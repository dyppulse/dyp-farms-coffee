import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { FarmsService } from './farms.service';
import { CreateFarmDto, UpdateFarmDto } from './dto/farms.dto';

@Controller('farms')
@UseGuards(JwtAuthGuard)
export class FarmsController {
  constructor(private farms: FarmsService) {}

  @Post()
  create(@Req() req: { user: { id: string } }, @Body() dto: CreateFarmDto) {
    return this.farms.create(req.user.id, dto);
  }

  @Get()
  findMine(@Req() req: { user: { id: string } }) {
    return this.farms.findMine(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.farms.findOneOwned(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
    @Body() dto: UpdateFarmDto,
  ) {
    return this.farms.update(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.farms.remove(id, req.user.id);
  }
}

@Controller('admin/farms')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminFarmsController {
  constructor(private farms: FarmsService) {}

  @Get()
  findAll() {
    return this.farms.findAllForAdmin();
  }
}
