import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { isCsrfSafe } from './session-cookie';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    if (!isCsrfSafe(req)) {
      throw new ForbiddenException('Missing client header');
    }
    return super.canActivate(context);
  }
}
