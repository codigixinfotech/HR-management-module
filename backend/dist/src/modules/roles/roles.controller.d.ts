import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    list(): import(".prisma/client").Prisma.PrismaPromise<({
        permissions: ({
            permission: {
                description: string | null;
                action: string;
                id: string;
                code: string;
                module: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        description: string | null;
        id: string;
        companyId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isSystem: boolean;
    })[]>;
    listPermissions(): import(".prisma/client").Prisma.PrismaPromise<{
        description: string | null;
        action: string;
        id: string;
        code: string;
        module: string;
    }[]>;
    findOne(id: string): Promise<{
        permissions: ({
            permission: {
                description: string | null;
                action: string;
                id: string;
                code: string;
                module: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        description: string | null;
        id: string;
        companyId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isSystem: boolean;
    }>;
    create(dto: CreateRoleDto): Promise<{
        permissions: ({
            permission: {
                description: string | null;
                action: string;
                id: string;
                code: string;
                module: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        description: string | null;
        id: string;
        companyId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isSystem: boolean;
    }>;
    update(id: string, dto: UpdateRoleDto): Promise<{
        permissions: ({
            permission: {
                description: string | null;
                action: string;
                id: string;
                code: string;
                module: string;
            };
        } & {
            id: string;
            roleId: string;
            permissionId: string;
        })[];
    } & {
        description: string | null;
        id: string;
        companyId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isSystem: boolean;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
