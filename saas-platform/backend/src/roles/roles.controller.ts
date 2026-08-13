import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  list() {
    return this.roles.list();
  }

  @Get('permissions')
  listPermissions() {
    return this.roles.listPermissions();
  }

  @Roles(RoleName.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto.name, dto.label);
  }

  @Roles(RoleName.SUPER_ADMIN)
  @Post(':id/permissions')
  assign(@Param('id') id: string, @Body() dto: AssignPermissionsDto) {
    return this.roles.assignPermissions(id, dto.permissionIds);
  }
}
