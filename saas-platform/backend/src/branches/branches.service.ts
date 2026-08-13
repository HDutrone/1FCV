import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  list() {
    return this.prisma.branch.findMany({
      include: { _count: { select: { employees: true, directions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.branch.findUnique({
      where: { id },
      include: { directions: { include: { departments: { include: { services: true } } } } },
    });
  }

  async create(dto: CreateBranchDto) {
    const branch = await this.prisma.branch.create({ data: dto });
    await this.notifications.publish('branch.created', branch, branch.id);
    return branch;
  }

  update(id: string, dto: UpdateBranchDto) {
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.branch.delete({ where: { id } });
  }
}
