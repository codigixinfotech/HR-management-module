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
import { SalaryComponentsService } from './salary-components.service';
import {
  CreateSalaryComponentDto,
  UpdateSalaryComponentDto,
} from './dto/salary-component.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../common/utils/tenant-context.util';

@Controller('payroll/salary-components')
export class SalaryComponentsController {
  constructor(
    private readonly salaryComponentsService: SalaryComponentsService,
  ) {}

  @Get()
  @Permissions('payroll.read')
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.salaryComponentsService.list(tenantCompanyId);
  }

  @Get(':id')
  @Permissions('payroll.read')
  findOne(@Param('id') id: string) {
    return this.salaryComponentsService.findById(id);
  }

  @Post()
  @Permissions('payroll.write')
  create(@Body() dto: CreateSalaryComponentDto) {
    return this.salaryComponentsService.create(dto);
  }

  @Patch(':id')
  @Permissions('payroll.write')
  update(@Param('id') id: string, @Body() dto: UpdateSalaryComponentDto) {
    return this.salaryComponentsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('payroll.write')
  remove(@Param('id') id: string) {
    return this.salaryComponentsService.remove(id);
  }
}
