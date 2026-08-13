import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { RoleName } from '@prisma/client';
import { RegisterStep1Dto } from './dto/register-step1.dto';
import { RegisterStep2Dto } from './dto/register-step2.dto';
import { LoginDto } from './dto/login.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Step 1: create the account + company shell, no profile details yet. */
  async registerStep1(dto: RegisterStep1Dto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const adminRole = await this.prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: { name: RoleName.ADMIN, label: 'Administrator' },
    });

    const company = await this.prisma.company.create({ data: { name: dto.companyName } });
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: '',
        lastName: '',
        roleId: adminRole.id,
        companyId: company.id,
        onboardingStep: 1,
      },
    });

    return { userId: user.id, companyId: company.id, nextStep: 2 };
  }

  /** Step 2: complete profile info, then issue tokens. */
  async registerStep2(dto: RegisterStep2Dto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('Registration not found — restart step 1');

    const updated = await this.prisma.user.update({
      where: { id: dto.userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        onboardingStep: 2,
        company: dto.sector || dto.companySize
          ? { update: { sector: dto.sector, size: dto.companySize } }
          : undefined,
      },
      include: { role: true },
    });

    await this.notifications.publish('company.onboarded', { companyId: user.companyId });

    return this.issueTokens(updated.id, updated.email, updated.role.name, updated.companyId ?? undefined);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email }, include: { role: true } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) throw new UnauthorizedException('Account disabled');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return this.issueTokens(user.id, user.email, user.role.name, user.companyId ?? undefined);
  }

  private issueTokens(sub: string, email: string, role: RoleName, companyId?: string) {
    const payload = { sub, email, role, companyId };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_TTL ?? '15m',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_TTL ?? '7d',
    });
    return { accessToken, refreshToken, user: { id: sub, email, role } };
  }
}
