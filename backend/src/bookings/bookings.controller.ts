import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Req() req: { user: { id: string } }) {
    return this.bookings.findByUser(req.user.id);
  }

  @Get('verify')
  verify(@Query('code') code: string) {
    return this.bookings.verifyTicket(code);
  }

  @Get(':id/ticket')
  @UseGuards(JwtAuthGuard)
  ticket(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.bookings.getTicket(id, req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  get(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.bookings.findById(id, req.user.id);
  }

  @Post(':id/poll')
  @UseGuards(JwtAuthGuard)
  poll(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.bookings.pollPaymentStatus(id, req.user.id);
  }
}
