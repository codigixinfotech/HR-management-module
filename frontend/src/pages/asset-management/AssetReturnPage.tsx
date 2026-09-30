import { AssetPageLayout } from './AssetPageLayout';
import { ReturnTab } from './ReturnTab';

export default function AssetReturnPage() {
  return (
    <AssetPageLayout
      title="Asset Return"
      description="Inspect physical asset condition, record return rationale, and update asset status."
    >
      {({ companyId, branchId }) => (
        <ReturnTab companyId={companyId} branchId={branchId} />
      )}
    </AssetPageLayout>
  );
}
