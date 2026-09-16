import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PayGradesService } from './pay-grades.service';
import { CreatePayGradeDto, UpdatePayGradeDto } from './dto/pay-grade.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId, getTenantBranchId, isUserSuperAdmin } from '../../common/utils/tenant-context.util';

@Controller('organization/pay-grades')
export class PayGradesController {
  constructor(private readonly service: PayGradesService) {}

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    let tenantBranchId = getTenantBranchId(user, branchId);
    if (!tenantBranchId && (branchId === 'HEAD_OFFICE' || branchId === 'NONE')) {
      tenantBranchId = 'HEAD_OFFICE';
    }
    return this.service.list(tenantCompanyId, tenantBranchId);
  }

  @Get('next-code')
  async getNextCode(
    @CurrentUser() user: CurrentUserPayload,
    @Query('branchId') branchId?: string,
    @Query('companyId') companyId?: string,
  ) {
    const isSuperAdmin = isUserSuperAdmin(user);
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    const tenantBranchId = isSuperAdmin
      ? branchId
      : (user.branchId || user.employee?.branchId || branchId);

    const nextCode = await this.service.generateNextGradeCode(tenantBranchId, tenantCompanyId);
    return { nextCode };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePayGradeDto,
  ) {
    const isSuperAdmin = isUserSuperAdmin(user);

    // For non-super-admin users, enforce their company and branch scope
    if (!isSuperAdmin) {
      dto.companyId = user.companyId!;
      dto.branchId = user.branchId || user.employee?.branchId || dto.branchId || undefined;
    }

    // Validate that the selected department belongs to the user's company+branch
    if (dto.departmentId && !isSuperAdmin) {
      const valid = await this.service.isDepartmentInScope(
        dto.departmentId,
        dto.companyId,
        dto.branchId,
      );
      if (!valid) {
        throw new ForbiddenException(
          'The selected department does not belong to your assigned branch. Access denied.',
        );
      }
    }

    return this.service.create(dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePayGradeDto,
  ) {
    const isSuperAdmin = isUserSuperAdmin(user);

    if (!isSuperAdmin) {
      // Verify the grade belongs to this user's company+branch before allowing update
      const grade = await this.service.findOne(id);
      if (grade.companyId !== user.companyId) {
        throw new ForbiddenException('Access denied: grade belongs to a different company.');
      }
      const userBranchId = user.branchId || user.employee?.branchId || null;
      if (userBranchId && grade.branchId && grade.branchId !== userBranchId) {
        throw new ForbiddenException('Access denied: grade belongs to a different branch.');
      }

      // Validate the new departmentId if provided
      if (dto.departmentId) {
        const effectiveBranchId = userBranchId;
        const valid = await this.service.isDepartmentInScope(
          dto.departmentId,
          user.companyId!,
          effectiveBranchId,
        );
        if (!valid) {
          throw new ForbiddenException(
            'The selected department does not belong to your assigned branch.',
          );
        }
      }
    }

    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    const isSuperAdmin = isUserSuperAdmin(user);
    if (!isSuperAdmin) {
      const grade = await this.service.findOne(id);
      if (grade.companyId !== user.companyId) {
        throw new ForbiddenException('Access denied: grade belongs to a different company.');
      }
    }
    return this.service.remove(id);
  }
}
