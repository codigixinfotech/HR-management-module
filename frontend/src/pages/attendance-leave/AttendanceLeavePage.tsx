import { useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '@/api/organization';
import { useAuthStore } from '@/stores/auth-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/PageHeader';
import { Clock, AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';

// Import new subpages
import { LiveAttendanceTab } from './LiveAttendanceTab';
import { AttendanceRegisterTab } from './AttendanceRegisterTab';
import { LeaveManagementTab } from './LeaveManagementTab';
import { ShiftRosterTab } from './ShiftRosterTab';
import { OvertimeManagementTab } from './OvertimeManagementTab';
import { AttendancePoliciesTab } from './AttendancePoliciesTab';
import { AttendanceReportsTab } from './AttendanceReportsTab';

export default function AttendanceLeavePage() {
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = routeTab || searchParams.get('tab') || 'register';
  
  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);

  const user = useAuthStore((s) => s.user);

  const isHrOrAdmin = Boolean(
    user?.permissions?.includes('*') ||
      user?.roles?.some((r) => r.toUpperCase().includes('ADMIN') || r.toUpperCase().includes('HR')) ||
      user?.primaryRole?.toUpperCase().includes('ADMIN') ||
      user?.primaryRole?.toUpperCase().includes('HR')
  );

  return (
    <div className="space-y-6">
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

      {/* Metrics — Only displayed for HR/Admin roles */}
      {isHrOrAdmin && activeTab !== 'live' && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard icon={UserCheck} label="Today's Present Rate" value="94.6%" hint="138 / 146 On Duty" accent="success" />
          <StatCard icon={Clock} label="On Leave Today" value="6 Employees" hint="4 Casual / 2 Medical" accent="info" />
          <StatCard icon={AlertCircle} label="Late Arrivals" value="2 Personnel" hint="Grace Period Applied" accent="warning" />
          <StatCard icon={ShieldCheck} label="Overtime Approved" value="14.5 Hours" hint="Plant Production Line" accent="primary" />
        </div>
      )}

      {/* Render Dedicated Subpage based on activeTab */}
      {activeTab === 'register' && <AttendanceRegisterTab />}
      
      {activeTab === 'live' && <LiveAttendanceTab />}
      
      {activeTab === 'leave' && <LeaveManagementTab />}
      
      {activeTab === 'roster' && <ShiftRosterTab />}
      
      {activeTab === 'overtime' && <OvertimeManagementTab />}
      
      {activeTab === 'policies' && <AttendancePoliciesTab />}
      
      {activeTab === 'reports' && <AttendanceReportsTab />}
    </div>
  );
}
