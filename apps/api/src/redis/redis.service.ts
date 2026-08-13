import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const NOTIFICATIONS_CHANNEL = 'platform:notifications';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  // Separate clients: ioredis puts a client that calls SUBSCRIBE into a
  // dedicated mode where it can no longer run normal commands.
  public readonly publisher: Redis;
  public readonly subscriber: Redis;

  constructor(private readonly config: ConfigService) {
    const url =
      this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    this.publisher = new Redis(url, { lazyConnect: true });
    this.subscriber = new Redis(url, { lazyConnect: true });
  }

  async onModuleInit() {
    try {
      await Promise.all([this.publisher.connect(), this.subscriber.connect()]);
    } catch (err) {
      this.logger.warn(
        `Redis unavailable (${(err as Error).message}) — real-time notifications will be disabled until it reconnects.`,
      );
    }
  }

  onModuleDestroy() {
    this.publisher.disconnect();
    this.subscriber.disconnect();
  }

  async publishNotification(payload: Record<string, unknown>) {
    try {
      await this.publisher.publish(
        NOTIFICATIONS_CHANNEL,
        JSON.stringify(payload),
      );
    } catch (err) {
      this.logger.warn(
        `Failed to publish notification: ${(err as Error).message}`,
      );
    }
  }
}
