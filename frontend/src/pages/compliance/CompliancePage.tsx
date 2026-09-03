import { useSearchParams, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { complianceTasksApi } from '@/api/compliance';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCompany } from '@/context/CompanyContext';
import { ComplianceTypesCard } from './ComplianceTypesCard';
import { ComplianceCalendarTab } from './ComplianceCalendarTab';
import { ComplianceReportsTab } from './ComplianceReportsTab';
import { ComplianceSetupTab } from './ComplianceSetupTab';
import { PfModule } from './pf/PfModule';
import { PtModule } from './pt/PtModule';
import { EsicModule } from './esic/EsicModule';
import { TdsModule } from './tds/TdsModule';
import { LabourComplianceModule } from './labour/LabourComplianceModule';
import { GovernmentReturnsModule } from './returns/GovernmentReturnsModule';

export default function CompliancePage() {
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = routeTab || searchParams.get('tab') || 'setup';

  const { activeCompanyId, companies } = useCompany();
  const companyId = searchParams.get('companyId') || activeCompanyId || companies?.[0]?.id;

  const { data: tasksPage } = useQuery({
    queryKey: ['compliance-tasks', companyId],
    queryFn: () => complianceTasksApi.list({ companyId, pageSize: 100 }),
    enabled: !!companyId,
  });
  const tasks = tasksPage?.items ?? [];
  const filed = tasks.filter((t) => t.status === 'FILED').length;
  const pending = tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const overdue = tasks.filter((t) => (t.status === 'PENDING' || t.status === 'IN_PROGRESS') && new Date(t.dueDate) < new Date()).length;

  return (
    <div className="space-y-6">
      {!['setup', 'pf', 'ptax', 'esic', 'itax', 'labour', 'returns', 'reports'].includes(activeTab) && (
        <>
          <PageHeader
            icon={ShieldCheck}
            title="Statutory Compliance & Legal Returns"
            description="Compliance calendar for PF, ESIC, Professional Tax, TDS and other statutory filings"
            badge={overdue > 0 ? `${overdue} overdue` : 'All up to date'}
            badgeVariant={overdue > 0 ? 'warning' : 'success'}
          />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={ShieldCheck} label="Total Tasks" value={tasks.length} accent="primary" />
            <StatCard icon={CheckCircle2} label="Filed" value={filed} accent="success" />
            <StatCard icon={Clock} label="Pending" value={pending} accent="warning" />
            <StatCard icon={AlertCircle} label="Overdue" value={overdue} accent="destructive" />
          </div>
        </>
      )}

      {/* Render Dedicated Subpage based on activeTab */}
      {activeTab === 'setup' && <ComplianceSetupTab companyId={companyId} companies={companies} />}

      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <ComplianceTypesCard companyId={companyId} />
          <ComplianceCalendarTab companyId={companyId} title="All Compliance Tasks" description="Every tracked filing, license and audit across categories" />
        </div>
      )}

      {activeTab === 'pf' && <PfModule companyId={companyId} companies={companies} />}

      {activeTab === 'esic' && <EsicModule companyId={companyId} companies={companies} />}

      {activeTab === 'ptax' && <PtModule companyId={companyId} companies={companies} />}

      {activeTab === 'itax' && <TdsModule companyId={companyId} companies={companies} />}

      {activeTab === 'labour' && <LabourComplianceModule companyId={companyId} companies={companies} />}

      {activeTab === 'returns' && <GovernmentReturnsModule companyId={companyId} companies={companies} />}

      {activeTab === 'reports' && <ComplianceReportsTab companyId={companyId} companies={companies} />}
    </div>
  );
}
