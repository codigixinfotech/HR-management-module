import { WorkforcePageLayout } from './WorkforcePageLayout';
import { ContractorManagementTab } from './ContractorManagementTab';

export default function ContractorManagementPage() {
  return (
    <WorkforcePageLayout
      title="Contractor Management"
      description="Staffing vendors, contracts, contractor workers, deployments, statutory compliance & labour registers"
    >
      {({ companyId, companies }) => (
        <ContractorManagementTab companyId={companyId} companies={companies} />
      )}
    </WorkforcePageLayout>
  );
}
