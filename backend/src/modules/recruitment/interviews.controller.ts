import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import {
  CreateInterviewDto,
  UpdateInterviewScheduleDto,
  UpdateInterviewStatusDto,
  SubmitEvaluationDto,
} from './dto/interview.dto';

@Controller('recruitment/interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  create(@Body() dto: CreateInterviewDto) {
    return this.interviewsService.createInterview(dto);
  }

  @Get()
  list(
    @Query('interviewerId') interviewerId?: string,
    @Query('candidateId') candidateId?: string,
    @Query('status') status?: string,
    @Query('filterTab') filterTab?: string,
    @Query('search') search?: string,
  ) {
    return this.interviewsService.listInterviews({
      interviewerId,
      candidateId,
      status,
      filterTab,
      search,
    });
  }

  @Get('dashboard-summary')
  getDashboardSummary() {
    return this.interviewsService.getDashboardSummary();
  }

  @Get('candidate/:candidateId/history')
  getCandidateInterviewHistory(@Param('candidateId') candidateId: string) {
    return this.interviewsService.getCandidateInterviewHistory(candidateId);
  }

  @Get('reminders/my')
  getReminders(@Query('interviewerId') interviewerId?: string) {
    return this.interviewsService.getPanelReminders(interviewerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.interviewsService.getInterviewById(id);
  }

  @Patch(':id/schedule')
  updateSchedule(@Param('id') id: string, @Body() dto: UpdateInterviewScheduleDto) {
    return this.interviewsService.updateSchedule(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInterviewStatusDto) {
    return this.interviewsService.updateStatus(id, dto);
  }

  @Post(':id/evaluations')
  submitEvaluation(@Param('id') id: string, @Body() dto: SubmitEvaluationDto) {
    return this.interviewsService.submitEvaluation(id, dto);
  }
}
