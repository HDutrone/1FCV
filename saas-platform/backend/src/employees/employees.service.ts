import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  list(branchId?: string) {
    return this.prisma.employee.findMany({
      where: branchId ? { branchId } : undefined,
      include: { branch: true, service: { include: { department: { include: { direction: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: { branch: true, service: true, affectations: { orderBy: { effectiveAt: 'desc' } } },
    });
  }

  async create(dto: CreateEmployeeDto) {
    const employee = await this.prisma.employee.create({ data: dto });
    await this.notifications.publish('employee.created', employee, employee.branchId);
    return employee;
  }

  update(id: string, dto: UpdateEmployeeDto) {
    return this.prisma.employee.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.employee.delete({ where: { id } });
  }
}
