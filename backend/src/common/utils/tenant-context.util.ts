import { UnauthorizedException } from '@nestjs/common';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

export function isUserSuperAdmin(
  user?: CurrentUserPayload | null,
): boolean {
  if (!user) return false;

  const roles = (user.roles ?? [])
    .filter((r): r is string => typeof r === 'string')
    .map((r) => r.trim().toUpperCase());

  const primaryRole = user.primaryRole?.trim().toUpperCase();

  // Explicit lower-level admin roles ALWAYS win.
  const isBranchAdmin =
    roles.includes('BRANCH_ADMIN') ||
    roles.includes('BRANCH ADMIN') ||
    primaryRole === 'BRANCH_ADMIN' ||
    primaryRole === 'BRANCH ADMIN' ||
    Boolean(user.branchId);

  if (isBranchAdmin) return false;

  const isCompanyAdmin =
    roles.includes('COMPANY_ADMIN') ||
    roles.includes('COMPANY ADMIN') ||
    primaryRole === 'COMPANY_ADMIN' ||
    primaryRole === 'COMPANY ADMIN';

  if (isCompanyAdmin) return false;

  // Super Admin should be determined by an explicit role,
  // not by an email address.
  return (
    roles.includes('SUPER_ADMIN') ||
    roles.includes('SUPERADMIN') ||
    primaryRole === 'SUPER_ADMIN' ||
    primaryRole === 'SUPERADMIN' ||
    primaryRole === 'SUPER ADMIN'
  );
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

  // Company Admin, Branch Admin, and Employees are strictly scoped to their assigned company
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

  // Branch Admin is strictly restricted to their assigned branch ONLY
  const roles = (user.roles ?? [])
    .filter((r): r is string => typeof r === 'string')
    .map((r) => r.trim().toUpperCase());
  const primaryRole = user.primaryRole?.trim().toUpperCase();

  const isBranchAdmin =
    roles.includes('BRANCH_ADMIN') ||
    roles.includes('BRANCH ADMIN') ||
    primaryRole === 'BRANCH_ADMIN' ||
    primaryRole === 'BRANCH ADMIN' ||
    Boolean(user.branchId);

  if (isBranchAdmin) {
    const assignedBranchId = user.branchId || user.employee?.branchId;
    return assignedBranchId || 'NO_BRANCH_ASSIGNED';
  }

  // For Company Admin, return cleanQueryBranch for service-level or validateTenantBranchId validation
  return cleanQueryBranch;
}

/**
 * Validates that if a queryBranchId is supplied by a Company Admin or other user,
 * the branch belongs to their assigned company.
 */
export async function validateTenantBranchId(
  prisma: { branch: { findUnique: (args: any) => Promise<any> } },
  user?: CurrentUserPayload | null,
  queryBranchId?: string,
): Promise<string | undefined> {
  const branchId = getTenantBranchId(user, queryBranchId);
  if (!branchId || branchId === 'NO_BRANCH_ASSIGNED' || !user || isUserSuperAdmin(user)) {
    return branchId;
  }

  // For Company Admin, verify the requested branch belongs to their company
  if (user.companyId && branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, companyId: true },
    });
    if (!branch || branch.companyId !== user.companyId) {
      // Cross-company branch access blocked!
      return 'NO_BRANCH_ASSIGNED';
    }
  }

  return branchId;
}
