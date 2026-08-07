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
import { ComplianceTypesService } from './compliance-types.service';
import {
  CreateComplianceTypeDto,
  UpdateComplianceTypeDto,
} from './dto/compliance-type.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('compliance/types')
export class ComplianceTypesController {
  constructor(
    private readonly complianceTypesService: ComplianceTypesService,
  ) {}

  @Get()
  @Permissions('compliance.read')
  list(@Query('companyId') companyId?: string) {
    return this.complianceTypesService.list(companyId);
  }

  @Get(':id')
  @Permissions('compliance.read')
  findOne(@Param('id') id: string) {
    return this.complianceTypesService.findById(id);
  }

  @Post()
  @Permissions('compliance.write')
  create(@Body() dto: CreateComplianceTypeDto) {
    return this.complianceTypesService.create(dto);
  }

  @Patch(':id')
  @Permissions('compliance.write')
  update(@Param('id') id: string, @Body() dto: UpdateComplianceTypeDto) {
    return this.complianceTypesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('compliance.write')
  remove(@Param('id') id: string) {
    return this.complianceTypesService.remove(id);
  }
}
