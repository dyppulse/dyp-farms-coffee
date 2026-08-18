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
import { ReceiptsService } from './receipts.service';

@Controller('receipts')
@UseGuards(JwtAuthGuard)
export class ReceiptsController {
  constructor(private receipts: ReceiptsService) {}

  @Post('generate')
  async generateReceipt(
    @Req() req: { user: { id: string } },
    @Body() body: { lotId: string; qualityData: any },
  ) {
    const receipt = this.receipts.generateReceiptFromQuality(
      body.lotId,
      body.qualityData,
    );
    return receipt;
  }

  @Get('user')
  async getUserReceipts(@Req() req: { user: { id: string } }) {
    const receipts = this.receipts.getUserReceipts(req.user.id);
    return { receipts };
  }

  @Get(':receiptId')
  async getReceipt(@Param('receiptId') receiptId: string) {
    const receipt = this.receipts.getReceiptById(receiptId);
    if (!receipt) return { error: 'Receipt not found' };
    return receipt;
  }

  @Post(':receiptId/share')
  async shareReceipt(
    @Param('receiptId') receiptId: string,
    @Body() body: { format: 'pdf' | 'email' | 'link' },
  ) {
    const share = this.receipts.shareReceipt(receiptId, body.format);
    return share;
  }
}
