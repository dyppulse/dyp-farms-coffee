import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { agentReplyFor, CommunityService } from './community.service';

function build() {
  const likeStore = new Set<string>();
  const db = {
    communityPostLike: {
      findUnique: jest.fn(({ where }) => Promise.resolve(likeStore.has(JSON.stringify(where)) ? { ok: 1 } : null)),
      create: jest.fn(({ data }) => {
        likeStore.add(JSON.stringify({ postId_userId: { postId: data.postId, userId: data.userId } }));
        return Promise.resolve({});
      }),
      delete: jest.fn(({ where }) => {
        likeStore.delete(JSON.stringify(where));
        return Promise.resolve({});
      }),
    },
    communityPost: {
      update: jest.fn(({ data }) => Promise.resolve({ likeCount: data.likeCount.increment ? 1 : 0 })),
    },
  };
  const prisma = {
    communityPost: { findUnique: jest.fn().mockResolvedValue({ id: 'p1' }), ...db.communityPost },
    communityPostLike: db.communityPostLike,
    chatConversation: { findUnique: jest.fn() },
    chatMessage: {
      create: jest.fn(({ data }) => Promise.resolve({ id: 'm', createdAt: new Date(), isAgent: false, ...data })), findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn((arg: unknown) => (typeof arg === 'function' ? arg(db) : Promise.all(arg as unknown[]))),
  };
  return { service: new CommunityService(prisma as never), prisma };
}

describe('CommunityService', () => {
  it('picks a canned answer by keyword and falls back politely', () => {
    expect(agentReplyFor('How do auctions work?')).toMatch(/Marketplace/);
    expect(agentReplyFor('Where is my SHIPPING?')).toMatch(/Track tab/);
    expect(agentReplyFor('hello')).toMatch(/Thanks for your message/);
  });

  it('lets a person like a post once, and take the like back', async () => {
    const { service } = build();
    expect(await service.toggleLike('p1', 'u1')).toMatchObject({ liked: true, likes: 1 });
    expect(await service.toggleLike('p1', 'u1')).toMatchObject({ liked: false, likes: 0 });
  });

  it('cannot like a post that does not exist', async () => {
    const { service, prisma } = build();
    prisma.communityPost.findUnique.mockResolvedValue(null);
    await expect(service.toggleLike('nope', 'u1')).rejects.toThrow(NotFoundException);
  });

  it('keeps chats private to their owner', async () => {
    const { service, prisma } = build();
    prisma.chatConversation.findUnique.mockResolvedValue({ id: 'c1', userId: 'owner' });
    await expect(service.getChatHistory('c1', 'intruder')).rejects.toThrow(ForbiddenException);
    await expect(service.sendChatMessage('c1', 'intruder', 'X', 'hi')).rejects.toThrow(ForbiddenException);
    expect(prisma.chatMessage.create).not.toHaveBeenCalled();
    prisma.chatConversation.findUnique.mockResolvedValue(null);
    await expect(service.getChatHistory('missing', 'owner')).rejects.toThrow(NotFoundException);
  });

  it('stores the customer message together with the automatic reply', async () => {
    const { service, prisma } = build();
    prisma.chatConversation.findUnique.mockResolvedValue({ id: 'c1', userId: 'u1' });
    await service.sendChatMessage('c1', 'u1', 'Ann', 'tell me about financing');
    const messages = prisma.chatMessage.create.mock.calls.map((c) => c[0].data);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ userId: 'u1', message: 'tell me about financing' });
    expect(messages[0].isAgent).toBeUndefined();
    expect(messages[1]).toMatchObject({ isAgent: true });
    expect(messages[1].message).toMatch(/warehouse receipt/);
  });
});
