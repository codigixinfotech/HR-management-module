import { WorkforcePageLayout } from './WorkforcePageLayout';
import { WorkforceReportsTab } from './WorkforceReportsTab';

export default function WorkforceReportsPage() {
  return (
    <WorkforcePageLayout
      title="Workforce Reports & Analytics"
      description="Operational headcount reports, shift utilization trends, plant line efficiency, and vendor compliance summaries"
      badge="Live Shop Floor Telemetry"
      badgeVariant="success"
      hideMetrics={true}
    >
      {({ companyId, companies }) => (
        <WorkforceReportsTab companyId={companyId} companies={companies} />
      )}
    </WorkforcePageLayout>
  );
}
