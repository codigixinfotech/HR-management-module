import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId, getTenantBranchId } from '../../common/utils/tenant-context.util';
import { Public } from '../../common/decorators/public.decorator';

@Controller('recruitment/assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get('technologies')
  @Permissions('recruitment.read')
  getTechnologies(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    const tenantBranchId = getTenantBranchId(user, branchId);
    return this.assessmentsService.getTechnologies(tenantCompanyId, tenantBranchId, activeOnly === 'true');
  }

  @Post('technologies')
  @Permissions('recruitment.write')
  createTechnology(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: any,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, dto.companyId || companyId);
    const tenantBranchId = getTenantBranchId(user, dto.branchId || branchId);
    return this.assessmentsService.createTechnology(dto, tenantCompanyId, tenantBranchId);
  }

  @Patch('technologies/:id')
  @Permissions('recruitment.write')
  updateTechnology(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: any,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.assessmentsService.updateTechnology(id, dto, tenantCompanyId);
  }

  @Patch('technologies/:id/status')
  @Permissions('recruitment.write')
  toggleTechnologyStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.assessmentsService.toggleTechnologyStatus(id, tenantCompanyId);
  }

  @Delete('technologies/:id')
  @Permissions('recruitment.write')
  deleteTechnology(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.assessmentsService.deleteTechnology(id, tenantCompanyId);
  }

  @Delete('technologies')
  @Permissions('recruitment.write')
  clearAllTechnologies(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.assessmentsService.clearAllTechnologies(tenantCompanyId);
  }

  @Get('kpis')
  @Permissions('recruitment.read')
  getKpis(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    const tenantBranchId = getTenantBranchId(user, branchId);
    return this.assessmentsService.getKpis(tenantCompanyId, tenantBranchId);
  }

  @Get('questions')
  @Permissions('recruitment.read')
  getQuestions(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    const tenantBranchId = getTenantBranchId(user, branchId);
    return this.assessmentsService.getQuestions(tenantCompanyId, tenantBranchId);
  }

  @Post('questions')
  @Permissions('recruitment.write')
  saveQuestion(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: any,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, dto.companyId || companyId);
    const tenantBranchId = getTenantBranchId(user, dto.branchId || branchId);
    return this.assessmentsService.saveQuestion(dto, tenantCompanyId, tenantBranchId);
  }

  @Post('questions/bulk')
  @Permissions('recruitment.write')
  bulkAddQuestions(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { questions: any[] },
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    const tenantBranchId = getTenantBranchId(user, branchId);
    return this.assessmentsService.bulkAddQuestions(body.questions || [], tenantCompanyId, tenantBranchId);
  }

  @Delete('questions/:id')
  @Permissions('recruitment.write')
  deleteQuestion(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.assessmentsService.deleteQuestion(id, tenantCompanyId);
  }

  @Patch('questions/:id/status')
  @Permissions('recruitment.write')
  toggleQuestionStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.assessmentsService.toggleQuestionStatus(id, tenantCompanyId);
  }

  @Get('attempts')
  @Permissions('recruitment.read')
  getAttempts(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    const tenantBranchId = getTenantBranchId(user, branchId);
    return this.assessmentsService.getAttempts(tenantCompanyId, tenantBranchId);
  }

  @Post('assign')
  @Permissions('recruitment.write')
  assign(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: any,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, body.companyId || companyId);
    const tenantBranchId = getTenantBranchId(user, body.branchId || branchId);
    return this.assessmentsService.createCandidateAttempt(body, tenantCompanyId, tenantBranchId);
  }

  @Public()
  @Get('attempts/:token')
  getAttemptByToken(@Param('token') token: string) {
    return this.assessmentsService.getAttemptByToken(token);
  }

  @Get()
  @Permissions('recruitment.read')
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    const tenantBranchId = getTenantBranchId(user, branchId);
    return this.assessmentsService.getAssessments(tenantCompanyId, tenantBranchId);
  }

  @Post()
  @Permissions('recruitment.write')
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: any,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, dto.companyId || companyId);
    const tenantBranchId = getTenantBranchId(user, dto.branchId || branchId);
    return this.assessmentsService.createAssessment(dto, tenantCompanyId, tenantBranchId);
  }

  @Patch(':id/status')
  @Permissions('recruitment.write')
  updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body('status') status: any,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.assessmentsService.updateAssessmentStatus(id, status, tenantCompanyId);
  }

  @Delete(':id')
  @Permissions('recruitment.write')
  delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.assessmentsService.deleteAssessment(id, tenantCompanyId);
  }
}
