import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { companiesApi, branchesApi, departmentsApi } from '@/api/organization';
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
} from 'lucide-react';

import { useCompany } from '@/context/CompanyContext';

export default function OrganizationPage() {
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = routeTab || searchParams.get('tab') || 'structure';

  const { activeCompanyId, setActiveCompanyId, companies } = useCompany();
  const { data: branches } = useQuery({ queryKey: ['branches', activeCompanyId], queryFn: () => branchesApi.list(activeCompanyId) });
  const { data: departments } = useQuery({ queryKey: ['departments', activeCompanyId], queryFn: () => departmentsApi.list(activeCompanyId) });
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
          description: 'Manage corporate entities, registered offices, facility branches & regional hubs',
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
          description: 'Visual hierarchy of executive leadership, department leads, reporting lines & span of control',
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
          companies &&
          companies.length > 0 && (
            <div className="w-64">
              <Select value={activeCompanyId} onValueChange={setActiveCompanyId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <StatCard icon={Network} label="Functional Departments" value={departments?.length ?? 0} accent="primary" />
            <StatCard icon={Award} label="Configured Designations" value={24} accent="info" />
            <StatCard icon={Layers} label="Average Dept Size" value="41 Employees" accent="success" />
            <StatCard icon={ShieldCheck} label="Dept Annual Budget" value="₹40.9 Cr" accent="warning" />
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
            <StatCard icon={Building2} label="Corporate Entities" value={companies?.length ?? 1} accent="primary" />
            <StatCard icon={GitFork} label="Registered Branches" value={branches?.length ?? 0} accent="info" />
            <StatCard icon={Clock} label="Primary Headquarters" value="Headquarters" accent="success" />
            <StatCard icon={Layers} label="Manufacturing Plants" value="1 Facility" accent="warning" />
          </div>

          <div className="space-y-6">
            <CompaniesTab onCompanyCreated={(id) => setTriggerAddBranchCompanyId(id)} />
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
