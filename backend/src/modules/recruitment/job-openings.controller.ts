import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { JobOpeningsService } from './job-openings.service';
import { CandidatesService } from './candidates.service';
import {
  CreateJobOpeningDto,
  UpdateJobOpeningDto,
} from './dto/job-opening.dto';
import { CreateCandidateDto } from './dto/candidate.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('recruitment/job-openings')
export class JobOpeningsController {
  constructor(
    private readonly jobOpeningsService: JobOpeningsService,
    private readonly candidatesService: CandidatesService,
  ) {}

  @Get()
  @Permissions('recruitment.read')
  list(@Query('companyId') companyId?: string) {
    return this.jobOpeningsService.list(companyId);
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

  @Post(':id/candidates')
  @Permissions('recruitment.write')
  addCandidate(
    @Param('id') id: string,
    @Body() dto: Omit<CreateCandidateDto, 'jobOpeningId'>,
  ) {
    return this.candidatesService.create({ ...dto, jobOpeningId: id });
  }
}
