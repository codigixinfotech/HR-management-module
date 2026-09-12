import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: CurrentUserPayload | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    if (user.permissions?.includes('*')) {
      return true;
    }

    const isHrOrAdmin = user.roles?.some(
      (r) => r.includes('HR') || r.includes('ADMIN') || r === 'SUPER_ADMIN',
    );

    if (isHrOrAdmin) {
      return true;
    }

    const isReadPermission = required.every((code) => code.endsWith('.read') || code.includes('.read'));
    if (isReadPermission) {
      return true;
    }

    const hasPermission = (code: string) => {
      if (user.permissions?.includes(code) || user.permissions?.includes('*')) return true;
      if (code.startsWith('workforce.')) {
        if (
          user.permissions?.includes('attendance_leave.write') ||
          user.permissions?.includes('attendance_leave.create') ||
          user.permissions?.includes('attendance_leave.edit')
        ) {
          return true;
        }
      }
      if (code.endsWith('.write')) {
        const prefix = code.replace('.write', '');
        return (
          user.permissions?.includes(`${prefix}.create`) ||
          user.permissions?.includes(`${prefix}.edit`) ||
          user.permissions?.includes(`${prefix}.write`)
        );
      }
      return false;
    };

    const hasAll = required.every(hasPermission);
    if (!hasAll) {
      throw new ForbiddenException(
        `Missing required permission(s): ${required.join(', ')}`,
      );
    }

    return true;
  }
}
