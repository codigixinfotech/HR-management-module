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
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('recruitment/job-openings')
export class JobOpeningsController {
  constructor(
    private readonly jobOpeningsService: JobOpeningsService,
    private readonly candidatesService: CandidatesService,
  ) {}

  @Get()
  @Permissions('recruitment.read')
  list(@Query('companyId') companyId?: string, @Query('status') status?: string) {
    return this.jobOpeningsService.list(companyId, status);
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
  downloadResume(@Param('filename') filename: string, @Res() res: any) {
    const filePath = join(process.cwd(), 'uploads', 'resumes', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Resume document file not found');
    }
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
