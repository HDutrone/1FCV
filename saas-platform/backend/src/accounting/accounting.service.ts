import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAccountDto, CreateJournalEntryDto } from './dto/accounting.dto';

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  listAccounts() {
    return this.prisma.account.findMany({ orderBy: { code: 'asc' } });
  }

  createAccount(dto: CreateAccountDto) {
    return this.prisma.account.create({ data: dto });
  }

  listEntries() {
    return this.prisma.journalEntry.findMany({ include: { lines: { include: { account: true } } }, orderBy: { date: 'desc' } });
  }

  createEntry(dto: CreateJournalEntryDto) {
    const totalDebit = dto.lines.reduce((sum, l) => sum + (l.debit ?? 0), 0);
    const totalCredit = dto.lines.reduce((sum, l) => sum + (l.credit ?? 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException('Journal entry must balance: total debit must equal total credit');
    }

    return this.prisma.journalEntry.create({
      data: { reference: dto.reference, memo: dto.memo, lines: { create: dto.lines } },
      include: { lines: true },
    });
  }
}
