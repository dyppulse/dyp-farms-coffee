import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ChatMessage as ChatRow,
  CommunityCategory,
  CommunityPost as PostRow,
  CommunityReply as ReplyRow,
} from '@prisma/client';
import { FIRST_PAGE, type Page } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  title: string;
  content: string;
  category: CommunityCategory;
  likes: number;
  replies: number;
  createdAt: string;
}

export interface CommunityReply {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  likes: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  userName: string;
  message: string;
  isAgent: boolean;
  createdAt: string;
}

type PostWithCount = PostRow & { _count: { replies: number } };

function toPost(p: PostWithCount): CommunityPost {
  return {
    id: p.id,
    userId: p.userId,
    userName: p.userName,
    userRole: p.userRole,
    title: p.title,
    content: p.content,
    category: p.category,
    likes: p.likeCount,
    replies: p._count.replies,
    createdAt: p.createdAt.toISOString(),
  };
}

function toReply(r: ReplyRow): CommunityReply {
  return {
    id: r.id,
    postId: r.postId,
    userId: r.userId,
    userName: r.userName,
    content: r.content,
    likes: 0,
    createdAt: r.createdAt.toISOString(),
  };
}

function toMessage(m: ChatRow): ChatMessage {
  return {
    id: m.id,
    conversationId: m.conversationId,
    userId: m.userId,
    userName: m.userName,
    message: m.message,
    isAgent: m.isAgent,
    createdAt: m.createdAt.toISOString(),
  };
}

const WELCOME = "Hello! I'm here to help. What can I assist you with today?";
const FALLBACK =
  "Thanks for your message! I'm processing your request. Please provide more details or try asking about auctions, quality, payments, shipping, financing, or tours.";

const KEYWORD_REPLIES: Record<string, string> = {
  auction:
    'To participate in an auction, navigate to the Marketplace tab, select "Live Auctions", and place your bid. Auctions typically close within 24 hours.',
  quality:
    'Quality grades are determined by our AI scanning system. Higher grades (A+) indicate superior bean quality. You can request a rescan if needed.',
  payment:
    'We accept multiple payment methods through our wallet system. You can add funds, withdraw, and split payments with other parties.',
  shipping:
    'Track your shipments in real-time using the Track tab. Each shipment has a QR code for verification at checkpoints.',
  financing:
    'Farmers can access financing options based on warehouse receipt value. Loans are processed quickly with flexible repayment terms.',
  tour: 'Book tours and farm stays through the Tours tab. Browse experiences, check availability, and make reservations directly in the app.',
};

export function agentReplyFor(message: string): string {
  const text = message.toLowerCase();
  for (const [keyword, reply] of Object.entries(KEYWORD_REPLIES)) {
    if (text.includes(keyword)) return reply;
  }
  return FALLBACK;
}

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async createPost(
    user: { id: string; name: string; role: string },
    title: string,
    content: string,
    category: CommunityCategory,
  ): Promise<CommunityPost> {
    const row = await this.prisma.communityPost.create({
      data: { userId: user.id, userName: user.name, userRole: user.role, title, content, category },
      include: { _count: { select: { replies: true } } },
    });
    return toPost(row);
  }

  async getPosts(category?: CommunityCategory, page: Page = FIRST_PAGE): Promise<CommunityPost[]> {
    const rows = await this.prisma.communityPost.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { replies: true } } },
      ...page,
    });
    return rows.map(toPost);
  }

  async getPostById(postId: string): Promise<CommunityPost | null> {
    const row = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      include: { _count: { select: { replies: true } } },
    });
    return row ? toPost(row) : null;
  }

  /** One like per person: liking again takes the like back. */
  async toggleLike(postId: string, userId: string): Promise<{ success: boolean; liked: boolean; likes: number }> {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const key = { postId_userId: { postId, userId } };
    const result = await this.prisma.$transaction(async (db) => {
      const existing = await db.communityPostLike.findUnique({ where: key });
      if (existing) {
        await db.communityPostLike.delete({ where: key });
        const updated = await db.communityPost.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        });
        return { liked: false, likes: updated.likeCount };
      }
      await db.communityPostLike.create({ data: { postId, userId } });
      const updated = await db.communityPost.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      });
      return { liked: true, likes: updated.likeCount };
    });
    return { success: true, ...result };
  }

  async addReply(postId: string, userId: string, userName: string, content: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    const row = await this.prisma.communityReply.create({ data: { postId, userId, userName, content } });
    return toReply(row);
  }

  async getPostReplies(postId: string, page: Page = FIRST_PAGE): Promise<CommunityReply[]> {
    const rows = await this.prisma.communityReply.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      ...page,
    });
    return rows.map(toReply);
  }

  async startChatConversation(userId: string): Promise<string> {
    const conversation = await this.prisma.chatConversation.create({
      data: {
        userId,
        messages: {
          create: { userId: 'system', userName: 'Support Agent', message: WELCOME, isAgent: true },
        },
      },
    });
    return conversation.id;
  }

  /** Stores the customer's message and the automatic reply. */
  async sendChatMessage(conversationId: string, userId: string, userName: string, message: string) {
    await this.assertOwnsConversation(conversationId, userId);
    const [sent] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({ data: { conversationId, userId, userName, message } }),
      this.prisma.chatMessage.create({
        data: {
          conversationId,
          userId: 'agent-001',
          userName: 'Support Agent',
          message: agentReplyFor(message),
          isAgent: true,
          createdAt: new Date(Date.now() + 1000),
        },
      }),
    ]);
    return toMessage(sent);
  }

  async getChatHistory(conversationId: string, userId: string): Promise<ChatMessage[]> {
    await this.assertOwnsConversation(conversationId, userId);
    const rows = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
    return rows.map(toMessage);
  }

  /** A conversation id alone is not enough to read or write it. */
  private async assertOwnsConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.chatConversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.userId !== userId) throw new ForbiddenException('Not your conversation');
  }
}
