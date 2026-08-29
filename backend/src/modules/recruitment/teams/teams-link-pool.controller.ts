import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { TeamsLinkPoolService } from './teams-link-pool.service';

@Controller('recruitment/teams-links')
export class TeamsLinkPoolController {
  constructor(private readonly linkPoolService: TeamsLinkPoolService) {}

  @Get()
  listLinks() {
    return this.linkPoolService.listPoolLinks();
  }

  @Post()
  addLink(@Body() dto: { title?: string; meetingUrl: string }) {
    return this.linkPoolService.addPoolLink(dto);
  }

  @Patch(':id/toggle')
  toggleActive(@Param('id') id: string) {
    return this.linkPoolService.toggleLinkActive(id);
  }

  @Delete(':id')
  deleteLink(@Param('id') id: string) {
    return this.linkPoolService.deletePoolLink(id);
  }

  @Post('preview-allocation')
  previewAllocation(
    @Body()
    dto: {
      interviewDate: string;
      startTime: string;
      durationMinutes?: number;
    },
  ) {
    return this.linkPoolService.allocateLinkForSlot({
      interviewDate: dto.interviewDate,
      startTime: dto.startTime,
      durationMinutes: dto.durationMinutes,
    });
  }
}
