import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PpeService } from './ppe.service';
import { CreatePpeItemDto, IssuePpeDto, UpdatePpeItemDto } from './dto/ppe.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('ehs/ppe')
export class PpeController {
  constructor(private readonly ppeService: PpeService) {}

  @Get()
  @Permissions('ehs.read')
  list(@Query('companyId') companyId?: string) {
    return this.ppeService.list(companyId);
  }

  @Get('issuances')
  @Permissions('ehs.read')
  listIssuances(@Query('ppeItemId') ppeItemId?: string) {
    return this.ppeService.listIssuances(ppeItemId);
  }

  @Post()
  @Permissions('ehs.write')
  create(@Body() dto: CreatePpeItemDto) {
    return this.ppeService.create(dto);
  }

  @Patch(':id')
  @Permissions('ehs.write')
  update(@Param('id') id: string, @Body() dto: UpdatePpeItemDto) {
    return this.ppeService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('ehs.write')
  remove(@Param('id') id: string) {
    return this.ppeService.remove(id);
  }

  @Post(':id/issue')
  @Permissions('ehs.write')
  issue(@Param('id') id: string, @Body() dto: IssuePpeDto) {
    return this.ppeService.issue(id, dto);
  }
}
