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
import { StoreService } from '../common/data/store.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlaceBidDto } from './dto/auctions.dto';

@Controller('auctions')
export class AuctionsController {
  constructor(
    private store: StoreService,
    private notifications: NotificationsService,
  ) {}

  @Get()
  getAuctions() {
    return this.store.getAuctions().map((auction) => {
      const lot = this.store.getLotById(auction.lotId);
      return { ...auction, lot };
    });
  }

  @Get(':lotId')
  getAuction(@Param('lotId') lotId: string) {
    const auction = this.store.getAuctionByLotId(lotId);
    if (!auction) throw new NotFoundException('Auction not found');
    const lot = this.store.getLotById(lotId);
    return { ...auction, lot };
  }

  @Post(':lotId/bid')
  @UseGuards(JwtAuthGuard)
  async placeBid(
    @Param('lotId') lotId: string,
    @Req() req: { user: { id: string; name: string } },
    @Body() dto: PlaceBidDto,
  ) {
    const bid = this.store.placeBid(
      lotId,
      req.user.id,
      req.user.name,
      dto.amount,
      dto.autoBid ?? false,
    );
    const auction = this.store.getAuctionByLotId(lotId);

    const lot = this.store.getLotById(lotId);
    if (lot?.farmerId && lot.farmerId !== req.user.id) {
      await this.notifications.create({
        userId: lot.farmerId,
        type: 'bid',
        title: 'New bid on your lot',
        body: `${req.user.name} bid ${dto.amount} on ${lot.name}`,
        entityType: 'auction',
        entityId: lotId,
      });
    }

    return {
      bid,
      auction,
      autoBid: dto.autoBid ?? false,
    };
  }
}
