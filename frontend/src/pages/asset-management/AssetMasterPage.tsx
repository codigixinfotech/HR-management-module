import { AssetPageLayout } from './AssetPageLayout';
import { AssetsTab } from './AssetsTab';

export default function AssetMasterPage() {
  return (
    <AssetPageLayout
      title="Asset Master"
      description="Directory of registered organizational assets, equipment, software licenses and operational records."
    >
      {({ companyId, branchId }) => (
        <AssetsTab companyId={companyId} branchId={branchId} />
      )}
    </AssetPageLayout>
  );
}
