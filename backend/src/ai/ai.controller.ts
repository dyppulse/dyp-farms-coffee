import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private ai: AiService) {}

  @Post('chat/start')
  async startChat(@Body() body: { conversationId?: string }) {
    const conversationId =
      body.conversationId ||
      `conv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const result = await this.ai.startIntelligentConversation(conversationId);
    return result;
  }

  @Post('chat/:conversationId/message')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: { message: string },
  ) {
    if (!body.message?.trim()) {
      return { error: 'Message is required' };
    }

    const result = await this.ai.getIntelligentResponse({
      conversationId,
      messages: [],
      userMessage: body.message,
    });

    return result;
  }

  @Get('chat/:conversationId')
  async getChat(@Param('conversationId') conversationId: string) {
    const messages = await this.ai.getConversationHistory(conversationId);
    return { conversationId, messages };
  }

  @Post('chat/:conversationId/clear')
  async clearChat(@Param('conversationId') conversationId: string) {
    const cleared = this.ai.clearConversation(conversationId);
    return { cleared, conversationId };
  }
}
