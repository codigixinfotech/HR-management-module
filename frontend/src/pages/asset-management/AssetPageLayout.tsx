import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Boxes, Laptop, UserCheck, Wrench } from 'lucide-react';
import { assetsApi } from '@/api/asset-management';
import { useCompany } from '@/context/CompanyContext';
import { useAuthStore } from '@/stores/auth-store';
import { isBranchAdminUser } from '@/lib/modules';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/PageHeader';

interface AssetPageLayoutProps {
  title: string;
  description: string;
  children: (context: { companyId?: string; branchId?: string }) => React.ReactNode;
}

export function AssetPageLayout({ title, description, children }: AssetPageLayoutProps) {
  const user = useAuthStore((s) => s.user);
  const isBranchAdmin = isBranchAdminUser(user);
  const userAssignedBranchId = user?.branchId || user?.employee?.branchId;
  const userAssignedCompanyId = user?.companyId || (user?.employee as any)?.companyId;

  const { activeCompanyId, setActiveCompanyId, companies } = useCompany();
  const selectableCompanies =
    isBranchAdmin && userAssignedCompanyId
      ? companies.filter((c) => c.id === userAssignedCompanyId)
      : companies;
  const currentCompany = selectableCompanies.find((c) => c.id === activeCompanyId) || selectableCompanies[0];
  const effectiveCompanyId =
    isBranchAdmin && userAssignedCompanyId
      ? userAssignedCompanyId
      : activeCompanyId || currentCompany?.id;
  const effectiveBranchId = isBranchAdmin ? userAssignedBranchId : undefined;

  const { data: assets } = useQuery({
    queryKey: ['assets', effectiveCompanyId, effectiveBranchId],
    queryFn: () => assetsApi.list(effectiveCompanyId, effectiveBranchId),
  });

  const totalValue = assets?.reduce((sum, a) => sum + (a.value ?? 0), 0) ?? 0;
  const allocatedCount = assets?.filter((a) => a.status === 'ALLOCATED').length ?? 0;
  const inStockCount = assets?.filter((a) => a.status === 'IN_STOCK' || a.status === 'AVAILABLE').length ?? 0;
  const maintenanceCount = assets?.filter((a) => a.status === 'UNDER_MAINTENANCE').length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Boxes}
        title={title}
        description={description}
        badge={`${assets?.length ?? 0} Total Asset Tags`}
        badgeVariant="info"
        actions={
          selectableCompanies && selectableCompanies.length > 0 ? (
            <div className="w-64">
              <Select
                value={effectiveCompanyId}
                onValueChange={setActiveCompanyId}
                disabled={isBranchAdmin}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {selectableCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Boxes}
          label="Total Asset Value"
          value={`₹${totalValue.toLocaleString('en-IN')}`}
          hint={`${assets?.length ?? 0} Total Asset Tags`}
          accent="info"
        />
        <StatCard
          icon={Laptop}
          label="Allocated Assets"
          value={`${allocatedCount} Assets`}
          hint="Assigned to Employees"
          accent="success"
        />
        <StatCard
          icon={UserCheck}
          label="Available Assets"
          value={`${inStockCount} Assets`}
          hint="Ready for Allocation"
          accent="primary"
        />
        <StatCard
          icon={Wrench}
          label="Under Maintenance"
          value={`${maintenanceCount} Assets`}
          hint="Under Service / Repair"
          accent="warning"
        />
      </div>

      <div>
        {children({ companyId: effectiveCompanyId, branchId: effectiveBranchId })}
      </div>
    </div>
  );
}
