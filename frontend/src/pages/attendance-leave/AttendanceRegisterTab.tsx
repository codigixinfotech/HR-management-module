import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '@/api/organization';
import { AttendanceTab } from './AttendanceTab';

export function AttendanceRegisterTab() {
  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });

  return (
    <div className="space-y-4">
      <AttendanceTab companyId={undefined} companies={companies ?? []} />
    </div>
  );
}
