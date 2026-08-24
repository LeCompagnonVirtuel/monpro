import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>();

  constructor(private messagingService: MessagingService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(client.id, userId);
      client.join(`user_${userId}`);
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
  handleJoinConversation(client: Socket, conversationId: string) {
    client.join(`conversation_${conversationId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, payload: { conversationId: string }) {
    const userId = this.connectedUsers.get(client.id);
    client.to(`conversation_${payload.conversationId}`).emit('userTyping', { userId });
  }
}
