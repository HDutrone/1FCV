import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AddNoteDto, CreateCustomerDto, UpdateStageDto } from './dto/crm.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  list() {
    return this.prisma.customer.findMany({
      include: { _count: { select: { saleOrders: true, invoices: true, notes: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: { notes: { orderBy: { createdAt: 'desc' } }, saleOrders: true, invoices: true },
    });
  }

  create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: dto });
  }

  async updateStage(id: string, dto: UpdateStageDto) {
    const customer = await this.prisma.customer.update({ where: { id }, data: { stage: dto.stage } });
    await this.notifications.publish('crm.stage_changed', customer);
    return customer;
  }

  addNote(id: string, dto: AddNoteDto, authorId?: string) {
    return this.prisma.crmNote.create({ data: { customerId: id, content: dto.content, authorId } });
  }
}
