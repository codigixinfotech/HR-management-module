import { UnauthorizedException } from '@nestjs/common';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

export function getTenantCompanyId(
  user?: CurrentUserPayload | null,
  queryCompanyId?: string,
): string {
  if (!user) {
    if (queryCompanyId) return queryCompanyId;
    throw new UnauthorizedException('Authentication required for tenant context');
  }

  const isSuperAdmin =
    user.permissions?.includes('*') ||
    user.roles?.some(
      (r) =>
        r.toUpperCase().includes('SUPER_ADMIN') ||
        r.toUpperCase() === 'SUPERADMIN',
    ) ||
    user.primaryRole?.toUpperCase().includes('SUPER_ADMIN');

  if (isSuperAdmin) {
    if (queryCompanyId && queryCompanyId.trim()) return queryCompanyId;
    return '';
  }

  if (user.companyId) {
    return user.companyId;
  }

  throw new UnauthorizedException('Company tenant context unavailable for user');
}

export function getTenantBranchId(
  user?: CurrentUserPayload | null,
  queryBranchId?: string,
): string | undefined {
  if (!user) return queryBranchId?.trim() || undefined;

  const isSuperAdmin =
    user.permissions?.includes('*') ||
    user.roles?.some(
      (r) =>
        r.toUpperCase().includes('SUPER_ADMIN') ||
        r.toUpperCase() === 'SUPERADMIN',
    ) ||
    user.primaryRole?.toUpperCase().includes('SUPER_ADMIN');

  const isCompanyAdmin =
    user.roles?.some((r) => r.toUpperCase().includes('COMPANY_ADMIN')) ||
    user.primaryRole?.toUpperCase().includes('COMPANY_ADMIN');

  // Super Admin and Company Admin can view all branches or filter by requested branchId
  if (isSuperAdmin || isCompanyAdmin) {
    return queryBranchId && queryBranchId.trim() ? queryBranchId.trim() : undefined;
  }

  // Branch Admin is strictly restricted to their assigned branch
  const isBranchAdmin =
    user.roles?.some((r) => r.toUpperCase().includes('BRANCH_ADMIN')) ||
    user.primaryRole?.toUpperCase().includes('BRANCH_ADMIN');

  if (isBranchAdmin) {
    const assignedBranchId = user.branchId || user.employee?.branchId;
    if (!assignedBranchId) {
      return 'NO_BRANCH_ASSIGNED';
    }
    return assignedBranchId;
  }

  return queryBranchId && queryBranchId.trim() ? queryBranchId.trim() : undefined;
}

