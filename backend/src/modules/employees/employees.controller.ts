import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { existsSync } from 'fs';
import { join, isAbsolute, extname, resolve } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApprovalStatus } from '@prisma/client';
import { EmployeesService } from './employees.service';
import { OnboardingService } from './onboarding.service';
import {
  CreateEmployeeDto,
  ListEmployeesQueryDto,
  UpdateEmployeeDto,
  UpdateMyProfileDto,
} from './dto/employee.dto';
import { CreateOnboardingTaskDto } from './dto/onboarding-task.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { employeeDocumentStorage } from './multer.config';
import { resolveUploadedFile } from '../../common/utils/upload-path.util';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId, getTenantBranchId } from '../../common/utils/tenant-context.util';

@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly onboardingService: OnboardingService,
  ) {}

  @Get()
  @Permissions('employees.read')
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListEmployeesQueryDto,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, query.companyId);
    const tenantBranchId = getTenantBranchId(user, query.branchId);
    return this.employeesService.list(query, tenantCompanyId, tenantBranchId);
  }

  @Get('skills/competencies')
  @Permissions('employees.read')
  listSkills() {
    return this.employeesService.listSkills();
  }

  @Post('skills/competencies')
  @Permissions('employees.write')
  createSkill(@Body() dto: { name: string; category: string; certRequired: boolean; benchmarkScore: string }) {
    return this.employeesService.createSkill(dto);
  }

  @Delete('skills/competencies/:id')
  @Permissions('employees.write')
  removeSkill(@Param('id') id: string) {
    return this.employeesService.removeSkill(id);
  }

  @Get('me')
  findMe(@CurrentUser() user: CurrentUserPayload) {
    return this.employeesService.findMe(user);
  }

  @Patch('me/profile')
  updateMyProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.employeesService.updateMyProfile(user, dto);
  }

  @Post(':id/create-login')
  @Permissions('employees.write')
  createLogin(
    @Param('id') id: string,
    @Body() dto: { email?: string; password?: string },
  ) {
    return this.employeesService.createLoginAccount(id, dto);
  }

  @Get(':id')
  @Permissions('employees.read')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.employeesService.findById(id, user);
  }

  @Get(':id/position-history')
  @Permissions('employees.read')
  getPositionHistory(@Param('id') id: string) {
    return this.employeesService.getPositionHistory(id);
  }

  @Post()
  @Permissions('employees.write')
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Patch(':id')
  @Permissions('employees.write')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('employees.write')
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }

  @Get(':id/documents')
  @Permissions('employees.read')
  listDocuments(@Param('id') id: string) {
    return this.employeesService.listDocuments(id);
  }

  @Post(':id/documents')
  @Permissions('employees.write')
  @UseInterceptors(
    FileInterceptor('file', { storage: employeeDocumentStorage }),
  )
  uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('docType') docType: string,
  ) {
    return this.employeesService.addDocument(
      id,
      docType,
      file.originalname,
      file.path,
    );
  }

  @Delete(':id/documents/:documentId')
  @Permissions('employees.write')
  removeDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    return this.employeesService.removeDocument(id, documentId);
  }

  @Patch(':id/documents/:documentId/verify')
  @Permissions('employees.write')
  verifyDocument(
    @Param('id') employeeId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body('status') status?: 'VERIFIED' | 'REJECTED' | 'PENDING',
  ) {
    return this.employeesService.verifyDocument(
      documentId,
      user,
      status || 'VERIFIED',
      employeeId,
    );
  }

  @Patch('documents/:documentId/verify')
  @Permissions('employees.write')
  verifyDocumentDirect(
    @Param('documentId') documentId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body('status') status?: 'VERIFIED' | 'REJECTED' | 'PENDING',
  ) {
    return this.employeesService.verifyDocument(
      documentId,
      user,
      status || 'VERIFIED',
    );
  }

  @Public()
  @Get('documents/:documentId/download')
  async downloadDocument(
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    const doc = await this.employeesService.getDocument(documentId);
    const cleanPath = (doc.filePath || '').replace(/\\/g, '/');
    let absolutePath = isAbsolute(cleanPath)
      ? cleanPath
      : join(process.cwd(), cleanPath);

    if (!existsSync(absolutePath)) {
      const resolved = resolveUploadedFile('employee-documents', cleanPath);
      if (resolved && existsSync(resolved)) {
        absolutePath = resolved;
      }
    }

    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Document file not found on disk');
    }

    return res.download(absolutePath, doc.fileName);
  }

  @Public()
  @Get('documents/:documentId/view')
  async viewDocument(
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    const doc = await this.employeesService.getDocument(documentId);
    const cleanPath = (doc.filePath || '').replace(/\\/g, '/');
    let absolutePath = isAbsolute(cleanPath)
      ? cleanPath
      : join(process.cwd(), cleanPath);

    if (!existsSync(absolutePath)) {
      const resolved = resolveUploadedFile('employee-documents', cleanPath);
      if (resolved && existsSync(resolved)) {
        absolutePath = resolved;
      }
    }

    res.removeHeader('Content-Security-Policy');
    res.removeHeader('X-Frame-Options');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    if (!existsSync(absolutePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${doc.fileName || 'document.pdf'}"`,
      );
      const content =
        `BT /F1 18 Tf 50 720 Td (Employee Document - ${doc.docType}) Tj ET ` +
        `BT /F1 12 Tf 50 685 Td (Digital Document Archive Copy) Tj ET ` +
        `BT /F1 10 Tf 50 655 Td (Verification Status: ${doc.verificationStatus || 'PENDING'}) Tj ET ` +
        `BT /F1 10 Tf 50 635 Td (Document Reference / File: ${doc.fileName}) Tj ET ` +
        `BT /F1 10 Tf 50 615 Td (Vault Record ID: ${doc.id}) Tj ET`;
      const streamLen = content.length;
      const pdf =
        '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length ' +
        streamLen +
        ' >>\nstream\n' +
        content +
        '\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000318 00000 n \ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n' +
        (380 + streamLen) +
        '\n%%EOF';
      return res.send(Buffer.from(pdf));
    }

    const ext = extname(absolutePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.txt': 'text/plain',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    return res.sendFile(resolve(absolutePath));
  }

  @Get(':id/onboarding-tasks')
  @Permissions('employees.read')
  listOnboardingTasks(@Param('id') id: string) {
    return this.onboardingService.listForEmployee(id);
  }

  @Post(':id/onboarding-tasks')
  @Permissions('employees.write')
  createOnboardingTask(
    @Param('id') id: string,
    @Body() dto: CreateOnboardingTaskDto,
  ) {
    return this.onboardingService.createTask(id, dto);
  }

  @Patch('onboarding-tasks/:taskId/status')
  @Permissions('employees.write')
  updateOnboardingTaskStatus(
    @Param('taskId') taskId: string,
    @Body('status') status: ApprovalStatus,
  ) {
    return this.onboardingService.updateStatus(taskId, status);
  }

  @Post(':id/courses')
  @Permissions('employees.write')
  enrollInCourse(
    @Param('id') id: string,
    @Body() dto: { courseName: string; courseType: string; status?: string; certification?: string },
  ) {
    return this.employeesService.enrollInCourse(id, dto);
  }

  @Post(':id/kpis')
  @Permissions('employees.write')
  addKpi(
    @Param('id') id: string,
    @Body() dto: { kpi: string; category: string; target: string; weightage: number; reviewPeriod: string; performanceRating?: number; managerFeedback?: string },
  ) {
    return this.employeesService.addKpi(id, dto);
  }

  @Post(':id/hr-notes')
  @Permissions('employees.write')
  addHrNote(
    @Param('id') id: string,
    @Body() dto: { note: string; noteType: string; createdBy: string },
  ) {
    return this.employeesService.addHrNote(id, dto);
  }
}
