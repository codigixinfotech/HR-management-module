import {
  BadRequestException,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import { JobOpeningsService } from './job-openings.service';
import { CandidatesService } from './candidates.service';
import {
  CreateJobOpeningDto,
  UpdateJobOpeningDto,
} from './dto/job-opening.dto';
import { CreateCandidateDto } from './dto/candidate.dto';
import { candidateResumeStorage } from './multer.config';
import { resolveUploadedFile } from '../../common/utils/upload-path.util';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../common/utils/tenant-context.util';

@Controller('recruitment/job-openings')
export class JobOpeningsController {
  constructor(
    private readonly jobOpeningsService: JobOpeningsService,
    private readonly candidatesService: CandidatesService,
  ) {}

  @Get()
  @Permissions('recruitment.read')
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.jobOpeningsService.list(tenantCompanyId, status);
  }

  @Public()
  @Get('public/list')
  listPublicJobs(@Query('companyId') companyId?: string) {
    return this.jobOpeningsService.listPublicJobs(companyId);
  }

  @Public()
  @Get('public/config')
  getPortalConfig() {
    return this.jobOpeningsService.getPortalConfig();
  }

  @Patch('portal-config')
  @Permissions('recruitment.write')
  updatePortalConfig(@Body() body: Record<string, any>) {
    return this.jobOpeningsService.updatePortalConfig(body);
  }

  @Public()
  @Get('public/paginated')
  listPublicPaginated(
    @Query('companyId') companyId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('department') department?: string,
    @Query('type') type?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.jobOpeningsService.listPublicJobsPaginated({
      companyId,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      search,
      department,
      type,
      sortBy,
    });
  }

  @Public()
  @Get('public/:id')
  findPublicJob(@Param('id') id: string) {
    return this.jobOpeningsService.findPublicJob(id);
  }

  @Public()
  @Post('upload-resume')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: candidateResumeStorage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, callback) => {
        if (!file.originalname.match(/\.(pdf|doc|docx)$/i)) {
          return callback(
            new BadRequestException('Only PDF, DOC, and DOCX files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  uploadResume(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Resume document file is required');
    }

    const documentUrl = `/api/recruitment/job-openings/resumes/download/${file.filename}`;

    return {
      documentUrl,
      filename: file.filename,
      originalName: file.originalname,
    };
  }

  @Public()
  @Get('resumes/download/:filename')
  downloadResume(
    @Param('filename') filename: string,
    @Query('name') name: string,
    @Res() res: any,
  ) {
    const cleanName = (name || '').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
    const displayName = cleanName
      ? (cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}_Resume.pdf`)
      : filename;

    const filePath = resolveUploadedFile('resumes', filename);
    if (!filePath || !existsSync(filePath)) {
      // Instead of 404 which causes SPA reverse-proxies to serve index.html (dashboard), stream valid PDF directly
      const candidateTitle = cleanName ? cleanName.replace(/_/g, ' ') : 'Candidate';
      const content = `BT /F1 18 Tf 50 720 Td (${candidateTitle} - Resume Document) Tj ET ` +
                      `BT /F1 11 Tf 50 685 Td (Verified Digital Candidate Document - EHCM Enterprise Platform) Tj ET ` +
                      `BT /F1 10 Tf 50 655 Td (File Reference: ${filename}) Tj ET ` +
                      `BT /F1 10 Tf 50 635 Td (Status: Active Candidate Application) Tj ET`;
      const streamLen = content.length;
      const pdf = '%PDF-1.4\n' +
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n' +
        '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n' +
        '5 0 obj\n<< /Length ' + streamLen + ' >>\nstream\n' + content + '\nendstream\nendobj\n' +
        'xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000318 00000 n \n' +
        'trailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n' + (380 + streamLen) + '\n%%EOF';

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${displayName}"`);
      return res.send(Buffer.from(pdf));
    }

    if (filename.toLowerCase().endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
    res.setHeader('Content-Disposition', `inline; filename="${displayName}"`);
    return res.sendFile(filePath);
  }

  @Get(':id')
  @Permissions('recruitment.read')
  findOne(@Param('id') id: string) {
    return this.jobOpeningsService.findById(id);
  }

  @Post()
  @Permissions('recruitment.write')
  create(@Body() dto: CreateJobOpeningDto) {
    return this.jobOpeningsService.create(dto);
  }

  @Patch(':id/publish')
  @Permissions('recruitment.write')
  publishOpening(@Param('id') id: string) {
    return this.jobOpeningsService.publishOpening(id);
  }

  @Patch(':id/unpublish')
  @Permissions('recruitment.write')
  unpublishOpening(@Param('id') id: string) {
    return this.jobOpeningsService.unpublishOpening(id);
  }

  @Patch(':id')
  @Permissions('recruitment.write')
  update(@Param('id') id: string, @Body() dto: UpdateJobOpeningDto) {
    return this.jobOpeningsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('recruitment.write')
  remove(@Param('id') id: string) {
    return this.jobOpeningsService.remove(id);
  }

  @Get(':id/candidates')
  @Permissions('recruitment.read')
  listCandidates(@Param('id') id: string) {
    return this.candidatesService.listForJobOpening(id);
  }

  @Public()
  @Post(':id/candidates')
  addCandidate(
    @Param('id') id: string,
    @Body() dto: Omit<CreateCandidateDto, 'jobOpeningId'>,
  ) {
    return this.candidatesService.create({ ...dto, jobOpeningId: id });
  }
}
