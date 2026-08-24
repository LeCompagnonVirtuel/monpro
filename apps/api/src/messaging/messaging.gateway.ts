import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagingService } from './messaging.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>();

  constructor(
    private messagingService: MessagingService,
    private jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      this.connectedUsers.set(client.id, userId);
      client.join(`user_${userId}`);
      (client as any).userId = userId;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: { conversationId: string; content: string; imageUrl?: string }) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return;

    const message = await this.messagingService.sendMessage(
      payload.conversationId,
      userId,
      payload.content,
      payload.imageUrl,
    );

    this.server.to(`conversation_${payload.conversationId}`).emit('newMessage', message);
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(client: Socket, conversationId: string) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return;

    const conversation = await this.messagingService.findConversation(conversationId);
    if (!conversation || !conversation.participants.some(p => p.userId === userId)) {
      return;
    }
    client.join(`conversation_${conversationId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, payload: { conversationId: string }) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return;
    client.to(`conversation_${payload.conversationId}`).emit('userTyping', { userId });
  }
}
