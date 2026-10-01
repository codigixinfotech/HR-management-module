import { WorkforcePageLayout } from './WorkforcePageLayout';
import { MachineAllocationTab } from './MachineAllocationTab';

export default function MachineAllocationPage() {
  return (
    <WorkforcePageLayout
      title="Machine & Assembly Line Allocation"
      description="Assign certified operators and supervisors to factory floor machinery"
    >
      {({ companyId, companies }) => (
        <MachineAllocationTab companyId={companyId} companies={companies} />
      )}
    </WorkforcePageLayout>
  );
}
