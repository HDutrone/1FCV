import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SaleOrderStatus } from '@prisma/client';
import { SalesService } from './sales.service';
import { CreateSaleOrderDto } from './dto/sale.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get()
  list() {
    return this.sales.list();
  }

  @Post()
  create(@Body() dto: CreateSaleOrderDto) {
    return this.sales.create(dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: SaleOrderStatus) {
    return this.sales.updateStatus(id, status);
  }
}
