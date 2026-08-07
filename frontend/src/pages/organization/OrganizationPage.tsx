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

export default function OrganizationPage() {
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = routeTab || searchParams.get('tab') || 'structure';

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });
  const { data: branches } = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: () => departmentsApi.list() });
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);

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
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Companies" />
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
      {activeTab === 'structure' && <OrgStructureTab />}

      {/* VIEW 2: Departments & Designations Page */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={Network} label="Functional Departments" value={departments?.length ?? 6} accent="primary" />
            <StatCard icon={Award} label="Configured Designations" value={24} accent="info" />
            <StatCard icon={Layers} label="Average Dept Size" value="41 Employees" accent="success" />
            <StatCard icon={ShieldCheck} label="Dept Annual Budget" value="₹40.9 Cr" accent="warning" />
          </div>

          <div className="space-y-6">
            <DepartmentsTab companyId={companyId} companies={companies ?? []} />
            <DesignationsTab companyId={companyId} companies={companies ?? []} />
          </div>
        </div>
      )}

      {/* VIEW 3: Branches & Locations Page */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={Building2} label="Corporate Entities" value={companies?.length ?? 1} accent="primary" />
            <StatCard icon={GitFork} label="Registered Branches" value={branches?.length ?? 4} accent="info" />
            <StatCard icon={Clock} label="Primary Headquarters" value="New York HQ" accent="success" />
            <StatCard icon={Layers} label="Manufacturing Plants" value="1 Facility" accent="warning" />
          </div>

          <div className="space-y-6">
            <CompaniesTab />
            <BranchesTab companyId={companyId} companies={companies ?? []} />
          </div>
        </div>
      )}

      {/* VIEW 4: Cost Centers & Pay Grades Page */}
      {activeTab === 'cost-centers' && <CostCentersTab />}

      {/* VIEW 5: Work Calendar & Holidays Page */}
      {activeTab === 'holidays' && <WorkCalendarTab />}

      {/* VIEW 6: HR Policies & Handbooks Page */}
      {activeTab === 'policies' && <PoliciesTab />}

      {/* VIEW 7: Organization Reports Page */}
      {activeTab === 'reports' && <ReportsTab />}
    </div>
  );
}
