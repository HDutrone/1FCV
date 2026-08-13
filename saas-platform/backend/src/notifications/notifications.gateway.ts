import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { REDIS_SUBSCRIBER } from '../redis/redis.module';
import Redis from 'ioredis';

// Realtime bus: any module publishes a domain event on the "events" Redis
// channel (see NotificationsService.publish); every connected client — and
// every horizontally-scaled Nest instance — receives it through this
// gateway, so the dashboard updates live across tabs/devices without polling.
const CHANNEL = 'ops:events';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/realtime' })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(@Inject(REDIS_SUBSCRIBER) private readonly subscriber: Redis) {}

  onModuleInit() {
    this.subscriber.subscribe(CHANNEL);
    this.subscriber.on('message', (_channel, message) => {
      this.server?.emit('event', JSON.parse(message));
    });
  }

  handleConnection(client: Socket) {
    const room = client.handshake.query.branchId as string | undefined;
    if (room) client.join(`branch:${room}`);
  }

  handleDisconnect() {
    // socket.io handles room cleanup automatically
  }

  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong', data: Date.now() };
  }
}
