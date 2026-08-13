import { Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService, NOTIFICATIONS_CHANNEL } from '../redis/redis.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

function companyRoom(companyId: string) {
  return `company:${companyId}`;
}

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: process.env.WEB_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit() {
    // One subscriber for the whole gateway; fan out to the right company room per message.
    this.redis.subscriber.subscribe(NOTIFICATIONS_CHANNEL).catch((err) => {
      this.logger.warn(
        `Could not subscribe to Redis channel: ${(err as Error).message}`,
      );
    });

    this.redis.subscriber.on('message', (_channel, message) => {
      try {
        const payload = JSON.parse(message) as {
          companyId: string;
          [key: string]: unknown;
        };
        this.server
          .to(companyRoom(payload.companyId))
          .emit('notification', payload);
      } catch (err) {
        this.logger.warn(
          `Dropped malformed notification payload: ${(err as Error).message}`,
        );
      }
    });
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
      });
      (client.data as { user?: JwtPayload }).user = payload;
      void client.join(companyRoom(payload.companyId));
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect() {
    // Socket.IO leaves rooms automatically on disconnect; nothing to clean up here.
  }
}
