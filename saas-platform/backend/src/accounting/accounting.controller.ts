import { Body, Controller, Get, Post } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CreateAccountDto, CreateJournalEntryDto } from './dto/accounting.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.ACCOUNTANT)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accounting: AccountingService) {}

  @Get('accounts')
  listAccounts() {
    return this.accounting.listAccounts();
  }

  @Post('accounts')
  createAccount(@Body() dto: CreateAccountDto) {
    return this.accounting.createAccount(dto);
  }

  @Get('entries')
  listEntries() {
    return this.accounting.listEntries();
  }

  @Post('entries')
  createEntry(@Body() dto: CreateJournalEntryDto) {
    return this.accounting.createEntry(dto);
  }
}
