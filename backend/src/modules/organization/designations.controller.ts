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
import { DesignationsService } from './designations.service';
import {
  CreateDesignationDto,
  UpdateDesignationDto,
} from './dto/designation.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../common/utils/tenant-context.util';

@Controller('organization/designations')
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Get()
  @Permissions('organization.designations.read')
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.designationsService.list(tenantCompanyId, departmentId);
  }

  @Get(':id')
  @Permissions('organization.designations.read')
  findOne(@Param('id') id: string) {
    return this.designationsService.findById(id);
  }

  @Post()
  @Permissions('organization.designations.write')
  create(@Body() dto: CreateDesignationDto) {
    return this.designationsService.create(dto);
  }

  @Patch(':id')
  @Permissions('organization.designations.write')
  update(@Param('id') id: string, @Body() dto: UpdateDesignationDto) {
    return this.designationsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('organization.designations.write')
  remove(@Param('id') id: string) {
    return this.designationsService.remove(id);
  }
}
