import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@Roles(RoleName.SUPER_ADMIN, RoleName.AUDITOR)
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query('entityType') entityType?: string) {
    return this.audit.list(entityType);
  }
}
