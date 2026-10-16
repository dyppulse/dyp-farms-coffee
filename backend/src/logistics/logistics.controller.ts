import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { StoreService } from '../common/data/store.service';

@UseGuards(JwtAuthGuard)
@Controller('logistics')
export class LogisticsController {
  constructor(private store: StoreService) {}

  @Get('verify/qr')
  verifyQr(@Query('code') code: string) {
    const shipment = this.store.verifyQrCode(code);
    if (!shipment) throw new NotFoundException('Invalid QR code');
    return { verified: true, shipment };
  }

  @Get()
  getShipments() {
    return this.store.getShipments();
  }

  @Get(':id')
  getShipment(@Param('id') id: string) {
    const shipment = this.store.getShipmentById(id);
    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }
}
