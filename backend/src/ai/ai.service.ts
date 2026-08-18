import { Injectable, BadRequestException } from '@nestjs/common';

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  conversationId: string;
  messages: ConversationMessage[];
  userMessage: string;
}

@Injectable()
export class AiService {
  private conversationHistories: Map<string, ConversationMessage[]> = new Map();

  private readonly systemPrompt = `You are a helpful support agent for Dyp Farms Coffee, a platform connecting coffee farmers, roasters, buyers, and tourists.

Your role is to:
1. Help users with platform features and operations
2. Provide guidance on coffee quality, grading, and auctions
3. Assist with financing, subscriptions, and wallet operations
4. Answer questions about logistics, tours, and community features
5. Provide friendly, professional, and knowledgeable responses

Key Platform Features to Help With:
- Quality Grading & AI Assessment
- Warehouse Receipts & Financing
- Coffee Marketplace & Auctions
- Subscriptions (3 tiers: Starter, Enthusiast, Connoisseur)
- Logistics Tracking & Shipment Management
- Coffee Tours & Farm Stays
- Community Discussion & Support
- Wallet & Payment Systems

Always be helpful, accurate, and encourage users to explore all platform features.`;

  private makeOpenAIRequest(
    messages: ConversationMessage[],
  ): Promise<string> {
    // Simulated OpenAI API call - in production, replace with actual API call
    // This uses intelligent keyword-based responses to simulate AI
    const userMessage =
      messages[messages.length - 1]?.content?.toLowerCase() || '';
    const response = this.generateIntelligentResponse(userMessage);
    return Promise.resolve(response);
  }

  private generateIntelligentResponse(userMessage: string): string {
    // Simulate intelligent responses based on user intent
    const keywords = {
      quality: {
        keywords: ['quality', 'grade', 'grading', 'scan', 'score', 'assessment'],
        response:
          'Our AI quality grading system analyzes coffee beans through image recognition. It assesses grade (A+, A, B, C), quality score (0-100), and moisture levels. Simply photograph your coffee beans in good lighting, and our system provides instant feedback. Results are integrated into warehouse receipts for financing purposes.',
      },
      auction: {
        keywords: ['auction', 'bid', 'bidding', 'live', 'highest bid'],
        response:
          'Our Live Auction feature lets you browse premium coffee lots and place real-time bids. Each auction has a countdown timer, bid history, and live chat. You can set auto-bid preferences to participate hands-free. Winning bids proceed directly to payment confirmation. Auctions typically run 24-48 hours.',
      },
      financing: {
        keywords: ['financing', 'loan', 'finance', 'money', 'borrow', 'payment'],
        response:
          'Our Financing system provides loans based on your warehouse receipt value. We offer: Max loan up to 80% of collateral, interest rate of 8.5% p.a., flexible terms (3, 6, or 12 months), and instant processing. Loan offers are calculated automatically from your receipt. Apply in the Financing tab and receive approval within hours.',
      },
      subscription: {
        keywords: ['subscription', 'subscribe', 'plan', 'delivery', 'monthly'],
        response:
          'We offer 3 subscription tiers: Starter ($29.99/mo, 1 bag, monthly), Enthusiast ($59.99/mo, 2 bags, biweekly), and Connoisseur ($99.99/mo, 4 bags, weekly). You can customize delivery frequency, skip deliveries, pause anytime, and upgrade/downgrade plans. All include free shipping and exclusive perks.',
      },
      logistics: {
        keywords: [
          'logistics',
          'shipping',
          'tracking',
          'shipment',
          'delivery',
          'qr',
          'verify',
        ],
        response:
          'Our Logistics Tracking provides real-time monitoring from farm to destination. You can view shipment routes on an interactive map, scan QR codes at checkpoints, and receive live status updates. Each shipment is verified at key checkpoints to ensure authenticity. Track tab shows all your active and completed shipments.',
      },
      wallet: {
        keywords: [
          'wallet',
          'payment',
          'balance',
          'transaction',
          'fund',
          'withdraw',
          'money',
        ],
        response:
          'Your Wallet is your financial hub in Dyp Farms. Add funds, withdraw money, pay for auctions and subscriptions, and view transaction history. We support multiple payment methods and show real-time balance. You can split payments with other parties and generate detailed receipts for all transactions.',
      },
      community: {
        keywords: [
          'community',
          'forum',
          'post',
          'discussion',
          'chat',
          'support',
          'help',
        ],
        response:
          'Join our vibrant Community! Browse discussion boards by category (tips, news, questions, discussions). Create posts, like others, and reply to discussions. Use our Live Support Chat for instant help on any platform feature. Our AI support system provides instant answers to common questions 24/7.',
      },
      tours: {
        keywords: [
          'tour',
          'tourism',
          'experience',
          'farm',
          'stay',
          'booking',
          'coffee',
        ],
        response:
          'Explore coffee tourism through our Tours feature! Browse farm tours, coffee tastings, and overnight farm stays on an interactive map. Book directly through the app with instant confirmation. Discover authentic farm experiences and connect with local coffee growers. Tours available worldwide with detailed descriptions and reviews.',
      },
      receipt: {
        keywords: ['receipt', 'warehouse', 'warehouse receipt', 'lot details'],
        response:
          'Warehouse Receipts are automatically generated from quality assessments. They include lot details, grade, quantity, storage location, estimated value, and quality score. You can share receipts via PDF or link. Receipts serve as collateral for financing applications and are your proof of quality.',
      },
    };

    // Find matching category
    for (const [category, data] of Object.entries(keywords)) {
      if (data.keywords.some((kw) => userMessage.includes(kw))) {
        return data.response;
      }
    }

    // Default intelligent response
    return (
      "I'm here to help with Dyp Farms Coffee! I can assist with: Quality Grading, Auctions & Bidding, Financing & Loans, Subscriptions, Logistics Tracking, Wallet & Payments, Community Forums, and Coffee Tours. " +
      "What would you like to know more about? Feel free to ask about any of these features or specific aspects of the platform."
    );
  }

