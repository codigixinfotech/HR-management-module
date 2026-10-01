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
import { WeeklyOffPoliciesService } from './weekly-off-policies.service';
import {
  CreateWeeklyOffPolicyDto,
  UpdateWeeklyOffPolicyDto,
} from './dto/weekly-off-policy.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getWorkforceTenantScope } from '../../common/utils/tenant-context.util';

@Controller('workforce/weekly-off-policies')
export class WeeklyOffPoliciesController {
  constructor(private readonly policiesService: WeeklyOffPoliciesService) {}

  @Get()
  @Permissions('workforce.read')
  list(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, companyId, branchId);
    return this.policiesService.list(scope.companyId, scope.branchId);
  }

  @Get(':id')
  @Permissions('workforce.read')
  findOne(@Param('id') id: string) {
    return this.policiesService.findById(id);
  }

  @Post()
  @Permissions('workforce.write')
  create(
    @Body() dto: CreateWeeklyOffPolicyDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, dto.companyId, dto.branchId || undefined);
    return this.policiesService.create(dto, scope.companyId, scope.branchId);
  }

  @Patch(':id')
  @Permissions('workforce.write')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWeeklyOffPolicyDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, dto.companyId, dto.branchId || undefined);
    return this.policiesService.update(
      id,
      dto,
      scope.companyId,
      scope.isSuperAdmin ? undefined : scope.branchId
    );
  }

  @Delete(':id')
  @Permissions('workforce.write')
  remove(
    @Param('id') id: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user);
    return this.policiesService.remove(
      id,
      scope.companyId,
      scope.isSuperAdmin ? undefined : scope.branchId
    );
  }
}
