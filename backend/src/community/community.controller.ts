import { Body, Controller, Get, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/auth.guard';
import { PageQueryDto, toPage } from '../common/pagination';
import { CATEGORIES, ChatMessageDto, type Category, CreatePostDto, ReplyDto } from './dto/community.dto';
import { CommunityService } from './community.service';

type AuthedReq = { user: { id: string; name: string; role: string } };

class PostsQueryDto extends PageQueryDto {
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: Category;
}

@Controller('community')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private community: CommunityService) {}

  @Post('posts')
  createPost(@Req() req: AuthedReq, @Body() body: CreatePostDto) {
    return this.community.createPost(req.user, body.title, body.content, body.category);
  }

  @Get('posts')
  async getPosts(@Query() query: PostsQueryDto) {
    return { posts: await this.community.getPosts(query.category, toPage(query)) };
  }

  @Get('posts/:postId')
  async getPost(@Param('postId') postId: string, @Query() page: PageQueryDto) {
    const post = await this.community.getPostById(postId);
    if (!post) throw new NotFoundException('Post not found');
    return { post, replies: await this.community.getPostReplies(postId, toPage(page)) };
  }

  @Post('posts/:postId/like')
  likePost(@Param('postId') postId: string, @Req() req: AuthedReq) {
    return this.community.toggleLike(postId, req.user.id);
  }

  @Post('posts/:postId/replies')
  addReply(@Param('postId') postId: string, @Req() req: AuthedReq, @Body() body: ReplyDto) {
    return this.community.addReply(postId, req.user.id, req.user.name, body.content);
  }

  @Post('chat/start')
  async startChat(@Req() req: AuthedReq) {
    const conversationId = await this.community.startChatConversation(req.user.id);
    return { conversationId, messages: await this.community.getChatHistory(conversationId, req.user.id) };
  }

  @Post('chat/:conversationId/send')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Req() req: AuthedReq,
    @Body() body: ChatMessageDto,
  ) {
    await this.community.sendChatMessage(conversationId, req.user.id, req.user.name, body.message);
    return { messages: await this.community.getChatHistory(conversationId, req.user.id) };
  }

  @Get('chat/:conversationId')
  async getChat(@Param('conversationId') conversationId: string, @Req() req: AuthedReq) {
    return { messages: await this.community.getChatHistory(conversationId, req.user.id) };
  }
}
