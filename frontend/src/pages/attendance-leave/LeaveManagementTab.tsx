import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '@/api/organization';
import { LeaveRequestsTab } from './LeaveRequestsTab';
import { LeaveTypesTab } from './LeaveTypesTab';

export function LeaveManagementTab() {
  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });

  return (
    <div className="space-y-6">
      <LeaveRequestsTab companyId={undefined} companies={companies ?? []} />
      <LeaveTypesTab companyId={undefined} companies={companies ?? []} />
    </div>
  );
}
