import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { RealtimeEvent } from './realtime.types';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emitToUser(userId: string, event: RealtimeEvent) {
    if (!this.server) {
      this.logger.warn('Server not initialized, skipping realtime event');
      return;
    }
    this.server.to(`user_${userId}`).emit(event.type, event);
  }

  emitToUsers(userIds: string[], event: RealtimeEvent) {
    if (!this.server) {
      this.logger.warn('Server not initialized, skipping realtime event');
      return;
    }
    for (const userId of userIds) {
      this.server.to(`user_${userId}`).emit(event.type, event);
    }
  }
}
