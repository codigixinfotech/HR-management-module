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
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../common/utils/tenant-context.util';

@Controller('recruitment/interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  create(@Body() dto: CreateInterviewDto) {
    return this.interviewsService.createInterview(dto);
  }

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('interviewerId') interviewerId?: string,
    @Query('candidateId') candidateId?: string,
    @Query('status') status?: string,
    @Query('filterTab') filterTab?: string,
    @Query('search') search?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.interviewsService.listInterviews({
      companyId: tenantCompanyId,
      interviewerId,
      candidateId,
      status,
      filterTab,
      search,
    });
  }

  @Get('dashboard-summary')
  getDashboardSummary(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.interviewsService.getDashboardSummary(tenantCompanyId);
  }

  @Get('candidate/:candidateId/history')
  getCandidateInterviewHistory(@Param('candidateId') candidateId: string) {
    return this.interviewsService.getCandidateInterviewHistory(candidateId);
  }

  @Get('reminders/my')
  getReminders(
    @CurrentUser() user: CurrentUserPayload,
    @Query('interviewerId') interviewerId?: string,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.interviewsService.getPanelReminders(interviewerId, tenantCompanyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.interviewsService.getInterviewById(id);
  }

  @Patch(':id/schedule')
  updateSchedule(@Param('id') id: string, @Body() dto: UpdateInterviewScheduleDto) {
    return this.interviewsService.rescheduleInterview(id, dto);
  }

  @Patch(':id/reschedule')
  rescheduleInterview(
    @Param('id') id: string,
    @Body() dto: UpdateInterviewScheduleDto
  ) {
    return this.interviewsService.rescheduleInterview(id, dto);
  }

  @Post(':id/cancel')
  cancelInterview(@Param('id') id: string, @Body() body: { comment?: string }) {
    return this.interviewsService.cancelInterview(id, body?.comment);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInterviewStatusDto) {
    return this.interviewsService.updateStatus(id, dto);
  }

  @Post(':id/evaluations')
  submitEvaluation(@Param('id') id: string, @Body() dto: SubmitEvaluationDto) {
    return this.interviewsService.submitEvaluation(id, dto);
  }

  @Post(':id/send-email')
  sendEmail(@Param('id') id: string) {
    return this.interviewsService.sendInterviewEmail(id);
  }
}
