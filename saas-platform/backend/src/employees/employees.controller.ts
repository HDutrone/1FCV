import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  list(@Query('branchId') branchId?: string) {
    return this.employees.list(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employees.findOne(id);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.HR_MANAGER)
  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return this.employees.create(dto);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.HR_MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employees.update(id, dto);
  }

  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.HR_MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employees.remove(id);
  }
}
