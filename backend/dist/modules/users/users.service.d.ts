import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly listInclude;
    list(query: PaginationQueryDto): Promise<{
        items: {
            company: {
                id: string;
                name: string;
            } | null;
            roles: ({
                role: {
                    id: string;
                    name: string;
                };
            } & {
                id: string;
                userId: string;
                roleId: string;
            })[];
            id: string;
            email: string;
            companyId: string | null;
            isActive: boolean;
            mustResetPassword: boolean;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findById(id: string): Promise<{
        company: {
            id: string;
            name: string;
        } | null;
        roles: ({
            role: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            userId: string;
            roleId: string;
        })[];
        id: string;
        email: string;
        companyId: string | null;
        isActive: boolean;
        mustResetPassword: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateUserDto): Promise<{
        company: {
            id: string;
            name: string;
        } | null;
        roles: ({
            role: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            userId: string;
            roleId: string;
        })[];
        id: string;
        email: string;
        companyId: string | null;
        isActive: boolean;
        mustResetPassword: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        company: {
            id: string;
            name: string;
        } | null;
        roles: ({
            role: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            userId: string;
            roleId: string;
        })[];
        id: string;
        email: string;
        companyId: string | null;
        isActive: boolean;
        mustResetPassword: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
