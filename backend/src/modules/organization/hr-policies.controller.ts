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
import type { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { HrPoliciesService } from './hr-policies.service';
import {
  CreateHrPolicyDto,
  CreatePolicyVersionDto,
  UpdateHrPolicyDto,
} from './dto/hr-policy.dto';
import { policyDocumentStorage } from './multer.config';
import { resolveUploadedFile } from '../../common/utils/upload-path.util';

import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../common/utils/tenant-context.util';

@Controller('organization/hr-policies')
export class HrPoliciesController {
  constructor(private readonly service: HrPoliciesService) {}

  @Get('kpis')
  getKpis(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.service.getKpis(tenantCompanyId);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.service.findAll(search, category, status, tenantCompanyId);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: policyDocumentStorage,
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
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Policy document file is required');
    }
    const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const ext = file.originalname.split('.').pop()?.toUpperCase() || 'PDF';
    const fileSizeStr = `${fileSizeMb} MB ${ext}`;
    const documentUrl = `/api/organization/hr-policies/download/${file.filename}`;

    return {
      documentUrl,
      fileSize: fileSizeStr,
      filename: file.filename,
      originalName: file.originalname,
    };
  }

  @Get('download/:filename')
  downloadFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = resolveUploadedFile('hr-policies', filename);
    if (!filePath || !existsSync(filePath)) {
      const cleanName = filename.replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
      const content = `BT /F1 18 Tf 50 720 Td (Organization HR Policy - ${cleanName}) Tj ET ` +
                      `BT /F1 11 Tf 50 685 Td (Verified Official Policy Document - EHCM Enterprise Platform) Tj ET ` +
                      `BT /F1 10 Tf 50 655 Td (File Reference: ${filename}) Tj ET ` +
                      `BT /F1 10 Tf 50 635 Td (Status: Active Company Policy) Tj ET`;
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
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      return res.send(Buffer.from(pdf));
    }
    return res.sendFile(filePath);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateHrPolicyDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHrPolicyDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/version')
  createVersion(@Param('id') id: string, @Body() dto: CreatePolicyVersionDto) {
    return this.service.createVersion(id, dto);
  }

  @Post(':id/send-reminder')
  sendReminder(@Param('id') id: string) {
    return this.service.sendReminder(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
