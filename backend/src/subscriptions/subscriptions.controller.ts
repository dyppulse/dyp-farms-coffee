import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { FrequencyDto, PlanIdDto } from './dto/subscriptions.dto';
import { SubscriptionsService } from './subscriptions.service';

type AuthedReq = { user: { id: string } };

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private subscriptions: SubscriptionsService) {}

  @Get('plans')
  getPlans() {
    return { plans: this.subscriptions.getPlans() };
  }

  @Get('plans/:planId')
  getPlan(@Param('planId') planId: string) {
    const plan = this.subscriptions.getPlanById(planId);
    if (!plan) return { error: 'Plan not found' };
    return plan;
  }

  @Post('create')
  createSubscription(@Req() req: AuthedReq, @Body() body: PlanIdDto) {
    return this.subscriptions.createSubscription(req.user.id, body.planId);
  }

  @Get('my-subscription')
  async getMySubscription(@Req() req: AuthedReq) {
    return { subscription: await this.subscriptions.getUserSubscription(req.user.id) };
  }

  @Put(':subscriptionId/plan')
  updatePlan(
    @Req() req: AuthedReq,
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: PlanIdDto,
  ) {
    return this.subscriptions.updateSubscriptionPlan(req.user.id, subscriptionId, body.planId);
  }

  @Put(':subscriptionId/frequency')
  updateFrequency(
    @Req() req: AuthedReq,
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: FrequencyDto,
  ) {
    return this.subscriptions.updateDeliveryFrequency(req.user.id, subscriptionId, body.frequency);
  }

  @Post(':subscriptionId/pause')
  pause(@Req() req: AuthedReq, @Param('subscriptionId') subscriptionId: string) {
    return this.subscriptions.pauseSubscription(req.user.id, subscriptionId);
  }

  @Post(':subscriptionId/resume')
  resume(@Req() req: AuthedReq, @Param('subscriptionId') subscriptionId: string) {
    return this.subscriptions.resumeSubscription(req.user.id, subscriptionId);
  }

  @Post(':subscriptionId/cancel')
  cancel(@Req() req: AuthedReq, @Param('subscriptionId') subscriptionId: string) {
    return this.subscriptions.cancelSubscription(req.user.id, subscriptionId);
  }

  @Post(':subscriptionId/skip')
  skip(@Req() req: AuthedReq, @Param('subscriptionId') subscriptionId: string) {
    return this.subscriptions.skipDelivery(req.user.id, subscriptionId);
  }
}
