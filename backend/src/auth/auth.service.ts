import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StoreService } from '../common/data/store.service';
import { LoginDto, SignUpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private store: StoreService,
    private jwtService: JwtService,
  ) {}

  signUp(dto: SignUpDto) {
    const existing = this.store.findUserByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const user = this.store.createUser({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      role: dto.role ?? 'buyer',
    });
    return this.buildAuthResponse(user);
  }

  login(dto: LoginDto) {
    const user = this.store.findUserByEmail(dto.email);
    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: {
    id: string;
    email: string;
    name: string;
    role: string;
  }) {
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
