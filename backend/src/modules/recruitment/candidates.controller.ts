import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { SaveCandidateScreeningDto, UpdateCandidateStageDto } from './dto/candidate.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('recruitment/candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get(':id')
  @Permissions('recruitment.read')
  findOne(@Param('id') id: string) {
    return this.candidatesService.findById(id);
  }

  @Get(':id/screening')
  @Permissions('recruitment.read')
  getScreening(@Param('id') id: string) {
    return this.candidatesService.getLatestScreening(id);
  }

  @Post(':id/screening')
  @Permissions('recruitment.write')
  saveScreening(@Param('id') id: string, @Body() dto: SaveCandidateScreeningDto) {
    return this.candidatesService.saveScreening(id, dto);
  }

  @Patch(':id/stage')
  @Permissions('recruitment.write')
  updateStage(@Param('id') id: string, @Body() dto: UpdateCandidateStageDto) {
    return this.candidatesService.updateStage(id, dto.stage);
  }

  @Patch(':id')
  @Permissions('recruitment.write')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.candidatesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('recruitment.write')
  remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}

