import { useSearchParams, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { companiesApi } from '@/api/organization';
import { complianceTasksApi } from '@/api/compliance';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/PageHeader';
import { ComplianceTypesCard } from './ComplianceTypesCard';
import { ComplianceCalendarTab } from './ComplianceCalendarTab';
import { PfModule } from './pf/PfModule';

export default function CompliancePage() {
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = routeTab || searchParams.get('tab') || 'dashboard';

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });
  const companyId = companies?.[0]?.id;

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

      {/* Render Dedicated Subpage based on activeTab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <ComplianceTypesCard companyId={companyId} />
          <ComplianceCalendarTab companyId={companyId} title="All Compliance Tasks" description="Every tracked filing, license and audit across categories" />
        </div>
      )}

      {activeTab === 'pf' && <PfModule companyId={companyId} companies={companies} />}

      {activeTab === 'esic' && (
        <ComplianceCalendarTab
          companyId={companyId}
          title="ESIC"
          description="Employee State Insurance monthly filings"
          filter={(t) => t.complianceType?.code === 'ESIC_RETURN'}
        />
      )}

      {activeTab === 'ptax' && (
        <ComplianceCalendarTab
          companyId={companyId}
          title="Professional Tax"
          description="State professional tax returns"
          filter={(t) => t.complianceType?.code === 'PT_RETURN'}
        />
      )}

      {activeTab === 'itax' && (
        <ComplianceCalendarTab
          companyId={companyId}
          title="Income Tax (TDS)"
          description="Quarterly TDS returns"
          filter={(t) => t.complianceType?.code === 'TDS_RETURN'}
        />
      )}

      {activeTab === 'labour' && (
        <ComplianceCalendarTab
          companyId={companyId}
          title="Labour Compliance"
          description="POSH, contract labour and other non-statutory-return audits"
          filter={(t) => t.complianceType?.category !== 'STATUTORY_RETURN'}
        />
      )}

      {activeTab === 'returns' && (
        <ComplianceCalendarTab
          companyId={companyId}
          title="Government Returns"
          description="All statutory return filings across PF, ESIC, PT and TDS"
          filter={(t) => t.complianceType?.category === 'STATUTORY_RETURN'}
        />
      )}

      {activeTab === 'reports' && <ComplianceReportsTab companyId={companyId} />}
    </div>
  );
}
