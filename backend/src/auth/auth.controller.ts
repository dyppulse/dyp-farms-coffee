import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto, SignUpDto } from './dto/auth.dto';
import { clearSessionCookie, setSessionCookie } from './session-cookie';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Both login routes still return accessToken in the body for the mobile app, and also set
  // an httpOnly session cookie that the web app uses (it never sees or stores the token).
  @Post('signup')
  async signUp(
    @Body() dto: SignUpDto,
    @Req() req: { ip?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signUp(dto, req.ip);
    setSessionCookie(res, result.accessToken);
    return result;
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: { ip?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, req.ip);
    setSessionCookie(res, result.accessToken);
    return result;
  }

  /** Who the current session belongs to; the web app calls this on load. */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: { user: { id: string; email: string; name: string; role: string } }) {
    const { id, email, name, role } = req.user;
    return { user: { id, email, name, role } };
  }

  @HttpCode(200)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    clearSessionCookie(res);
    return { loggedOut: true };
  }
}
