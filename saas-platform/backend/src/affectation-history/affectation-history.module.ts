import { Module } from '@nestjs/common';
import { AffectationHistoryController } from './affectation-history.controller';
import { AffectationHistoryService } from './affectation-history.service';
import { PrismaService } from '../prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AffectationHistoryController],
  providers: [AffectationHistoryService, PrismaService],
})
export class AffectationHistoryModule {}
