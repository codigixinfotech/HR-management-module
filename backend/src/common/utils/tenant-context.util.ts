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
    if (user.companyId) return user.companyId;
    return '';
  }

  if (user.companyId) {
    return user.companyId;
  }

  throw new UnauthorizedException('Company tenant context unavailable for user');
}
