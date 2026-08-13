import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AddPayslipDto, CreatePayrollRunDto } from './dto/payroll.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  listRuns() {
    return this.prisma.payrollRun.findMany({
      include: { _count: { select: { payslips: true } } },
      orderBy: { runDate: 'desc' },
    });
  }

  createRun(dto: CreatePayrollRunDto) {
    return this.prisma.payrollRun.create({ data: dto });
  }

  payslips(runId: string) {
    return this.prisma.payslip.findMany({ where: { payrollRunId: runId }, include: { employee: true } });
  }

  addPayslip(runId: string, dto: AddPayslipDto) {
    const bonuses = dto.bonuses ?? 0;
    const deductions = dto.deductions ?? 0;
    const netPay = dto.baseSalary + bonuses - deductions;
    return this.prisma.payslip.create({
      data: { payrollRunId: runId, employeeId: dto.employeeId, baseSalary: dto.baseSalary, bonuses, deductions, netPay },
    });
  }

  async markPaid(runId: string) {
    await this.prisma.payslip.updateMany({ where: { payrollRunId: runId }, data: { status: 'paid', paidAt: new Date() } });
    const run = await this.prisma.payrollRun.update({ where: { id: runId }, data: { status: 'paid' } });
    await this.notifications.publish('payroll.paid', run);
    return run;
  }
}
