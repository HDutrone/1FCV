import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CrmService } from './crm.service';
import { AddNoteDto, CreateCustomerDto, UpdateStageDto } from './dto/crm.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('crm/customers')
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @Get()
  list() {
    return this.crm.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.crm.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.crm.create(dto);
  }

  @Patch(':id/stage')
  updateStage(@Param('id') id: string, @Body() dto: UpdateStageDto) {
    return this.crm.updateStage(id, dto);
  }

  @Post(':id/notes')
  addNote(@Param('id') id: string, @Body() dto: AddNoteDto, @CurrentUser() user: { id: string }) {
    return this.crm.addNote(id, dto, user?.id);
  }
}
