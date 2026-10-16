import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryFrequency, Subscription as Row, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  bagCount: number;
  deliveryFrequency: DeliveryFrequency;
  features: string[];
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  nextDeliveryDate: string;
  deliveryFrequency: DeliveryFrequency;
  nextPaymentDate: string;
  totalSpent: number;
  bagsSent: number;
  createdAt: string;
}

const PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter',
    description: 'Perfect for coffee enthusiasts',
    monthlyPrice: 29.99,
    bagCount: 1,
    deliveryFrequency: 'monthly',
    features: [
      'One 12oz bag monthly',
      'Free shipping',
      'Early access to new roasts',
      'Coffee tasting notes',
    ],
  },
  {
    id: 'plan-enthusiast',
    name: 'Enthusiast',
    description: 'For serious coffee lovers',
    monthlyPrice: 59.99,
    bagCount: 2,
    deliveryFrequency: 'biweekly',
    features: [
      'Two 12oz bags biweekly',
      'Free shipping',
      'Member-only discounts',
      'Curated blend selections',
      'Brewing guides',
    ],
  },
  {
    id: 'plan-connoisseur',
    name: 'Connoisseur',
    description: 'Ultimate coffee experience',
    monthlyPrice: 99.99,
    bagCount: 4,
    deliveryFrequency: 'weekly',
    features: [
      'Four 12oz bags weekly',
      'Free shipping worldwide',
      'VIP customer support',
      'Farm-direct coffees',
      'Exclusive events & tastings',
      'Custom roast profiles',
    ],
  },
];

export function addInterval(from: Date, frequency: DeliveryFrequency): Date {
  const next = new Date(from);
  if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'biweekly') next.setDate(next.getDate() + 14);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

function toSubscription(r: Row): UserSubscription {
  return {
    id: r.id,
    userId: r.userId,
    planId: r.planId,
    planName: r.planName,
    status: r.status,
    nextDeliveryDate: r.nextDeliveryAt.toISOString(),
    deliveryFrequency: r.frequency,
    nextPaymentDate: r.nextPaymentAt.toISOString(),
    totalSpent: r.totalSpent,
    bagsSent: r.bagsSent,
    createdAt: r.createdAt.toISOString(),
  };
}

/**
 * Subscriptions are records of what a customer asked for. Nothing here charges money yet;
 * billing will run through the payments gateway once payments are switched on.
 */
@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  getPlans(): SubscriptionPlan[] {
    return PLANS;
  }

  getPlanById(planId: string): SubscriptionPlan | null {
    return PLANS.find((p) => p.id === planId) ?? null;
  }

  async createSubscription(userId: string, planId: string): Promise<UserSubscription> {
    const plan = this.getPlanById(planId);
    if (!plan) throw new NotFoundException('Plan not found');

    const nextDelivery = addInterval(new Date(), plan.deliveryFrequency);
    try {
      const row = await this.prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          planName: plan.name,
          frequency: plan.deliveryFrequency,
          nextDeliveryAt: nextDelivery,
          nextPaymentAt: nextDelivery,
        },
      });
      return toSubscription(row);
    } catch (error) {
      // Partial unique index: one live (active or paused) subscription per user.
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('You already have a subscription. Cancel it before starting another.');
      }
      throw error;
    }
  }

  /** The user's current subscription: active, or paused (so they can resume it). */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const row = await this.prisma.subscription.findFirst({
      where: { userId, status: { not: SubscriptionStatus.cancelled } },
      orderBy: { createdAt: 'desc' },
    });
    return row ? toSubscription(row) : null;
  }

  async updateSubscriptionPlan(userId: string, subscriptionId: string, newPlanId: string) {
    const sub = await this.findLive(userId, subscriptionId);
    const plan = this.getPlanById(newPlanId);
    if (!plan) throw new NotFoundException('Plan not found');
    return this.save(sub.id, {
      planId: plan.id,
      planName: plan.name,
      frequency: plan.deliveryFrequency,
    });
  }

  async updateDeliveryFrequency(userId: string, subscriptionId: string, frequency: DeliveryFrequency) {
    const sub = await this.findLive(userId, subscriptionId);
    return this.save(sub.id, { frequency });
  }

  async pauseSubscription(userId: string, subscriptionId: string) {
    const sub = await this.findLive(userId, subscriptionId);
    if (sub.status !== SubscriptionStatus.active) {
      throw new BadRequestException('Only an active subscription can be paused');
    }
    return this.save(sub.id, { status: SubscriptionStatus.paused });
  }

  async resumeSubscription(userId: string, subscriptionId: string) {
    const sub = await this.findLive(userId, subscriptionId);
    if (sub.status !== SubscriptionStatus.paused) {
      throw new BadRequestException('Only a paused subscription can be resumed');
    }
    return this.save(sub.id, { status: SubscriptionStatus.active });
  }

  async cancelSubscription(userId: string, subscriptionId: string) {
    const sub = await this.findLive(userId, subscriptionId);
    return this.save(sub.id, { status: SubscriptionStatus.cancelled });
  }

  async skipDelivery(userId: string, subscriptionId: string) {
    const sub = await this.findLive(userId, subscriptionId);
    if (sub.status !== SubscriptionStatus.active) {
      throw new BadRequestException('Resume your subscription before skipping a delivery');
    }
    return this.save(sub.id, {
      nextDeliveryAt: addInterval(sub.nextDeliveryAt, sub.frequency),
    });
  }

  /** Another user's subscription looks exactly like a missing one (404, not 403). */
  private async findLive(userId: string, subscriptionId: string): Promise<Row> {
    const sub = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!sub || sub.userId !== userId) throw new NotFoundException('Subscription not found');
    if (sub.status === SubscriptionStatus.cancelled) {
      throw new BadRequestException('This subscription is cancelled');
    }
    return sub;
  }

  private async save(id: string, data: Partial<Row>): Promise<UserSubscription> {
    const row = await this.prisma.subscription.update({ where: { id }, data });
    return toSubscription(row);
  }
}
