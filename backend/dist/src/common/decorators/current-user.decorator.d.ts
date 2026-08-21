export interface CurrentUserPayload {
    userId: string;
    email: string;
    companyId: string | null;
    mustResetPassword?: boolean;
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
export declare const CurrentUser: (...dataOrPipes: (keyof CurrentUserPayload | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
