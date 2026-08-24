import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Messaging')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  @Get()
  @ApiOperation({ summary: 'Mes conversations' })
  getConversations(@CurrentUser('id') userId: string) {
    return this.messagingService.getConversations(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Créer/ouvrir une conversation' })
  createConversation(@CurrentUser('id') userId: string, @Body('recipientId') recipientId: string) {
    return this.messagingService.getOrCreateConversation(userId, recipientId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Messages d\'une conversation' })
  getMessages(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.messagingService.getMessages(id, userId, page, limit);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Envoyer un message' })
  sendMessage(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { content: string; imageUrl?: string },
  ) {
    return this.messagingService.sendMessage(id, userId, body.content, body.imageUrl);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Marquer comme lu' })
  markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.messagingService.markAsRead(id, userId);
  }
}
