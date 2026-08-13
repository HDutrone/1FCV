import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_PUBLISHER } from '../redis/redis.module';

export interface OpsEvent<T = unknown> {
  type: string; // e.g. "vacation.requested", "stock.low", "invoice.paid"
  payload: T;
  branchId?: string;
  createdAt: string;
}

@Injectable()
export class NotificationsService {
  constructor(@Inject(REDIS_PUBLISHER) private readonly publisher: Redis) {}

  async publish<T>(type: string, payload: T, branchId?: string) {
    const event: OpsEvent<T> = { type, payload, branchId, createdAt: new Date().toISOString() };
    await this.publisher.publish('ops:events', JSON.stringify(event));
    return event;
  }
}
