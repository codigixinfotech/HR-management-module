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
    primaryRole === 'BRANCH ADMIN';

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

export function isUserBranchAdmin(
  user?: CurrentUserPayload | null,
): boolean {
  if (!user) return false;

  const roles = (user.roles ?? [])
    .filter((r): r is string => typeof r === 'string')
    .map((r) => r.trim().toUpperCase());
  const primaryRole = user.primaryRole?.trim().toUpperCase();

  return (
    roles.includes('BRANCH_ADMIN') ||
    roles.includes('BRANCH ADMIN') ||
    primaryRole === 'BRANCH_ADMIN' ||
    primaryRole === 'BRANCH ADMIN'
  );
}

export function isUserCompanyAdmin(
  user?: CurrentUserPayload | null,
): boolean {
  if (!user) return false;
  if (isUserBranchAdmin(user)) return false;
  if (isUserSuperAdmin(user)) return false;

  const roles = (user.roles ?? [])
    .filter((r): r is string => typeof r === 'string')
    .map((r) => r.trim().toUpperCase());
  const primaryRole = user.primaryRole?.trim().toUpperCase();

  return (
    roles.includes('COMPANY_ADMIN') ||
    roles.includes('COMPANY ADMIN') ||
    roles.includes('HR_ADMIN') ||
    primaryRole === 'COMPANY_ADMIN' ||
    primaryRole === 'COMPANY ADMIN' ||
    primaryRole === 'HR_ADMIN'
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
    primaryRole === 'BRANCH ADMIN';

  if (isBranchAdmin) {
    const assignedBranchId = user.branchId || user.employee?.branchId;
    return assignedBranchId || 'NO_BRANCH_ASSIGNED';
  }

  // Head Office Admin is restricted to Head Office only
  const isHeadOfficeAdmin =
    roles.includes('HEAD_OFFICE_ADMIN') ||
    roles.includes('HEAD_OFFICE') ||
    roles.includes('HO_ADMIN') ||
    primaryRole === 'HEAD_OFFICE_ADMIN' ||
    primaryRole === 'HO_ADMIN';

  if (isHeadOfficeAdmin) {
    return 'HEAD_OFFICE';
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
  if (!branchId || branchId === 'NO_BRANCH_ASSIGNED' || branchId === 'HEAD_OFFICE' || !user || isUserSuperAdmin(user)) {
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

/**
 * Resolves the strict workforce scope (Company & Branch) for Shift Master, Week Off Master, and Roster.
 * - Super Admin: Broad access, can switch company or branch or view ALL.
 * - Head Office Login (no branchId or HEAD_OFFICE): Strictly locked to user.companyId + HEAD_OFFICE.
 * - Branch Login (user.branchId set, e.g. Cravita B or Cravita C): Strictly locked to user.companyId + user.branchId.
 */
export function getWorkforceTenantScope(
  user?: CurrentUserPayload | null,
  queryCompanyId?: string,
  queryBranchId?: string,
): { companyId: string; branchId?: string | null; isSuperAdmin: boolean } {
  const isSuper = isUserSuperAdmin(user);

  // 1. Super Admin: full switcher capabilities
  if (isSuper) {
    const cleanCompany =
      queryCompanyId &&
      queryCompanyId.trim() &&
      queryCompanyId.trim() !== 'ALL' &&
      queryCompanyId.trim() !== 'undefined' &&
      queryCompanyId.trim() !== 'null'
        ? queryCompanyId.trim()
        : (user?.companyId || '');

    let resolvedBranch: string | null | undefined = undefined;
    if (queryBranchId === 'HEAD_OFFICE' || queryBranchId === 'NONE' || queryBranchId === 'null') {
      resolvedBranch = 'HEAD_OFFICE';
    } else if (
      queryBranchId &&
      queryBranchId.trim() &&
      queryBranchId.trim() !== 'ALL' &&
      queryBranchId.trim() !== 'undefined'
    ) {
      resolvedBranch = queryBranchId.trim();
    } // else undefined = ALL branches

    return { companyId: cleanCompany, branchId: resolvedBranch, isSuperAdmin: true };
  }

  // 2. Non-Super Admin: strictly scoped to Logged-in Company + Logged-in Branch
  const companyId = user?.companyId || (queryCompanyId && queryCompanyId !== 'ALL' ? queryCompanyId : '');
  const userAssignedBranchId = user?.branchId || user?.employee?.branchId;

  if (
    userAssignedBranchId &&
    userAssignedBranchId !== 'NONE' &&
    userAssignedBranchId !== 'HEAD_OFFICE'
  ) {
    // Assigned to a specific branch (e.g. Cravita B, Cravita C)
    return { companyId, branchId: userAssignedBranchId, isSuperAdmin: false };
  }

  // Head Office Login (no branchId or HEAD_OFFICE)
  return { companyId, branchId: 'HEAD_OFFICE', isSuperAdmin: false };
}

