import { Controller, Get, Post, Param } from '@nestjs/common';
import { AtsService } from './ats.service';

@Controller('recruitment/candidates')
export class AtsController {
  constructor(private readonly atsService: AtsService) {}

  @Get(':id/ats')
  getCandidateAtsAnalysis(@Param('id') id: string) {
    return this.atsService.getAnalysisByCandidateId(id);
  }

  @Post(':id/ats/reanalyze')
  reanalyzeCandidateAts(@Param('id') id: string) {
    return this.atsService.analyzeCandidate(id);
  }
}