  async startIntelligentConversation(
    conversationId: string,
  ): Promise<{ conversationId: string; messages: ConversationMessage[] }> {
    if (this.conversationHistories.has(conversationId)) {
      return {
        conversationId,
        messages: this.conversationHistories.get(conversationId) || [],
      };
    }

    const initialMessages: ConversationMessage[] = [
      {
        role: 'system',
        content: this.systemPrompt,
      },
      {
        role: 'assistant',
        content:
          "Hello! 👋 I'm the Dyp Farms Coffee AI Assistant. I'm here to help you with any questions about our platform - from quality grading and auctions to financing, subscriptions, logistics, and more. What can I help you with today?",
      },
    ];

    this.conversationHistories.set(conversationId, initialMessages);
    return { conversationId, messages: initialMessages };
  }

  async getIntelligentResponse(req: ChatRequest): Promise<{
    conversationId: string;
    messages: ConversationMessage[];
  }> {
    const { conversationId, userMessage } = req;

    if (!conversationId || !userMessage?.trim()) {
      throw new BadRequestException('Conversation ID and message are required');
    }

    // Get or initialize conversation history
    let history = this.conversationHistories.get(conversationId);
    if (!history) {
      history = [
        {
          role: 'system',
          content: this.systemPrompt,
        },
      ];
    }

    // Add user message
    history.push({
      role: 'user',
      content: userMessage,
    });

    try {
      // Get AI response (simulated)
      const aiResponse = await this.makeOpenAIRequest(history);

      // Add assistant response
      history.push({
        role: 'assistant',
        content: aiResponse,
      });

      // Keep only last 10 exchanges to save memory (system + assistant + 10 exchanges)
      if (history.length > 22) {
        history = [
          history[0], // system message
          ...history.slice(-20),
        ];
      }

      this.conversationHistories.set(conversationId, history);

      return { conversationId, messages: history };
    } catch (error) {
      throw new BadRequestException(
        'Failed to process message. Please try again.',
      );
    }
  }

  async getConversationHistory(
    conversationId: string,
  ): Promise<ConversationMessage[]> {
    const history = this.conversationHistories.get(conversationId);
    if (!history) {
      throw new BadRequestException('Conversation not found');
    }
    return history;
  }

  clearConversation(conversationId: string): boolean {
    return this.conversationHistories.delete(conversationId);
  }
}
