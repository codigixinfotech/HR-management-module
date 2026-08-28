import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { OfferEmailService, SendOfferEmailDto } from './offer-email.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('recruitment/offers')
export class OffersController {
  constructor(private readonly offerEmailService: OfferEmailService) {}

  @Post('send-email')
  @Permissions('recruitment.write')
  async sendOfferEmail(@Body() dto: any) {
    if (dto.testUrl || dto.assessmentName) {
      return this.offerEmailService.sendAssessmentEmail(dto);
    }
    return this.offerEmailService.sendOfferEmail(dto);
  }

  @Post('send-assessment-email')
  @Permissions('recruitment.write')
  async sendAssessmentEmail(@Body() dto: any) {
    return this.offerEmailService.sendAssessmentEmail(dto);
  }

  @Post('test-smtp')
  @Permissions('recruitment.read')
  async testSmtpConnection(@Body('email') email?: string) {
    return this.offerEmailService.testSmtpConnection(email);
  }

  @Get('audit-logs')
  @Permissions('recruitment.read')
  async getAuditLogs(@Query('offerId') offerId?: string) {
    return this.offerEmailService.getAuditLogs(offerId);
  }
}
