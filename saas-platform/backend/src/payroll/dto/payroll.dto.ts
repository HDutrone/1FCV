import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePayrollRunDto {
  @IsString() period: string; // "2026-08"
}

export class AddPayslipDto {
  @IsString() employeeId: string;
  @IsNumber() baseSalary: number;
  @IsOptional() @IsNumber() bonuses?: number;
  @IsOptional() @IsNumber() deductions?: number;
}
