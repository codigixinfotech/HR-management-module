import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { subscriptionsApi, plansApi, type PlanPackageItem, type SubscriberItem } from '@/api/plansApi';
import { useCompany } from '@/context/CompanyContext';
import { BuyerAccessModal } from './BuyerAccessModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  ExternalLink,
  Calendar,
  Sparkles,
  RefreshCw,
  Copy,
  Key,
  CheckCircle2,
  ShieldCheck,
  Send,
  Building,
  Check,
  Lock,
} from 'lucide-react';

interface ViewSubscribersModalProps {
  plan: PlanPackageItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenAddSubscriber: (plan: PlanPackageItem) => void;
}

export const ViewSubscribersModal: React.FC<ViewSubscribersModalProps> = ({
  plan,
  open,
  onOpenChange,
  onOpenAddSubscriber,
}) => {
  const navigate = useNavigate();
  const { setActiveCompanyId } = useCompany();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [billingFilter, setBillingFilter] = useState('ALL');

  // Selected subscriber for "Buyer Access" details dialog
  const [selectedAccessSubscriber, setSelectedAccessSubscriber] = useState<SubscriberItem | null>(null);
  const [isResending, setIsResending] = useState(false);

  // Load subscribers for plan
  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ['plan-subscribers', plan?.id],
    queryFn: () => (plan?.id ? subscriptionsApi.getSubscribersForPlan(plan.id) : []),
    enabled: Boolean(plan?.id && open),
  });

  // Load ERP module catalog for module name resolution
  const { data: moduleCatalog = [] } = useQuery({
    queryKey: ['module-catalog'],
    queryFn: plansApi.getModuleCatalog,
    enabled: Boolean(open),
  });

  const moduleNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const mod of moduleCatalog) {
      map.set(mod.key, mod.name);
    }
    return map;
  }, [moduleCatalog]);

  if (!plan) return null;

  const filteredSubscribers = subscribers.filter((sub: SubscriberItem) => {
    const matchesSearch =
      sub.companyName.toLowerCase().includes(search.toLowerCase()) ||
      sub.companyCode.toLowerCase().includes(search.toLowerCase()) ||
      sub.adminEmail.toLowerCase().includes(search.toLowerCase()) ||
      sub.industry.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    const matchesBilling = billingFilter === 'ALL' || sub.billingCycle === billingFilter;
    return matchesSearch && matchesStatus && matchesBilling;
  });

  const handleGoToSubscription = (companyId: string) => {
    setActiveCompanyId(companyId);
    onOpenChange(false);
    navigate(`/administration/subscription?companyId=${companyId}`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  const handleResendInvitation = async (subscriber: SubscriberItem) => {
    setIsResending(true);
    try {
      const res = await subscriptionsApi.resendInvitation({
        companyId: subscriber.companyId,
        email: subscriber.adminEmail,
      });
      toast.success(res.message || `Invitation re-dispatched to ${subscriber.adminEmail}`);
      if (res.invitationUrl) {
        setSelectedAccessSubscriber({
          ...subscriber,
          invitationUrl: res.invitationUrl,
          invitationStatus: 'DISPATCHED',
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to resend invitation email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[88vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold">
                    {plan.name} — Subscribers
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Companies subscribed to this plan
                  </DialogDescription>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onOpenAddSubscriber(plan);
                }}
                className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> Add Subscriber
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search company, code, or email..."
                  className="h-8 pl-8 text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Status:</span>
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="TRIAL">Trial</option>
                  <option value="EXPIRED">Expired</option>
                </select>

                <span className="text-muted-foreground ml-2">Billing:</span>
                <select
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  value={billingFilter}
                  onChange={(e) => setBillingFilter(e.target.value)}
                >
                  <option value="ALL">All Billing</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>
            </div>

            {/* Subscribers Table */}
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-semibold">Company</TableHead>
                    <TableHead className="text-xs font-semibold">Plan</TableHead>
                    <TableHead className="text-xs font-semibold">Modules</TableHead>
                    <TableHead className="text-xs font-semibold">Admin</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                        Loading subscriber accounts...
                      </TableCell>
                    </TableRow>
                  ) : filteredSubscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                        No corporate accounts are currently subscribed to this package.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscribers.map((sub) => {
                      const modCount = sub.includedModules?.length ?? 0;

                      return (
                        <TableRow key={sub.subscriptionId} className="hover:bg-muted/20">
                          {/* Company */}
                          <TableCell className="text-xs">
                            <div className="font-semibold text-foreground">{sub.companyName}</div>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {sub.companyCode}
                            </span>
                          </TableCell>

                          {/* Plan */}
                          <TableCell className="text-xs">
                            <span className="font-medium text-foreground">{sub.planName}</span>
                            <span className="text-[10px] text-muted-foreground block font-mono">
                              ₹{sub.price?.toLocaleString()} / {sub.billingCycle === 'MONTHLY' ? 'Mo' : 'Yr'}
                            </span>
                          </TableCell>

                          {/* Modules */}
                          <TableCell className="text-xs font-mono">
                            <Badge variant="outline" className="bg-muted/40 text-[11px] font-mono">
                              {modCount} / 25
                            </Badge>
                          </TableCell>

                          {/* Admin */}
                          <TableCell className="text-xs">
                            <span className="font-mono text-muted-foreground truncate max-w-[200px] block">
                              {sub.adminEmail}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              Role: {sub.adminRole || 'COMPANY_ADMIN'}
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-xs">
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              {sub.status === 'ACTIVE' ? 'Active' : sub.status}
                            </span>
                            {sub.isAddon && (
                              <span className="text-[10px] text-muted-foreground block">(Via Add-on)</span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-xs text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedAccessSubscriber(sub)}
                                className="h-7 px-2.5 text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1"
                              >
                                <Key className="h-3 w-3" />
                                View Access
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="text-xs">
                                  <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">
                                    Subscriber Actions
                                  </DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => setSelectedAccessSubscriber(sub)}
                                    className="gap-2 cursor-pointer font-semibold text-primary"
                                  >
                                    <Key className="h-3.5 w-3.5" /> View Buyer Access
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleGoToSubscription(sub.companyId)}
                                    className="gap-2 cursor-pointer"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" /> View Company Subscription
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleGoToSubscription(sub.companyId)}
                                    className="gap-2 cursor-pointer"
                                  >
                                    <Sparkles className="h-3.5 w-3.5" /> Manage Modules & Add-ons
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleGoToSubscription(sub.companyId)}
                                    className="gap-2 cursor-pointer"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" /> Renew Subscription
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="px-6 py-3 border-t bg-muted/20">
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

      {/* ================= BUYER ACCESS DETAILS MODAL ================= */}
      <BuyerAccessModal
        subscriber={selectedAccessSubscriber}
        plan={plan}
        open={Boolean(selectedAccessSubscriber)}
        onOpenChange={(openState) => {
          if (!openState) setSelectedAccessSubscriber(null);
        }}
      />
    </>

  );
};
