-- CreateEnum
CREATE TYPE "CommunityCategory" AS ENUM ('discussion', 'tips', 'news', 'question');

-- CreateEnum
CREATE TYPE "FinancingStatus" AS ENUM ('pending', 'approved', 'rejected', 'funded', 'repaid');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "DeliveryFrequency" AS ENUM ('weekly', 'biweekly', 'monthly');

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "CommunityCategory" NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityReply" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPostLike" (
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPostLike_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "ChatConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isAgent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancingRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "requestedAmount" INTEGER NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "FinancingStatus" NOT NULL DEFAULT 'pending',
    "monthlyPayment" DOUBLE PRECISION NOT NULL,
    "totalRepayment" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "fundedAt" TIMESTAMP(3),

    CONSTRAINT "FinancingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "frequency" "DeliveryFrequency" NOT NULL,
    "nextDeliveryAt" TIMESTAMP(3) NOT NULL,
    "nextPaymentAt" TIMESTAMP(3) NOT NULL,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bagsSent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityPost_category_createdAt_idx" ON "CommunityPost"("category", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_createdAt_idx" ON "CommunityPost"("createdAt");

-- CreateIndex
CREATE INDEX "CommunityPost_userId_idx" ON "CommunityPost"("userId");

-- CreateIndex
CREATE INDEX "CommunityReply_postId_createdAt_idx" ON "CommunityReply"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityReply_userId_idx" ON "CommunityReply"("userId");

-- CreateIndex
CREATE INDEX "CommunityPostLike_userId_idx" ON "CommunityPostLike"("userId");

-- CreateIndex
CREATE INDEX "ChatConversation_userId_idx" ON "ChatConversation"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "FinancingRequest_userId_createdAt_idx" ON "FinancingRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FinancingRequest_receiptId_idx" ON "FinancingRequest"("receiptId");

-- CreateIndex
CREATE INDEX "FinancingRequest_status_idx" ON "FinancingRequest"("status");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- AddForeignKey
ALTER TABLE "CommunityReply" ADD CONSTRAINT "CommunityReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPostLike" ADD CONSTRAINT "CommunityPostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One live (active or paused) subscription per user, enforced by the database so two
-- simultaneous sign-ups cannot both succeed.
CREATE UNIQUE INDEX "Subscription_userId_live_key" ON "Subscription"("userId") WHERE "status" <> 'cancelled';

-- A loan can only be requested once per receipt while an earlier request is still open.
CREATE UNIQUE INDEX "FinancingRequest_receiptId_open_key" ON "FinancingRequest"("receiptId") WHERE "status" IN ('pending', 'approved', 'funded');
