import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { SalaryTemplatesService } from './salary-templates.service';
import { CreateSalaryTemplateDto, UpdateSalaryTemplateDto } from './dto/salary-template.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../common/utils/tenant-context.util';

@Controller('payroll/salary-templates')
export class SalaryTemplatesController {
  constructor(private readonly service: SalaryTemplatesService) {}

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.service.list(tenantCompanyId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() dto: CreateSalaryTemplateDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSalaryTemplateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
