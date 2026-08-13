import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { BranchesModule } from './branches/branches.module';
import { HrModule } from './hr/hr.module';
import { EmployeesModule } from './employees/employees.module';
import { AffectationHistoryModule } from './affectation-history/affectation-history.module';
import { TrainingsModule } from './trainings/trainings.module';
import { VacationsModule } from './vacations/vacations.module';
import { PayrollModule } from './payroll/payroll.module';
import { SalesModule } from './sales/sales.module';
import { StockModule } from './stock/stock.module';
import { AuditModule } from './audit/audit.module';
import { AccountingModule } from './accounting/accounting.module';
import { BillingModule } from './billing/billing.module';
import { CrmModule } from './crm/crm.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    RolesModule,
    BranchesModule,
    HrModule,
    EmployeesModule,
    AffectationHistoryModule,
    TrainingsModule,
    VacationsModule,
    PayrollModule,
    SalesModule,
    StockModule,
    AuditModule,
    AccountingModule,
    BillingModule,
    CrmModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
