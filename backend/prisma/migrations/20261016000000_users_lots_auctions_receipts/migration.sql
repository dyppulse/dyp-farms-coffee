-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('farmer', 'roaster', 'tourist', 'admin');

-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('active', 'ended');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'roaster',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoffeeLot" (
    "id" TEXT NOT NULL,
    "lotNumber" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "grade" TEXT NOT NULL DEFAULT 'Ungraded',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cuppingNotes" TEXT NOT NULL DEFAULT '',
    "traceability" TEXT NOT NULL,
    "warehouse" TEXT NOT NULL DEFAULT 'unassigned',
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "imageUrl" TEXT,
    "inAuction" BOOLEAN NOT NULL DEFAULT false,
    "farmerId" TEXT,
    "farmId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoffeeLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auction" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "currentBid" DOUBLE PRECISION NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "AuctionStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bidderName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoBidLimit" (
    "auctionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bidderName" TEXT NOT NULL,
    "maxAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AutoBidLimit_pkey" PRIMARY KEY ("auctionId","userId")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseReceipt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "lotName" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "moistureLevel" DOUBLE PRECISION NOT NULL,
    "storageLocation" TEXT NOT NULL,
    "gpsLocation" JSONB,
    "qualityScore" INTEGER NOT NULL,
    "estimatedValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarehouseReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CoffeeLot_lotNumber_key" ON "CoffeeLot"("lotNumber");

-- CreateIndex
CREATE INDEX "CoffeeLot_farmerId_idx" ON "CoffeeLot"("farmerId");

-- CreateIndex
CREATE UNIQUE INDEX "Auction_lotId_key" ON "Auction"("lotId");

-- CreateIndex
CREATE INDEX "Bid_auctionId_createdAt_idx" ON "Bid"("auctionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_userId_lotId_key" ON "CartItem"("userId", "lotId");

-- CreateIndex
CREATE INDEX "WarehouseReceipt_userId_createdAt_idx" ON "WarehouseReceipt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WarehouseReceipt_lotId_idx" ON "WarehouseReceipt"("lotId");

-- AddForeignKey
ALTER TABLE "CoffeeLot" ADD CONSTRAINT "CoffeeLot_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "CoffeeLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoBidLimit" ADD CONSTRAINT "AutoBidLimit_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "CoffeeLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseReceipt" ADD CONSTRAINT "WarehouseReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseReceipt" ADD CONSTRAINT "WarehouseReceipt_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "CoffeeLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

