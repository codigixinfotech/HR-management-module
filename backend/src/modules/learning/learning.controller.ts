import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { LearningService } from './learning.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('learning')
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  // ==========================================
  // PART 7 — COURSE CATALOG
  // ==========================================

  @Public()
  @Get('catalog-courses')
  async getCatalogCourses() {
    return await this.learningService.getCatalogCourses();
  }

  @Post('catalog-courses')
  async createCatalogCourse(@Body() body: any) {
    return await this.learningService.createCatalogCourse(body);
  }

  @Delete('catalog-courses/:id')
  async deleteCatalogCourse(@Param('id') id: string) {
    return await this.learningService.deleteCatalogCourse(id);
  }

  // ==========================================
  // PART 1, 2, 8 — COMPANY COURSES & PURCHASING
  // ==========================================

  @Get('company-courses')
  async getCompanyCourses(@CurrentUser() user?: CurrentUserPayload) {
    return await this.learningService.getCompanyCourses(user);
  }

  @Post('company-courses')
  async addCompanyCourse(@Body() body: any) {
    return await this.learningService.addCompanyCourse(body);
  }

  @Delete('company-courses/:id')
  async deleteCompanyCourse(@Param('id') id: string) {
    return await this.learningService.deleteCompanyCourse(id);
  }

  @Post('company-courses/:id/enrollments')
  async enrollEmployees(
    @Param('id') courseId: string,
    @Body() body: { employeeIds: string[]; notifyPortal?: boolean; notifyEmail?: boolean }
  ) {
    return await this.learningService.enrollEmployees(courseId, body);
  }

  @Post('company-courses/:id/purchase-seats')
  async purchaseAdditionalSeats(
    @Param('id') courseId: string,
    @Body() body: { additionalSeats: number; pricePerSeat?: number; billingEntity?: string; costCenter?: string }
  ) {
    return await this.learningService.purchaseAdditionalSeats(courseId, body);
  }

  // ==========================================
  // PART 3 — ENROLLMENTS & SEAT LEDGER
  // ==========================================

  @Get('enrollments')
  async getEnrollments() {
    return await this.learningService.getEnrollments();
  }

  @Post('enrollments/:id/release')
  async releaseSeat(@Param('id') enrollmentId: string) {
    return await this.learningService.releaseSeat(enrollmentId);
  }

  @Delete('enrollments/:id')
  async deleteEnrollment(@Param('id') id: string) {
    return await this.learningService.deleteEnrollment(id);
  }

  // ==========================================
  // PART 9 & 10 — EMPLOYEE LEARNING HUB & PROGRESS
  // ==========================================

  @Get('my-learning')
  async getMyLearning(@CurrentUser() user?: CurrentUserPayload) {
    return await this.learningService.getMyLearning(user);
  }

  @Patch('enrollments/:id/start')
  async startEnrollment(@Param('id') id: string, @CurrentUser() user?: CurrentUserPayload) {
    return await this.learningService.startEnrollment(id, user);
  }

  @Patch('enrollments/:id/progress')
  async updateEnrollmentProgress(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user?: CurrentUserPayload
  ) {
    return await this.learningService.updateEnrollmentProgress(id, body, user);
  }

  // ==========================================
  // PART 11 — ASSESSMENT ENGINE
  // ==========================================

  @Get('courses/:courseId/assessment')
  async getCourseAssessment(@Param('courseId') courseId: string) {
    return await this.learningService.getCourseAssessment(courseId);
  }

  @Post('assessments')
  async saveCourseAssessment(@Body() body: any) {
    return await this.learningService.saveCourseAssessment(body);
  }

  @Post('assessments/:id/attempts')
  async submitAssessmentAttempt(
    @Param('id') assessmentId: string,
    @Body() body: any,
    @CurrentUser() user?: CurrentUserPayload
  ) {
    return await this.learningService.submitAssessmentAttempt(assessmentId, body, user);
  }

  // ==========================================
  // PART 12 — CERTIFICATES
  // ==========================================

  @Get('certificates')
  async getCertificates() {
    return await this.learningService.getCertificates();
  }

  @Get('my-certificates')
  async getMyCertificates(@CurrentUser() user?: CurrentUserPayload) {
    return await this.learningService.getMyCertificates(user);
  }

  @Post('certificates')
  async createCertificate(@Body() body: any) {
    return await this.learningService.createCertificate(body);
  }

  @Delete('certificates/:id')
  async deleteCertificate(@Param('id') id: string) {
    return await this.learningService.deleteCertificate(id);
  }

  // ==========================================
  // PART 13 — SKILL MATRIX & COMPETENCIES
  // ==========================================

  @Get('skills')
  async getSkills() {
    return await this.learningService.getSkills();
  }

  @Post('skills')
  async createSkill(@Body() body: any) {
    return await this.learningService.createSkill(body);
  }

  @Patch('skills/:id')
  async updateSkill(@Param('id') id: string, @Body() body: any) {
    return await this.learningService.updateSkill(id, body);
  }

  @Delete('skills/:id')
  async deleteSkill(@Param('id') id: string) {
    return await this.learningService.deleteSkill(id);
  }

  @Get('employee-skills')
  async getEmployeeSkills(@CurrentUser() user?: CurrentUserPayload) {
    return await this.learningService.getEmployeeSkills(user);
  }

  // ==========================================
  // PART 4, 5, 6 — EMPLOYEE REIMBURSEMENTS
  // ==========================================

  @Post('reimbursements')
  async submitReimbursement(@Body() body: any, @CurrentUser() user?: CurrentUserPayload) {
    return await this.learningService.submitReimbursement(body, user);
  }

  @Get('reimbursements')
  async getReimbursements(@CurrentUser() user?: CurrentUserPayload) {
    return await this.learningService.getReimbursements(user);
  }

  @Get('my-reimbursements')
  async getMyReimbursements(@CurrentUser() user?: CurrentUserPayload) {
    return await this.learningService.getMyReimbursements(user);
  }

  @Patch('reimbursements/:id/approve')
  async approveReimbursement(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user?: CurrentUserPayload
  ) {
    return await this.learningService.approveReimbursement(id, body, user);
  }

  @Patch('reimbursements/:id/reject')
  async rejectReimbursement(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user?: CurrentUserPayload
  ) {
    return await this.learningService.rejectReimbursement(id, body, user);
  }

  @Patch('reimbursements/:id/mark-payment-pending')
  async markReimbursementPaymentPending(@Param('id') id: string, @CurrentUser() user?: CurrentUserPayload) {
    return await this.learningService.markReimbursementPaymentPending(id, user);
  }

  @Patch('reimbursements/:id/mark-paid')
  async markReimbursementPaid(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user?: CurrentUserPayload
  ) {
    return await this.learningService.markReimbursementPaid(id, body, user);
  }

  // ==========================================
  // PART 16 — TRAINING PROGRAMS
  // ==========================================

  @Get('programs')
  async getPrograms() {
    return await this.learningService.getPrograms();
  }

  @Post('programs')
  async createProgram(@Body() body: any) {
    return await this.learningService.createProgram(body);
  }

  @Patch('programs/:id')
  async updateProgram(@Param('id') id: string, @Body() body: any) {
    return await this.learningService.updateProgram(id, body);
  }

  @Delete('programs/:id')
  async deleteProgram(@Param('id') id: string) {
    return await this.learningService.deleteProgram(id);
  }

  // ==========================================
  // PART 14 & 15 — NOTIFICATIONS & EMAIL
  // ==========================================

  @Get('notifications')
  async getNotifications(@CurrentUser() user?: CurrentUserPayload) {
    return await this.learningService.getNotifications(user);
  }

  @Patch('notifications/:id/read')
  async markNotificationRead(@Param('id') id: string) {
    return await this.learningService.markNotificationRead(id);
  }

  @Patch('notifications/read-all')
  async markAllNotificationsRead(@CurrentUser() user?: CurrentUserPayload) {
    return await this.learningService.markAllNotificationsRead(user);
  }

  @Get('email-dispatches')
  async getEmailDispatches() {
    return await this.learningService.getEmailDispatches();
  }

  // ==========================================
  // COURSE REQUESTS & PURCHASES
  // ==========================================

  @Get('course-requests')
  async getCourseRequests(@CurrentUser() user?: CurrentUserPayload) {
    return await this.learningService.getCourseRequests(user);
  }

  @Get('my-course-requests')
  async getMyCourseRequests(@CurrentUser() user?: CurrentUserPayload) {
    return await this.learningService.getMyCourseRequests(user);
  }

  @Post('course-requests')
  async submitCourseRequest(@Body() body: any, @CurrentUser() user?: CurrentUserPayload) {
    return await this.learningService.submitCourseRequest(body, user);
  }

  @Patch('course-requests/:id/approve')
  async approveCourseRequest(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user?: CurrentUserPayload
  ) {
    return await this.learningService.approveCourseRequest(id, body, user);
  }

  @Post('course-requests/:id/approve-purchase')
  async approvePurchaseCourseRequest(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user?: CurrentUserPayload
  ) {
    return await this.learningService.approveAndPurchaseCourseRequest(id, body, user);
  }

  @Post('course-requests/:id/approve-existing-seat')
  async approveExistingSeatCourseRequest(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user?: CurrentUserPayload
  ) {
    return await this.learningService.approveExistingSeatCourseRequest(id, body, user);
  }

  @Patch('course-requests/:id/reject')
  async rejectCourseRequest(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user?: CurrentUserPayload
  ) {
    return await this.learningService.rejectCourseRequest(id, body, user);
  }

  @Patch('course-requests/:id')
  async updateCourseRequest(@Param('id') id: string, @Body() body: any) {
    return await this.learningService.updateCourseRequest(id, body);
  }

  @Delete('course-requests/:id')
  async deleteCourseRequest(@Param('id') id: string) {
    return await this.learningService.deleteCourseRequest(id);
  }

  @Get('purchase-history')
  async getPurchaseHistory() {
    return await this.learningService.getPurchaseHistory();
  }

  @Delete('purchase-history/:id')
  async deletePurchaseHistory(@Param('id') id: string) {
    return await this.learningService.deletePurchaseHistory(id);
  }

  // ==========================================
  // PART 17 — REPORTS & CSV EXPORTS
  // ==========================================

  @Get('reports/summary')
  async getReportsSummary() {
    return await this.learningService.getReportsSummary();
  }

  @Get('reports/export/completions')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="lms_training_completions.csv"')
  async exportCompletionsCsv(@Res() res: Response) {
    const csv = await this.learningService.exportCompletionsCsv();
    return res.send(csv);
  }

  @Get('reports/export/certificates')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="lms_certificates_register.csv"')
  async exportCertificatesCsv(@Res() res: Response) {
    const csv = await this.learningService.exportCertificatesCsv();
    return res.send(csv);
  }

  @Get('reports/export/reimbursements')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="lms_learning_reimbursements.csv"')
  async exportReimbursementsCsv(@Res() res: Response) {
    const csv = await this.learningService.exportReimbursementsCsv();
    return res.send(csv);
  }
}
