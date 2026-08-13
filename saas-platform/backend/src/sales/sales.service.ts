import { Injectable } from '@nestjs/common';
import { SaleOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateSaleOrderDto } from './dto/sale.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  list() {
    return this.prisma.saleOrder.findMany({
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateSaleOrderDto) {
    const total = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const order = await this.prisma.saleOrder.create({
      data: {
        reference: dto.reference,
        customerId: dto.customerId,
        total,
        items: { create: dto.items },
      },
      include: { items: true },
    });
    await this.notifications.publish('sale.created', order);
    return order;
  }

  updateStatus(id: string, status: SaleOrderStatus) {
    return this.prisma.saleOrder.update({ where: { id }, data: { status } });
  }
}
