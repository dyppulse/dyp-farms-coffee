import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StoreService } from '../common/data/store.service';
import { AttemptLimiter } from './attempt-limiter';
import { LoginDto, SignUpDto } from './dto/auth.dto';
import { hashPassword, hashPasswordSync, verifyPassword } from './password';

const FIFTEEN_MIN = 15 * 60 * 1000;

// Verified against when the email is unknown, so "no such user" and "wrong password"
// take the same time and can't be told apart.
const DUMMY_HASH = hashPasswordSync('not-a-real-password');

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class AuthService {
  // Failed logins per account: 5 misses locks that email for 15 minutes.
  private emailFailures = new AttemptLimiter({
    max: 5,
    windowMs: FIFTEEN_MIN,
    lockMs: FIFTEEN_MIN,
  });
  // Failed logins per client IP: a high ceiling against spraying many accounts. Kept
  // generous because everyone behind one proxy/NAT shares an address.
  private ipFailures = new AttemptLimiter({
    max: 50,
    windowMs: FIFTEEN_MIN,
    lockMs: FIFTEEN_MIN,
  });
  // Account creation per client IP.
  private signups = new AttemptLimiter({
    max: 10,
    windowMs: 60 * 60 * 1000,
    lockMs: 60 * 60 * 1000,
  });

  constructor(
    private store: StoreService,
    private jwtService: JwtService,
  ) {}

  async signUp(dto: SignUpDto, ip = 'unknown') {
    this.assertNotLocked(this.signups.lockedFor(ip), 'sign-up attempts');
    this.signups.hit(ip);

    const email = normalizeEmail(dto.email);
    const existing = await this.store.findUserByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    let user;
    try {
      user = await this.store.createUser({
        email,
        password: await hashPassword(dto.password),
        name: dto.name,
        role: dto.role ?? 'roaster',
      });
    } catch (error) {
      // Lost a race with a concurrent signup for the same email.
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto, ip = 'unknown') {
    const email = normalizeEmail(dto.email);
    this.assertNotLocked(
      Math.max(
        this.emailFailures.lockedFor(email),
        this.ipFailures.lockedFor(ip),
      ),
      'failed login attempts',
    );

    const user = await this.store.findUserByEmail(email);
    const valid = await verifyPassword(
      dto.password,
      user?.password ?? DUMMY_HASH,
    );
    if (!user || !valid) {
      this.emailFailures.hit(email);
      this.ipFailures.hit(ip);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.emailFailures.reset(email);
    return this.buildAuthResponse(user);
  }

  private assertNotLocked(secondsLeft: number, what: string) {
    if (secondsLeft <= 0) return;
    const minutes = Math.ceil(secondsLeft / 60);
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: `Too many ${what}. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
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
      role: user.role,
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
