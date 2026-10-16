import {
  Body,
  Controller,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AccountService } from './account.service';

class DeleteAccountDto {
  @IsString()
  password: string;
}

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private account: AccountService) {}

  @Delete()
  delete(@Req() req: { user: { id: string } }, @Body() dto: DeleteAccountDto) {
    return this.account.deleteAccount(req.user.id, dto.password);
  }
}
