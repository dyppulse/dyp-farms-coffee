import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { StoreService } from '../common/data/store.service';
import { AddToCartDto } from './dto/lots.dto';

@Controller('lots')
export class LotsController {
  constructor(private store: StoreService) {}

  @Get()
  getLots(@Query('search') search?: string) {
    return this.store.getLots(search);
  }

  @Get('cart/items')
  @UseGuards(JwtAuthGuard)
  getCart(@Req() req: { user: { id: string } }) {
    return this.store.getCart(req.user.id);
  }

  @Post('cart')
  @UseGuards(JwtAuthGuard)
  addToCart(@Req() req: { user: { id: string } }, @Body() dto: AddToCartDto) {
    const lot = this.store.getLotById(dto.lotId);
    if (!lot) throw new NotFoundException('Lot not found');
    return this.store.addToCart(req.user.id, dto.lotId, dto.quantity ?? 1);
  }

  @Get(':id')
  getLot(@Param('id') id: string) {
    const lot = this.store.getLotById(id);
    if (!lot) throw new NotFoundException('Lot not found');
    return lot;
  }
}
