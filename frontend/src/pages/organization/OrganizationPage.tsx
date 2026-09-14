import { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { companiesApi, branchesApi, departmentsApi, designationsApi } from '@/api/organization';
import { employeesApi } from '@/api/employees';
import { formatIndianBudget } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/PageHeader';
import { CompaniesTab } from './CompaniesTab';
import { BranchesTab } from './BranchesTab';
import { DepartmentsTab } from './DepartmentsTab';
import { DesignationsTab } from './DesignationsTab';
import { OrgStructureTab } from './OrgStructureTab';
import { CostCentersTab } from './CostCentersTab';
import { WorkCalendarTab } from './WorkCalendarTab';
import { PoliciesTab } from './PoliciesTab';
import { ReportsTab } from './ReportsTab';
import {
  Building2,
  GitFork,
  Network,
  Award,
  ShieldCheck,
  FileText,
  BarChart3,
  Calendar,
  Clock,
  Layers,
  Lock,
} from 'lucide-react';

import { useCompany } from '@/context/CompanyContext';
import { useAuthStore } from '@/stores/auth-store';
import { isSuperAdminUser, isBranchAdminUser } from '@/lib/modules';

export default function OrganizationPage() {
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = routeTab || searchParams.get('tab') || 'structure';

  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = isSuperAdminUser(user);
  const isBranchAdmin = isBranchAdminUser(user);
  const assignedBranchId = user?.branchId || user?.employee?.branchId;

  const { activeCompanyId, activeCompany, setActiveCompanyId, companies } = useCompany();
  const { data: branches } = useQuery({ queryKey: ['branches', activeCompanyId], queryFn: () => branchesApi.list(activeCompanyId) });
  const { data: departments } = useQuery({ queryKey: ['departments', activeCompanyId], queryFn: () => departmentsApi.list(activeCompanyId) });
  const { data: designations } = useQuery({ queryKey: ['designations', activeCompanyId], queryFn: () => designationsApi.list(activeCompanyId) });
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'org-stats', activeCompanyId, isBranchAdmin ? assignedBranchId : 'ALL'],
    queryFn: () => employeesApi.list({
      pageSize: 1000,
      companyId: activeCompanyId,
      branchId: isBranchAdmin && assignedBranchId ? assignedBranchId : undefined,
    }),
  });

  const totalEmployees = useMemo(() => {
    if (!employeesData?.items) return 0;
    if (isBranchAdmin && assignedBranchId) {
      return employeesData.items.filter((emp: any) => emp.branchId === assignedBranchId).length;
    }
    return employeesData.total ?? employeesData.items.length;
  }, [employeesData, isBranchAdmin, assignedBranchId]);

  const activeBranchName = user?.branchName || (isBranchAdmin ? 'Branch' : null);
  const [triggerAddBranchCompanyId, setTriggerAddBranchCompanyId] = useState<string | null>(null);

  const getPageHeaderInfo = () => {
    switch (activeTab) {
      case 'departments':
        return {
          title: 'Departments & Designations',
          description: 'Manage functional departmental units, job designations, reporting chains & headcount caps',
          badge: 'Department Architecture',
          icon: Network,
        };
      case 'branches':
        return {
          title: 'Branches & Locations',
          description: 'Manage legal entities, registered offices, facility branches & regional hubs',
          badge: 'Facility Management',
          icon: GitFork,
        };
      case 'cost-centers':
        return {
          title: 'Cost Centers & Pay Grades',
          description: 'Allocate departmental budgets, salary scale ranges, notice periods & probation matrices',
          badge: 'Financial & Grade Scales',
          icon: ShieldCheck,
        };
      case 'holidays':
        return {
          title: 'Work Calendar & Holidays',
          description: 'Declared national, festival, and regional restricted holidays across branch locations',
          badge: '2026 Work Calendar',
          icon: Calendar,
        };
      case 'policies':
        return {
          title: 'HR Policies & Handbooks',
          description: 'Published employee handbooks, POSH guidelines, IT security protocols & compliance sign-offs',
          badge: 'Corporate Governance',
          icon: FileText,
        };
      case 'reports':
        return {
          title: 'Organization Reports',
          description: 'Workforce distribution reports across entities, branches, departments & pay grade bands',
          badge: 'Org Analytics',
          icon: BarChart3,
        };
      case 'structure':
      default:
        return {
          title: 'Organization Structure',
          description: 'Visual representation of organizational hierarchy, reporting relationships, and workforce structure.',
          badge: 'Org Architecture',
          icon: Building2,
        };
    }
  };

  const headerInfo = getPageHeaderInfo();

  return (
    <div className="space-y-6">
      {/* ── 1. Page Header ── */}
      <PageHeader
        icon={headerInfo.icon}
        title={headerInfo.title}
        description={headerInfo.description}
        badge={headerInfo.badge}
        actions={
          isSuperAdmin ? (
            <div className="w-64">
              <Select
                value={activeCompanyId || 'ALL'}
                onValueChange={(val) => {
                  setActiveCompanyId(val);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Select Organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs font-semibold">
                    🏢 All Organizations
                  </SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name} {c.code ? `(${c.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-muted/60 rounded-xl border border-border/80 text-xs font-semibold text-foreground cursor-not-allowed select-none shadow-2xs">
              <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate max-w-[220px]">
                {activeCompany?.name || user?.companyName || 'Assigned Organization'}
              </span>
            </div>
          )
        }
      />

      {/* ── 2. Render Dedicated Page View Based on Tab ── */}

      {/* VIEW 1: Organization Structure View */}
      {activeTab === 'structure' && <OrgStructureTab companyId={activeCompanyId} />}

      {/* VIEW 2: Departments & Designations Page */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              icon={Network}
              label={isBranchAdmin ? "Branch Departments" : "Functional Departments"}
              value={departments?.length ?? 0}
              accent="primary"
            />
            <StatCard
              icon={Award}
              label="Configured Designations"
              value={designations?.length ?? 0}
              accent="info"
            />
            <StatCard
              icon={Layers}
              label={isBranchAdmin ? "Branch Employees" : "Average Dept Size"}
              value={
                isBranchAdmin
                  ? `${totalEmployees} ${totalEmployees === 1 ? 'Employee' : 'Employees'}`
                  : (departments && departments.length > 0
                      ? `${Math.round(totalEmployees / departments.length)} Employees`
                      : `${totalEmployees} Employees`)
              }
              accent="success"
            />
            <StatCard
              icon={ShieldCheck}
              label="Dept Annual Budget"
              value={formatIndianBudget(departments?.reduce((sum, d) => sum + (Number(d.annualBudget) || 0), 0)) ?? '₹0'}
              accent="warning"
            />
          </div>

          <div className="space-y-6">
            <DepartmentsTab companyId={activeCompanyId} companies={companies ?? []} />
            <DesignationsTab companyId={activeCompanyId} companies={companies ?? []} />
          </div>
        </div>
      )}

      {/* VIEW 3: Branches & Locations Page */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={Building2} label="Legal Entities" value={companies?.length ?? 1} accent="primary" />
            <StatCard icon={GitFork} label="Registered Branches" value={branches?.length ?? 0} accent="info" />
            <StatCard
              icon={Clock}
              label={isBranchAdmin ? "Assigned Branch" : "Primary Headquarters"}
              value={activeBranchName || (branches?.[0]?.name ?? 'Headquarters')}
              accent="success"
            />
            <StatCard
              icon={Layers}
              label={isBranchAdmin ? "Branch Employees" : "Total Workforce"}
              value={`${totalEmployees} ${totalEmployees === 1 ? 'Employee' : 'Employees'}`}
              accent="warning"
            />
          </div>

          <div className="space-y-6">
            <CompaniesTab
              companyId={activeCompanyId}
              onCompanyCreated={(id) => setTriggerAddBranchCompanyId(id)}
            />
            <BranchesTab
              companyId={activeCompanyId}
              companies={companies ?? []}
              triggerOpenWithCompanyId={triggerAddBranchCompanyId}
              onTriggerHandled={() => setTriggerAddBranchCompanyId(null)}
            />
          </div>
        </div>
      )}

      {/* VIEW 4: Cost Centers & Pay Grades Page */}
      {activeTab === 'cost-centers' && <CostCentersTab companyId={activeCompanyId} />}

      {/* VIEW 5: Work Calendar & Holidays Page */}
      {activeTab === 'holidays' && <WorkCalendarTab companyId={activeCompanyId} />}

      {/* VIEW 6: HR Policies & Handbooks Page */}
      {activeTab === 'policies' && <PoliciesTab companyId={activeCompanyId} />}

      {/* VIEW 7: Organization Reports Page */}
      {activeTab === 'reports' && <ReportsTab companyId={activeCompanyId} />}
    </div>
  );
}
