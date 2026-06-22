import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { StoreService } from '../common/data/store.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private store: StoreService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dyp-farms-secret-key',
    });
  }

  validate(payload: { sub: string; email: string }) {
    const user = this.store.findUserById(payload.sub);
    if (!user) throw new UnauthorizedException();
    const { password: _password, ...result } = user;
    return result;
  }
}
