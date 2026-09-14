import { UnauthorizedException } from '@nestjs/common';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

export function isUserSuperAdmin(user?: CurrentUserPayload | null): boolean {
  if (!user) return false;

  // 1. Email check for Super Admins
  if (user.email === 'admin@ehcm.local') return true;
  if (user.email?.toLowerCase().includes('ppurvesh503')) return true;

  // 2. Roles check
  const hasSuperRole = user.roles?.some((r) => {
    const u = typeof r === 'string' ? r.toUpperCase() : '';
    return u.includes('SUPER_ADMIN') || u === 'SUPERADMIN' || u.includes('SUPER');
  });
  const hasSuperPrimary =
    user.primaryRole?.toUpperCase().includes('SUPER_ADMIN') ||
    user.primaryRole?.toUpperCase() === 'SUPER ADMIN';

  if (hasSuperRole || hasSuperPrimary) return true;

  // 3. If user is explicitly assigned as a Branch Admin or has a branchId, they are NEVER a Super Admin
  const isBranchAdmin =
    user.roles?.some((r) => {
      const u = typeof r === 'string' ? r.toUpperCase() : '';
      return u.includes('BRANCH_ADMIN') || u === 'BRANCH ADMIN';
    }) ||
    user.primaryRole?.toUpperCase().includes('BRANCH_ADMIN') ||
    user.primaryRole === 'Branch Admin' ||
    Boolean(user.branchId);

  if (isBranchAdmin) return false;

  // 4. If user is explicitly assigned as a Company Admin, they are NEVER a Super Admin
  const isCompanyAdmin =
    user.roles?.some((r) => {
      const u = typeof r === 'string' ? r.toUpperCase() : '';
      return u.includes('COMPANY_ADMIN') || u === 'COMPANY ADMIN';
    }) ||
    user.primaryRole?.toUpperCase().includes('COMPANY_ADMIN') ||
    user.primaryRole === 'Company Admin';

  if (isCompanyAdmin) return false;

  // 5. If user has no companyId and no branchId, they are a platform super admin
  if (user.companyId === null && !user.branchId) return true;

  return false;
}

export function getTenantCompanyId(
  user?: CurrentUserPayload | null,
  queryCompanyId?: string,
): string {
  if (!user) {
    if (queryCompanyId && queryCompanyId.trim() && queryCompanyId.trim() !== 'ALL') {
      return queryCompanyId.trim();
    }
    return '';
  }

  // Super Admin can view all companies or filter by requested companyId
  if (isUserSuperAdmin(user)) {
    if (
      queryCompanyId &&
      queryCompanyId.trim() &&
      queryCompanyId.trim() !== 'ALL' &&
      queryCompanyId.trim() !== 'undefined' &&
      queryCompanyId.trim() !== 'null'
    ) {
      return queryCompanyId.trim();
    }
    return ''; // empty string means ALL companies (no companyId where filter)
  }

  // Company Admin and Branch Admin (and Employees) are strictly scoped to their assigned company
  if (user.companyId) {
    return user.companyId;
  }

  if (
    queryCompanyId &&
    queryCompanyId.trim() &&
    queryCompanyId.trim() !== 'ALL' &&
    queryCompanyId.trim() !== 'undefined'
  ) {
    return queryCompanyId.trim();
  }

  return '';
}

export function getTenantBranchId(
  user?: CurrentUserPayload | null,
  queryBranchId?: string,
): string | undefined {
  const cleanQueryBranch =
    queryBranchId &&
    queryBranchId.trim() &&
    queryBranchId.trim() !== 'ALL' &&
    queryBranchId.trim() !== 'HEAD_OFFICE' &&
    queryBranchId.trim() !== 'undefined' &&
    queryBranchId.trim() !== 'null'
      ? queryBranchId.trim()
      : undefined;

  if (!user) return cleanQueryBranch;

  // Super Admin can view all branches or filter by requested branchId
  if (isUserSuperAdmin(user)) {
    return cleanQueryBranch;
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
    return assignedBranchId || 'NO_BRANCH_ASSIGNED';
  }

  // Company Admin can view all branches belonging to their company or filter by requested branchId
  return cleanQueryBranch;
}
