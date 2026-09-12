import { UnauthorizedException } from '@nestjs/common';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

export function isUserSuperAdmin(user?: CurrentUserPayload | null): boolean {
  if (!user) return false;

  // 1. If user is explicitly assigned as a Branch Admin or has a branchId, they are NEVER a Super Admin
  const isBranchAdmin =
    user.roles?.some((r) => {
      const u = typeof r === 'string' ? r.toUpperCase() : '';
      return u.includes('BRANCH_ADMIN') || u === 'BRANCH ADMIN';
    }) ||
    user.primaryRole?.toUpperCase().includes('BRANCH_ADMIN') ||
    user.primaryRole === 'Branch Admin' ||
    Boolean(user.branchId);

  if (isBranchAdmin) return false;

  // 2. If user is explicitly assigned as a Company Admin, they are NEVER a Super Admin
  const isCompanyAdmin =
    user.roles?.some((r) => {
      const u = typeof r === 'string' ? r.toUpperCase() : '';
      return u.includes('COMPANY_ADMIN') || u === 'COMPANY ADMIN';
    }) ||
    user.primaryRole?.toUpperCase().includes('COMPANY_ADMIN') ||
    user.primaryRole === 'Company Admin';

  if (isCompanyAdmin) return false;

  // 3. System super admin identity checks
  if (user.email === 'admin@ehcm.local') return true;

  const hasSuperRole = user.roles?.some((r) => {
    const u = typeof r === 'string' ? r.toUpperCase() : '';
    return u.includes('SUPER_ADMIN') || u === 'SUPERADMIN';
  });
  const hasSuperPrimary = user.primaryRole?.toUpperCase().includes('SUPER_ADMIN');

  if (hasSuperRole || hasSuperPrimary) return true;

  // 4. If user has no companyId and no branchId, they are a platform super admin
  if (user.companyId === null && !user.branchId) return true;

  return false;
}

export function getTenantCompanyId(
  user?: CurrentUserPayload | null,
  queryCompanyId?: string,
): string {
  if (!user) {
    if (queryCompanyId) return queryCompanyId;
    throw new UnauthorizedException('Authentication required for tenant context');
  }

  // Super Admin can view all companies or filter by requested companyId
  if (isUserSuperAdmin(user)) {
    if (queryCompanyId && queryCompanyId.trim()) return queryCompanyId.trim();
    return '';
  }

  // Company Admin and Branch Admin (and Employees) are strictly scoped to their assigned company
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

  // Super Admin can view all branches or filter by requested branchId
  if (isUserSuperAdmin(user)) {
    return queryBranchId && queryBranchId.trim() ? queryBranchId.trim() : undefined;
  }

  const isCompanyAdmin =
    user.roles?.some((r) => {
      const u = typeof r === 'string' ? r.toUpperCase() : '';
      return u.includes('COMPANY_ADMIN') || u === 'COMPANY ADMIN';
    }) ||
    user.primaryRole?.toUpperCase().includes('COMPANY_ADMIN') ||
    user.primaryRole === 'Company Admin';

  // Company Admin can view all branches belonging to their company or filter by requested branchId
  if (isCompanyAdmin) {
    return queryBranchId && queryBranchId.trim() ? queryBranchId.trim() : undefined;
  }

  // Branch Admin is strictly restricted to their assigned branch
  const isBranchAdmin =
    user.roles?.some((r) => {
      const u = typeof r === 'string' ? r.toUpperCase() : '';
      return u.includes('BRANCH_ADMIN') || u === 'BRANCH ADMIN';
    }) ||
    user.primaryRole?.toUpperCase().includes('BRANCH_ADMIN') ||
    user.primaryRole === 'Branch Admin' ||
    Boolean(user.branchId);

  if (isBranchAdmin) {
    const assignedBranchId = user.branchId || user.employee?.branchId;
    if (!assignedBranchId) {
      return 'NO_BRANCH_ASSIGNED';
    }
    return assignedBranchId;
  }

  return queryBranchId && queryBranchId.trim() ? queryBranchId.trim() : undefined;
}
