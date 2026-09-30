import { AssetPageLayout } from './AssetPageLayout';
import { AssetReportsTab } from './AssetReportsTab';

export default function AssetReportsPage() {
  return (
    <AssetPageLayout
      title="Asset Reports"
      description="Operational asset reports, category breakdown, valuation trends, and employee asset ratios."
    >
      {({ companyId, branchId }) => (
        <AssetReportsTab companyId={companyId} branchId={branchId} />
      )}
    </AssetPageLayout>
  );
}
