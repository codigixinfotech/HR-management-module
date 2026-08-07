import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateSafetyIncidentDto, UpdateSafetyIncidentStatusDto } from './dto/safety-incident.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('ehs/incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @Permissions('ehs.read')
  list(@Query('companyId') companyId?: string) {
    return this.incidentsService.list(companyId);
  }

  @Get(':id')
  @Permissions('ehs.read')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findById(id);
  }

  @Post()
  @Permissions('ehs.write')
  create(@Body() dto: CreateSafetyIncidentDto) {
    return this.incidentsService.create(dto);
  }

  @Patch(':id/status')
  @Permissions('ehs.write')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateSafetyIncidentStatusDto) {
    return this.incidentsService.updateStatus(id, dto);
  }
}
