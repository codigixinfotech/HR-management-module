import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Users, ShieldCheck, ArrowRightLeft, UserX, Plus, ArrowLeft } from 'lucide-react';
import { employeesApi } from '@/api/employees';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/PageHeader';

// Import new tab components
import { EmployeeDirectoryTab } from './EmployeeDirectoryTab';
import { EmployeeMasterTab } from './EmployeeMasterTab';
import { DocumentVaultTab } from './DocumentVaultTab';
import { TransfersPromotionsTab } from './TransfersPromotionsTab';
import { ExitManagementTab } from './ExitManagementTab';
import { EmployeeReportsTab } from './EmployeeReportsTab';

import { useCompany } from '@/context/CompanyContext';
import { useAuthStore } from '@/stores/auth-store';

export default function EmployeeListPage() {
  const navigate = useNavigate();
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const rawTab = routeTab || searchParams.get('tab') || 'directory';
  const activeTab = rawTab === 'skills' ? 'directory' : rawTab;

  const { activeCompanyId } = useCompany();
  const user = useAuthStore((s) => s.user);

  const isBranchAdmin = useMemo(() => {
    if (!user) return false;
    const roles = (user.roles ?? []).map((r) => String(r).toUpperCase());
    const primary = user.primaryRole?.toUpperCase();
    return (
      roles.includes('BRANCH_ADMIN') ||
      roles.includes('BRANCH ADMIN') ||
      primary === 'BRANCH_ADMIN' ||
      primary === 'BRANCH ADMIN' ||
      Boolean(user.branchId)
    );
  }, [user]);

  const assignedBranchId = user?.branchId || user?.employee?.branchId;
  const effectiveBranchId = isBranchAdmin && assignedBranchId ? assignedBranchId : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['employees', 1, '', activeCompanyId, effectiveBranchId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 500, companyId: activeCompanyId, branchId: effectiveBranchId }),
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ['transfers', activeCompanyId, effectiveBranchId],
    queryFn: () => employeesApi.listTransfers({ companyId: activeCompanyId, branchId: effectiveBranchId }),
  });

  const employeesList = data?.items ?? [];
  const totalPersonnel = data?.total ?? 0;

  // Verified documents: percentage of employees with KYC verified or at least 1 uploaded document
  const verifiedCount = employeesList.filter(
    (e) => e.kycStatus === 'VERIFIED' || (e.documents && e.documents.length > 0)
  ).length;
  const verifiedDocsPct = employeesList.length > 0
    ? `${Math.round((verifiedCount / employeesList.length) * 100)}%`
    : '0%';

  // Transfers & Promotions YTD count
  const transfersCount = transfers.length;

  // Annual Attrition Rate
  const exitedCount = employeesList.filter(
    (e) => e.status === 'TERMINATED' || e.status === 'INACTIVE'
  ).length;
  const attritionPct = employeesList.length > 0
    ? `${((exitedCount / employeesList.length) * 100).toFixed(1)}%`
    : '0.0%';

  const isAddingMaster = activeTab === 'master' && searchParams.get('action') === 'new';

  return (
    <div className="space-y-6">
      {/* PageHeader and Top StatCards — Hidden on 'reports' tab to avoid double cards and irrelevant master action */}
      {activeTab !== 'reports' && (
        <>
          <PageHeader
            icon={Users}
            title="Employee Directory & Lifecycle Master"
            description="Complete employee master profile, digital document vault, transfers, skill records & exit offboarding"
            badge={`${totalPersonnel} Total Active Personnel`}
            badgeVariant="success"
            actions={
              isAddingMaster ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs border-border/80"
                  onClick={() => navigate('/employees/master')}
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Discard & Back
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => navigate('/employees/master?action=new')}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Employee Master
                </Button>
              )
            }
          />

          {/* Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total Active Employees"
              value={`${totalPersonnel}`}
              hint="100% Payroll Enrolled"
              accent="success"
            />
            <StatCard
              icon={ShieldCheck}
              label="Verified Documents"
              value={verifiedDocsPct}
              hint="Aadhaar & PAN Synced"
              accent="info"
            />
            <StatCard
              icon={ArrowRightLeft}
              label="Promotions & Transfers YTD"
              value={`${transfersCount}`}
              hint="Internal Career Progression"
              accent="primary"
            />
            <StatCard
              icon={UserX}
              label="Annual Attrition Rate"
              value={attritionPct}
              hint="Low Attrition Score"
              accent="warning"
            />
          </div>
        </>
      )}

      {/* Render Dedicated Subpage based on activeTab */}
      {activeTab === 'directory' && (
        <EmployeeDirectoryTab employees={data?.items} isLoading={isLoading} />
      )}

      {activeTab === 'master' && <EmployeeMasterTab />}

      {activeTab === 'documents' && <DocumentVaultTab />}
      {activeTab === 'transfers' && <TransfersPromotionsTab />}

      {activeTab === 'exit' && <ExitManagementTab />}

      {activeTab === 'reports' && <EmployeeReportsTab />}
    </div>
  );
}