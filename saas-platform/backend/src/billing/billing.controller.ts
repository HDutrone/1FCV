import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/invoice.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('invoices')
  list() {
    return this.billing.list();
  }

  @Post('invoices')
  create(@Body() dto: CreateInvoiceDto) {
    return this.billing.create(dto);
  }

  @Post('invoices/:id/pay')
  markPaid(@Param('id') id: string) {
    return this.billing.markPaid(id);
  }
}
