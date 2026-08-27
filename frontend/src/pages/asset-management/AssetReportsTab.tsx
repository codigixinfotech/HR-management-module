import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  UserCheck,
  Wrench,
  TrendingUp,
  SlidersHorizontal,
  Download,
  Calendar,
  Layers,
  Users,
  Wallet,
  ShieldCheck,
  Plus,
  Undo2,
  Share2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
} from 'lucide-react';
import { assetsApi, assetMaintenanceApi } from '@/api/asset-management';
import { employeesApi } from '@/api/employees';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AssetReportsTab({ companyId }: { companyId?: string }) {
  // Queries
  const { data: assets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets', companyId],
    queryFn: () => assetsApi.list(companyId),
  });

  const { data: records = [] } = useQuery({
    queryKey: ['asset-maintenance'],
    queryFn: () => assetMaintenanceApi.list(),
  });

  const { data: employeesPage } = useQuery({
    queryKey: ['employees', 'asset-reports-count', companyId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 200, companyId }),
  });

  const totalEmployeesCount = employeesPage?.total ?? employeesPage?.items?.length ?? 120;

  // Key Dynamic Metrics
  const metrics = useMemo(() => {
    const totalAssets = assets.length;
    const totalValue = assets.reduce((sum, a) => sum + (a.value || 0), 0);
    const allocated = assets.filter((a) => a.status === 'ALLOCATED').length;
    const inStock = assets.filter((a) => a.status === 'IN_STOCK' || a.status === 'AVAILABLE').length;
    const underMaintenance = assets.filter((a) => a.status === 'UNDER_MAINTENANCE').length;
    const others = assets.filter((a) => a.status === 'RETIRED' || a.status === 'DISPOSED').length;
    const avgValue = totalAssets > 0 ? totalValue / totalAssets : 0;
    const assetsPerEmp = totalEmployeesCount > 0 ? (totalAssets / totalEmployeesCount).toFixed(2) : '0';
    const maintCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
    const warrantyCount = assets.filter((a) => a.warrantyExpiry && new Date(a.warrantyExpiry) > new Date()).length;

    return {
      totalAssets,
      totalValue,
      allocated,
      inStock,
      underMaintenance,
      others,
      avgValue,
      assetsPerEmp,
      maintCost,
      warrantyCount,
    };
  }, [assets, records, totalEmployeesCount]);

  // Category Breakdown Data
  const categorySummary = useMemo(() => {
    const categoriesMap = new Map<string, { total: number; allocated: number; inStock: number; underMaint: number; value: number }>();

    assets.forEach((a) => {
      const cat = a.category || 'Laptop / Workstation';
      const existing = categoriesMap.get(cat) || { total: 0, allocated: 0, inStock: 0, underMaint: 0, value: 0 };

      existing.total += 1;
      if (a.status === 'ALLOCATED') existing.allocated += 1;
      else if (a.status === 'IN_STOCK' || a.status === 'AVAILABLE') existing.inStock += 1;
      else if (a.status === 'UNDER_MAINTENANCE') existing.underMaint += 1;

      existing.value += a.value || 0;
      categoriesMap.set(cat, existing);
    });

    const list = Array.from(categoriesMap.entries()).map(([category, stats]) => ({
      category,
      ...stats,
    }));

    // Ensure default ERP categories exist if empty
    if (!categoriesMap.has('Mobile / Tablet')) {
      list.push({ category: 'Mobile / Tablet', total: 0, allocated: 0, inStock: 0, underMaint: 0, value: 0 });
    }
    if (!categoriesMap.has('Laptop / Workstation')) {
      list.push({ category: 'Laptop / Workstation', total: 0, allocated: 0, inStock: 0, underMaint: 0, value: 0 });
    }

    return list;
  }, [assets]);

  // Top Valuable Assets Ranking
  const topValuableAssets = useMemo(() => {
    const sorted = [...assets].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 4);
    return sorted.map((a) => {
      const pct = metrics.totalValue > 0 ? (((a.value || 0) / metrics.totalValue) * 100).toFixed(1) : '0';
      return {
        ...a,
        percentage: Number(pct),
      };
    });
  }, [assets, metrics.totalValue]);

  // Dynamic Recent Activity Log Feed
  const recentActivities = useMemo(() => {
    const feed: { id: string; title: string; subtitle: string; time: string; type: 'add' | 'maint' | 'return' | 'alloc' }[] = [];

    assets.slice(0, 4).forEach((a, idx) => {
      if (a.status === 'UNDER_MAINTENANCE') {
        feed.push({
          id: `maint-${a.id}`,
          title: '🔧 Maintenance initiated',
          subtitle: `${a.name} (${a.assetTag}) sent for repair`,
          time: '25 Aug 2026 • 10:15 AM',
          type: 'maint',
        });
      } else if (a.status === 'ALLOCATED') {
        const empName = a.currentEmployee ? `${a.currentEmployee.firstName} ${a.currentEmployee.lastName}` : 'Employee';
        feed.push({
          id: `alloc-${a.id}`,
          title: '👤 Asset allocated',
          subtitle: `${a.name} allocated to ${empName}`,
          time: '20 Aug 2026 • 02:20 PM',
          type: 'alloc',
        });
      } else {
        feed.push({
          id: `add-${a.id}`,
          title: '+ Asset added',
          subtitle: `${a.name} (${a.assetTag}) added to stock`,
          time: '25 Aug 2026 • 10:30 AM',
          type: 'add',
        });
      }
    });

    if (feed.length === 0) {
      feed.push({
        id: 'default-1',
        title: '+ Asset registered',
        subtitle: 'System initialized with active inventory records',
        time: 'Today',
        type: 'add',
      });
    }

    return feed;
  }, [assets]);

  return (
    <div className="space-y-6 text-xs">
      {/* ── TOP HEADER FILTERS & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-xs">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 px-3 text-xs gap-1.5 font-medium bg-background">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> 01 Aug 2026 - 25 Aug 2026
          </Badge>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          </Button>
        </div>

        <Button size="sm" className="h-8 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
          <Download className="h-3.5 w-3.5" /> Export Report
        </Button>
      </div>

      {/* ── 1. TOP EXECUTIVE STATS CARDS (4 CARDS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Value */}
        <Card className="shadow-2xs border-border/80 relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-muted-foreground text-[10.5px] font-semibold uppercase tracking-wider block">
                  Total Asset Register Value
                </span>
                <strong className="text-xl sm:text-2xl font-extrabold text-foreground mt-1 block">
                  ₹{metrics.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </strong>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  {metrics.totalAssets} Total Hardware Tags
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-between justify-center shrink-0">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" /> 12.5% vs last month
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Allocated Devices */}
        <Card className="shadow-2xs border-border/80 relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-muted-foreground text-[10.5px] font-semibold uppercase tracking-wider block">
                  Allocated Devices
                </span>
                <strong className="text-xl sm:text-2xl font-extrabold text-foreground mt-1 block">
                  {metrics.allocated} Items
                </strong>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">0% vs last month</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-between justify-center shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[10.5px] font-semibold text-muted-foreground">
              <Minus className="h-3.5 w-3.5" /> 0% vs last month
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Available Stock */}
        <Card className="shadow-2xs border-border/80 relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-muted-foreground text-[10.5px] font-semibold uppercase tracking-wider block">
                  Available Stock
                </span>
                <strong className="text-xl sm:text-2xl font-extrabold text-foreground mt-1 block">
                  {metrics.inStock} Items
                </strong>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">Ready for New Joiners</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-between justify-center shrink-0">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" /> 100% vs last month
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Under Maintenance */}
        <Card className="shadow-2xs border-border/80 relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-muted-foreground text-[10.5px] font-semibold uppercase tracking-wider block">
                  Under Maintenance
                </span>
                <strong className="text-xl sm:text-2xl font-extrabold text-foreground mt-1 block">
                  {metrics.underMaintenance} Devices
                </strong>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">Hardware service queue</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-between justify-center shrink-0">
                <Wrench className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600">
              <ArrowDownRight className="h-3.5 w-3.5" /> -100% vs last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. MIDDLE VISUAL ANALYTICS ROW (3 CARDS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visual Card 1: Asset Status Overview Donut */}
        <Card className="shadow-2xs border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Asset Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-col items-center justify-center py-4">
              {/* SVG Ring Donut */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted/30"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Available Ring (Emerald) */}
                  <path
                    className="text-emerald-500 transition-all duration-500 stroke-current"
                    strokeWidth="3.8"
                    strokeDasharray={metrics.totalAssets > 0 ? `${(metrics.inStock / metrics.totalAssets) * 100}, 100` : '100, 100'}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold text-foreground">{metrics.totalAssets}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Total Assets</span>
                </div>
              </div>

              {/* Status Breakdown Legend */}
              <div className="w-full space-y-1.5 mt-4 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Available (In Stock)
                  </span>
                  <strong className="font-semibold">{metrics.inStock} ({metrics.totalAssets > 0 ? Math.round((metrics.inStock / metrics.totalAssets) * 100) : 0}%)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span> Allocated
                  </span>
                  <strong className="font-semibold">{metrics.allocated} ({metrics.totalAssets > 0 ? Math.round((metrics.allocated / metrics.totalAssets) * 100) : 0}%)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Under Maintenance
                  </span>
                  <strong className="font-semibold">{metrics.underMaintenance} ({metrics.totalAssets > 0 ? Math.round((metrics.underMaintenance / metrics.totalAssets) * 100) : 0}%)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400"></span> Others
                  </span>
                  <strong className="font-semibold">{metrics.others} ({metrics.totalAssets > 0 ? Math.round((metrics.others / metrics.totalAssets) * 100) : 0}%)</strong>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Card 2: Asset Value Trend Line Graph */}
        <Card className="shadow-2xs border-border/80">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Asset Value Trend</CardTitle>
            <Select defaultValue="this-month">
              <SelectTrigger className="h-7 text-[11px] w-[110px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month" className="text-xs">This Month</SelectItem>
                <SelectItem value="last-quarter" className="text-xs">Last Quarter</SelectItem>
                <SelectItem value="this-year" className="text-xs">This Year</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-[200px] w-full flex flex-col justify-end pt-4">
              {/* Custom SVG Trend Curve */}
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 100 Q 50 80 100 70 T 200 40 T 300 20 L 300 120 L 0 120 Z"
                  fill="url(#trendGradient)"
                />
                <path
                  d="M 0 100 Q 50 80 100 70 T 200 40 T 300 20"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="300" cy="20" r="4" fill="#6366f1" />
              </svg>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2 border-t pt-1">
                <span>Jul 26</span>
                <span>Aug 02</span>
                <span>Aug 09</span>
                <span>Aug 16</span>
                <span>Aug 25</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Card 3: Assets by Category Donut */}
        <Card className="shadow-2xs border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Assets by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-col items-center justify-center py-4">
              {/* Category SVG Donut Ring */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted/30"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Purple Ring Segment */}
                  <path
                    className="text-purple-500 transition-all duration-500 stroke-current"
                    strokeWidth="3.8"
                    strokeDasharray="66.67, 100"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold text-foreground">{metrics.totalAssets}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Total</span>
                </div>
              </div>

              {/* Category Legend */}
              <div className="w-full space-y-1.5 mt-4 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500"></span> Mobile / Tablet
                  </span>
                  <strong className="font-semibold">1 (33.33%)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Laptop / Workstation
                  </span>
                  <strong className="font-semibold">2 (66.67%)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400"></span> Others
                  </span>
                  <strong className="font-semibold">0 (0%)</strong>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. BOTTOM ROW 1 (3 ANALYTICS CARDS GRID) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Asset Register by Category Table */}
        <Card className="shadow-2xs border-border/80 lg:col-span-1">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Asset Register by Category</CardTitle>
              <CardDescription className="text-[11px]">Dynamic breakdown of counts and values</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">Category</TableHead>
                  <TableHead className="text-[11px] text-center">Total</TableHead>
                  <TableHead className="text-[11px] text-center">Allocated</TableHead>
                  <TableHead className="text-[11px] text-center">In Stock</TableHead>
                  <TableHead className="text-[11px] text-right">Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorySummary.map((r) => (
                  <TableRow key={r.category} className="hover:bg-muted/40">
                    <TableCell className="text-[11px] font-semibold text-foreground">{r.category}</TableCell>
                    <TableCell className="text-[11px] text-center font-bold">{r.total}</TableCell>
                    <TableCell className="text-[11px] text-center text-blue-600 font-semibold">{r.allocated}</TableCell>
                    <TableCell className="text-[11px] text-center text-emerald-600 font-semibold">{r.inStock}</TableCell>
                    <TableCell className="text-[11px] text-right font-mono font-bold text-foreground">
                      ₹{r.value.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Summary Total Row */}
                <TableRow className="bg-muted/30 font-bold border-t-2">
                  <TableCell className="text-[11px] text-primary">Total</TableCell>
                  <TableCell className="text-[11px] text-center text-primary">{metrics.totalAssets}</TableCell>
                  <TableCell className="text-[11px] text-center text-blue-600">{metrics.allocated}</TableCell>
                  <TableCell className="text-[11px] text-center text-emerald-600">{metrics.inStock}</TableCell>
                  <TableCell className="text-[11px] text-right font-mono text-primary">
                    ₹{metrics.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Card 2: Top Assets by Value */}
        <Card className="shadow-2xs border-border/80">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Top Assets by Value</CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-4">
            {topValuableAssets.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 text-xs">No registered assets found.</p>
            ) : (
              topValuableAssets.map((a) => (
                <div key={a.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <strong className="text-foreground block font-semibold">{a.name}</strong>
                        <span className="text-[9.5px] text-muted-foreground font-mono">{a.assetTag}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <strong className="text-foreground block font-mono font-bold">
                        ₹{(a.value || 0).toLocaleString('en-IN')}
                      </strong>
                      <span className="text-[9.5px] text-muted-foreground font-semibold">{a.percentage}%</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(a.percentage, 5)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Card 3: Recent Asset Activities Feed */}
        <Card className="shadow-2xs border-border/80">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Asset Activities</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-[11px] text-indigo-600 font-semibold">
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-3">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-start gap-2.5 text-[11px] pb-2 border-b border-border/40 last:border-b-0">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  act.type === 'add'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : act.type === 'maint'
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-blue-500/10 text-blue-600'
                }`}>
                  {act.type === 'add' ? '+' : act.type === 'maint' ? '🔧' : '👤'}
                </div>
                <div className="flex-1">
                  <strong className="text-foreground block font-semibold">{act.title}</strong>
                  <span className="text-muted-foreground block text-[10.5px]">{act.subtitle}</span>
                  <span className="text-[9.5px] text-muted-foreground font-mono mt-0.5 block">{act.time}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── 4. BOTTOM ROW 2 (6 QUICK METRIC BADGES GRID) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1 */}
        <Card className="shadow-2xs p-3 border-border/80 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <span className="text-muted-foreground block text-[9.5px] font-semibold uppercase">Total Assets</span>
            <strong className="text-sm font-extrabold text-foreground">{metrics.totalAssets}</strong>
            <span className="text-[9px] text-emerald-600 font-semibold block">▲ 100% this month</span>
          </div>
        </Card>

        {/* Metric 2 */}
        <Card className="shadow-2xs p-3 border-border/80 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <span className="text-muted-foreground block text-[9.5px] font-semibold uppercase">Total Employees</span>
            <strong className="text-sm font-extrabold text-foreground">{totalEmployeesCount}</strong>
            <span className="text-[9px] text-emerald-600 font-semibold block">▲ 8.3% this month</span>
          </div>
        </Card>

        {/* Metric 3 */}
        <Card className="shadow-2xs p-3 border-border/80 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <span className="text-muted-foreground block text-[9.5px] font-semibold uppercase">Assets per Employee</span>
            <strong className="text-sm font-extrabold text-foreground">{metrics.assetsPerEmp}</strong>
            <span className="text-[9px] text-emerald-600 font-semibold block">▲ 85.7% this month</span>
          </div>
        </Card>

        {/* Metric 4 */}
        <Card className="shadow-2xs p-3 border-border/80 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <span className="text-muted-foreground block text-[9.5px] font-semibold uppercase">Avg Asset Value</span>
            <strong className="text-xs font-bold text-foreground">₹{metrics.avgValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
            <span className="text-[9px] text-emerald-600 font-semibold block">▲ 12.5% this month</span>
          </div>
        </Card>

        {/* Metric 5 */}
        <Card className="shadow-2xs p-3 border-border/80 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <span className="text-muted-foreground block text-[9.5px] font-semibold uppercase">Maintenance Cost</span>
            <strong className="text-xs font-bold text-foreground">₹{metrics.maintCost.toLocaleString('en-IN')}</strong>
            <span className="text-[9px] text-muted-foreground font-semibold block">- 0% this month</span>
          </div>
        </Card>

        {/* Metric 6 */}
        <Card className="shadow-2xs p-3 border-border/80 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <span className="text-muted-foreground block text-[9.5px] font-semibold uppercase">Warranty Assets</span>
            <strong className="text-sm font-extrabold text-foreground">{metrics.warrantyCount}</strong>
            <span className="text-[9px] text-muted-foreground font-semibold block">- 0% this month</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
