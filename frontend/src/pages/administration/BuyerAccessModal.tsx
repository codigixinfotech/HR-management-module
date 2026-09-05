import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi, plansApi, type PlanPackageItem, type SubscriberItem } from '@/api/plansApi';
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
import { toast } from 'sonner';
import {
  Key,
  CheckCircle2,
  ShieldCheck,
  Send,
  Building,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface BuyerAccessModalProps {
  subscriber: SubscriberItem | null;
  plan: PlanPackageItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BuyerAccessModal: React.FC<BuyerAccessModalProps> = ({
  subscriber,
  plan,
  open,
  onOpenChange,
}) => {
  const [isResending, setIsResending] = useState(false);
  const [currentSubscriber, setCurrentSubscriber] = useState<SubscriberItem | null>(subscriber);

  React.useEffect(() => {
    setCurrentSubscriber(subscriber);
  }, [subscriber]);

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

  if (!currentSubscriber) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  const handleResendInvitation = async () => {
    setIsResending(true);
    try {
      const res = await subscriptionsApi.resendInvitation({
        companyId: currentSubscriber.companyId,
        email: currentSubscriber.adminEmail,
      });
      toast.success(res.message || `Invitation re-dispatched to ${currentSubscriber.adminEmail}`);
      if (res.invitationUrl) {
        setCurrentSubscriber({
          ...currentSubscriber,
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

  const effectiveModules = currentSubscriber.includedModules || [];
  const effectiveSet = new Set(effectiveModules);

  const purchasedModulesList = moduleCatalog.filter((m) => effectiveSet.has(m.key));
  const lockedModulesList = moduleCatalog.filter((m) => !effectiveSet.has(m.key));

  const invitationUrl = currentSubscriber.invitationUrl
    ? `${window.location.origin}${currentSubscriber.invitationUrl}`
    : `${window.location.origin}/auth/set-password?token=inv_${currentSubscriber.companyId}&email=${encodeURIComponent(
        currentSubscriber.adminEmail
      )}`;

  const loginUrl = `${window.location.origin}/login`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Buyer Access — {currentSubscriber.companyName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Purchased package specifications and provisioned ERP credentials
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* 1. COMPANY & SUBSCRIPTION OVERVIEW */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border bg-muted/30 text-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Company
              </span>
              <p className="font-semibold text-foreground text-sm mt-0.5">
                {currentSubscriber.companyName}
              </p>
              <span className="text-[11px] font-mono text-muted-foreground">
                Code: {currentSubscriber.companyCode} • {currentSubscriber.city || 'Corporate HQ'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Subscription
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-foreground text-sm">
                  {currentSubscriber.planName || 'Standard Package'}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                >
                  ● Active
                </Badge>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground block">
                Valid Until:{' '}
                {new Date(currentSubscriber.validUntil).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* 2. PURCHASED MODULES */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Purchased Modules
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              >
                {effectiveModules.length} / 25 Modules
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {purchasedModulesList.length > 0
                ? purchasedModulesList.map((mod) => (
                    <div
                      key={mod.key}
                      className="flex items-center gap-2 p-2 rounded-lg border bg-background text-xs border-emerald-500/30"
                    >
                      <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                      <span className="font-medium text-foreground truncate">{mod.name}</span>
                    </div>
                  ))
                : effectiveModules.map((modKey: string) => {
                    const displayName =
                      moduleNameMap.get(modKey) ||
                      modKey
                        .split('-')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ');

                    return (
                      <div
                        key={modKey}
                        className="flex items-center gap-2 p-2 rounded-lg border bg-background text-xs border-emerald-500/30"
                      >
                        <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span className="font-medium text-foreground truncate">{displayName}</span>
                      </div>
                    );
                  })}
            </div>
          </div>

          {/* 3. LOCKED MODULES */}
          {lockedModulesList.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Locked Modules
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                  {lockedModulesList.length} Locked
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {lockedModulesList.map((mod) => (
                  <div
                    key={mod.key}
                    className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20 text-xs opacity-75"
                  >
                    <span className="text-xs">🔒</span>
                    <span className="font-medium text-muted-foreground truncate">{mod.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. COMPANY ADMIN ACCESS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Company Admin Access
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                Role: {currentSubscriber.adminRole || 'COMPANY_ADMIN'}
              </Badge>
            </div>

            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-muted-foreground text-[11px]">Primary Admin Email</span>
                <span className="font-semibold font-mono text-foreground">
                  {currentSubscriber.adminEmail}
                </span>
              </div>

              {/* Single ERP Login URL */}
              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px] font-semibold">ERP Login</span>
                <div className="flex items-center gap-2">
                  <Input readOnly value={loginUrl} className="h-8 text-[11px] font-mono bg-background" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(loginUrl, 'ERP Login URL')}
                    className="h-8 px-2.5 text-xs shrink-0 gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
              </div>

              {/* Invitation Link */}
              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px] font-semibold">
                  First-Time Set Password Invitation
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={invitationUrl}
                    className="h-8 text-[11px] font-mono bg-background"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(invitationUrl, 'Invitation Link')}
                    className="h-8 px-2.5 text-xs shrink-0 gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground">Invitation Status:</span>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium"
                >
                  ● {currentSubscriber.invitationStatus === 'ACTIVATED' ? 'Activated' : 'Dispatched'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isResending}
              onClick={handleResendInvitation}
              className="gap-1.5 text-xs"
            >
              <Send className="h-3.5 w-3.5 text-primary" />
              {isResending ? 'Resending...' : 'Resend Invitation'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(loginUrl, 'Login URL')}
              className="gap-1.5 text-xs"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Login Link
            </Button>
          </div>

          <Button variant="default" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
