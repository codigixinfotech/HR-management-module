import { useAuthStore } from '@/stores/auth-store';
import { isHrOrAdminUser } from '@/lib/modules';
import { WorkforcePageLayout } from './WorkforcePageLayout';
import { ShiftRosterTab } from '@/pages/attendance-leave/ShiftRosterTab';

export default function ShiftPlanningPage() {
  const user = useAuthStore((s) => s.user);
  const isHrOrAdmin = isHrOrAdminUser(user);

  return (
    <WorkforcePageLayout
      title={isHrOrAdmin ? 'Shift Planning & Roster Engine' : 'Shift Planning & Roster'}
      description={
        isHrOrAdmin
          ? 'Configure shift patterns, weekly off rules, employee assignments, visual roster planning, rotations, and approvals'
          : 'Published operational shift schedule, multi-shift rotation tracking, weekly off policies, and approved requests'
      }
      badge={isHrOrAdmin ? 'Automated Telemetry Active' : 'Published Roster Active'}
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
