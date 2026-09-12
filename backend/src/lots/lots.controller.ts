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
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, CreateLotDto } from './dto/lots.dto';

@Controller('lots')
export class LotsController {
  constructor(
    private store: StoreService,
    private prisma: PrismaService,
  ) {}

  @Get()
  getLots(@Query('search') search?: string) {
    return this.store.getLots(search);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createLot(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateLotDto,
  ) {
    let traceability = dto.traceability;
    if (!traceability && dto.farmId) {
      const farm = await this.prisma.farm.findUnique({ where: { id: dto.farmId } });
      if (farm) traceability = farm.name;
    }

    return this.store.createLot({
      name: dto.name,
      origin: dto.origin,
      grade: dto.grade ?? 'Ungraded',
      price: dto.price ?? 0,
      cuppingNotes: dto.cuppingNotes ?? '',
      traceability: traceability ?? 'Not yet traced to a registered farm',
      warehouse: dto.warehouse ?? 'unassigned',
      quantity: dto.quantity,
      unit: dto.unit ?? 'kg',
      farmerId: req.user.id,
      farmId: dto.farmId,
    });
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
