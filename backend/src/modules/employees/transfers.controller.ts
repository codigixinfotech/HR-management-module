import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('employees/transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  @Permissions('employees.read')
  list() {
    return this.transfersService.list();
  }

  @Get(':id')
  @Permissions('employees.read')
  findOne(@Param('id') id: string) {
    return this.transfersService.findById(id);
  }

  @Post()
  @Permissions('employees.write')
  create(@Body() dto: any) {
    return this.transfersService.create(dto);
  }

  @Put(':id')
  @Permissions('employees.write')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.transfersService.update(id, dto);
  }

  @Post(':id/approve')
  @Permissions('employees.write')
  approve(@Param('id') id: string, @Body() body: any) {
    return this.transfersService.approve(id, body);
  }

  @Post(':id/reject')
  @Permissions('employees.write')
  reject(@Param('id') id: string, @Body() body: any) {
    return this.transfersService.reject(id, body);
  }

  @Post(':id/effective')
  @Permissions('employees.write')
  effective(@Param('id') id: string) {
    return this.transfersService.makeEffective(id);
  }

  @Post(':id/cancel')
  @Permissions('employees.write')
  cancel(@Param('id') id: string) {
    return this.transfersService.cancel(id);
  }
}
