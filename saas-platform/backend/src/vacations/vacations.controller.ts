import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { VacationStatus } from '@prisma/client';
import { VacationsService } from './vacations.service';
import { CreateVacationRequestDto, DecideVacationDto } from './dto/vacation.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@Controller('vacations')
export class VacationsController {
  constructor(private readonly vacations: VacationsService) {}

  @Get()
  list(@Query('status') status?: VacationStatus) {
    return this.vacations.list(status);
  }

  @Post()
  create(@Body() dto: CreateVacationRequestDto) {
    return this.vacations.create(dto);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.HR_MANAGER)
  @Patch(':id/decision')
  decide(@Param('id') id: string, @Body() dto: DecideVacationDto, @CurrentUser() user: { id: string }) {
    return this.vacations.decide(id, dto, user?.id);
  }
}
