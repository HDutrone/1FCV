import { Injectable } from '@nestjs/common';
import { StockMovementType } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateProductDto, CreateWarehouseDto, RecordMovementDto } from './dto/stock.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  listProducts() {
    return this.prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createProduct(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  listWarehouses() {
    return this.prisma.warehouse.findMany({ include: { branch: true } });
  }

  createWarehouse(dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({ data: dto });
  }

  levels(warehouseId?: string) {
    return this.prisma.stockItem.findMany({
      where: warehouseId ? { warehouseId } : undefined,
      include: { product: true, warehouse: true },
    });
  }

  async recordMovement(dto: RecordMovementDto) {
    const delta = dto.type === StockMovementType.OUT ? -dto.quantity : dto.quantity;

    const [movement, item] = await this.prisma.$transaction([
      this.prisma.stockMovement.create({ data: dto }),
      this.prisma.stockItem.upsert({
        where: { productId_warehouseId: { productId: dto.productId, warehouseId: dto.warehouseId } },
        update: { quantity: { increment: delta } },
        create: { productId: dto.productId, warehouseId: dto.warehouseId, quantity: Math.max(delta, 0) },
      }),
    ]);

    if (item.quantity <= item.reorderLevel) {
      await this.notifications.publish('stock.low', item, dto.warehouseId);
    }
    return movement;
  }
}
