import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/context/CompanyContext';
import { subscriptionsApi, plansApi, type ModuleEntitlementItem, type PlanPackageItem } from '@/api/plansApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Lock,
  Calendar,
  Sparkles,
  ArrowUpRight,
  HardDrive,
  Users,
  Building,
  GraduationCap,
  ShieldCheck,
  RefreshCw,
  Plus,
  Zap,
  Info
} from 'lucide-react';

export const CompanySubscriptionTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeCompanyId, activeCompany, companies, setActiveCompanyId } = useCompany();

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');
  const [renewMonths, setRenewMonths] = useState<1 | 12>(12);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch subscription info for current active company
  const { data: subData, isLoading } = useQuery({
    queryKey: ['company-subscription', activeCompanyId],
    queryFn: () => (activeCompanyId ? subscriptionsApi.getCompanySubscription(activeCompanyId) : null),
    enabled: Boolean(activeCompanyId),
  });

  // Fetch all plans and add-ons for the upgrade/manage modal
  const { data: plansData } = useQuery({
    queryKey: ['plans', 'ALL'],
    queryFn: () => plansApi.list(),
  });

  const allPlans = plansData?.items || [];
  const availableAddons = allPlans.filter((p) => p.type === 'ADD_ON');
  const availablePlans = allPlans.filter((p) => p.type === 'STANDARD_PLAN' || p.type === 'CUSTOM_PACKAGE');

  const subscription = subData?.subscription;
  const currentPlan = subData?.plan;
  const usage = subData?.usage;
  const matrix = subData?.moduleEntitlementMatrix || [];

  const handleOpenManageModal = () => {
    if (subData?.activeAddonPackages) {
      setSelectedAddonIds(subData.activeAddonPackages.map((a) => a.id));
    }
    if (currentPlan) {
      setSelectedPlanId(currentPlan.id);
    }
    if (subscription) {
      setSelectedBillingCycle(subscription.billingCycle as any || 'ANNUAL');
    }
    setIsManageModalOpen(true);
  };

  const handleSaveAddons = async () => {
    if (!activeCompanyId) return;
    setIsUpdating(true);
    try {
      await subscriptionsApi.manageAddons(activeCompanyId, { addonIds: selectedAddonIds });
      toast.success('Active add-ons updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['company-subscription'] });
      setIsManageModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update add-ons');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePlan = async () => {
    if (!activeCompanyId || !selectedPlanId) return;
    setIsUpdating(true);
    try {
      await subscriptionsApi.changePlan(activeCompanyId, {
        planId: selectedPlanId,
        billingCycle: selectedBillingCycle,
      });
      toast.success('Company subscription plan updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['company-subscription'] });
      setIsManageModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change plan');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRenew = async () => {
    if (!activeCompanyId) return;
    setIsUpdating(true);
    try {
      await subscriptionsApi.renew(activeCompanyId, { durationMonths: renewMonths });
      toast.success(`Subscription renewed for ${renewMonths} month(s) successfully!`);
      queryClient.invalidateQueries({ queryKey: ['company-subscription'] });
      setIsManageModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to renew subscription');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-muted-foreground">
        Loading active company subscription & module entitlements...
      </div>
    );
  }

  const employeePercent = usage ? Math.min(100, Math.round((usage.employees.current / usage.employees.max) * 100)) : 0;
  const storagePercent = usage ? Math.min(100, Math.round((usage.storage.currentGb / usage.storage.maxGb) * 100)) : 0;
  const departmentsPercent = usage ? Math.min(100, Math.round((usage.departments.current / usage.departments.max) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Architectural Context Alert */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <Info className="h-4 w-4" />
          </div>
          <div className="text-xs space-y-1">
            <span className="font-bold text-foreground">Company Subscription & Active Entitlements</span>
            <p className="text-muted-foreground leading-relaxed">
              Shows what modules and capacity limits are currently active for{' '}
              <strong className="text-foreground">{activeCompany?.name || 'this company'}</strong> based on their purchased plan and add-ons.
            </p>
          </div>
        </div>

        {/* Company Switcher if multiple exist */}
        {companies.length > 1 && (
          <div className="shrink-0 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Company:</span>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs font-semibold"
              value={activeCompanyId}
              onChange={(e) => setActiveCompanyId(e.target.value)}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Subscription Card */}
      <div className="grid grid-cols-3 gap-4">
        {/* Active Plan Overview */}
        <Card className="col-span-2 shadow-2xs border-primary/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Current Plan</span>
                <CardTitle className="text-xl font-bold text-foreground mt-0.5">
                  {currentPlan?.name || 'Standard Plan'}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  {currentPlan?.description || 'Active Enterprise HCM SaaS Subscription'}
                </CardDescription>
              </div>

              <div className="text-right">
                <Badge variant="default" className="text-xs bg-emerald-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Active Subscription
                </Badge>
                <div className="mt-2 text-lg font-bold font-mono text-foreground">
                  ₹{subscription?.price?.toLocaleString() || 0}
                  <span className="text-xs font-normal text-muted-foreground"> / {subscription?.billingCycle?.toLowerCase()}</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-muted/40 border text-xs">
              <div>
                <span className="text-muted-foreground text-[11px]">Subscription Validity</span>
                <p className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  {subscription?.validUntil ? new Date(subscription.validUntil).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground text-[11px]">Days Remaining</span>
                <p className="font-semibold text-emerald-600 font-mono mt-0.5">
                  {subscription?.daysRemaining ?? 365} Days
                </p>
              </div>

              <div>
                <span className="text-muted-foreground text-[11px]">Active Add-ons</span>
                <p className="font-semibold text-foreground mt-0.5">
                  {subData?.activeAddonPackages?.length || 0} Modules
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                Auto-renewal is <strong className="text-foreground">{subscription?.autoRenew ? 'Enabled' : 'Disabled'}</strong>
              </span>
              <Button size="sm" onClick={handleOpenManageModal} className="gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> Manage Subscription & Add-ons
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Company Quick Profile */}
        <Card className="shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Subscribed Organization</CardTitle>
            <CardDescription className="text-xs">Primary tenant information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">Corporate Name</span>
              <p className="font-semibold text-foreground">{activeCompany?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-muted-foreground">Entity Code</span>
                <p className="font-mono font-medium text-foreground">{activeCompany?.code}</p>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground">Currency</span>
                <p className="font-mono font-medium text-foreground">{activeCompany?.currency || 'INR'}</p>
              </div>
            </div>
            <div className="pt-2 border-t text-[11px] text-muted-foreground">
              Module access is enforced globally across all users and roles of this company.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Usage Meters */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Resource Usage & Capacity Limits</CardTitle>
          <CardDescription className="text-xs">
            Real-time consumption vs plan maximums for {activeCompany?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            {/* Employees */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>Employees Enrolled</span>
                </div>
                <span className="font-mono font-semibold">
                  {usage?.employees.current} / {usage?.employees.max === 99999 ? 'Unlimited' : usage?.employees.max}
                </span>
              </div>
              <Progress value={employeePercent} className="h-2" />
              <p className="text-[11px] text-muted-foreground">{employeePercent}% of capacity utilized</p>
            </div>

            {/* Storage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <HardDrive className="h-3.5 w-3.5 text-primary" />
                  <span>Cloud Storage</span>
                </div>
                <span className="font-mono font-semibold">
                  {usage?.storage.currentGb} GB / {usage?.storage.maxGb} GB
                </span>
              </div>
              <Progress value={storagePercent} className="h-2" />
              <p className="text-[11px] text-muted-foreground">{storagePercent}% of cloud storage used</p>
            </div>

            {/* Departments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Building className="h-3.5 w-3.5 text-primary" />
                  <span>Configured Departments</span>
                </div>
                <span className="font-mono font-semibold">
                  {usage?.departments.current} / {usage?.departments.max}
                </span>
              </div>
              <Progress value={departmentsPercent} className="h-2" />
              <p className="text-[11px] text-muted-foreground">{departmentsPercent}% of limit utilized</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enabled & Locked Modules Section */}
      <div className="space-y-6">
        {/* 1. ENABLED MODULES */}
        <Card className="shadow-2xs border-emerald-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold">Enabled Modules</CardTitle>
                  <Badge variant="default" className="text-[10px] bg-emerald-600">
                    {matrix.filter((m) => m.isEnabled).length} Active
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Modules currently included in {activeCompany?.name}'s active subscription
                </CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenManageModal}
                className="gap-1.5 text-xs h-8"
              >
                <Plus className="h-3 w-3" /> Add Modules
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {matrix.filter((m) => m.isEnabled).map((mod: ModuleEntitlementItem) => (
                <div
                  key={mod.key}
                  className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-50/40 shadow-2xs space-y-1.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-semibold text-foreground">{mod.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{mod.category}</span>
                    </div>

                    <Badge variant="default" className="text-[9.5px] bg-emerald-600 shrink-0">
                      {mod.source === 'ADDON' ? 'Add-on' : 'Active'}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {mod.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 2. LOCKED MODULES */}
        {matrix.filter((m) => !m.isEnabled).length > 0 && (
          <Card className="shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-semibold">Locked Modules</CardTitle>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      {matrix.filter((m) => !m.isEnabled).length} Available for Upgrade
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    These ERP modules require an upgrade or add-on purchase to unlock
                  </CardDescription>
                </div>

                <Button
                  size="sm"
                  onClick={handleOpenManageModal}
                  className="gap-1.5 text-xs h-8"
                >
                  <Sparkles className="h-3 w-3" /> Upgrade All Modules
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {matrix.filter((m) => !m.isEnabled).map((mod: ModuleEntitlementItem) => (
                  <div
                    key={mod.key}
                    className="p-3 rounded-xl border border-border/60 bg-muted/20 opacity-80 hover:opacity-100 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs font-semibold text-foreground">{mod.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{mod.category}</span>
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1.5">
                        {mod.description}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-mono">₹{mod.defaultPricePerMonth}/mo</span>
                      <button
                        type="button"
                        onClick={handleOpenManageModal}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
                      >
                        Upgrade <ArrowUpRight className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Manage Subscription & Add-ons Modal */}
      <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b bg-muted/20">
            <DialogTitle className="text-base font-semibold">Manage Subscription</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add individual modules, upgrade plan tiers, or extend subscription validity for {activeCompany?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <Tabs defaultValue="addons" className="w-full">
              <TabsList className="mb-4 bg-muted/60">
                <TabsTrigger value="addons" className="text-xs">
                  Add Modules ({selectedAddonIds.length})
                </TabsTrigger>
                <TabsTrigger value="upgrade" className="text-xs">
                  Change Plan Tier
                </TabsTrigger>
                <TabsTrigger value="renew" className="text-xs">
                  Renew Subscription
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: ADD MODULES (ADD-ONS) */}
              <TabsContent value="addons" className="space-y-4 mt-0">
                <div className="text-xs text-muted-foreground pb-1">
                  Select modular add-ons to immediately activate them for {activeCompany?.name}.
                </div>

                <div className="space-y-2">
                  {availableAddons.map((addon) => {
                    const isSelected = selectedAddonIds.includes(addon.id);

                    return (
                      <div
                        key={addon.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAddonIds(selectedAddonIds.filter((id) => id !== addon.id));
                          } else {
                            setSelectedAddonIds([...selectedAddonIds, addon.id]);
                          }
                        }}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div>
                            <span className="text-xs font-semibold text-foreground">{addon.name}</span>
                            <p className="text-[11px] text-muted-foreground">{addon.description}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold font-mono text-emerald-600">
                            ₹{addon.price}/mo
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSaveAddons}
                    disabled={isUpdating}
                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isUpdating ? 'Saving...' : 'Apply Module Add-ons'}
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 2: UPGRADE / CHANGE PLAN TIER */}
              <TabsContent value="upgrade" className="space-y-4 mt-0">
                <div className="text-xs text-muted-foreground pb-1">
                  Choose an upgraded platform tier. The new limits and module entitlements will apply immediately.
                </div>

                <div className="space-y-2">
                  {availablePlans.map((plan) => {
                    const isCurrent = plan.id === currentPlan?.id;
                    const isSelected = plan.id === selectedPlanId;

                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : isCurrent
                            ? 'border-emerald-500/40 bg-emerald-50/20'
                            : 'border-border hover:bg-muted/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{plan.name}</span>
                            {isCurrent && (
                              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                                Current Plan
                              </Badge>
                            )}
                            {plan.badge && (
                              <Badge variant="default" className="text-[10px]">
                                {plan.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{plan.description}</p>
                          <span className="text-[10px] text-primary font-medium mt-1 inline-block">
                            Includes {Array.isArray(plan.includedModules) ? plan.includedModules.length : 0} of 25 Modules • Up to {plan.maxEmployees} Employees
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold font-mono text-emerald-600">
                            ₹{selectedBillingCycle === 'MONTHLY' ? plan.monthlyPrice : plan.annualPrice}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            / {selectedBillingCycle === 'MONTHLY' ? 'month' : 'year'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Billing Cycle:</span>
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      value={selectedBillingCycle}
                      onChange={(e) => setSelectedBillingCycle(e.target.value as any)}
                    >
                      <option value="ANNUAL">Annual (Best Value)</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleChangePlan}
                    disabled={isUpdating || selectedPlanId === currentPlan?.id}
                    className="gap-1.5 text-xs"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {isUpdating ? 'Updating...' : 'Confirm Plan Change'}
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 3: RENEW SUBSCRIPTION */}
              <TabsContent value="renew" className="space-y-4 mt-0">
                <div className="p-4 rounded-xl border bg-muted/30 space-y-3 text-xs">
                  <span className="font-semibold text-foreground">Extend Subscription Validity</span>
                  <p className="text-muted-foreground">
                    Current Expiry: <strong className="text-foreground">{subscription?.validUntil ? new Date(subscription.validUntil).toLocaleDateString() : 'N/A'}</strong>
                  </p>

                  <div className="pt-2 border-t space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Renew For:</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="renewDuration"
                          checked={renewMonths === 1}
                          onChange={() => setRenewMonths(1)}
                          className="text-primary"
                        />
                        <span>1 Month</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="renewDuration"
                          checked={renewMonths === 12}
                          onChange={() => setRenewMonths(12)}
                          className="text-primary"
                        />
                        <span>1 Year (Best Value)</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 text-muted-foreground">
                    New Valid Until: <strong className="text-emerald-600 font-mono">
                      {subscription?.validUntil
                        ? (() => {
                            const d = new Date(subscription.validUntil);
                            d.setMonth(d.getMonth() + renewMonths);
                            return d.toLocaleDateString();
                          })()
                        : 'N/A'}
                    </strong>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleRenew}
                    disabled={isUpdating}
                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {isUpdating ? 'Renewing...' : `Renew Subscription (${renewMonths === 1 ? '1 Month' : '1 Year'})`}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="px-6 py-3 border-t bg-muted/20">
            <Button variant="outline" size="sm" onClick={() => setIsManageModalOpen(false)} className="text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
