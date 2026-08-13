import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterStep1Dto } from './dto/register-step1.dto';
import { RegisterStep2Dto } from './dto/register-step2.dto';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
  ) {}

  private sign(payload: JwtPayload, expiresIn: '30m' | '7d') {
    return this.jwt.sign(payload, { expiresIn });
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    status: string;
    companyId: string;
  }) {
    const { id, email, fullName, role, status, companyId } = user;
    return { id, email, fullName, role, status, companyId };
  }

  /** Step 1 of registration: create the company + an admin account, pending profile completion. */
  async registerStep1(dto: RegisterStep1Dto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: 'ADMIN',
        status: 'PENDING',
        company: { create: { name: dto.companyName } },
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      companyId: user.companyId,
    };

    // Short-lived token: only good for finishing step 2, not for general API access.
    return {
      accessToken: this.sign(payload, '30m'),
      user: this.toSafeUser(user),
    };
  }

  /** Step 2: complete the profile and activate the account. */
  async registerStep2(current: JwtPayload, dto: RegisterStep2Dto) {
    const user = await this.prisma.user.findUnique({
      where: { id: current.sub },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.status !== 'PENDING') {
      throw new ForbiddenException(
        'Registration already completed for this account',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { fullName: dto.fullName, phone: dto.phone, status: 'ACTIVE' },
    });

    await this.redis.publishNotification({
      type: 'user.registered',
      companyId: updated.companyId,
      message: `${updated.fullName} finished setting up their account`,
      at: new Date().toISOString(),
    });

    const payload: JwtPayload = {
      sub: updated.id,
      email: updated.email,
      role: updated.role,
      status: updated.status,
      companyId: updated.companyId,
    };

    return {
      accessToken: this.sign(payload, '7d'),
      user: this.toSafeUser(updated),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('This account has been suspended');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      companyId: user.companyId,
    };

    // Pending accounts get a short-lived token too, scoped to finish step 2.
    const expiresIn = user.status === 'PENDING' ? '30m' : '7d';

    return {
      accessToken: this.sign(payload, expiresIn),
      user: this.toSafeUser(user),
    };
  }

  async me(current: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: current.sub },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toSafeUser(user);
  }
}
