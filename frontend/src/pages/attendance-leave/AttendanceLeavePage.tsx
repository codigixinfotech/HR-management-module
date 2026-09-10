import { useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '@/api/organization';
import { useAuthStore } from '@/stores/auth-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Import new subpages
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
  
  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);

  const user = useAuthStore((s) => s.user);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const isHrOrAdmin = Boolean(
    user?.permissions?.includes('*') ||
      user?.roles?.some((r) => r.toUpperCase().includes('ADMIN') || r.toUpperCase().includes('HR')) ||
      user?.primaryRole?.toUpperCase().includes('ADMIN') ||
      user?.primaryRole?.toUpperCase().includes('HR')
  );
  const effectiveCompanyId = companyId || user?.companyId || undefined;

  return (
    <div className="space-y-6">
      {/* Desktop PageHeader - Hidden on mobile per user request */}
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
              <div className="w-56">
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All companies" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          }
        />
      </div>

      {/* Top metrics cards hidden across all tabs per user request */}

      {/* Render Dedicated Subpage based on activeTab */}
      {activeTab === 'register' && <AttendanceRegisterTab />}
      
      {activeTab === 'live' && <LiveAttendanceTab />}
      
      {activeTab === 'leave' && <LeaveManagementTab />}
      
      {activeTab === 'roster' && <ShiftRosterTab companyId={effectiveCompanyId} />}
      
      {activeTab === 'overtime' && <OvertimeManagementTab />}
      
      {activeTab === 'policies' && <AttendancePoliciesTab />}
      
      {activeTab === 'reports' && <AttendanceReportsTab />}
    </div>
  );
}
