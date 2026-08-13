import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  list(entityType?: string) {
    return this.prisma.auditLog.findMany({
      where: entityType ? { entityType } : undefined,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  record(userId: string | undefined, action: string, entityType: string, entityId?: string, metadata?: object) {
    return this.prisma.auditLog.create({ data: { userId, action, entityType, entityId, metadata } });
  }
}
