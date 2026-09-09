import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { plansApi, subscriptionsApi, type PlanPackageItem, type SubscriberItem } from '@/api/plansApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BuyerAccessModal } from './BuyerAccessModal';
import {
  Check,
  Lock,
  Copy,
  Power,
  Trash2,
  Users,
  HardDrive,
  Building,
  MapPin,
  GraduationCap,
  Key,
} from 'lucide-react';

interface PackageDetailsDrawerProps {
  planId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDuplicate: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export const PackageDetailsDrawer: React.FC<PackageDetailsDrawerProps> = ({
  planId,
  open,
  onOpenChange,
  onDuplicate,
  onToggleStatus,
  onDelete,
}) => {
  const [selectedAccessSubscriber, setSelectedAccessSubscriber] = useState<SubscriberItem | null>(null);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['plans', planId],
    queryFn: () => (planId ? plansApi.getById(planId) : null),
    enabled: Boolean(planId && open),
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ['plan-subscribers', planId],
    queryFn: () => (planId ? subscriptionsApi.getSubscribersForPlan(planId) : []),
    enabled: Boolean(planId && open),
  });

  const { data: moduleCatalog = [] } = useQuery({
    queryKey: ['plans', 'module-catalog'],
    queryFn: plansApi.getModuleCatalog,
    enabled: Boolean(open),
  });


  if (!planId) return null;

  const includedModules: string[] = Array.isArray(plan?.includedModules)
    ? (plan?.includedModules as string[])
    : [];

  const typeLabel =
    plan?.type === 'STANDARD_PLAN'
      ? 'Standard Plan'
      : plan?.type === 'CUSTOM_PACKAGE'
      ? 'Custom Package'
      : 'Add-on';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold">{plan?.name || 'Package Details'}</DialogTitle>
                  <Badge variant="outline" className="text-xs font-mono">
                    {plan?.code}
                  </Badge>
                  {plan?.badge && (
                    <Badge variant="default" className="text-[10px] bg-primary/90">
                      {plan.badge}
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {typeLabel} • {plan?.category || 'Core HR'} • Created {plan?.createdAt ? new Date(plan.createdAt).toLocaleDateString() : ''}
                </DialogDescription>
              </div>
            </div>

            <div className="text-right">
              <span className="text-base font-bold font-mono text-emerald-600">
                ₹{plan?.price?.toLocaleString() || 0}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium"> / {plan?.billingCycle?.toLowerCase()}</span>
              <div>
                <Badge
                  variant={plan?.status === 'ACTIVE' ? 'default' : 'secondary'}
                  className="text-[10px] mt-1"
                >
                  {plan?.status || 'Active'}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Tabs */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading package specifications...</div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mb-4 bg-muted/60">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="modules" className="text-xs">
                  Modules ({includedModules.length} / {moduleCatalog.length})
                </TabsTrigger>
                <TabsTrigger value="limits" className="text-xs">Usage Limits</TabsTrigger>
                <TabsTrigger value="companies" className="text-xs">
                  Subscribed Companies ({subscribers.length})
                </TabsTrigger>
              </TabsList>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-4 mt-0">
                {plan?.description && (
                  <p className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/30 border">
                    {plan.description}
                  </p>
                )}

                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl border bg-card text-center">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Package Type</span>
                    <p className="text-xs font-bold text-foreground mt-1">{typeLabel}</p>
                  </div>
                  <div className="p-3 rounded-xl border bg-card text-center">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Modules Access</span>
                    <p className="text-xs font-bold text-primary mt-1 font-mono">
                      {includedModules.length} / {moduleCatalog.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border bg-card text-center">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Employee Limit</span>
                    <p className="text-xs font-bold text-foreground mt-1 font-mono">
                      {plan?.maxEmployees === 99999 ? 'Unlimited' : plan?.maxEmployees || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border bg-card text-center">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">Storage Limit</span>
                    <p className="text-xs font-bold text-foreground mt-1 font-mono">
                      {plan?.maxStorageGb} GB
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-card space-y-2">
                  <span className="text-xs font-bold text-foreground">Commercial Pricing Options</span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">Monthly Billing:</span>
                      <span className="font-semibold font-mono">₹{plan?.monthlyPrice || plan?.price || 0} / month</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">Annual Billing:</span>
                      <span className="font-semibold font-mono text-emerald-600">₹{plan?.annualPrice || (plan?.price ? plan.price * 10 : 0)} / year</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* MODULES TAB */}
              <TabsContent value="modules" className="space-y-4 mt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b">
                  <span>Included Modules: <strong className="text-emerald-600">{includedModules.length}</strong></span>
                  <span>Locked Modules: <strong className="text-muted-foreground">{moduleCatalog.length - includedModules.length}</strong></span>
                </div>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {moduleCatalog.map((mod) => {
                    const isIncluded = includedModules.includes(mod.key);

                    return (
                      <div
                        key={mod.key}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                          isIncluded ? 'border-emerald-500/30 bg-emerald-50/40 text-foreground' : 'border-border/60 bg-muted/20 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isIncluded ? (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
                              <Check className="h-3 w-3" />
                            </div>
                          ) : (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0">
                              <Lock className="h-3 w-3" />
                            </div>
                          )}
                          <div>
                            <span className="font-semibold">{mod.name}</span>
                            <span className="text-[11px] text-muted-foreground ml-2">({mod.category})</span>
                          </div>
                        </div>

                        <Badge
                          variant={isIncluded ? 'default' : 'outline'}
                          className={`text-[10px] ${isIncluded ? 'bg-emerald-600' : 'text-muted-foreground'}`}
                        >
                          {isIncluded ? 'Included' : 'Locked'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* LIMITS TAB */}
              <TabsContent value="limits" className="space-y-3 mt-0">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border bg-card flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Max Employees</span>
                    </div>
                    <span className="font-mono font-bold text-sm">
                      {plan?.maxEmployees === 99999 ? 'Unlimited' : plan?.maxEmployees}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border bg-card flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HardDrive className="h-4 w-4 text-primary" />
                      <span>Cloud Storage</span>
                    </div>
                    <span className="font-mono font-bold text-sm">{plan?.maxStorageGb} GB</span>
                  </div>

                  <div className="p-3 rounded-xl border bg-card flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="h-4 w-4 text-primary" />
                      <span>Max Departments</span>
                    </div>
                    <span className="font-mono font-bold text-sm">{plan?.maxDepartments}</span>
                  </div>

                  <div className="p-3 rounded-xl border bg-card flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>Max Branch Locations</span>
                    </div>
                    <span className="font-mono font-bold text-sm">{plan?.maxLocations}</span>
                  </div>

                  <div className="p-3 rounded-xl border bg-card flex items-center justify-between col-span-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <span>Max LMS Active Learners</span>
                    </div>
                    <span className="font-mono font-bold text-sm">
                      {plan?.maxLmsLearners === 99999 ? 'Unlimited' : plan?.maxLmsLearners}
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* SUBSCRIBED COMPANIES TAB */}
              <TabsContent value="companies" className="space-y-3 mt-0">
                {subscribers.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    No corporate accounts are currently subscribed to this package.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subscribers.map((sub: SubscriberItem) => (
                      <div
                        key={sub.subscriptionId}
                        className="p-4 rounded-xl border bg-card text-xs space-y-3 shadow-xs"
                      >
                        <div className="flex items-center justify-between pb-2 border-b">
                          <div>
                            <span className="font-bold text-sm text-foreground">
                              {sub.companyName}
                            </span>
                            <span className="text-xs font-mono text-muted-foreground ml-2">
                              ({sub.companyCode})
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          >
                            ● Active
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[11px] text-muted-foreground block">Plan</span>
                            <p className="font-semibold text-foreground mt-0.5">
                              {sub.planName || plan?.name}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] text-muted-foreground block">Valid Until</span>
                            <p className="font-semibold text-foreground font-mono mt-0.5">
                              {new Date(sub.validUntil).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] text-muted-foreground block">Admin</span>
                            <p className="font-semibold font-mono text-foreground mt-0.5 truncate">
                              {sub.adminEmail}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] text-muted-foreground block">Role</span>
                            <p className="font-semibold text-foreground mt-0.5">
                              {sub.adminRole || 'COMPANY_ADMIN'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAccessSubscriber(sub)}
                            className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5 font-medium"
                          >
                            <Key className="h-3.5 w-3.5" />
                            View Access
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Buyer Access Modal */}
        <BuyerAccessModal
          subscriber={selectedAccessSubscriber}
          plan={plan}
          open={Boolean(selectedAccessSubscriber)}
          onOpenChange={(openState) => {
            if (!openState) setSelectedAccessSubscriber(null);
          }}
        />

        {/* Footer Actions */}

        <DialogFooter className="px-6 py-3 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => plan?.id && onDuplicate(plan.id)}
              className="gap-1.5 text-xs"
            >
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => plan?.id && onToggleStatus(plan.id)}
              className="gap-1.5 text-xs"
            >
              <Power className="h-3.5 w-3.5" />
              {plan?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => plan?.id && onDelete(plan.id)}
              className="gap-1.5 text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
