import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Boxes, Laptop, UserCheck, Wrench } from 'lucide-react';
import { assetsApi } from '@/api/asset-management';
import { useCompany } from '@/context/CompanyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/PageHeader';
import { AssetsTab } from './AssetsTab';
import { AllocationTab } from './AllocationTab';
import { ReturnTab } from './ReturnTab';
import { MaintenanceTab } from './MaintenanceTab';
import { AssetReportsTab } from './AssetReportsTab';
import { getCompanyCategoryConfig } from './assetCategoryConfig';

export default function AssetManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const { activeCompanyId, setActiveCompanyId, companies } = useCompany();
  const currentCompany = companies.find((c) => c.id === activeCompanyId) || companies[0];
  const companyId = activeCompanyId || currentCompany?.id;
  const companyEntityType = currentCompany?.entityType;

  const [activeSectorName, setActiveSectorName] = useState(() =>
    getCompanyCategoryConfig(companyId, companyEntityType).sectorName
  );

  useEffect(() => {
    const cfg = getCompanyCategoryConfig(companyId, companyEntityType);
    setActiveSectorName(cfg.sectorName);

    const onUpdate = (e: any) => {
      if (!companyId || e.detail?.companyId === companyId) {
        setActiveSectorName(e.detail?.config?.sectorName || cfg.sectorName);
      }
    };
    window.addEventListener('ehcm_asset_category_updated', onUpdate);
    return () => window.removeEventListener('ehcm_asset_category_updated', onUpdate);
  }, [companyId, companyEntityType]);

  const { data: assets } = useQuery({
    queryKey: ['assets', companyId],
    queryFn: () => assetsApi.list(companyId),
  });

  const totalValue = assets?.reduce((sum, a) => sum + (a.value ?? 0), 0) ?? 0;
  const allocatedCount = assets?.filter((a) => a.status === 'ALLOCATED').length ?? 0;
  const inStockCount = assets?.filter((a) => a.status === 'IN_STOCK' || a.status === 'AVAILABLE').length ?? 0;
  const maintenanceCount = assets?.filter((a) => a.status === 'UNDER_MAINTENANCE').length ?? 0;

  const assetCategories = Array.from(new Set((assets ?? []).map((a) => a.category))).map((category) => {
    const categoryAssets = (assets ?? []).filter((a) => a.category === category);
    return {
      category,
      count: categoryAssets.length,
      allocated: categoryAssets.filter((a) => a.status === 'ALLOCATED').length,
      inStock: categoryAssets.filter((a) => a.status === 'IN_STOCK' || a.status === 'AVAILABLE').length,
    };
  });
  const categoryAccents = ['primary', 'info', 'success', 'warning'] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Boxes}
        title={`Asset Management — ${activeSectorName}`}
        description="Manage organizational assets, employee allocations, returns, maintenance and asset lifecycle."
        badge={`${activeSectorName} · ${assets?.length ?? 0} Total Asset Tags`}
        badgeVariant="info"
        actions={
          companies && companies.length > 0 ? (
            <div className="w-64">
              <Select value={companyId} onValueChange={setActiveCompanyId}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
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

      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
        <TabsList className="flex h-auto flex-wrap gap-1 bg-muted/60 p-1">
          <TabsTrigger value="dashboard" className="text-xs px-3 py-1.5">Overview</TabsTrigger>
          <TabsTrigger value="master" className="text-xs px-3 py-1.5">Asset Master</TabsTrigger>
          <TabsTrigger value="allocation" className="text-xs px-3 py-1.5">Asset Allocation</TabsTrigger>
          <TabsTrigger value="return" className="text-xs px-3 py-1.5">Asset Return</TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs px-3 py-1.5">Maintenance</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs px-3 py-1.5">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Asset Portfolio Snapshot</CardTitle>
              <CardDescription>
                Quick pulse on asset categories, allocation and operational health. Head to Asset Master for the full
                asset directory and registration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assetCategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {assetCategories.map((c, i) => (
                    <StatCard
                      key={c.category}
                      icon={Boxes}
                      label={c.category}
                      value={c.count}
                      hint={`${c.allocated} allocated · ${c.inStock} in stock`}
                      accent={categoryAccents[i % categoryAccents.length]}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No assets registered yet. Add assets from the Asset Master tab to see a category breakdown here.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="master" className="mt-4">
          <AssetsTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="allocation" className="mt-4">
          <AllocationTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="return" className="mt-4">
          <ReturnTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="maintenance" className="mt-4">
          <MaintenanceTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <AssetReportsTab companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
