import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  ChangeSubscriptionPlanDto,
  ManageSubscriptionAddonsDto,
  RenewSubscriptionDto,
  SubscribeNewCompanyDto,
} from './dto/plan.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('company/:companyId')
  getCompanySubscription(@Param('companyId') companyId: string) {
    return this.subscriptionsService.getCompanySubscription(companyId);
  }

  @Get('company/:companyId/check-plan/:planId')
  checkActiveSubscription(
    @Param('companyId') companyId: string,
    @Param('planId') planId: string,
  ) {
    return this.subscriptionsService.checkActiveSubscription(companyId, planId);
  }

  @Post('company/:companyId/change-plan')
  changePlan(
    @Param('companyId') companyId: string,
    @Body() dto: ChangeSubscriptionPlanDto,
  ) {
    return this.subscriptionsService.changePlan(companyId, dto);
  }

  @Post('company/:companyId/addons')
  manageAddons(
    @Param('companyId') companyId: string,
    @Body() dto: ManageSubscriptionAddonsDto,
  ) {
    return this.subscriptionsService.manageAddons(companyId, dto);
  }

  @Post('subscribe')
  subscribeCompany(@Body() dto: any) {
    return this.subscriptionsService.subscribeCompany(dto);
  }

  @Post('subscribe-new-company')
  subscribeNewCompany(@Body() dto: SubscribeNewCompanyDto) {
    return this.subscriptionsService.subscribeNewCompany(dto);
  }

  @Get('plan/:planId/subscribers')
  getSubscribersForPlan(@Param('planId') planId: string) {
    return this.subscriptionsService.getSubscribersForPlan(planId);
  }

  @Post('resend-invitation')
  resendInvitation(@Body() body: { companyId: string; email: string }) {
    return this.subscriptionsService.resendInvitation(body.companyId, body.email);
  }

  @Post('company/:companyId/renew')
  renewSubscription(
    @Param('companyId') companyId: string,
    @Body() dto: RenewSubscriptionDto,
  ) {
    return this.subscriptionsService.renewSubscription(companyId, dto);
  }
}

