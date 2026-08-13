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

@Controller('organization/hr-policies')
export class HrPoliciesController {
  constructor(private readonly service: HrPoliciesService) {}

  @Get('kpis')
  getKpis(@Query('companyId') companyId?: string) {
    return this.service.getKpis(companyId);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.service.findAll(search, category, status, companyId);
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
    const filePath = join(process.cwd(), 'uploads', 'hr-policies', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Policy document file not found');
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
