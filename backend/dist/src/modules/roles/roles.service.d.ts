import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class RolesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly include;
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
        companyId: string | null;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        isSystem: boolean;
    })[]>;
    findById(id: string): Promise<{
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
        companyId: string | null;
        createdAt: Date;
        name: string;
        updatedAt: Date;
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
        companyId: string | null;
        createdAt: Date;
        name: string;
        updatedAt: Date;
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
        companyId: string | null;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        isSystem: boolean;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    listPermissions(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        description: string | null;
        code: string;
        action: string;
        module: string;
    }[]>;
}
