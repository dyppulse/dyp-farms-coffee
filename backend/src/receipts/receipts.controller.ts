import {
  Body,
  Controller,
  Get,
  NotFoundException,
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
  generateReceipt(
    @Req() req: { user: { id: string; role?: string } },
    @Body() body: { lotId: string; qualityData: any },
  ) {
    return this.receipts.generateReceiptFromQuality(
      req.user,
      body.lotId,
      body.qualityData,
    );
  }

  @Get('user')
  async getUserReceipts(@Req() req: { user: { id: string } }) {
    const receipts = await this.receipts.getUserReceipts(req.user.id);
    return { receipts };
  }

  @Get(':receiptId')
  async getReceipt(
    @Req() req: { user: { id: string } },
    @Param('receiptId') receiptId: string,
  ) {
    const receipt = await this.receipts.getReceiptById(req.user.id, receiptId);
    if (!receipt) throw new NotFoundException('Receipt not found');
    return receipt;
  }

  @Post(':receiptId/share')
  shareReceipt(
    @Req() req: { user: { id: string } },
    @Param('receiptId') receiptId: string,
    @Body() body: { format: 'pdf' | 'email' | 'link' },
  ) {
    return this.receipts.shareReceipt(req.user.id, receiptId, body.format);
  }
}
