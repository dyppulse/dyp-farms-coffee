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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('shop/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post()
  create(@Req() req: { user: { id: string } }, @Body() dto: CreateOrderDto) {
    return this.orders.createOrder(req.user.id, dto);
  }

  @Get()
  findMine(@Req() req: { user: { id: string } }) {
    return this.orders.findByUser(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.orders.findById(id, req.user.id);
  }

  @Post(':id/poll')
  poll(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.orders.pollPaymentStatus(id, req.user.id);
  }
}
