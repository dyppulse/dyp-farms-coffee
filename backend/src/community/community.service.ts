import { Injectable } from '@nestjs/common';

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  title: string;
  content: string;
  category: 'discussion' | 'tips' | 'news' | 'question';
  likes: number;
  replies: number;
  createdAt: string;
  imageUrl?: string;
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

@Injectable()
export class CommunityService {
  private posts: CommunityPost[] = [];
  private replies: CommunityReply[] = [];
  private chatMessages: ChatMessage[] = [];

  createPost(
    userId: string,
    userName: string,
    userRole: string,
    title: string,
    content: string,
    category: 'discussion' | 'tips' | 'news' | 'question',
  ): CommunityPost {
    const post: CommunityPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      userId,
      userName,
      userRole,
      title,
      content,
      category,
      likes: 0,
      replies: 0,
      createdAt: new Date().toISOString(),
    };
    this.posts.push(post);
    return post;
  }

  getPosts(
    category?: string,
    limit: number = 50,
  ): CommunityPost[] {
    let filtered = this.posts;
    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }
    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ).slice(0, limit);
  }

  getPostById(postId: string): CommunityPost | null {
    return this.posts.find((p) => p.id === postId) || null;
  }

  likePost(postId: string): boolean {
    const post = this.posts.find((p) => p.id === postId);
    if (post) {
      post.likes++;
      return true;
    }
    return false;
  }

  addReply(
    postId: string,
    userId: string,
    userName: string,
    content: string,
  ): CommunityReply {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    const reply: CommunityReply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      postId,
      userId,
      userName,
      content,
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    this.replies.push(reply);
    post.replies++;
    return reply;
  }

  getPostReplies(postId: string): CommunityReply[] {
    return this.replies.filter((r) => r.postId === postId);
  }

  startChatConversation(userId: string, userName: string): string {
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const welcomeMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      userId: 'system',
      userName: 'Support Agent',
      message:
        "Hello! I'm here to help. What can I assist you with today?",
      isAgent: true,
      createdAt: new Date().toISOString(),
    };
    this.chatMessages.push(welcomeMessage);
    return conversationId;
  }

  sendChatMessage(
    conversationId: string,
    userId: string,
    userName: string,
    message: string,
  ): ChatMessage {
    const chatMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      userId,
      userName,
      message,
      isAgent: false,
      createdAt: new Date().toISOString(),
    };
    this.chatMessages.push(chatMsg);

    const agentReply = this.generateAgentResponse(message);
    const reply: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      conversationId,
      userId: 'agent-001',
      userName: 'Support Agent',
      message: agentReply,
      isAgent: true,
      createdAt: new Date(Date.now() + 1000).toISOString(),
    };
    this.chatMessages.push(reply);

    return chatMsg;
  }

  private generateAgentResponse(message: string): string {
    const keywords = {
      auction: 'To participate in an auction, navigate to the Marketplace tab, select "Live Auctions", and place your bid. Auctions typically close within 24 hours.',
      quality:
        'Quality grades are determined by our AI scanning system. Higher grades (A+) indicate superior bean quality. You can request a rescan if needed.',
      payment:
        'We accept multiple payment methods through our wallet system. You can add funds, withdraw, and split payments with other parties.',
      shipping:
        'Track your shipments in real-time using the Track tab. Each shipment has a QR code for verification at checkpoints.',
      financing:
        'Farmers can access financing options based on warehouse receipt value. Loans are processed quickly with flexible repayment terms.',
      tour: "Book tours and farm stays through the Tours tab. Browse experiences, check availability, and make reservations directly in the app.",
    };

    for (const [key, response] of Object.entries(keywords)) {
      if (message.toLowerCase().includes(key)) {
        return response;
      }
    }

    return "Thanks for your message! I'm processing your request. Please provide more details or try asking about auctions, quality, payments, shipping, financing, or tours.";
  }

  getChatHistory(conversationId: string): ChatMessage[] {
    return this.chatMessages.filter((m) => m.conversationId === conversationId);
  }
}
