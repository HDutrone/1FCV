import { Injectable } from '@nestjs/common';
import { VacationStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateVacationRequestDto, DecideVacationDto } from './dto/vacation.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class VacationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  list(status?: VacationStatus) {
    return this.prisma.vacationRequest.findMany({
      where: status ? { status } : undefined,
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateVacationRequestDto) {
    const request = await this.prisma.vacationRequest.create({ data: dto });
    await this.notifications.publish('vacation.requested', request);
    return request;
  }

  async decide(id: string, dto: DecideVacationDto, decidedById?: string) {
    const updated = await this.prisma.vacationRequest.update({
      where: { id },
      data: {
        status: dto.decision as VacationStatus,
        approvedById: decidedById,
        decidedAt: new Date(),
      },
    });
    await this.notifications.publish('vacation.decided', updated);
    return updated;
  }
}
