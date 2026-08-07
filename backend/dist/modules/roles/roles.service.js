"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let RolesService = class RolesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    include = { permissions: { include: { permission: true } } };
    list() {
        return this.prisma.role.findMany({
            include: this.include,
            orderBy: { name: 'asc' },
        });
    }
    async findById(id) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: this.include,
        });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        return role;
    }
    async create(dto) {
        const existing = await this.prisma.role.findFirst({
            where: { name: dto.name, companyId: dto.companyId ?? null },
        });
        if (existing)
            throw new common_1.ConflictException('A role with this name already exists for this scope');
        return this.prisma.role.create({
            data: {
                name: dto.name,
                description: dto.description,
                companyId: dto.companyId,
                permissions: dto.permissionIds
                    ? {
                        create: dto.permissionIds.map((permissionId) => ({
                            permissionId,
                        })),
                    }
                    : undefined,
            },
            include: this.include,
        });
    }
    async update(id, dto) {
        const role = await this.findById(id);
        if (role.isSystem)
            throw new common_1.BadRequestException('System roles cannot be modified');
        if (dto.permissionIds) {
            await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
        }
        return this.prisma.role.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                permissions: dto.permissionIds
                    ? {
                        create: dto.permissionIds.map((permissionId) => ({
                            permissionId,
                        })),
                    }
                    : undefined,
            },
            include: this.include,
        });
    }
    async remove(id) {
        const role = await this.findById(id);
        if (role.isSystem)
            throw new common_1.BadRequestException('System roles cannot be deleted');
        await this.prisma.role.delete({ where: { id } });
        return { success: true };
    }
    listPermissions() {
        return this.prisma.permission.findMany({
            orderBy: [{ module: 'asc' }, { action: 'asc' }],
        });
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map