import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { FinancingService } from './financing.service';

@Controller('financing')
@UseGuards(JwtAuthGuard)
export class FinancingController {
  constructor(private financing: FinancingService) {}

  @Post('calculate-offer')
  calculateOffer(@Body() body: { receiptValue: number }) {
    const offer = this.financing.calculateLoanOffer(body.receiptValue);
    return offer;
  }

  @Post('request-loan')
  async requestLoan(
    @Req() req: { user: { id: string } },
    @Body()
    body: { lotId: string; receiptId: string; amount: number; duration: number },
  ) {
    const request = this.financing.createFinancingRequest(
      req.user.id,
      body.lotId,
      body.receiptId,
      body.amount,
      body.duration,
    );
    return request;
  }

  @Get('requests')
  async getRequests(@Req() req: { user: { id: string } }) {
    const requests = this.financing.getFinancingRequests(req.user.id);
    return { requests };
  }

  @Get('requests/:requestId')
  async getRequest(@Param('requestId') requestId: string) {
    const requests = this.financing.getFinancingRequests('');
    const request = requests.find((r) => r.id === requestId);
    if (!request) return { error: 'Request not found' };
    return request;
  }

  @Post('requests/:requestId/approve')
  async approveRequest(@Param('requestId') requestId: string) {
    const approved = this.financing.approveFinancing(requestId);
    return approved;
  }

  @Post('requests/:requestId/fund')
  async fundRequest(@Param('requestId') requestId: string) {
    const funded = this.financing.fundLoan(requestId);
    return funded;
  }
}
