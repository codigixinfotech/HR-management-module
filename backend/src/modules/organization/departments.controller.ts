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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('organization/departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @Permissions('organization.departments.read')
  list(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.departmentsService.list(companyId, branchId);
  }

  @Get(':id')
  @Permissions('organization.departments.read')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findById(id);
  }

  @Post()
  @Permissions('organization.departments.write')
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Patch(':id')
  @Permissions('organization.departments.write')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('organization.departments.write')
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
