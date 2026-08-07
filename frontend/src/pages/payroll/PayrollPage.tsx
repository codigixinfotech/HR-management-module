import { useSearchParams, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building, Calendar, DollarSign, FileText, Wallet } from 'lucide-react';
import { companiesApi } from '@/api/organization';
import { payrollRunsApi, payslipsApi } from '@/api/payroll';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/empty-state';

// Import subpages
import { SalaryStructureTab } from './SalaryStructureTab';
import { PayrollProcessingTab } from './PayrollProcessingTab';
import { PayslipsTab } from './PayslipsTab';
import { PayrollReportsTab } from './PayrollReportsTab';
import { SalaryRevisionTab } from './SalaryRevisionTab';
import { LoansAdvancesTab } from './LoansAdvancesTab';
import { ReimbursementsTab } from './ReimbursementsTab';
import { BankTransferTab } from './BankTransferTab';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const RUN_STATUS_BADGE_VARIANT: Record<string, 'success' | 'warning' | 'info'> = {
  PROCESSED: 'warning',
  APPROVED: 'success',
  PAID: 'success',
};

export default function PayrollPage() {
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = routeTab || searchParams.get('tab') || 'dashboard';

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });
  const companyId = companies?.[0]?.id;

  const { data: runs } = useQuery({
    queryKey: ['payroll-runs', companyId],
    queryFn: () => payrollRunsApi.list(companyId),
    enabled: !!companyId,
  });

  const latestRun = runs?.filter((r) => r.status !== 'DRAFT').sort((a, b) => b.year - a.year || b.month - a.month)[0];

  const { data: latestPayslips } = useQuery({
    queryKey: ['payslips', latestRun?.id],
    queryFn: () => payslipsApi.list({ payrollRunId: latestRun!.id }),
    enabled: !!latestRun,
  });

  const grossTotal = latestPayslips?.reduce((sum, p) => sum + p.grossEarnings, 0) ?? 0;
  const statutoryTotal = latestPayslips?.reduce((sum, p) => sum + p.pf + p.esic + p.professionalTax, 0) ?? 0;
  const netTotal = latestPayslips?.reduce((sum, p) => sum + p.netPay, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wallet}
        title="Payroll Processing Engine"
        description="Manage salary components, automated payroll calculation, statutory deductions and payslips"
        badge={latestRun ? `${MONTH_NAMES[latestRun.month - 1]} ${latestRun.year} - ${latestRun.status}` : 'No runs yet'}
        badgeVariant={latestRun ? RUN_STATUS_BADGE_VARIANT[latestRun.status] ?? 'info' : 'secondary'}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Latest Run Gross"
          value={`₹${grossTotal.toLocaleString('en-IN')}`}
          hint={latestRun ? `${MONTH_NAMES[latestRun.month - 1]} ${latestRun.year}` : 'Process a run to see totals'}
          accent="primary"
        />
        <StatCard
          icon={Building}
          label="Statutory Deductions (PF/ESIC/PT)"
          value={`₹${statutoryTotal.toLocaleString('en-IN')}`}
          hint="Computed automatically on processing"
          accent="warning"
        />
        <StatCard
          icon={Wallet}
          label="Net Payout"
          value={`₹${netTotal.toLocaleString('en-IN')}`}
          hint={latestRun?.status ?? '-'}
          accent="success"
        />
        <StatCard
          icon={FileText}
          label="Payslips Generated"
          value={latestRun?._count?.payslips ?? 0}
          hint="In the latest processed run"
          accent="info"
        />
      </div>

      {/* Render Dedicated Subpage based on activeTab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Snapshot of the most recently processed payroll run. Select options from the sidebar to manage salary structures,
            process new runs, and review payslips and reports.
          </p>
          {latestRun ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={Calendar}
                label="Latest Processed Period"
                value={`${MONTH_NAMES[latestRun.month - 1]} ${latestRun.year}`}
                hint={latestRun.status}
                accent="primary"
              />
              <StatCard
                icon={FileText}
                label="Payslips Generated"
                value={latestRun._count?.payslips ?? 0}
                accent="info"
              />
              <StatCard icon={Wallet} label="Net Payout" value={`₹${netTotal.toLocaleString('en-IN')}`} accent="success" />
            </div>
          ) : (
            <EmptyState
              icon={Wallet}
              title="No payroll runs yet"
              description="Create and process a payroll run to see an overview here."
            />
          )}
        </div>
      )}

      {activeTab === 'structure' && <SalaryStructureTab companyId={companyId} />}

      {activeTab === 'processing' && <PayrollProcessingTab companyId={companyId} />}

      {activeTab === 'payslips' && <PayslipsTab companyId={companyId} />}

      {activeTab === 'revision' && <SalaryRevisionTab />}

      {activeTab === 'loans' && <LoansAdvancesTab />}

      {activeTab === 'reimbursements' && <ReimbursementsTab />}

      {activeTab === 'bank-transfer' && <BankTransferTab />}

      {activeTab === 'reports' && <PayrollReportsTab companyId={companyId} />}
    </div>
  );
}
