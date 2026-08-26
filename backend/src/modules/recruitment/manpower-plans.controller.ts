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
import { ManpowerPlansService } from './manpower-plans.service';
import { CreateManpowerPlanDto, UpdateManpowerPlanDto } from './dto/manpower-plan.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('recruitment/manpower-plans')
export class ManpowerPlansController {
  constructor(private readonly manpowerPlansService: ManpowerPlansService) {}

  @Get()
  @Permissions('recruitment.read')
  list(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.manpowerPlansService.list(companyId, branchId);
  }

  @Get('count-active')
  @Permissions('recruitment.read')
  countActive(
    @Query('departmentName') departmentName?: string,
    @Query('role') role?: string,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('designationId') designationId?: string,
  ) {
    return this.manpowerPlansService.countActiveStaff(departmentName, role, companyId, departmentId, designationId, branchId);
  }

  @Get(':id')
  @Permissions('recruitment.read')
  findOne(@Param('id') id: string) {
    return this.manpowerPlansService.findOne(id);
  }

  @Post()
  @Permissions('recruitment.write')
  create(@Body() dto: CreateManpowerPlanDto) {
    return this.manpowerPlansService.create(dto);
  }

  @Patch(':id')
  @Permissions('recruitment.write')
  update(@Param('id') id: string, @Body() dto: UpdateManpowerPlanDto) {
    return this.manpowerPlansService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('recruitment.write')
  remove(@Param('id') id: string) {
    return this.manpowerPlansService.remove(id);
  }
}
