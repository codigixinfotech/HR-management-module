import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    list(): import("@prisma/client").Prisma.PrismaPromise<({
        permissions: ({
            permission: {
                id: string;
                description: string | null;
                module: string;
                action: string;
                code: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        companyId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isSystem: boolean;
    })[]>;
    listPermissions(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        description: string | null;
        module: string;
        action: string;
        code: string;
    }[]>;
    findOne(id: string): Promise<{
        permissions: ({
            permission: {
                id: string;
                description: string | null;
                module: string;
                action: string;
                code: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        companyId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isSystem: boolean;
    }>;
    create(dto: CreateRoleDto): Promise<{
        permissions: ({
            permission: {
                id: string;
                description: string | null;
                module: string;
                action: string;
                code: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        companyId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isSystem: boolean;
    }>;
    update(id: string, dto: UpdateRoleDto): Promise<{
        permissions: ({
            permission: {
                id: string;
                description: string | null;
                module: string;
                action: string;
                code: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        companyId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isSystem: boolean;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
