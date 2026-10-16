import { PageQueryDto, toPage } from '../common/pagination';
import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  findMine(@Req() req: { user: { id: string } }, @Query() page: PageQueryDto) {
    return this.notifications.findMine(req.user.id, toPage(page));
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.notifications.markRead(id, req.user.id);
  }
}
