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
                action: string;
                module: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string | null;
        description: string | null;
        isSystem: boolean;
    })[]>;
    listPermissions(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        description: string | null;
        code: string;
        action: string;
        module: string;
    }[]>;
    findOne(id: string): Promise<{
        permissions: ({
            permission: {
                id: string;
                description: string | null;
                code: string;
                action: string;
                module: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string | null;
        description: string | null;
        isSystem: boolean;
    }>;
    create(dto: CreateRoleDto): Promise<{
        permissions: ({
            permission: {
                id: string;
                description: string | null;
                code: string;
                action: string;
                module: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string | null;
        description: string | null;
        isSystem: boolean;
    }>;
    update(id: string, dto: UpdateRoleDto): Promise<{
        permissions: ({
            permission: {
                id: string;
                description: string | null;
                code: string;
                action: string;
                module: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        companyId: string | null;
        description: string | null;
        isSystem: boolean;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
