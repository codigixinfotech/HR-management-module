import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../common/utils/tenant-context.util';
import { Query } from '@nestjs/common';

@Controller('organization/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Permissions('organization.companies.read')
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.companiesService.list(tenantCompanyId);
  }

  @Get(':id')
  @Permissions('organization.companies.read')
  findOne(@Param('id') id: string) {
    return this.companiesService.findById(id);
  }

  @Post()
  @Permissions('organization.companies.write')
  create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @Patch(':id')
  @Permissions('organization.companies.write')
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('organization.companies.write')
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
