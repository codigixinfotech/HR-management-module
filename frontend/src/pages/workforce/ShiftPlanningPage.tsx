import { WorkforcePageLayout } from './WorkforcePageLayout';
import { ShiftRosterTab } from '@/pages/attendance-leave/ShiftRosterTab';

export default function ShiftPlanningPage() {
  return (
    <WorkforcePageLayout
      title="Shift Planning & Roster Engine"
      description="Configure shift patterns, weekly off rules, employee assignments, visual roster planning, rotations, and approvals"
      badge="Automated Telemetry Active"
      badgeVariant="success"
      hideMetrics={true}
    >
      {({ companyId, selectedBranch, branches }) => (
        <ShiftRosterTab
          companyId={companyId}
          selectedBranch={selectedBranch}
          branches={branches}
        />
      )}
    </WorkforcePageLayout>
  );
}
