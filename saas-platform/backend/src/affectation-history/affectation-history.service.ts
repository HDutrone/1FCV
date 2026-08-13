import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAffectationDto } from './dto/create-affectation.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AffectationHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  list(employeeId?: string) {
    return this.prisma.affectation.findMany({
      where: employeeId ? { employeeId } : undefined,
      include: { employee: true },
      orderBy: { effectiveAt: 'desc' },
    });
  }

  // Records the move AND updates the employee's current position/branch/service —
  // one write path so the "current state" and "history" can never drift apart.
  async create(dto: CreateAffectationDto, createdById?: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const [affectation] = await this.prisma.$transaction([
      this.prisma.affectation.create({
        data: {
          employeeId: dto.employeeId,
          fromServiceId: employee.serviceId,
          toServiceId: dto.toServiceId,
          fromBranchId: employee.branchId,
          toBranchId: dto.toBranchId ?? employee.branchId,
          fromPosition: employee.position,
          toPosition: dto.toPosition ?? employee.position,
          reason: dto.reason,
          effectiveAt: new Date(dto.effectiveAt),
          createdById,
        },
      }),
      this.prisma.employee.update({
        where: { id: dto.employeeId },
        data: {
          serviceId: dto.toServiceId ?? employee.serviceId,
          branchId: dto.toBranchId ?? employee.branchId,
          position: dto.toPosition ?? employee.position,
        },
      }),
    ]);

    await this.notifications.publish('employee.affected', affectation, dto.toBranchId ?? employee.branchId);
    return affectation;
  }
}
