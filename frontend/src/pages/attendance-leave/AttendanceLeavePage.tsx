import { useSearchParams, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useCompany } from '@/context/CompanyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { Clock } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Import subpages
import { LiveAttendanceTab } from './LiveAttendanceTab';
import { AttendanceRegisterTab } from './AttendanceRegisterTab';
import { LeaveManagementTab } from './LeaveManagementTab';
import { ShiftRosterTab } from './ShiftRosterTab';
import { OvertimeManagementTab } from './OvertimeManagementTab';
import { AttendancePoliciesTab } from './AttendancePoliciesTab';
import { AttendanceReportsTab } from './AttendanceReportsTab';
import { useLeaveStore } from './leaveStore';

export default function AttendanceLeavePage() {
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = routeTab || searchParams.get('tab') || 'live';
  const activeLeaveSubTab = useLeaveStore((s) => s.activeSubTab);

  const { activeCompanyId, setActiveCompanyId, companies } = useCompany();
  const user = useAuthStore((s) => s.user);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const isHrOrAdmin = Boolean(
    user?.permissions?.includes('*') ||
      user?.roles?.some((r) => r.toUpperCase().includes('ADMIN') || r.toUpperCase().includes('HR')) ||
      user?.primaryRole?.toUpperCase().includes('ADMIN') ||
      user?.primaryRole?.toUpperCase().includes('HR')
  );

  const effectiveCompanyId = activeCompanyId || user?.companyId || undefined;

  return (
    <div className="space-y-6">
      {/* Desktop PageHeader */}
      <div className="hidden md:block">
        <PageHeader
          icon={Clock}
          title="Attendance, Leave & Shift Roster Engine"
          description="Biometric punch logs, monthly muster roll register, leave workflows, shift rosters & overtime calculations"
          badge="Live Gateway Active"
          badgeVariant="success"
          actions={
            companies &&
            companies.length > 0 && (
              <div className="w-64">
                <Select
                  value={effectiveCompanyId || ''}
                  onValueChange={(val) => {
                    if (val && val !== 'ALL') {
                      setActiveCompanyId(val);
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-xs font-semibold bg-background border-border/80 shadow-2xs">
                    <SelectValue placeholder="Select Organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs font-medium">
                        {c.name} {c.code ? `(${c.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          }
        />
      </div>

      {/* Render Dedicated Subpage based on activeTab, keyed by effectiveCompanyId to guarantee clean reload without residual state */}
      <div key={effectiveCompanyId || 'no-company'} className="w-full">
        {activeTab === 'register' && <AttendanceRegisterTab companyId={effectiveCompanyId} />}

        {activeTab === 'live' && <LiveAttendanceTab companyId={effectiveCompanyId} />}

        {activeTab === 'leave' && <LeaveManagementTab companyId={effectiveCompanyId} />}

        {activeTab === 'roster' && <ShiftRosterTab companyId={effectiveCompanyId} />}

        {activeTab === 'overtime' && <OvertimeManagementTab companyId={effectiveCompanyId} />}

        {activeTab === 'policies' && <AttendancePoliciesTab companyId={effectiveCompanyId} />}

        {activeTab === 'reports' && <AttendanceReportsTab companyId={effectiveCompanyId} />}
      </div>
    </div>
  );
}
