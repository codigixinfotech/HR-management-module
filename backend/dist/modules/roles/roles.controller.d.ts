import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    list(): import(".prisma/client").Prisma.PrismaPromise<({
        permissions: ({
            permission: {
                id: string;
                description: string | null;
                code: string;
                module: string;
                action: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        companyId: string | null;
        name: string;
        description: string | null;
        isSystem: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    listPermissions(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        description: string | null;
        code: string;
        module: string;
        action: string;
    }[]>;
    findOne(id: string): Promise<{
        permissions: ({
            permission: {
                id: string;
                description: string | null;
                code: string;
                module: string;
                action: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        companyId: string | null;
        name: string;
        description: string | null;
        isSystem: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateRoleDto): Promise<{
        permissions: ({
            permission: {
                id: string;
                description: string | null;
                code: string;
                module: string;
                action: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        companyId: string | null;
        name: string;
        description: string | null;
        isSystem: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateRoleDto): Promise<{
        permissions: ({
            permission: {
                id: string;
                description: string | null;
                code: string;
                module: string;
                action: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        companyId: string | null;
        name: string;
        description: string | null;
        isSystem: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
