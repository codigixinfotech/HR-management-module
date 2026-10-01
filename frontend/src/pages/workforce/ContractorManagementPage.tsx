import { WorkforcePageLayout } from './WorkforcePageLayout';
import { ContractorManagementTab } from './ContractorManagementTab';

export default function ContractorManagementPage() {
  return (
    <WorkforcePageLayout
      title="Contract Labour Staffing Vendors"
      description="Manpower supply agency contracts, deployed headcount & statutory CLRA compliance"
    >
      {({ companyId, companies }) => (
        <ContractorManagementTab companyId={companyId} companies={companies} />
      )}
    </WorkforcePageLayout>
  );
}
