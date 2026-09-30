import { AssetPageLayout } from './AssetPageLayout';
import { MaintenanceTab } from './MaintenanceTab';

export default function AssetMaintenancePage() {
  return (
    <AssetPageLayout
      title="Maintenance & Repairs"
      description="Issue and manage work orders, QC inspections, warranty claims, and servicing history."
    >
      {({ companyId, branchId }) => (
        <MaintenanceTab companyId={companyId} branchId={branchId} />
      )}
    </AssetPageLayout>
  );
}
