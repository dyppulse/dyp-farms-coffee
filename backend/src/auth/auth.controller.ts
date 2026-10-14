import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SignUpDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signUp(@Body() dto: SignUpDto, @Req() req: { ip?: string }) {
    return this.authService.signUp(dto, req.ip);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: { ip?: string }) {
    return this.authService.login(dto, req.ip);
  }
}
