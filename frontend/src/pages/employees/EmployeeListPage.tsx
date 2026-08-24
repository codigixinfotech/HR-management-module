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
import { SkillsCertificationsTab } from './SkillsCertificationsTab';
import { TransfersPromotionsTab } from './TransfersPromotionsTab';
import { ExitManagementTab } from './ExitManagementTab';
import { EmployeeReportsTab } from './EmployeeReportsTab';

import { useCompany } from '@/context/CompanyContext';

export default function EmployeeListPage() {
  const navigate = useNavigate();
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = routeTab || searchParams.get('tab') || 'directory';

  const { activeCompanyId } = useCompany();

  const { data, isLoading } = useQuery({
    queryKey: ['employees', 1, '', activeCompanyId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 500, companyId: activeCompanyId }),
  });

  const isAddingMaster = activeTab === 'master' && searchParams.get('action') === 'new';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Employee Directory & Lifecycle Master"
        description="Complete employee master profile, digital document vault, transfers, skill records & exit offboarding"
        badge={`${data?.total ?? 0} Total Active Personnel`}
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
          value={`${data?.total ?? 0}`}
          hint="100% Payroll Enrolled"
          accent="success"
        />
        <StatCard
          icon={ShieldCheck}
          label="Verified Documents"
          value="96.8%"
          hint="Aadhaar & PAN Synced"
          accent="info"
        />
        <StatCard
          icon={ArrowRightLeft}
          label="Promotions & Transfers YTD"
          value="12"
          hint="Internal Career Progression"
          accent="primary"
        />
        <StatCard
          icon={UserX}
          label="Annual Attrition Rate"
          value="3.8%"
          hint="Low Attrition Score"
          accent="warning"
        />
      </div>

      {/* Render Dedicated Subpage based on activeTab */}
      {activeTab === 'directory' && (
        <EmployeeDirectoryTab employees={data?.items} isLoading={isLoading} />
      )}

      {activeTab === 'master' && <EmployeeMasterTab />}

      {activeTab === 'documents' && <DocumentVaultTab />}

      {activeTab === 'skills' && <SkillsCertificationsTab />}

      {activeTab === 'transfers' && <TransfersPromotionsTab />}

      {activeTab === 'exit' && <ExitManagementTab />}

      {activeTab === 'reports' && <EmployeeReportsTab />}
    </div>
  );
}