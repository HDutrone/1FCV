import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { HrService } from './hr.service';
import { CreateDepartmentDto, CreateDirectionDto, CreateServiceDto } from './dto/hr.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@Controller('hr')
export class HrController {
  constructor(private readonly hr: HrService) {}

  @Get('org-chart')
  orgChart(@Query('branchId') branchId?: string) {
    return this.hr.orgChart(branchId);
  }

  @Get('directions')
  listDirections() {
    return this.hr.listDirections();
  }

  @Get('departments')
  listDepartments() {
    return this.hr.listDepartments();
  }

  @Get('services')
  listServices() {
    return this.hr.listServices();
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.HR_MANAGER)
  @Post('directions')
  createDirection(@Body() dto: CreateDirectionDto) {
    return this.hr.createDirection(dto);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.HR_MANAGER)
  @Post('departments')
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.hr.createDepartment(dto);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.HR_MANAGER)
  @Post('services')
  createService(@Body() dto: CreateServiceDto) {
    return this.hr.createService(dto);
  }
}
