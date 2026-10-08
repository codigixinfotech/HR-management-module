import React from 'react';
import { Factory, Wrench, Users, ShieldCheck } from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';
import { useAuthStore } from '@/stores/auth-store';
import { isBranchAdminUser } from '@/lib/modules';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkforceBranchProvider, useWorkforceBranch, type WorkforceBranchContextType } from './WorkforceBranchContext';
import { WorkforceBranchFilter } from './WorkforceBranchFilter';
import type { Company, Branch } from '@/api/types';

export interface WorkforceLayoutContext extends WorkforceBranchContextType {
  companyId?: string;
  companies: Company[];
  branchId: string;
}

interface WorkforcePageLayoutProps {
  title?: string;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'primary';
  actions?: React.ReactNode;
  metrics?: React.ReactNode;
  hideMetrics?: boolean;
  children: (context: WorkforceLayoutContext) => React.ReactNode;
}

function WorkforcePageLayoutInner({
  title,
  description,
  badge,
  badgeVariant,
  actions,
  metrics,
  hideMetrics,
  effectiveCompanyId,
  selectableCompanies,
  setActiveCompanyId,
  children,
}: WorkforcePageLayoutProps & {
  effectiveCompanyId?: string;
  selectableCompanies: Company[];
  setActiveCompanyId: (id: string) => void;
}) {
  const branchContext = useWorkforceBranch();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Factory}
        title={title || 'Industrial Workforce & Shop Floor Operations'}
        description={description || 'Shift demand planning, machine operator line allocations, contractor vendor management & blue-collar labour'}
        badge={badge || 'Plant Line Efficiency: 96.2%'}
        badgeVariant={badgeVariant || 'warning'}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {actions}

            {/* Branch Filter dropdown matching Employee Master Page */}
            <WorkforceBranchFilter
              isSuperOrCompanyAdmin={branchContext.isSuperOrCompanyAdmin}
              isBranchAdmin={branchContext.isBranchAdmin}
              selectedBranch={branchContext.selectedBranch}
              onBranchChange={branchContext.setSelectedBranch}
              branches={branchContext.branches}
              assignedBranchName={branchContext.assignedBranchName}
            />

            {/* Company / Organization selector for multi-company setups */}
            {selectableCompanies && selectableCompanies.length > 0 && (
              <div className="w-52">
                <Select
                  value={effectiveCompanyId}
                  onValueChange={(val) => setActiveCompanyId(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All companies" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableCompanies.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        }
      />

      {/* Dynamic Metrics */}
      {metrics}


      <div>
        {children({
          ...branchContext,
          companyId: effectiveCompanyId,
          companies: selectableCompanies,
          branchId: branchContext.selectedBranch,
        })}
      </div>
    </div>
  );
}

export function WorkforcePageLayout(props: WorkforcePageLayoutProps) {
  const user = useAuthStore((s) => s.user);
  const isBranchAdmin = isBranchAdminUser(user);
  const userAssignedCompanyId = user?.companyId || (user?.employee as any)?.companyId;

  const { activeCompanyId, setActiveCompanyId, companies } = useCompany();
  const selectableCompanies =
    isBranchAdmin && userAssignedCompanyId
      ? companies.filter((c) => c.id === userAssignedCompanyId)
      : companies;
  const currentCompany = selectableCompanies.find((c) => c.id === activeCompanyId) || selectableCompanies[0];
  const effectiveCompanyId =
    isBranchAdmin && userAssignedCompanyId
      ? userAssignedCompanyId
      : activeCompanyId || currentCompany?.id;

  return (
    <WorkforceBranchProvider companyId={effectiveCompanyId}>
      <WorkforcePageLayoutInner
        {...props}
        effectiveCompanyId={effectiveCompanyId}
        selectableCompanies={selectableCompanies}
        setActiveCompanyId={setActiveCompanyId}
      />
    </WorkforceBranchProvider>
  );
}
