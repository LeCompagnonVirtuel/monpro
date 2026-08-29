import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/pagination';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateConversation(userId1: string, userId2: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userId1 } } },
          { participants: { some: { userId: userId2 } } },
        ],
      },
      include: { participants: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } } },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: userId1 }, { userId: userId2 }],
        },
      },
      include: { participants: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } } },
    });
  }

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(conversationId: string, userId: string, page?: number, limit?: number) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new ForbiddenException('Vous n\'avez pas accès à cette conversation');

    const { page: p, limit: l, skip } = paginate(page, limit || 50);
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return { data: messages.reverse(), total, page: p, limit: l };
  }

  async sendMessage(conversationId: string, senderId: string, content: string, imageUrl?: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });
    if (!participant) throw new ForbiddenException();

    const message = await this.prisma.message.create({
      data: { conversationId, senderId, content, imageUrl },
      include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async findConversation(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });

    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  }
}
