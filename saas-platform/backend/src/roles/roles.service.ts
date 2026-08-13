import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RoleName } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.role.findMany({ include: { permissions: true, users: false } });
  }

  create(name: RoleName, label: string) {
    return this.prisma.role.create({ data: { name, label } });
  }

  assignPermissions(roleId: string, permissionIds: string[]) {
    return this.prisma.role.update({
      where: { id: roleId },
      data: { permissions: { set: permissionIds.map((id) => ({ id })) } },
    });
  }

  listPermissions() {
    return this.prisma.permission.findMany();
  }
}
