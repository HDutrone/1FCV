import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDepartmentDto, CreateDirectionDto, CreateServiceDto } from './dto/hr.dto';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  // Full org chart: branch -> direction -> department -> service
  orgChart(branchId?: string) {
    return this.prisma.direction.findMany({
      where: branchId ? { branchId } : undefined,
      include: { departments: { include: { services: { include: { _count: { select: { employees: true } } } } } } },
    });
  }

  createDirection(dto: CreateDirectionDto) {
    return this.prisma.direction.create({ data: dto });
  }

  createDepartment(dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: dto });
  }

  createService(dto: CreateServiceDto) {
    return this.prisma.service.create({ data: dto });
  }

  listDirections() {
    return this.prisma.direction.findMany({ include: { branch: true } });
  }

  listDepartments() {
    return this.prisma.department.findMany({ include: { direction: true } });
  }

  listServices() {
    return this.prisma.service.findMany({ include: { department: true } });
  }
}
