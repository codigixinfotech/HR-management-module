import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApprovalStatus } from '@prisma/client';
import { EmployeesService } from './employees.service';
import { OnboardingService } from './onboarding.service';
import {
  CreateEmployeeDto,
  ListEmployeesQueryDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';
import { CreateOnboardingTaskDto } from './dto/onboarding-task.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { employeeDocumentStorage } from './multer.config';

@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly onboardingService: OnboardingService,
  ) {}

  @Get()
  @Permissions('employees.read')
  list(@Query() query: ListEmployeesQueryDto) {
    return this.employeesService.list(query, query.companyId);
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

  @Get(':id')
  @Permissions('employees.read')
  findOne(@Param('id') id: string) {
    return this.employeesService.findById(id);
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
