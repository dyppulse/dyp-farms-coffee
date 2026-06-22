import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { BookingsService } from '../bookings/bookings.service';
import { CreateBookingDto } from '../bookings/dto/create-booking.dto';
import { ToursService } from './tours.service';

@Controller('tours')
export class ToursController {
  constructor(
    private tours: ToursService,
    private bookings: BookingsService,
  ) {}

  @Get()
  getTours() {
    return this.tours.findAll();
  }

  @Get('reviews')
  getReviews(@Query('tourId') tourId?: string) {
    return this.tours.getReviews(tourId);
  }

  @Get(':id/slots')
  getSlots(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.tours.getSlots(id, from, to);
  }

  @Get(':id')
  getTour(@Param('id') id: string) {
    return this.tours.findById(id);
  }

  @Post(':id/bookings')
  @UseGuards(JwtAuthGuard)
  createBooking(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookings.createBooking(id, req.user.id, dto);
  }
}
