import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterStep1Dto } from './dto/register-step1.dto';
import { RegisterStep2Dto } from './dto/register-step2.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register/step-1')
  registerStep1(@Body() dto: RegisterStep1Dto) {
    return this.auth.registerStep1(dto);
  }

  @Post('register/step-2')
  registerStep2(@Body() dto: RegisterStep2Dto) {
    return this.auth.registerStep2(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
}
