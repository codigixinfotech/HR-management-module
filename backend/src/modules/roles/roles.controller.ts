import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('administration.roles.read')
  list(@Query('companyId') companyId?: string) {
    return this.rolesService.list(companyId);
  }

  @Get('permissions/catalog')
  @Permissions('administration.roles.read')
  listPermissions() {
    return this.rolesService.listPermissions();
  }

  @Get(':id')
  @Permissions('administration.roles.read')
  findOne(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Post()
  @Permissions('administration.roles.write')
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Post(':id/duplicate')
  @Permissions('administration.roles.write')
  duplicate(@Param('id') id: string) {
    return this.rolesService.duplicate(id);
  }

  @Post(':id/assign-users')
  @Permissions('administration.roles.write')
  assignUsers(@Param('id') id: string, @Body() body: { userIds: string[] }) {
    return this.rolesService.assignUsers(id, body.userIds || []);
  }

  @Patch(':id')
  @Permissions('administration.roles.write')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('administration.roles.write')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
