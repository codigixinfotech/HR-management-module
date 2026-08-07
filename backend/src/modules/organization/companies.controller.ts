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

@Controller('organization/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Permissions('organization.companies.read')
  list() {
    return this.companiesService.list();
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
