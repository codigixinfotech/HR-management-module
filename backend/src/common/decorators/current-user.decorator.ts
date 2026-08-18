import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  userId: string;
  email: string;
  companyId: string | null;
  permissions: string[];
  roles: string[];
  primaryRole: string;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    fullName: string;
    departmentId: string | null;
    departmentName: string | null;
    designationId: string | null;
    designationTitle: string | null;
  } | null;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: CurrentUserPayload = request.user;
    return data ? user?.[data] : user;
  },
);
