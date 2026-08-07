import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Marks a route as requiring one or more permission codes, e.g. 'organization.company.write'.
 * A user needs ALL listed permissions unless they hold the built-in SUPER_ADMIN role.
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
