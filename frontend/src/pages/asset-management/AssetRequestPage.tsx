import { AssetPageLayout } from './AssetPageLayout';
import { AssetRequestsTab } from './AssetRequestsTab';

export default function AssetRequestPage() {
  return (
    <AssetPageLayout
      title="Asset Requests & Self-Service"
      description="Manage employee equipment requests, manager reviews, stock checks, and inventory allocations."
    >
      {({ companyId, branchId }) => (
        <AssetRequestsTab companyId={companyId} branchId={branchId} />
      )}
    </AssetPageLayout>
  );
}
