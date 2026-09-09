import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { plansApi, type PlanPackageItem } from '@/api/plansApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { CreatePackageWizardModal } from './CreatePackageWizardModal';
import { PackageDetailsDrawer } from './PackageDetailsDrawer';
import { AddSubscriberModal } from './AddSubscriberModal';
import { ViewSubscribersModal } from './ViewSubscribersModal';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Layers,
  Sparkles,
  Zap,
  MoreVertical,
  Eye,
  Copy,
  Power,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Package,
  Info,
  Users,
  UserPlus,
  DollarSign
} from 'lucide-react';

export const PlansPackagesTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Specifications Drawer
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Add Subscriber Modal
  const [targetPlanForSubscriber, setTargetPlanForSubscriber] = useState<PlanPackageItem | null>(null);
  const [isAddSubscriberOpen, setIsAddSubscriberOpen] = useState(false);

  // View Subscribers Modal
  const [targetPlanForViewSubscribers, setTargetPlanForViewSubscribers] = useState<PlanPackageItem | null>(null);
  const [isViewSubscribersOpen, setIsViewSubscribersOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['plans', filterType, search],
    queryFn: () => plansApi.list({
      type: filterType === 'ALL' ? undefined : filterType,
      search: search || undefined,
    }),
  });

  const plans = data?.items || [];
  const counts = data?.counts || {
    total: 0,
    totalPlansAndPackages: 0,
    plans: 0,
    activePlans: 0,
    customPackages: 0,
    addons: 0,
    activeSubscribers: 0,
    monthlyRevenue: 0,
    totalModules: 25,
  };

  const handleDuplicate = async (id: string) => {
    try {
      await plansApi.duplicate(id);
      toast.success('Package duplicated successfully as draft');
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to duplicate package');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await plansApi.toggleStatus(id);
      toast.success('Package status updated');
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
      return;
    }
    try {
      await plansApi.delete(id);
      toast.success('Package deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setIsDrawerOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete package');
    }
  };

  const openAddSubscriber = (pkg: PlanPackageItem) => {
    setTargetPlanForSubscriber(pkg);
    setIsAddSubscriberOpen(true);
  };

  const openViewSubscribers = (pkg: PlanPackageItem) => {
    setTargetPlanForViewSubscribers(pkg);
    setIsViewSubscribersOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Architectural Context Alert */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          <Info className="h-4 w-4" />
        </div>
        <div className="text-xs space-y-1">
          <span className="font-bold text-foreground">Commercial Package & Module Entitlement Layer</span>
          <p className="text-muted-foreground leading-relaxed">
            <strong>Plans & Packages</strong> controls commercial entitlements (<em>"What ERP modules and capacity limits does the company own?"</em>),
            while <strong>Roles & Permissions</strong> controls role-level access (<em>"What actions can a specific user perform inside enabled modules?"</em>).
          </p>
        </div>
      </div>

      {/* Top 4 Metrics Row (Standard Commercial Metrics) */}
      <div className="grid grid-cols-4 gap-4">
        {/* Total Plans & Packages */}
        <div className="p-4 rounded-xl border bg-card shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Plans & Packages</span>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono mt-2">
            {counts.totalPlansAndPackages || counts.total}
          </div>
          <span className="text-[11px] text-muted-foreground">Standard plans, custom bundles & add-ons</span>
        </div>

        {/* Active Plans */}
        <div className="p-4 rounded-xl border bg-card shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Plans</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">
            {counts.activePlans || 4}
          </div>
          <span className="text-[11px] text-muted-foreground">Available for immediate subscription</span>
        </div>

        {/* Active Subscribers */}
        <div className="p-4 rounded-xl border bg-card shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Subscribers</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-primary mt-2">
            {counts.activeSubscribers || 0}
          </div>
          <span className="text-[11px] text-muted-foreground">Corporate tenant subscriptions active</span>
        </div>

        {/* Monthly Revenue */}
        <div className="p-4 rounded-xl border bg-card shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Monthly Recurring Revenue</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600 mt-2">
            ₹{(counts.monthlyRevenue || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground">Across all active subscribers</span>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Plans & Packages Catalog</CardTitle>
            <CardDescription className="text-xs">
              Manage plans, packages, add-ons, modules, usage limits and corporate subscribers.
            </CardDescription>
          </div>
          <Button onClick={() => setIsWizardOpen(true)} size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Create Package
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
              <Button
                variant={filterType === 'ALL' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-3"
                onClick={() => setFilterType('ALL')}
              >
                All ({counts.total})
              </Button>
              <Button
                variant={filterType === 'STANDARD_PLAN' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-3"
                onClick={() => setFilterType('STANDARD_PLAN')}
              >
                Standard Plans ({counts.plans})
              </Button>
              <Button
                variant={filterType === 'CUSTOM_PACKAGE' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-3"
                onClick={() => setFilterType('CUSTOM_PACKAGE')}
              >
                Custom Packages ({counts.customPackages})
              </Button>
              <Button
                variant={filterType === 'ADD_ON' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-3"
                onClick={() => setFilterType('ADD_ON')}
              >
                Add-ons ({counts.addons})
              </Button>
            </div>

            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search plans & packages..."
                className="h-8 pl-8 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-semibold">Package / Plan Name</TableHead>
                  <TableHead className="text-xs font-semibold">Commercial Type</TableHead>
                  <TableHead className="text-xs font-semibold">Modules Entitlement</TableHead>
                  <TableHead className="text-xs font-semibold">Commercial Price</TableHead>
                  <TableHead className="text-xs font-semibold">Subscribers</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      Loading package catalog from database...
                    </TableCell>
                  </TableRow>
                ) : plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      No plans or packages matching the selected filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((pkg) => {
                    const incModules: string[] = Array.isArray(pkg.includedModules)
                      ? (pkg.includedModules as string[])
                      : [];

                    const typeBadgeVariant =
                      pkg.type === 'STANDARD_PLAN'
                        ? 'default'
                        : pkg.type === 'CUSTOM_PACKAGE'
                        ? 'secondary'
                        : 'outline';

                    const typeText =
                      pkg.type === 'STANDARD_PLAN'
                        ? 'Standard Plan'
                        : pkg.type === 'CUSTOM_PACKAGE'
                        ? 'Custom Package'
                        : 'Add-on';

                    const subscriberCount = pkg._count?.subscriptions || 0;

                    return (
                      <TableRow key={pkg.id} className="hover:bg-muted/20">
                        <TableCell className="font-semibold text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">{pkg.name}</span>
                            {pkg.badge && (
                              <Badge variant="outline" className="text-[9.5px] font-medium text-primary border-primary/30">
                                {pkg.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{pkg.code}</p>
                        </TableCell>

                        <TableCell className="text-xs">
                          <Badge variant={typeBadgeVariant} className="text-[10px]">
                            {typeText}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs font-mono">
                          <span className="font-semibold text-primary">{incModules.length}</span>
                          <span className="text-muted-foreground"> / {counts.totalModules} Modules</span>
                        </TableCell>

                        <TableCell className="text-xs font-mono">
                          <span className="font-semibold text-emerald-600">₹{pkg.price.toLocaleString()}</span>
                          <span className="text-muted-foreground text-[11px]"> / {pkg.billingCycle === 'MONTHLY' ? 'mo' : pkg.billingCycle.toLowerCase()}</span>
                        </TableCell>

                        {/* Clickable Subscribers column */}
                        <TableCell className="text-xs font-mono">
                          <button
                            type="button"
                            onClick={() => openViewSubscribers(pkg)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="Click to view subscribed companies"
                          >
                            <Users className="h-3.5 w-3.5" />
                            <span>
                              {subscriberCount} {subscriberCount === 1 ? 'Company' : 'Companies'}
                            </span>
                          </button>
                        </TableCell>

                        <TableCell className="text-xs">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                              pkg.status === 'ACTIVE'
                                ? 'text-emerald-600'
                                : pkg.status === 'DRAFT'
                                ? 'text-amber-600'
                                : 'text-muted-foreground'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                pkg.status === 'ACTIVE'
                                  ? 'bg-emerald-600'
                                  : pkg.status === 'DRAFT'
                                  ? 'bg-amber-600'
                                  : 'bg-muted-foreground'
                              }`}
                            />
                            {pkg.status === 'ACTIVE' ? 'Active' : pkg.status === 'DRAFT' ? 'Draft' : 'Inactive'}
                          </span>
                        </TableCell>

                        <TableCell className="text-xs text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs min-w-44">
                              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">
                                Package Actions
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPlanId(pkg.id);
                                  setIsDrawerOpen(true);
                                }}
                                className="gap-2 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" /> View Specifications
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openViewSubscribers(pkg)}
                                className="gap-2 cursor-pointer font-medium text-primary"
                              >
                                <Users className="h-3.5 w-3.5" /> View Subscribers
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openAddSubscriber(pkg)}
                                className="gap-2 cursor-pointer font-medium text-emerald-600"
                              >
                                <UserPlus className="h-3.5 w-3.5" /> Add Subscriber
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDuplicate(pkg.id)}
                                className="gap-2 cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5" /> Duplicate Package
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(pkg.id)}
                                className="gap-2 cursor-pointer"
                              >
                                <Power className="h-3.5 w-3.5" />
                                {pkg.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(pkg.id)}
                                className="gap-2 text-destructive cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 1. Create Wizard Modal */}
      <CreatePackageWizardModal
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['plans'] })}
      />

      {/* 2. Package Details Drawer */}
      <PackageDetailsDrawer
        planId={selectedPlanId}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onDuplicate={handleDuplicate}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />

      {/* 3. Add Subscriber Modal */}
      <AddSubscriberModal
        plan={targetPlanForSubscriber}
        open={isAddSubscriberOpen}
        onOpenChange={setIsAddSubscriberOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['plans'] });
          queryClient.invalidateQueries({ queryKey: ['company-subscription'] });
          queryClient.invalidateQueries({ queryKey: ['plan-subscribers'] });
        }}
      />

      {/* 4. View Subscribers Modal */}
      <ViewSubscribersModal
        plan={targetPlanForViewSubscribers}
        open={isViewSubscribersOpen}
        onOpenChange={setIsViewSubscribersOpen}
        onOpenAddSubscriber={(p) => openAddSubscriber(p)}
      />
    </div>
  );
};
