import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TrainingsService } from './trainings.service';
import { CreateTrainingProgramDto, EnrollDto } from './dto/training.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@Controller('trainings')
export class TrainingsController {
  constructor(private readonly trainings: TrainingsService) {}

  @Get()
  list() {
    return this.trainings.list();
  }

  @Get(':id/enrollments')
  enrollments(@Param('id') id: string) {
    return this.trainings.enrollments(id);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.HR_MANAGER)
  @Post()
  create(@Body() dto: CreateTrainingProgramDto) {
    return this.trainings.create(dto);
  }

  @Post('enroll')
  enroll(@Body() dto: EnrollDto) {
    return this.trainings.enroll(dto);
  }
}
