import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { ERP_25_MODULE_CATALOG } from './module-catalog.constants';

@Injectable()
export class PlansService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultPackages();
  }

  getModuleCatalog() {
    return ERP_25_MODULE_CATALOG;
  }

  async list(filter?: { type?: string; search?: string; status?: string }) {
    const where: any = {};
    if (filter?.type && filter.type !== 'ALL') {
      where.type = filter.type;
    }
    if (filter?.status && filter.status !== 'ALL') {
      where.status = filter.status;
    }
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search } },
        { code: { contains: filter.search } },
        { description: { contains: filter.search } },
      ];
    }

    const items = await this.prisma.planPackage.findMany({
      where,
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    const allSubs = await this.prisma.companySubscription.findMany({
      select: { id: true, planId: true, activeAddons: true, status: true, price: true, billingCycle: true },
    });

    const activeSubs = allSubs.filter((s) => s.status === 'ACTIVE');
    const monthlyRevenue = activeSubs.reduce((acc, sub) => {
      const p = Number(sub.price) || 0;
      return acc + (sub.billingCycle === 'ANNUAL' ? Math.round(p / 12) : p);
    }, 0);

    const itemsWithCounts = items.map((pkg) => {
      const subscriberCount = allSubs.filter((s) => {
        if (s.planId === pkg.id) return true;
        if (Array.isArray(s.activeAddons) && (s.activeAddons as string[]).includes(pkg.id)) return true;
        return false;
      }).length;

      return {
        ...pkg,
        _count: { subscriptions: subscriberCount },
      };
    });

    const counts = {
      total: await this.prisma.planPackage.count(),
      totalPlansAndPackages: await this.prisma.planPackage.count(),
      plans: await this.prisma.planPackage.count({ where: { type: 'STANDARD_PLAN' } }),
      activePlans: await this.prisma.planPackage.count({ where: { status: 'ACTIVE', type: { in: ['STANDARD_PLAN', 'CUSTOM_PACKAGE'] } } }),
      customPackages: await this.prisma.planPackage.count({ where: { type: 'CUSTOM_PACKAGE' } }),
      addons: await this.prisma.planPackage.count({ where: { type: 'ADD_ON' } }),
      activeSubscribers: activeSubs.length,
      monthlyRevenue,
      totalModules: ERP_25_MODULE_CATALOG.length,
    };

    return { items: itemsWithCounts, counts };
  }

  async findById(id: string) {
    const plan = await this.prisma.planPackage.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: {
            company: {
              select: { id: true, name: true, code: true, city: true },
            },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('Plan or Package not found');
    return plan;
  }

  async create(dto: CreatePlanDto) {
    const existing = await this.prisma.planPackage.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`A package with code "${dto.code}" already exists.`);
    }

    return this.prisma.planPackage.create({
      data: {
        name: dto.name,
        code: dto.code,
        type: dto.type || 'STANDARD_PLAN',
        category: dto.category || 'Core HR',
        description: dto.description,
        badge: dto.badge,
        billingCycle: dto.billingCycle || 'MONTHLY',
        price: dto.price ?? 0,
        monthlyPrice: dto.monthlyPrice ?? dto.price ?? 0,
        annualPrice: dto.annualPrice ?? (dto.price ? dto.price * 10 : 0),
        currency: dto.currency || 'INR',
        status: dto.status || 'ACTIVE',
        isPopular: dto.isPopular ?? false,
        maxEmployees: dto.maxEmployees ?? 50,
        maxDepartments: dto.maxDepartments ?? 10,
        maxLocations: dto.maxLocations ?? 2,
        maxStorageGb: dto.maxStorageGb ?? 5,
        maxLmsLearners: dto.maxLmsLearners ?? 20,
        includedModules: dto.includedModules || [],
        featureToggles: dto.featureToggles || {},
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdatePlanDto) {
    await this.findById(id);
    return this.prisma.planPackage.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.badge !== undefined && { badge: dto.badge }),
        ...(dto.billingCycle !== undefined && { billingCycle: dto.billingCycle }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.monthlyPrice !== undefined && { monthlyPrice: dto.monthlyPrice }),
        ...(dto.annualPrice !== undefined && { annualPrice: dto.annualPrice }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.isPopular !== undefined && { isPopular: dto.isPopular }),
        ...(dto.maxEmployees !== undefined && { maxEmployees: dto.maxEmployees }),
        ...(dto.maxDepartments !== undefined && { maxDepartments: dto.maxDepartments }),
        ...(dto.maxLocations !== undefined && { maxLocations: dto.maxLocations }),
        ...(dto.maxStorageGb !== undefined && { maxStorageGb: dto.maxStorageGb }),
        ...(dto.maxLmsLearners !== undefined && { maxLmsLearners: dto.maxLmsLearners }),
        ...(dto.includedModules !== undefined && { includedModules: dto.includedModules }),
        ...(dto.featureToggles !== undefined && { featureToggles: dto.featureToggles }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async duplicate(id: string) {
    const original = await this.findById(id);
    const codeSuffix = Math.floor(1000 + Math.random() * 9000);
    const newCode = `${original.code}_COPY_${codeSuffix}`;
    const newName = `${original.name} (Copy)`;

    return this.prisma.planPackage.create({
      data: {
        name: newName,
        code: newCode,
        type: original.type,
        category: original.category,
        description: original.description,
        badge: original.badge,
        billingCycle: original.billingCycle,
        price: original.price,
        monthlyPrice: original.monthlyPrice,
        annualPrice: original.annualPrice,
        currency: original.currency,
        status: 'DRAFT',
        isPopular: false,
        maxEmployees: original.maxEmployees,
        maxDepartments: original.maxDepartments,
        maxLocations: original.maxLocations,
        maxStorageGb: original.maxStorageGb,
        maxLmsLearners: original.maxLmsLearners,
        includedModules: original.includedModules as any,
        featureToggles: original.featureToggles as any,
        sortOrder: original.sortOrder + 1,
      },
    });
  }

  async toggleStatus(id: string) {
    const original = await this.findById(id);
    const newStatus = original.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.prisma.planPackage.update({
      where: { id },
      data: { status: newStatus, isActive: newStatus === 'ACTIVE' },
    });
  }

  async remove(id: string) {
    const original = await this.findById(id);
    const subsCount = await this.prisma.companySubscription.count({ where: { planId: id } });
    if (subsCount > 0) {
      throw new ConflictException(`Cannot delete plan "${original.name}" because ${subsCount} company subscription(s) are actively using it. Please change their plans or deactivate this plan instead.`);
    }

    return this.prisma.planPackage.delete({ where: { id } });
  }

  async seedDefaultPackages() {
    const count = await this.prisma.planPackage.count();
    if (count > 0) return; // Already seeded

    const defaults = [
      // ── Standard Plans ──
      {
        name: 'Starter',
        code: 'STARTER',
        type: 'STANDARD_PLAN',
        category: 'Core HR',
        description: 'Essential HR, employee directory, attendance tracking & ESS portal for growing teams.',
        billingCycle: 'MONTHLY',
        price: 999,
        monthlyPrice: 999,
        annualPrice: 9990,
        currency: 'INR',
        badge: 'Startup Ready',
        status: 'ACTIVE',
        isPopular: false,
        sortOrder: 1,
        maxEmployees: 50,
        maxDepartments: 10,
        maxLocations: 2,
        maxStorageGb: 10,
        maxLmsLearners: 25,
        includedModules: [
          'employee-management',
          'organization',
          'onboarding',
          'attendance-leave',
          'shift-planning',
          'payslips',
          'loans-advances',
          'reimbursements',
          'employee-experience',
          'labour-compliance',
        ],
      },
      {
        name: 'Professional',
        code: 'PROFESSIONAL',
        type: 'STANDARD_PLAN',
        category: 'Workforce',
        description: 'Comprehensive HR automation, ATS recruitment, end-to-end payroll & statutory tax compliance.',
        billingCycle: 'MONTHLY',
        price: 1999,
        monthlyPrice: 1999,
        annualPrice: 19990,
        currency: 'INR',
        badge: 'Popular',
        status: 'ACTIVE',
        isPopular: true,
        sortOrder: 2,
        maxEmployees: 250,
        maxDepartments: 30,
        maxLocations: 10,
        maxStorageGb: 50,
        maxLmsLearners: 150,
        includedModules: [
          'employee-management',
          'organization',
          'recruitment',
          'onboarding',
          'attendance-leave',
          'shift-planning',
          'payroll',
          'salary-revision',
          'loans-advances',
          'reimbursements',
          'payslips',
          'pf-esic',
          'statutory-taxes',
          'labour-compliance',
          'performance',
          'employee-experience',
          'asset-management',
          'travel-expense',
        ],
      },
      {
        name: 'Business',
        code: 'BUSINESS',
        type: 'STANDARD_PLAN',
        category: 'Operations & Platform',
        description: 'Full workforce optimization, Learning LMS, safety audits, and automated approval matrix.',
        billingCycle: 'MONTHLY',
        price: 3999,
        monthlyPrice: 3999,
        annualPrice: 39990,
        currency: 'INR',
        badge: 'Best Value',
        status: 'ACTIVE',
        isPopular: false,
        sortOrder: 3,
        maxEmployees: 1000,
        maxDepartments: 100,
        maxLocations: 50,
        maxStorageGb: 250,
        maxLmsLearners: 500,
        includedModules: [
          'employee-management',
          'organization',
          'recruitment',
          'onboarding',
          'attendance-leave',
          'shift-planning',
          'workforce-planning',
          'machine-allocation',
          'payroll',
          'salary-revision',
          'loans-advances',
          'reimbursements',
          'payslips',
          'pf-esic',
          'statutory-taxes',
          'labour-compliance',
          'performance',
          'learning',
          'employee-experience',
          'asset-management',
          'travel-expense',
          'safety-ehs',
        ],
      },
      {
        name: 'Enterprise',
        code: 'ENTERPRISE',
        type: 'STANDARD_PLAN',
        category: 'Operations & Platform',
        description: 'Complete 25-module enterprise suite with AI intelligence, IoT hardware terminals & ERP connectors.',
        billingCycle: 'MONTHLY',
        price: 7999,
        monthlyPrice: 7999,
        annualPrice: 79990,
        currency: 'INR',
        badge: 'Enterprise Tier',
        status: 'ACTIVE',
        isPopular: false,
        sortOrder: 4,
        maxEmployees: 99999,
        maxDepartments: 999,
        maxLocations: 999,
        maxStorageGb: 1000,
        maxLmsLearners: 99999,
        includedModules: ERP_25_MODULE_CATALOG.map((m) => m.key),
      },

      // ── Custom Packages ──
      {
        name: 'Employee Management System',
        code: 'CUSTOM_EMP_MGMT',
        type: 'CUSTOM_PACKAGE',
        category: 'Core HR',
        description: 'Employee directory, organizational structure, and digital onboarding for growing teams.',
        billingCycle: 'MONTHLY',
        price: 499,
        monthlyPrice: 499,
        annualPrice: 4990,
        currency: 'INR',
        status: 'ACTIVE',
        sortOrder: 10,
        maxEmployees: 50,
        maxDepartments: 10,
        maxLocations: 2,
        maxStorageGb: 10,
        maxLmsLearners: 0,
        includedModules: ['employee-management', 'organization', 'onboarding'],
      },
      {
        name: 'HR Essentials',
        code: 'CUSTOM_HR_ESSENTIALS',
        type: 'CUSTOM_PACKAGE',
        category: 'Core HR',
        description: 'Core organizational hierarchy, employee profiles, onboarding workflows and ESS communication.',
        billingCycle: 'MONTHLY',
        price: 999,
        monthlyPrice: 999,
        annualPrice: 9990,
        currency: 'INR',
        status: 'ACTIVE',
        sortOrder: 11,
        maxEmployees: 100,
        maxDepartments: 20,
        maxLocations: 5,
        maxStorageGb: 25,
        maxLmsLearners: 0,
        includedModules: ['employee-management', 'organization', 'onboarding', 'employee-experience'],
      },
      {
        name: 'Payroll Package',
        code: 'CUSTOM_PAYROLL_PKG',
        type: 'CUSTOM_PACKAGE',
        category: 'Payroll & Finance',
        description: 'Complete salary generation, payslips distribution, and salary revision matrix.',
        billingCycle: 'MONTHLY',
        price: 1499,
        monthlyPrice: 1499,
        annualPrice: 14990,
        currency: 'INR',
        status: 'ACTIVE',
        sortOrder: 12,
        maxEmployees: 250,
        maxDepartments: 25,
        maxLocations: 5,
        maxStorageGb: 25,
        maxLmsLearners: 0,
        includedModules: ['payroll', 'salary-revision', 'payslips'],
      },
      {
        name: 'LMS Package',
        code: 'CUSTOM_LMS_PKG',
        type: 'CUSTOM_PACKAGE',
        category: 'Talent & Learning',
        description: 'Dedicated corporate LMS with training programs, course catalogs, certs & skill matrices.',
        billingCycle: 'MONTHLY',
        price: 799,
        monthlyPrice: 799,
        annualPrice: 7990,
        currency: 'INR',
        status: 'ACTIVE',
        sortOrder: 13,
        maxEmployees: 250,
        maxDepartments: 20,
        maxLocations: 5,
        maxStorageGb: 20,
        maxLmsLearners: 100,
        includedModules: ['learning'],
      },
      {
        name: 'Recruitment Package',
        code: 'CUSTOM_RECRUITMENT_PKG',
        type: 'CUSTOM_PACKAGE',
        category: 'Core HR',
        description: 'Talent acquisition pipeline, job board postings, candidate assessments and automated onboarding.',
        billingCycle: 'MONTHLY',
        price: 999,
        monthlyPrice: 999,
        annualPrice: 9990,
        currency: 'INR',
        status: 'ACTIVE',
        sortOrder: 14,
        maxEmployees: 200,
        maxDepartments: 20,
        maxLocations: 5,
        maxStorageGb: 25,
        maxLmsLearners: 0,
        includedModules: ['recruitment', 'onboarding'],
      },
      {
        name: 'Workforce Attendance Bundle',
        code: 'CUSTOM_WORKFORCE_BUNDLE',
        type: 'CUSTOM_PACKAGE',
        category: 'Workforce',
        description: 'Attendance tracking, biometric synchronization, leave management, and shift roster scheduling.',
        billingCycle: 'MONTHLY',
        price: 899,
        monthlyPrice: 899,
        annualPrice: 8990,
        currency: 'INR',
        status: 'ACTIVE',
        sortOrder: 15,
        maxEmployees: 200,
        maxDepartments: 20,
        maxLocations: 5,
        maxStorageGb: 20,
        maxLmsLearners: 0,
        includedModules: ['attendance-leave', 'shift-planning', 'workforce-planning'],
      },
      {
        name: 'Safety & Compliance Bundle',
        code: 'CUSTOM_SAFETY_COMPLIANCE',
        type: 'CUSTOM_PACKAGE',
        category: 'Compliance',
        description: 'EPFO/ESIC returns, Professional Tax computation, labour registers, and EHS safety audits.',
        billingCycle: 'MONTHLY',
        price: 999,
        monthlyPrice: 999,
        annualPrice: 9990,
        currency: 'INR',
        status: 'ACTIVE',
        sortOrder: 16,
        maxEmployees: 300,
        maxDepartments: 30,
        maxLocations: 10,
        maxStorageGb: 30,
        maxLmsLearners: 0,
        includedModules: ['pf-esic', 'statutory-taxes', 'labour-compliance', 'safety-ehs'],
      },
      {
        name: 'HR Operations & Assets',
        code: 'CUSTOM_OPERATIONS_ASSETS',
        type: 'CUSTOM_PACKAGE',
        category: 'Operations & Platform',
        description: 'Fixed asset register, corporate travel desks, expense claims and employee loan advances.',
        billingCycle: 'MONTHLY',
        price: 899,
        monthlyPrice: 899,
        annualPrice: 8990,
        currency: 'INR',
        status: 'ACTIVE',
        sortOrder: 17,
        maxEmployees: 250,
        maxDepartments: 20,
        maxLocations: 5,
        maxStorageGb: 25,
        maxLmsLearners: 0,
        includedModules: ['asset-management', 'travel-expense', 'loans-advances', 'reimbursements'],
      },

      // ── Add-ons ──
      {
        name: 'Attendance & Leave Add-on',
        code: 'ADDON_ATTENDANCE',
        type: 'ADD_ON',
        category: 'Workforce',
        description: 'Add live punch logging, geo-fenced mobile punching, and leave balance management.',
        billingCycle: 'MONTHLY',
        price: 399,
        monthlyPrice: 399,
        annualPrice: 3990,
        currency: 'INR',
        status: 'ACTIVE',
        sortOrder: 30,
        includedModules: ['attendance-leave'],
      },
      {
        name: 'Recruitment (ATS) Add-on',
        code: 'ADDON_RECRUITMENT',
        type: 'ADD_ON',
        category: 'Core HR',
        description: 'Add requisition pipeline, candidate assessment tests, and automated Teams interview links.',
        billingCycle: 'MONTHLY',
        price: 499,
        monthlyPrice: 499,
        annualPrice: 4990,
        currency: 'INR',
        status: 'ACTIVE',
        sortOrder: 31,
        includedModules: ['recruitment'],
      },
      {
        name: 'Payroll Processing Add-on',
        code: 'ADDON_PAYROLL',
        type: 'ADD_ON',
        category: 'Payroll & Finance',
        description: 'Add automated salary calculation, bank NEFT files, and statutory deduction schedules.',
        billingCycle: 'MONTHLY',
        price: 999,
        monthlyPrice: 999,
        annualPrice: 9990,
        currency: 'INR',
        status: 'ACTIVE',
        sortOrder: 32,
        includedModules: ['payroll'],
      },
      {
        name: 'Performance (OKR) Add-on',
        code: 'ADDON_PERFORMANCE',
        type: 'ADD_ON',
        category: 'Talent & Learning',
        description: 'Add company goal cascading, continuous manager feedback, and 360 appraisal cycles.',
        billingCycle: 'MONTHLY',
        price: 399,
        monthlyPrice: 399,
        annualPrice: 3990,
        currency: 'INR',
        status: 'ACTIVE',
        sortOrder: 33,
        includedModules: ['performance'],
      },
      {
        name: 'LMS Training Add-on',
        code: 'ADDON_LMS',
        type: 'ADD_ON',
        category: 'Talent & Learning',
        description: 'Add enterprise course catalog, external training approvals, and skill matrix tracking.',
        billingCycle: 'MONTHLY',
        price: 799,
        monthlyPrice: 799,
        annualPrice: 7990,
        currency: 'INR',
        status: 'ACTIVE',
        sortOrder: 34,
        maxLmsLearners: 100,
        includedModules: ['learning'],
      },
      {
        name: 'AI Intelligence Center Add-on',
        code: 'ADDON_AI_INTELLIGENCE',
        type: 'ADD_ON',
        category: 'Operations & Platform',
        description: 'Add AI resume ranking, attendance anomaly detection, and predictive churn analytics.',
        billingCycle: 'MONTHLY',
        price: 899,
        monthlyPrice: 899,
        annualPrice: 8990,
        currency: 'INR',
        status: 'ACTIVE',
        sortOrder: 35,
        includedModules: ['ai-intelligence'],
      },
    ];

    for (const item of defaults) {
      await this.prisma.planPackage.create({
        data: {
          ...item,
          featureToggles: {},
        },
      });
    }
  }
}
