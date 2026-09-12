import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { TicketsService } from './tickets.service';
import { CreateTicketDto, UpdateTicketStatusDto } from './dto/tickets.dto';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private tickets: TicketsService) {}

  @Post()
  create(@Req() req: { user: { id: string } }, @Body() dto: CreateTicketDto) {
    return this.tickets.create(req.user.id, dto);
  }

  @Get()
  findMine(@Req() req: { user: { id: string } }) {
    return this.tickets.findMine(req.user.id);
  }
}

@Controller('admin/tickets')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminTicketsController {
  constructor(private tickets: TicketsService) {}

  @Get()
  findAll() {
    return this.tickets.findAllForAdmin();
  }

  @Patch(':id')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.tickets.updateStatus(id, dto);
  }
}
