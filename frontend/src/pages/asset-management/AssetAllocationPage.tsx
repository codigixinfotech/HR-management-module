import { AssetPageLayout } from './AssetPageLayout';
import { AllocationTab } from './AllocationTab';

export default function AssetAllocationPage() {
  return (
    <AssetPageLayout
      title="Asset Allocation"
      description="Personal devices and organizational equipment currently allocated to company staff."
    >
      {({ companyId, branchId }) => (
        <AllocationTab companyId={companyId} branchId={branchId} />
      )}
    </AssetPageLayout>
  );
}
