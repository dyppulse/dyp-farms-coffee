import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private subscriptions: SubscriptionsService) {}

  @Get('plans')
  getPlans() {
    const plans = this.subscriptions.getPlans();
    return { plans };
  }

  @Get('plans/:planId')
  getPlan(@Param('planId') planId: string) {
    const plan = this.subscriptions.getPlanById(planId);
    if (!plan) return { error: 'Plan not found' };
    return plan;
  }

  @Post('create')
  async createSubscription(
    @Req() req: { user: { id: string } },
    @Body() body: { planId: string },
  ) {
    const subscription = this.subscriptions.createSubscription(
      req.user.id,
      body.planId,
    );
    return subscription;
  }

  @Get('my-subscription')
  async getMySubscription(@Req() req: { user: { id: string } }) {
    const subscription = this.subscriptions.getUserSubscription(req.user.id);
    if (!subscription) return { subscription: null };
    return { subscription };
  }

  @Put(':subscriptionId/plan')
  async updatePlan(
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: { planId: string },
  ) {
    const subscription = this.subscriptions.updateSubscriptionPlan(
      subscriptionId,
      body.planId,
    );
    return subscription;
  }

  @Put(':subscriptionId/frequency')
  async updateFrequency(
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: { frequency: 'weekly' | 'biweekly' | 'monthly' },
  ) {
    const subscription = this.subscriptions.updateDeliveryFrequency(
      subscriptionId,
      body.frequency,
    );
    return subscription;
  }

  @Post(':subscriptionId/pause')
  async pauseSubscription(@Param('subscriptionId') subscriptionId: string) {
    const subscription = this.subscriptions.pauseSubscription(subscriptionId);
    return subscription;
  }

  @Post(':subscriptionId/resume')
  async resumeSubscription(@Param('subscriptionId') subscriptionId: string) {
    const subscription = this.subscriptions.resumeSubscription(subscriptionId);
    return subscription;
  }

  @Post(':subscriptionId/cancel')
  async cancelSubscription(@Param('subscriptionId') subscriptionId: string) {
    const subscription = this.subscriptions.cancelSubscription(subscriptionId);
    return subscription;
  }

  @Post(':subscriptionId/skip')
  async skipDelivery(@Param('subscriptionId') subscriptionId: string) {
    const subscription = this.subscriptions.skipDelivery(subscriptionId);
    return subscription;
  }
}
