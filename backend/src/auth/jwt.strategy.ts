import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { StoreService } from '../common/data/store.service';
import { getJwtSecret } from './jwt-secret';
import { extractToken } from './session-cookie';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private store: StoreService) {
    super({
      jwtFromRequest: extractToken,
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.store.findUserById(payload.sub);
    if (!user) throw new UnauthorizedException();
    const { password: _password, ...result } = user;
    return result;
  }
}
