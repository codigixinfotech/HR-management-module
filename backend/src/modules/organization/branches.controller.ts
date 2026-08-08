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
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';
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

  // Location Sub-endpoints
  @Get(':branchId/locations')
  @Permissions('organization.branches.read')
  listLocations(@Param('branchId') branchId: string) {
    return this.branchesService.listLocations(branchId);
  }

  @Post(':branchId/locations')
  @Permissions('organization.branches.write')
  createLocation(
    @Param('branchId') branchId: string,
    @Body() dto: CreateLocationDto,
  ) {
    return this.branchesService.createLocation(branchId, dto);
  }

  @Patch('locations/:id')
  @Permissions('organization.branches.write')
  updateLocation(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.branchesService.updateLocation(id, dto);
  }

  @Delete('locations/:id')
  @Permissions('organization.branches.write')
  removeLocation(@Param('id') id: string) {
    return this.branchesService.removeLocation(id);
  }
}
