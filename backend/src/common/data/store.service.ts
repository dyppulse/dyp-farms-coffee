import { Injectable } from '@nestjs/common';
import {
  auctions,
  cartItems,
  coffeeLots,
  reviews,
  shipments,
  tours,
  users,
  walletBalances,
  walletTransactions,
} from './seed.data';
import {
  Auction,
  AuctionBid,
  CartItem,
  CoffeeLot,
  Review,
  Shipment,
  Tour,
  User,
  WalletTransaction,
} from '../interfaces';

@Injectable()
export class StoreService {
  private users = [...users];
  private walletBalances = { ...walletBalances };
  private walletTransactions = [...walletTransactions];
  private coffeeLots = [...coffeeLots];
  private auctions = [...auctions];
  private shipments = [...shipments];
  private tours = [...tours];
  private reviews = [...reviews];
  private cartItems = [...cartItems];

  findUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  findUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  createUser(data: Omit<User, 'id' | 'createdAt'>): User {
    const user: User = {
      ...data,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    this.walletBalances[user.id] = 0;
    return user;
  }

  getWalletBalance(userId: string): number {
    return this.walletBalances[userId] ?? 0;
  }

  getWalletTransactions(userId: string): WalletTransaction[] {
    return this.walletTransactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  addFunds(userId: string, amount: number): WalletTransaction {
    this.walletBalances[userId] = (this.walletBalances[userId] ?? 0) + amount;
    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      userId,
      type: 'deposit',
      amount,
      description: 'Add Funds',
      createdAt: new Date().toISOString(),
    };
    this.walletTransactions.push(tx);
    return tx;
  }

  withdraw(userId: string, amount: number): WalletTransaction {
    const balance = this.walletBalances[userId] ?? 0;
    if (balance < amount) {
      throw new Error('Insufficient balance');
    }
    this.walletBalances[userId] = balance - amount;
    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      userId,
      type: 'withdrawal',
      amount: -amount,
      description: 'Withdraw to Bank',
      createdAt: new Date().toISOString(),
    };
    this.walletTransactions.push(tx);
    return tx;
  }

  getLots(search?: string): CoffeeLot[] {
    if (!search) return this.coffeeLots;
    const q = search.toLowerCase();
    return this.coffeeLots.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.origin.toLowerCase().includes(q) ||
        l.lotNumber.includes(q),
    );
  }

  getLotById(id: string): CoffeeLot | undefined {
    return this.coffeeLots.find((l) => l.id === id);
  }

  getAuctions(): Auction[] {
    return this.auctions;
  }

  getAuctionByLotId(lotId: string): Auction | undefined {
    return this.auctions.find((a) => a.lotId === lotId);
  }

  placeBid(
    lotId: string,
    userId: string,
    bidderName: string,
    amount: number,
    autoBid = false,
  ): AuctionBid {
    const auction = this.auctions.find((a) => a.lotId === lotId);
    if (!auction) throw new Error('Auction not found');
    if (amount <= auction.currentBid) {
      throw new Error('Bid must be higher than current bid');
    }
    if (autoBid) {
      this.autoBidLimits.set(`${userId}:${lotId}`, {
        maxAmount: amount,
        bidderName,
      });
    }
    const bid = this.placeBidInternal(auction, lotId, userId, bidderName, amount);
    this.resolveAutoBids(lotId);
    return bid;
  }

  private autoBidLimits = new Map<
    string,
    { maxAmount: number; bidderName: string }
  >();

  private placeBidInternal(
    auction: Auction,
    lotId: string,
    userId: string,
    bidderName: string,
    amount: number,
  ): AuctionBid {
    const bid: AuctionBid = {
      id: `bid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      lotId,
      userId,
      bidderName,
      amount,
      createdAt: new Date().toISOString(),
    };
    auction.bids.unshift(bid);
    auction.currentBid = amount;
    return bid;
  }

  private resolveAutoBids(lotId: string) {
    const auction = this.auctions.find((a) => a.lotId === lotId);
    if (!auction) return;

    let changed = true;
    while (changed) {
      changed = false;
      const topBidder = auction.bids[0]?.userId;
      for (const [key, config] of this.autoBidLimits) {
        const [userId, keyLotId] = key.split(':');
        if (keyLotId !== lotId || userId === topBidder) continue;
        const nextAmount = Math.min(config.maxAmount, auction.currentBid + 100);
        if (nextAmount > auction.currentBid) {
          this.placeBidInternal(
            auction,
            lotId,
            userId,
            config.bidderName,
            nextAmount,
          );
          changed = true;
          break;
        }
      }
    }
  }

  getShipments(): Shipment[] {
    return this.shipments;
  }

  getShipmentById(id: string): Shipment | undefined {
    return this.shipments.find((s) => s.id === id);
  }

  verifyQrCode(code: string): Shipment | undefined {
    return this.shipments.find((s) => s.qrCode === code);
  }

  getTours(): Tour[] {
    return this.tours;
  }

  getReviews(tourId?: string): Review[] {
    if (!tourId) return this.reviews;
    return this.reviews.filter((r) => r.tourId === tourId);
  }

  getCart(userId: string): (CartItem & { lot: CoffeeLot })[] {
    return this.cartItems
      .filter((c) => c.userId === userId)
      .map((c) => ({
        ...c,
        lot: this.coffeeLots.find((l) => l.id === c.lotId)!,
      }))
      .filter((c) => c.lot);
  }

  addToCart(userId: string, lotId: string, quantity = 1): CartItem {
    const existing = this.cartItems.find(
      (c) => c.userId === userId && c.lotId === lotId,
    );
    if (existing) {
      existing.quantity += quantity;
      return existing;
    }
    const item: CartItem = {
      id: `cart-${Date.now()}`,
      userId,
      lotId,
      quantity,
    };
    this.cartItems.push(item);
    return item;
  }

  getDashboard(userId: string) {
    const activeAuctions = this.auctions.filter(
      (a) => new Date(a.endsAt).getTime() > Date.now(),
    ).length;
    return {
      walletBalance: this.getWalletBalance(userId),
      pendingPayments: this.walletTransactions.filter(
        (t) => t.userId === userId && t.type === 'payment',
      ).length,
      auctionStatus: `${activeAuctions} active auction${activeAuctions === 1 ? '' : 's'}`,
      weatherInsights: {
        temperature: 24,
        humidity: 68,
        forecast: 'Partly cloudy, ideal drying conditions',
      },
      warehouseLots: this.coffeeLots.filter((l) => l.warehouse === 'b1a')
        .length,
    };
  }
}
