import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ComplianceTasksService } from './compliance-tasks.service';
import {
  CreateComplianceTaskDto,
  ListComplianceTasksQueryDto,
  UpdateComplianceTaskStatusDto,
} from './dto/compliance-task.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('compliance/tasks')
export class ComplianceTasksController {
  constructor(
    private readonly complianceTasksService: ComplianceTasksService,
  ) {}

  @Get()
  @Permissions('compliance.read')
  list(@Query() query: ListComplianceTasksQueryDto) {
    return this.complianceTasksService.list(
      query,
      query.companyId,
      query.status,
    );
  }

  @Get(':id')
  @Permissions('compliance.read')
  findOne(@Param('id') id: string) {
    return this.complianceTasksService.findById(id);
  }

  @Post()
  @Permissions('compliance.write')
  create(@Body() dto: CreateComplianceTaskDto) {
    return this.complianceTasksService.create(dto);
  }

  @Patch(':id/status')
  @Permissions('compliance.write')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateComplianceTaskStatusDto,
  ) {
    return this.complianceTasksService.updateStatus(id, dto);
  }

  @Delete(':id')
  @Permissions('compliance.write')
  remove(@Param('id') id: string) {
    return this.complianceTasksService.remove(id);
  }
}
