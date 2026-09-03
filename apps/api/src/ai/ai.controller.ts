import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { EstimatePriceDto } from './dto/price.dto';
import { DiagnoseDto } from './dto/diagnose.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // ─── Feature 1: Chatbot ───────────────────────────────────────────────

  @Post('chat')
  @Throttle({ ai: { ttl: 60000, limit: 10 } })
  async chat(@Body() dto: ChatDto) {
    const reply = await this.aiService.chat(dto.message, dto.conversationHistory);
    return { reply };
  }

  // ─── Feature 3: Price Estimation ──────────────────────────────────────

  @Post('estimate-price')
  @Throttle({ ai: { ttl: 60000, limit: 5 } })
  async estimatePrice(@Body() dto: EstimatePriceDto) {
    return this.aiService.estimatePrice(
      dto.serviceId,
      dto.description,
      dto.latitude,
      dto.longitude,
    );
  }

  // ─── Feature 4: Photo Diagnosis ───────────────────────────────────────

  @Post('diagnose')
  @Throttle({ ai: { ttl: 60000, limit: 5 } })
  async diagnose(@Body() dto: DiagnoseDto) {
    return this.aiService.diagnosePhoto(dto.imageBase64);
  }

  // ─── Feature 5: Conversation Summary ──────────────────────────────────

  @Get('summary/:conversationId')
  @UseGuards(JwtAuthGuard)
  @Throttle({ ai: { ttl: 60000, limit: 10 } })
  async getSummary(@Param('conversationId') conversationId: string) {
    const summary = await this.aiService.summarizeConversation(conversationId);
    return { summary };
  }

  // ─── Feature 6: Availability Prediction ───────────────────────────────

  @Get('availability/:professionalId')
  @UseGuards(JwtAuthGuard)
  @Throttle({ ai: { ttl: 60000, limit: 5 } })
  async getAvailability(
    @Param('professionalId') professionalId: string,
    @Query('preferredDate') preferredDate?: string,
  ) {
    const date = preferredDate ? new Date(preferredDate) : undefined;
    return this.aiService.predictAvailability(professionalId, date);
  }
}
