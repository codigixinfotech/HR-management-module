import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskProgressDto,
  CompleteTaskDto,
  ReviewTaskDto,
  CreateTaskRequestDto,
  ReviewTaskRequestDto,
} from './dto/task.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @Public()
  @Permissions('employees.read')
  listTasks(
    @Query('assignedToId') assignedToId?: string,
    @Query('assignedToName') assignedToName?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('departmentName') departmentName?: string,
    @Query('search') search?: string,
  ) {
    return this.tasksService.listTasks({
      assignedToId,
      assignedToName,
      status,
      priority,
      departmentName,
      search,
    });
  }

  @Get('dashboard-summary')
  @Public()
  @Permissions('employees.read')
  getDashboardSummary(@Query('employeeId') employeeId?: string) {
    return this.tasksService.getDashboardSummary(employeeId);
  }

  @Get('requests')
  @Public()
  @Permissions('employees.read')
  listRequests(@Query('requestedById') requestedById?: string) {
    return this.tasksService.listRequests(requestedById);
  }

  @Post('requests')
  @Public()
  @Permissions('employees.write')
  createRequest(@Body() dto: CreateTaskRequestDto) {
    return this.tasksService.createRequest(dto);
  }

  @Patch('requests/:id/review')
  @Public()
  @Permissions('employees.write')
  reviewRequest(@Param('id') id: string, @Body() dto: ReviewTaskRequestDto) {
    return this.tasksService.reviewRequest(id, dto);
  }

  @Get(':id')
  @Public()
  @Permissions('employees.read')
  findOne(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Post()
  @Public()
  @Permissions('employees.write')
  createTask(@Body() dto: CreateTaskDto) {
    return this.tasksService.createTask(dto);
  }

  @Patch(':id/start')
  @Public()
  @Permissions('employees.write')
  startTask(@Param('id') id: string, @Body('startedBy') startedBy?: string) {
    return this.tasksService.startTask(id, startedBy);
  }

  @Patch(':id/progress')
  @Public()
  @Permissions('employees.write')
  updateProgress(@Param('id') id: string, @Body() dto: UpdateTaskProgressDto) {
    return this.tasksService.updateProgress(id, dto);
  }

  @Patch(':id/complete')
  @Public()
  @Permissions('employees.write')
  completeTask(@Param('id') id: string, @Body() dto: CompleteTaskDto) {
    return this.tasksService.completeTask(id, dto);
  }

  @Patch(':id/review')
  @Public()
  @Permissions('employees.write')
  reviewTask(@Param('id') id: string, @Body() dto: ReviewTaskDto) {
    return this.tasksService.reviewTask(id, dto);
  }
}
