import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { StockMovementType } from '@prisma/client';

export class CreateProductDto {
  @IsString() sku: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() unitPrice: number;
  @IsOptional() @IsString() category?: string;
}

export class CreateWarehouseDto {
  @IsString() name: string;
  @IsString() branchId: string;
}

export class RecordMovementDto {
  @IsString() productId: string;
  @IsString() warehouseId: string;
  @IsEnum(StockMovementType) type: StockMovementType;
  @IsInt() quantity: number;
  @IsOptional() @IsString() note?: string;
}
