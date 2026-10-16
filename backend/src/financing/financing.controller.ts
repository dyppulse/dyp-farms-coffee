import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/auth.guard';
import { PageQueryDto, toPage } from '../common/pagination';
import { CalculateOfferDto, RequestLoanDto } from './dto/financing.dto';
import { FinancingService } from './financing.service';

type AuthedReq = { user: { id: string; role?: string } };

@Controller('financing')
@UseGuards(JwtAuthGuard)
export class FinancingController {
  constructor(private financing: FinancingService) {}

  @Post('calculate-offer')
  calculateOffer(@Body() body: CalculateOfferDto) {
    return this.financing.calculateLoanOffer(body.receiptValue);
  }

  @Post('request-loan')
  requestLoan(@Req() req: AuthedReq, @Body() body: RequestLoanDto) {
    return this.financing.createFinancingRequest(
      req.user.id,
      body.lotId,
      body.receiptId,
      body.amount,
      body.duration,
    );
  }

  @Get('requests')
  async getRequests(@Req() req: AuthedReq, @Query() page: PageQueryDto) {
    return { requests: await this.financing.getFinancingRequests(req.user.id, toPage(page)) };
  }

  @Get('requests/:requestId')
  getRequest(@Req() req: AuthedReq, @Param('requestId') requestId: string) {
    return this.financing.getFinancingRequest(requestId, req.user);
  }

  // Approving, rejecting and funding loans are staff decisions.
  @UseGuards(AdminGuard)
  @Post('requests/:requestId/approve')
  approveRequest(@Param('requestId') requestId: string) {
    return this.financing.approveFinancing(requestId);
  }

  @UseGuards(AdminGuard)
  @Post('requests/:requestId/reject')
  rejectRequest(@Param('requestId') requestId: string) {
    return this.financing.rejectFinancing(requestId);
  }

  @UseGuards(AdminGuard)
  @Post('requests/:requestId/fund')
  fundRequest(@Param('requestId') requestId: string) {
    return this.financing.fundLoan(requestId);
  }
}
