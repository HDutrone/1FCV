import { Injectable } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateInvoiceDto } from './dto/invoice.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  list() {
    return this.prisma.invoice.findMany({
      include: { customer: true, lines: true },
      orderBy: { issueDate: 'desc' },
    });
  }

  create(dto: CreateInvoiceDto) {
    const amount = dto.lines.reduce((sum, l) => sum + (l.quantity ?? 1) * l.unitPrice, 0);
    return this.prisma.invoice.create({
      data: {
        number: dto.number,
        customerId: dto.customerId,
        dueDate: new Date(dto.dueDate),
        amount,
        lines: { create: dto.lines },
      },
      include: { lines: true },
    });
  }

  async markPaid(id: string) {
    const invoice = await this.prisma.invoice.update({ where: { id }, data: { status: InvoiceStatus.PAID } });
    await this.notifications.publish('invoice.paid', invoice);
    return invoice;
  }
}
