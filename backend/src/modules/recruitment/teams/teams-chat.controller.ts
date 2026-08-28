import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TeamsChatService, SendMessageDto } from './teams-chat.service';

@Controller('recruitment/candidates')
export class TeamsChatController {
  constructor(private readonly teamsChatService: TeamsChatService) {}

  @Get(':id/messages')
  getCandidateMessages(@Param('id') candidateId: string) {
    return this.teamsChatService.getCandidateMessages(candidateId);
  }

  @Post(':id/messages')
  sendChatMessage(
    @Param('id') candidateId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.teamsChatService.sendChatMessage(candidateId, dto);
  }

  @Post(':id/messages/system')
  postSystemEvent(
    @Param('id') candidateId: string,
    @Body() body: { senderName: string; content: string; eventType?: string; meta?: any },
  ) {
    return this.teamsChatService.postSystemEvent(
      candidateId,
      body.senderName || 'Microsoft Teams Integration',
      body.content,
      body.eventType,
      body.meta,
    );
  }
}
