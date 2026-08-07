import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { UpdateCandidateStageDto } from './dto/candidate.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('recruitment/candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get(':id')
  @Permissions('recruitment.read')
  findOne(@Param('id') id: string) {
    return this.candidatesService.findById(id);
  }

  @Patch(':id/stage')
  @Permissions('recruitment.write')
  updateStage(@Param('id') id: string, @Body() dto: UpdateCandidateStageDto) {
    return this.candidatesService.updateStage(id, dto.stage);
  }

  @Delete(':id')
  @Permissions('recruitment.write')
  remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}
