import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTrainingProgramDto, EnrollDto } from './dto/training.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TrainingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  list() {
    return this.prisma.trainingProgram.findMany({
      include: { _count: { select: { enrollments: true } } },
      orderBy: { startDate: 'desc' },
    });
  }

  create(dto: CreateTrainingProgramDto) {
    return this.prisma.trainingProgram.create({ data: dto });
  }

  async enroll(dto: EnrollDto) {
    const enrollment = await this.prisma.trainingEnrollment.create({ data: dto });
    await this.notifications.publish('training.enrolled', enrollment);
    return enrollment;
  }

  enrollments(programId: string) {
    return this.prisma.trainingEnrollment.findMany({ where: { programId }, include: { employee: true } });
  }
}
