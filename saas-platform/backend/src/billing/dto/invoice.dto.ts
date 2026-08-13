import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class InvoiceLineDto {
  @IsString() description: string;
  @IsOptional() @IsInt() quantity?: number;
  @IsNumber() unitPrice: number;
}

export class CreateInvoiceDto {
  @IsString() number: string;
  @IsOptional() @IsString() customerId?: string;
  @IsDateString() dueDate: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[];
}
