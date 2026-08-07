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
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('organization/branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @Permissions('organization.branches.read')
  list(@Query('companyId') companyId?: string) {
    return this.branchesService.list(companyId);
  }

  @Get(':id')
  @Permissions('organization.branches.read')
  findOne(@Param('id') id: string) {
    return this.branchesService.findById(id);
  }

  @Post()
  @Permissions('organization.branches.write')
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Patch(':id')
  @Permissions('organization.branches.write')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('organization.branches.write')
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
