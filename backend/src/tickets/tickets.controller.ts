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
import {
  CreateCommentDto,
  CreateTicketDto,
  EscalateTicketDto,
  RequestEscalationDto,
  UpdateTicketDto,
} from './dto/tickets.dto';

type AuthedReq = { user: { id: string; name: string; role: string } };

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private tickets: TicketsService) {}

  @Post()
  create(@Req() req: AuthedReq, @Body() dto: CreateTicketDto) {
    return this.tickets.create(req.user.id, dto);
  }

  @Get()
  findMine(@Req() req: AuthedReq) {
    return this.tickets.findMine(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.tickets.findOne(id, req.user);
  }

  @Post(':id/comments')
  comment(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.tickets.addComment(id, req.user, dto);
  }

  @Post(':id/escalation-request')
  requestEscalation(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() dto: RequestEscalationDto,
  ) {
    return this.tickets.requestEscalation(id, req.user, dto);
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

  @Get(':id')
  findOne(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.tickets.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.tickets.update(id, req.user, dto);
  }

  @Post(':id/comments')
  comment(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.tickets.addComment(id, req.user, dto);
  }

  @Post(':id/escalate')
  escalate(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() dto: EscalateTicketDto,
  ) {
    return this.tickets.escalate(id, req.user, dto);
  }
}
