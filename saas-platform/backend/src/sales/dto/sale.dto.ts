import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class SaleItemDto {
  @IsString() productId: string;
  @IsInt() quantity: number;
  @IsNumber() unitPrice: number;
}

export class CreateSaleOrderDto {
  @IsString() reference: string;
  @IsOptional() @IsString() customerId?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}
