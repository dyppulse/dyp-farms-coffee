import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CommunityService } from './community.service';

@Controller('community')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private community: CommunityService) {}

  @Post('posts')
  async createPost(
    @Req() req: { user: { id: string; name: string; role: string } },
    @Body()
    body: {
      title: string;
      content: string;
      category: 'discussion' | 'tips' | 'news' | 'question';
    },
  ) {
    const post = this.community.createPost(
      req.user.id,
      req.user.name,
      req.user.role,
      body.title,
      body.content,
      body.category,
    );
    return post;
  }

  @Get('posts')
  async getPosts(@Query('category') category?: string) {
    const posts = this.community.getPosts(category);
    return { posts };
  }

  @Get('posts/:postId')
  async getPost(@Param('postId') postId: string) {
    const post = this.community.getPostById(postId);
    if (!post) return { error: 'Post not found' };
    const replies = this.community.getPostReplies(postId);
    return { post, replies };
  }

  @Post('posts/:postId/like')
  async likePost(@Param('postId') postId: string) {
    const success = this.community.likePost(postId);
    return { success };
  }

  @Post('posts/:postId/replies')
  async addReply(
    @Param('postId') postId: string,
    @Req() req: { user: { id: string; name: string } },
    @Body() body: { content: string },
  ) {
    const reply = this.community.addReply(
      postId,
      req.user.id,
      req.user.name,
      body.content,
    );
    return reply;
  }

  @Post('chat/start')
  async startChat(@Req() req: { user: { id: string; name: string } }) {
    const conversationId = this.community.startChatConversation(
      req.user.id,
      req.user.name,
    );
    const messages = this.community.getChatHistory(conversationId);
    return { conversationId, messages };
  }

  @Post('chat/:conversationId/send')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Req() req: { user: { id: string; name: string } },
    @Body() body: { message: string },
  ) {
    this.community.sendChatMessage(
      conversationId,
      req.user.id,
      req.user.name,
      body.message,
    );
    const messages = this.community.getChatHistory(conversationId);
    return { messages };
  }

  @Get('chat/:conversationId')
  async getChat(@Param('conversationId') conversationId: string) {
    const messages = this.community.getChatHistory(conversationId);
    return { messages };
  }
}
