import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { AddPayslipDto, CreatePayrollRunDto } from './dto/payroll.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.ACCOUNTANT)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payroll: PayrollService) {}

  @Get('runs')
  listRuns() {
    return this.payroll.listRuns();
  }

  @Post('runs')
  createRun(@Body() dto: CreatePayrollRunDto) {
    return this.payroll.createRun(dto);
  }

  @Get('runs/:id/payslips')
  payslips(@Param('id') id: string) {
    return this.payroll.payslips(id);
  }

  @Post('runs/:id/payslips')
  addPayslip(@Param('id') id: string, @Body() dto: AddPayslipDto) {
    return this.payroll.addPayslip(id, dto);
  }

  @Post('runs/:id/pay')
  markPaid(@Param('id') id: string) {
    return this.payroll.markPaid(id);
  }
}
