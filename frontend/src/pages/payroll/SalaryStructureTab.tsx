import { SalaryStructurePage } from './salary-structure/SalaryStructurePage';

export function SalaryStructureTab({ companyId }: { companyId?: string }) {
  return <SalaryStructurePage companyId={companyId} />;
}
