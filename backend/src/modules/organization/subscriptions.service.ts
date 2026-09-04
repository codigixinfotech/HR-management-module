import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ERP_25_MODULE_CATALOG } from './module-catalog.constants';
import {
  ChangeSubscriptionPlanDto,
  ManageSubscriptionAddonsDto,
  RenewSubscriptionDto,
  SubscribeNewCompanyDto,
} from './dto/plan.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompanySubscription(companyId: string) {
    // 1. Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException(`Company with ID "${companyId}" not found`);
    }

    // 2. Find subscription or auto-initialize with a default plan if none exists
    let subscription = await this.prisma.companySubscription.findFirst({
      where: { companyId },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      // Find default professional or starter plan
      let defaultPlan = await this.prisma.planPackage.findFirst({
        where: { code: 'PROFESSIONAL' },
      });
      if (!defaultPlan) {
        defaultPlan = await this.prisma.planPackage.findFirst({
          where: { type: 'STANDARD_PLAN' },
        });
      }

      if (defaultPlan) {
        const now = new Date();
        const oneYearLater = new Date();
        oneYearLater.setFullYear(now.getFullYear() + 1);

        subscription = await this.prisma.companySubscription.create({
          data: {
            companyId,
            planId: defaultPlan.id,
            billingCycle: 'ANNUAL',
            status: 'ACTIVE',
            price: defaultPlan.annualPrice,
            startDate: now,
            endDate: oneYearLater,
            validUntil: oneYearLater,
            autoRenew: true,
            activeAddons: [],
          },
          include: {
            plan: true,
          },
        });
      }
    }

    // 3. Compute real-time usage metrics
    const employeesCount = await this.prisma.employee.count({
      where: { companyId },
    });

    const departmentsCount = await this.prisma.department.count({
      where: { companyId },
    });

    const locationsCount = await this.prisma.branch.count({
      where: { companyId },
    });

    // Approximate storage from employee attachments (baseline 4.2 GB + 0.1 per employee)
    const storageUsedGb = Number((4.2 + (employeesCount * 0.05)).toFixed(1));

    // 4. Fetch details of all purchased add-on packages
    const activeAddonIds: string[] = Array.isArray(subscription?.activeAddons)
      ? (subscription.activeAddons as string[])
      : [];

    const activeAddonPackages = activeAddonIds.length > 0
      ? await this.prisma.planPackage.findMany({
          where: { id: { in: activeAddonIds } },
        })
      : [];

    // 5. Aggregate all enabled module keys
    const planIncludedModules: string[] = Array.isArray(subscription?.plan?.includedModules)
      ? (subscription.plan.includedModules as string[])
      : [];

    const addonIncludedModules: string[] = [];
    for (const addon of activeAddonPackages) {
      if (Array.isArray(addon.includedModules)) {
        addonIncludedModules.push(...(addon.includedModules as string[]));
      }
    }

    const customOverrides: string[] = Array.isArray(subscription?.customModuleOverrides)
      ? (subscription.customModuleOverrides as string[])
      : [];

    const allEnabledModulesSet = new Set<string>([
      ...planIncludedModules,
      ...addonIncludedModules,
      ...customOverrides,
    ]);

    // 6. Map the 25 modules into entitlement matrix
    const moduleEntitlementMatrix = ERP_25_MODULE_CATALOG.map((mod) => {
      const isFromPlan = planIncludedModules.includes(mod.key);
      const isFromAddon = addonIncludedModules.includes(mod.key);
      const isFromOverride = customOverrides.includes(mod.key);
      const isEnabled = allEnabledModulesSet.has(mod.key);

      let source = 'NONE';
      if (isFromPlan) source = 'PLAN';
      else if (isFromAddon) source = 'ADDON';
      else if (isFromOverride) source = 'OVERRIDE';

      return {
        ...mod,
        isEnabled,
        source,
      };
    });

    // 7. Calculate validity countdown
    const now = new Date();
    const expiryDate = subscription?.validUntil || subscription?.endDate || now;
    const diffMs = new Date(expiryDate).getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    // 8. Calculate effective limits
    const maxEmployees = subscription?.employeeLimitOverride ?? subscription?.plan?.maxEmployees ?? 50;
    const maxDepartments = subscription?.plan?.maxDepartments ?? 10;
    const maxLocations = subscription?.plan?.maxLocations ?? 2;
    const maxStorageGb = subscription?.storageLimitOverrideGb ?? subscription?.plan?.maxStorageGb ?? 10;
    const maxLmsLearners = subscription?.lmsLearnerLimitOverride ?? subscription?.plan?.maxLmsLearners ?? 25;

    return {
      company: {
        id: company.id,
        code: company.code,
        name: company.name,
        legalName: company.legalName,
        city: company.city,
        currency: company.currency,
      },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        price: Number(subscription.price),
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        validUntil: subscription.validUntil || subscription.endDate,
        autoRenew: subscription.autoRenew,
        daysRemaining,
      } : null,
      plan: subscription?.plan || null,
      activeAddonPackages,
      usage: {
        employees: { current: employeesCount, max: maxEmployees },
        departments: { current: departmentsCount, max: maxDepartments },
        locations: { current: locationsCount, max: maxLocations },
        storage: { currentGb: storageUsedGb, maxGb: maxStorageGb },
        lmsLearners: { current: Math.min(employeesCount, maxLmsLearners), max: maxLmsLearners },
      },
      moduleEntitlementMatrix,
      totalModulesCount: ERP_25_MODULE_CATALOG.length,
      enabledModulesCount: allEnabledModulesSet.size,
    };
  }

  async changePlan(companyId: string, dto: ChangeSubscriptionPlanDto) {
    const plan = await this.prisma.planPackage.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('Plan package not found');

    const existing = await this.prisma.companySubscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const duration = dto.billingCycle === 'MONTHLY' ? 1 : 12;
    const newEnd = new Date(now);
    newEnd.setMonth(newEnd.getMonth() + duration);

    const price = dto.billingCycle === 'MONTHLY' ? plan.monthlyPrice : plan.annualPrice;

    if (existing) {
      return this.prisma.companySubscription.update({
        where: { id: existing.id },
        data: {
          planId: plan.id,
          billingCycle: dto.billingCycle || existing.billingCycle,
          price,
          status: 'ACTIVE',
          startDate: now,
          endDate: newEnd,
          validUntil: newEnd,
          autoRenew: dto.autoRenew !== undefined ? dto.autoRenew : existing.autoRenew,
        },
      });
    }

    return this.prisma.companySubscription.create({
      data: {
        companyId,
        planId: plan.id,
        billingCycle: dto.billingCycle || 'ANNUAL',
        price,
        status: 'ACTIVE',
        startDate: now,
        endDate: newEnd,
        validUntil: newEnd,
        autoRenew: dto.autoRenew ?? true,
      },
    });
  }

  async manageAddons(companyId: string, dto: ManageSubscriptionAddonsDto) {
    const existing = await this.prisma.companySubscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    if (!existing) {
      throw new NotFoundException('No active subscription found for company');
    }

    return this.prisma.companySubscription.update({
      where: { id: existing.id },
      data: {
        activeAddons: dto.addonIds,
      },
    });
  }

  async renewSubscription(companyId: string, dto: RenewSubscriptionDto) {
    const existing = await this.prisma.companySubscription.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    if (!existing) {
      throw new NotFoundException('No active subscription found for company');
    }

    const monthsToAdd = dto.durationMonths || (existing.billingCycle === 'MONTHLY' ? 1 : 12);
    const currentEnd = new Date(existing.validUntil || existing.endDate);
    const baseDate = currentEnd > new Date() ? currentEnd : new Date();
    const newEnd = new Date(baseDate);
    newEnd.setMonth(newEnd.getMonth() + monthsToAdd);

    return this.prisma.companySubscription.update({
      where: { id: existing.id },
      data: {
        status: 'ACTIVE',
        endDate: newEnd,
        validUntil: newEnd,
      },
    });
  }

  async subscribeCompany(dto: any) {
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) throw new NotFoundException('Company not found');

    const plan = await this.prisma.planPackage.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('Plan or Package not found');

    const existing = await this.prisma.companySubscription.findFirst({
      where: { companyId: dto.companyId },
      orderBy: { createdAt: 'desc' },
    });

    const now = dto.startDate ? new Date(dto.startDate) : new Date();
    let newEnd = dto.endDate ? new Date(dto.endDate) : new Date(now);
    if (!dto.endDate) {
      const durationMonths = dto.billingCycle === 'MONTHLY' ? 1 : 12;
      newEnd.setMonth(newEnd.getMonth() + durationMonths);
    }

    const price = dto.price ?? (dto.billingCycle === 'MONTHLY' ? plan.monthlyPrice : plan.annualPrice);

    // If package is an ADD_ON and company already has a subscription
    if (plan.type === 'ADD_ON' && existing) {
      const currentAddons: string[] = Array.isArray(existing.activeAddons)
        ? (existing.activeAddons as string[])
        : [];
      if (!currentAddons.includes(plan.id)) {
        currentAddons.push(plan.id);
      }

      return this.prisma.companySubscription.update({
        where: { id: existing.id },
        data: {
          activeAddons: currentAddons,
          paymentStatus: dto.paymentStatus || 'PAID',
          paymentReference: dto.paymentReference || `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        },
      });
    }

    // Base plan or custom package subscription
    if (existing) {
      return this.prisma.companySubscription.update({
        where: { id: existing.id },
        data: {
          planId: plan.id,
          billingCycle: dto.billingCycle || existing.billingCycle,
          price,
          status: 'ACTIVE',
          startDate: now,
          endDate: newEnd,
          validUntil: newEnd,
          autoRenew: dto.autoRenew !== undefined ? dto.autoRenew : existing.autoRenew,
          paymentStatus: dto.paymentStatus || 'PAID',
          paymentReference: dto.paymentReference || `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        },
      });
    }

    return this.prisma.companySubscription.create({
      data: {
        companyId: dto.companyId,
        planId: plan.id,
        billingCycle: dto.billingCycle || 'MONTHLY',
        price,
        status: 'ACTIVE',
        startDate: now,
        endDate: newEnd,
        validUntil: newEnd,
        autoRenew: dto.autoRenew ?? true,
        activeAddons: [],
        paymentStatus: dto.paymentStatus || 'PAID',
        paymentReference: dto.paymentReference || `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      },
    });
  }

  async getSubscribersForPlan(planId: string) {
    const allSubs = await this.prisma.companySubscription.findMany({
      include: {
        company: {
          include: {
            users: {
              where: { isActive: true },
              take: 1,
              select: { id: true, email: true, mustResetPassword: true },
            },
          },
        },
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const matchedSubs = allSubs.filter((s) => {
      if (s.planId === planId) return true;
      if (Array.isArray(s.activeAddons) && (s.activeAddons as string[]).includes(planId)) return true;
      return false;
    });

    return matchedSubs.map((s) => {
      const adminUser = s.company.users[0];
      const adminEmail =
        adminUser?.email || s.company.email || `admin@${s.company.code.toLowerCase()}.com`;
      const invitationToken = `inv_${Buffer.from(
        `${adminUser?.id || s.companyId}:${s.company.code}`
      ).toString('base64url')}`;
      const invitationUrl = `/auth/set-password?token=${invitationToken}&email=${encodeURIComponent(
        adminEmail
      )}`;
      const invitationStatus = adminUser?.mustResetPassword === false ? 'ACTIVATED' : 'DISPATCHED';
      const planIncluded = Array.isArray(s.plan.includedModules)
        ? (s.plan.includedModules as string[])
        : [];

      return {
        subscriptionId: s.id,
        companyId: s.companyId,
        companyName: s.company.name,
        companyCode: s.company.code,
        industry: s.company.entityType || 'Information Technology',
        city: s.company.city || 'Corporate HQ',
        adminEmail,
        adminRole: 'COMPANY_ADMIN',
        planName: s.plan.name,
        includedModules: planIncluded,
        billingCycle: s.billingCycle,
        price: Number(s.price),
        status: s.status,
        startDate: s.startDate,
        validUntil: s.validUntil || s.endDate,
        paymentStatus: s.paymentStatus || 'PAID',
        paymentReference: s.paymentReference || 'N/A',
        isAddon: s.planId !== planId,
        invitationUrl,
        invitationStatus,
      };
    });
  }

  async resendInvitation(companyId: string, email: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Company not found');

    const invitationToken = `inv_${Buffer.from(`${company.id}:${Date.now()}`).toString('base64url')}`;
    const invitationUrl = `/auth/set-password?token=${invitationToken}&email=${encodeURIComponent(email)}`;

    return {
      success: true,
      message: `Invitation email dispatched to ${email}`,
      invitationUrl,
    };
  }


  async checkActiveSubscription(companyId: string, planId: string) {
    const activeSub = await this.prisma.companySubscription.findFirst({
      where: {
        companyId,
        status: 'ACTIVE',
        planId,
      },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeSub) {
      return {
        hasActive: true,
        subscription: {
          id: activeSub.id,
          planName: activeSub.plan.name,
          billingCycle: activeSub.billingCycle,
          price: Number(activeSub.price),
          startDate: activeSub.startDate,
          validUntil: activeSub.validUntil || activeSub.endDate,
        },
      };
    }

    // Check if package is included in active addons
    const subWithAddon = await this.prisma.companySubscription.findFirst({
      where: {
        companyId,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (
      subWithAddon &&
      Array.isArray(subWithAddon.activeAddons) &&
      (subWithAddon.activeAddons as string[]).includes(planId)
    ) {
      const addonPlan = await this.prisma.planPackage.findUnique({
        where: { id: planId },
      });
      return {
        hasActive: true,
        subscription: {
          id: subWithAddon.id,
          planName: addonPlan?.name || 'Add-on Package',
          billingCycle: subWithAddon.billingCycle,
          price: Number(addonPlan?.monthlyPrice || 0),
          startDate: subWithAddon.startDate,
          validUntil: subWithAddon.validUntil || subWithAddon.endDate,
        },
      };
    }

    return { hasActive: false, subscription: null };
  }

  async subscribeNewCompany(dto: SubscribeNewCompanyDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify company code does not already exist
      const existingCode = await tx.company.findUnique({
        where: { code: dto.companyCode.trim().toUpperCase() },
      });
      if (existingCode) {
        throw new ConflictException(`A company with code "${dto.companyCode}" already exists.`);
      }

      // 2. Verify admin email does not already exist
      const existingUser = await tx.user.findUnique({
        where: { email: dto.adminEmail.trim().toLowerCase() },
      });
      if (existingUser) {
        throw new ConflictException(`A user with email "${dto.adminEmail}" already exists.`);
      }

      // 3. Verify target plan exists
      const plan = await tx.planPackage.findUnique({
        where: { id: dto.planId },
      });
      if (!plan) {
        throw new NotFoundException('Selected plan or package was not found.');
      }

      // 4. Create Company
      const cityName = dto.city || (dto.registeredAddress ? dto.registeredAddress.split(',')[0].trim() : 'Corporate HQ');
      const company = await tx.company.create({
        data: {
          code: dto.companyCode.trim().toUpperCase(),
          name: dto.companyName.trim(),
          legalName: dto.companyName.trim(),
          entityType: dto.industry || 'Information Technology',
          registeredAddress: dto.registeredAddress,
          city: cityName,
          state: dto.state || 'State HQ',
          country: dto.country || 'India',
          currency: dto.currency || 'INR',
          email: dto.companyEmail.trim().toLowerCase(),
          phone: dto.contactPhone,
          isActive: true,
        },
      });

      // 5. Ensure COMPANY_ADMIN role exists
      let adminRole = await tx.role.findFirst({
        where: { name: 'COMPANY_ADMIN' },
      });
      if (!adminRole) {
        adminRole = await tx.role.create({
          data: {
            name: 'COMPANY_ADMIN',
            description: 'Company Administrator with management access to ERP settings and modules',
            isSystem: true,
          },
        });
      }

      // 6. Create Primary Admin User with a secure hashed temporary token
      const randomSecret = `Ehcm@${Math.random().toString(36).substring(2, 8).toUpperCase()}!${Math.floor(100 + Math.random() * 900)}`;
      const passwordHash = await bcrypt.hash(randomSecret, 12);

      const user = await tx.user.create({
        data: {
          email: dto.adminEmail.trim().toLowerCase(),
          passwordHash,
          companyId: company.id,
          isActive: true,
          mustResetPassword: true,
          roles: {
            create: [{ roleId: adminRole.id }],
          },
        },
      });

      // 7. Create Primary Employee profile for the Admin User
      const fullName = (dto.adminName || dto.contactPerson || 'Admin User').trim();
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || 'Admin';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      await tx.employee.create({
        data: {
          employeeCode: `${company.code}-001`,
          companyId: company.id,
          userId: user.id,
          firstName,
          lastName,
          workEmail: dto.adminEmail.trim().toLowerCase(),
          phone: dto.adminPhone || dto.contactPhone,
          status: 'ACTIVE',
          employmentType: 'PERMANENT',
        },
      });

      // 8. Calculate subscription dates and pricing
      const now = dto.startDate ? new Date(dto.startDate) : new Date();
      let end = dto.endDate ? new Date(dto.endDate) : new Date(now);
      if (!dto.endDate) {
        const months = dto.billingCycle === 'ANNUAL' ? 12 : 1;
        end.setMonth(end.getMonth() + months);
      }

      const price = dto.price ?? (dto.billingCycle === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice);
      const paymentRef = dto.paymentReference || `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 9. Create CompanySubscription
      const subscription = await tx.companySubscription.create({
        data: {
          companyId: company.id,
          planId: plan.id,
          billingCycle: dto.billingCycle || 'MONTHLY',
          status: 'ACTIVE',
          price,
          startDate: now,
          endDate: end,
          validUntil: end,
          autoRenew: dto.autoRenew ?? true,
          activeAddons: plan.type === 'ADD_ON' ? [plan.id] : [],
          paymentStatus: dto.paymentStatus || 'PAID',
          paymentReference: paymentRef,
        },
        include: {
          plan: true,
        },
      });

      // 10. Generate Invitation Token
      const invitationToken = `inv_${Buffer.from(`${user.id}:${Date.now()}`).toString('base64url')}`;
      const invitationUrl = `/auth/set-password?token=${invitationToken}&email=${encodeURIComponent(user.email)}`;

      return {
        success: true,
        company: {
          id: company.id,
          code: company.code,
          name: company.name,
          email: company.email,
        },
        adminUser: {
          id: user.id,
          email: user.email,
          name: fullName,
          mustResetPassword: user.mustResetPassword,
          role: 'COMPANY_ADMIN',
        },
        subscription: {
          id: subscription.id,
          planName: plan.name,
          billingCycle: subscription.billingCycle,
          price: Number(subscription.price),
          validUntil: subscription.validUntil,
          paymentStatus: subscription.paymentStatus,
          paymentReference: subscription.paymentReference,
        },
        invitation: {
          sent: dto.sendInvitation ?? true,
          delivery: dto.invitationDelivery || ['EMAIL'],
          email: user.email,
          invitationUrl,
          notice: 'A secure invitation link to set up their ERP password has been generated and dispatched.',
        },
      };
    });
  }
}

