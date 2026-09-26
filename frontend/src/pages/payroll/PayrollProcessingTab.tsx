import { PayrollProcessingPage } from './payroll-processing/PayrollProcessingPage';

export function PayrollProcessingTab({ companyId }: { companyId?: string }) {
  return <PayrollProcessingPage companyId={companyId} />;
}
