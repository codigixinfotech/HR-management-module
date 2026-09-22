import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '@/api/organization';
import { useCompany } from '@/context/CompanyContext';
import { AttendanceTab } from './AttendanceTab';

interface AttendanceRegisterTabProps {
  companyId?: string;
}

export function AttendanceRegisterTab({ companyId }: AttendanceRegisterTabProps = {}) {
  const { activeCompanyId } = useCompany();
  const effectiveCompanyId = companyId || activeCompanyId;
  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });

  return (
    <div className="space-y-4">
      <AttendanceTab companyId={effectiveCompanyId} companies={companies ?? []} />
    </div>
  );
}

