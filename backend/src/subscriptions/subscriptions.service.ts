import { Injectable } from '@nestjs/common';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  bagCount: number;
  deliveryFrequency: 'weekly' | 'biweekly' | 'monthly';
  features: string[];
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: 'active' | 'paused' | 'cancelled';
  nextDeliveryDate: string;
  deliveryFrequency: 'weekly' | 'biweekly' | 'monthly';
  nextPaymentDate: string;
  totalSpent: number;
  bagsSent: number;
  createdAt: string;
}

@Injectable()
export class SubscriptionsService {
  private plans: SubscriptionPlan[] = [
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

  private subscriptions: UserSubscription[] = [];

  getPlans(): SubscriptionPlan[] {
    return this.plans;
  }

  getPlanById(planId: string): SubscriptionPlan | null {
    return this.plans.find((p) => p.id === planId) || null;
  }

  createSubscription(
    userId: string,
    planId: string,
  ): UserSubscription {
    const plan = this.getPlanById(planId);
    if (!plan) throw new Error('Plan not found');

    const nextDelivery = new Date();
    if (plan.deliveryFrequency === 'weekly') {
      nextDelivery.setDate(nextDelivery.getDate() + 7);
    } else if (plan.deliveryFrequency === 'biweekly') {
      nextDelivery.setDate(nextDelivery.getDate() + 14);
    } else {
      nextDelivery.setMonth(nextDelivery.getMonth() + 1);
    }

    const nextPayment = new Date(nextDelivery);

    const subscription: UserSubscription = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      userId,
      planId,
      planName: plan.name,
      status: 'active',
      nextDeliveryDate: nextDelivery.toISOString(),
      deliveryFrequency: plan.deliveryFrequency,
      nextPaymentDate: nextPayment.toISOString(),
      totalSpent: 0,
      bagsSent: 0,
      createdAt: new Date().toISOString(),
    };
    this.subscriptions.push(subscription);
    return subscription;
  }

  getUserSubscription(userId: string): UserSubscription | null {
    return this.subscriptions.find(
      (s) => s.userId === userId && s.status === 'active',
    ) || null;
  }

  updateSubscriptionPlan(
    subscriptionId: string,
    newPlanId: string,
  ): UserSubscription {
    const subscription = this.subscriptions.find((s) => s.id === subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const newPlan = this.getPlanById(newPlanId);
    if (!newPlan) throw new Error('Plan not found');

    subscription.planId = newPlanId;
    subscription.planName = newPlan.name;
    subscription.deliveryFrequency = newPlan.deliveryFrequency;
    return subscription;
  }

  updateDeliveryFrequency(
    subscriptionId: string,
    frequency: 'weekly' | 'biweekly' | 'monthly',
  ): UserSubscription {
    const subscription = this.subscriptions.find((s) => s.id === subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    subscription.deliveryFrequency = frequency;
    return subscription;
  }

  pauseSubscription(subscriptionId: string): UserSubscription {
    const subscription = this.subscriptions.find((s) => s.id === subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    subscription.status = 'paused';
    return subscription;
  }

  resumeSubscription(subscriptionId: string): UserSubscription {
    const subscription = this.subscriptions.find((s) => s.id === subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    subscription.status = 'active';
    return subscription;
  }

  cancelSubscription(subscriptionId: string): UserSubscription {
    const subscription = this.subscriptions.find((s) => s.id === subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    subscription.status = 'cancelled';
    return subscription;
  }

  skipDelivery(subscriptionId: string): UserSubscription {
    const subscription = this.subscriptions.find((s) => s.id === subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const nextDelivery = new Date(subscription.nextDeliveryDate);
    if (subscription.deliveryFrequency === 'weekly') {
      nextDelivery.setDate(nextDelivery.getDate() + 7);
    } else if (subscription.deliveryFrequency === 'biweekly') {
      nextDelivery.setDate(nextDelivery.getDate() + 14);
    } else {
      nextDelivery.setMonth(nextDelivery.getMonth() + 1);
    }

    subscription.nextDeliveryDate = nextDelivery.toISOString();
    return subscription;
  }
}
