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
import { ManpowerRequisitionsService } from './manpower-requisitions.service';
import {
  CreateManpowerRequisitionDto,
  UpdateManpowerRequisitionDto,
  UpdateMrStatusDto,
} from './dto/manpower-requisition.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../common/utils/tenant-context.util';

@Controller('recruitment/manpower-requisitions')
export class ManpowerRequisitionsController {
  constructor(private readonly mrService: ManpowerRequisitionsService) {}

  @Get('next-number')
  @Permissions('recruitment.read')
  getNextMrNumber() {
    return this.mrService.generateNextMrNumber();
  }

  @Get()
  @Permissions('recruitment.read')
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.mrService.list(tenantCompanyId, status);
  }

  @Get(':id')
  @Permissions('recruitment.read')
  findOne(@Param('id') id: string) {
    return this.mrService.findOne(id);
  }

  @Post()
  @Permissions('recruitment.write')
  create(@Body() dto: CreateManpowerRequisitionDto) {
    return this.mrService.create(dto);
  }

  @Patch(':id/status')
  @Permissions('recruitment.write')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateMrStatusDto) {
    return this.mrService.updateStatus(id, dto);
  }

  @Patch(':id')
  @Permissions('recruitment.write')
  update(@Param('id') id: string, @Body() dto: UpdateManpowerRequisitionDto) {
    return this.mrService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('recruitment.write')
  remove(@Param('id') id: string) {
    return this.mrService.remove(id);
  }
}
