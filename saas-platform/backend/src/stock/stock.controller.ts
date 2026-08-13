import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateProductDto, CreateWarehouseDto, RecordMovementDto } from './dto/stock.dto';

@Controller('stock')
export class StockController {
  constructor(private readonly stock: StockService) {}

  @Get('products')
  listProducts() {
    return this.stock.listProducts();
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.stock.createProduct(dto);
  }

  @Get('warehouses')
  listWarehouses() {
    return this.stock.listWarehouses();
  }

  @Post('warehouses')
  createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.stock.createWarehouse(dto);
  }

  @Get('levels')
  levels(@Query('warehouseId') warehouseId?: string) {
    return this.stock.levels(warehouseId);
  }

  @Post('movements')
  recordMovement(@Body() dto: RecordMovementDto) {
    return this.stock.recordMovement(dto);
  }
}
