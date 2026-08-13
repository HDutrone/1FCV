import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterStep1Dto } from './dto/register-step1.dto';
import { RegisterStep2Dto } from './dto/register-step2.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register/step1')
  registerStep1(@Body() dto: RegisterStep1Dto) {
    return this.auth.registerStep1(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('register/step2')
  registerStep2(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterStep2Dto,
  ) {
    return this.auth.registerStep2(user, dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.auth.me(user);
  }
}
