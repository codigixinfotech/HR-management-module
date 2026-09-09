import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('catalog/modules')
  getModuleCatalog() {
    return this.plansService.getModuleCatalog();
  }

  @Get()
  list(
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.plansService.list({ type, search, status });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.plansService.findById(id);
  }

  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.plansService.duplicate(id);
  }

  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.plansService.toggleStatus(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}
