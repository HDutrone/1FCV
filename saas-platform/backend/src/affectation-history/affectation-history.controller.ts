import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AffectationHistoryService } from './affectation-history.service';
import { CreateAffectationDto } from './dto/create-affectation.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@Controller('affectation-history')
export class AffectationHistoryController {
  constructor(private readonly service: AffectationHistoryService) {}

  @Get()
  list(@Query('employeeId') employeeId?: string) {
    return this.service.list(employeeId);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.HR_MANAGER)
  @Post()
  create(@Body() dto: CreateAffectationDto, @CurrentUser() user: { id: string }) {
    return this.service.create(dto, user?.id);
  }
}
