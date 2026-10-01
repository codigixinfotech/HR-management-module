import { WorkforcePageLayout } from './WorkforcePageLayout';
import { LabourManagementTab } from './LabourManagementTab';

export default function LabourManagementPage() {
  return (
    <WorkforcePageLayout
      title="Labour Management"
      description="Blue-collar workforce attendance, wage compliance and statutory labour records"
    >
      {({ companyId, companies }) => (
        <LabourManagementTab companyId={companyId} companies={companies} />
      )}
    </WorkforcePageLayout>
  );
}
