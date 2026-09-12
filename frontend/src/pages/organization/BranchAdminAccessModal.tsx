import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { branchesApi, type BranchAdminAccess } from '@/api/organization';
import type { Branch } from '@/api/types';
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
  ShieldCheck,
  Building2,
  Copy,
  Send,
  GitFork,
  CheckCircle2,
  Lock,
  Mail,
  Check,
  RefreshCw,
} from 'lucide-react';

interface BranchAdminAccessModalProps {
  branch: Branch | null;
  companyName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BranchAdminAccessModal: React.FC<BranchAdminAccessModalProps> = ({
  branch,
  companyName,
  open,
  onOpenChange,
}) => {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');

  const {
    data: adminAccess,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['branch-admin-access', branch?.id],
    queryFn: () => (branch?.id ? branchesApi.getAdminAccess(branch.id) : null),
    enabled: Boolean(open && branch?.id),
  });

  useEffect(() => {
    if (adminAccess?.adminEmail) {
      setEmailInput(adminAccess.adminEmail);
    } else if (branch?.email) {
      setEmailInput(branch.email);
    }
  }, [adminAccess?.adminEmail, branch?.email]);

  const saveEmailMutation = useMutation({
    mutationFn: (newEmail: string) => {
      if (!branch) throw new Error('Branch not found');
      return branchesApi.updateAdminEmail(branch.id, newEmail);
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Branch Admin email updated & new invitation link generated!');
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update email');
    },
  });

  const resendMutation = useMutation({
    mutationFn: (emailToUse?: string) => {
      if (!branch) throw new Error('Branch not found');
      return branchesApi.resendInvitation(branch.id, emailToUse);
    },
    onSuccess: (data) => {
      toast.success(data.message || `Invitation link dispatched to ${data.adminEmail || emailInput}`);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to send invitation');
    },
  });

  if (!branch) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedLabel(null), 2500);
  };

  const handleSaveEmail = () => {
    if (!emailInput || !emailInput.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    saveEmailMutation.mutate(emailInput);
  };

  const isEmailModified =
    emailInput.trim().toLowerCase() !== (adminAccess?.adminEmail || '').trim().toLowerCase();

  const origin = window.location.origin;
  const loginUrl = `${origin}/login`;
  const invitationUrl = adminAccess?.invitationUrl
    ? (adminAccess.invitationUrl.startsWith('http')
        ? adminAccess.invitationUrl
        : `${origin}${adminAccess.invitationUrl}`)
    : `${origin}/auth/set-password?token=inv_${branch.id}`;

  const isActivated = adminAccess?.invitationStatus === 'ACTIVATED';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-indigo-500/20">
        {/* HEADER */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-indigo-50/80 via-background to-violet-50/50 dark:from-indigo-950/20 dark:via-background dark:to-violet-950/10">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/20 shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold tracking-tight">
                    BRANCH ADMIN ACCESS
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Isolated operational privileges and invitation credentials for this facility
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="font-mono text-[11px] px-2.5 py-1 bg-indigo-500/10 text-indigo-600 border-indigo-500/30 font-semibold"
            >
              Role: BRANCH_ADMIN
            </Badge>
          </div>
        </DialogHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* 1. CREDENTIALS & INVITATION CARD */}
          <div className="p-4 rounded-xl border bg-muted/20 dark:bg-muted/10 space-y-4 border-border/80">
            {/* Primary Admin Email (Changeable & Savable) */}
            <div className="space-y-2 pb-3.5 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Primary Branch Admin Email
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-2 py-0.5 font-medium ${
                    isActivated
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}
                >
                  ● {isActivated ? 'Activated' : 'Invitation Pending'}
                </Badge>
              </div>

              {/* Editable Email Input with Instant Save & Update Link */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter branch admin email (e.g. admin@branch.com)"
                    className={`h-9 text-xs font-mono bg-background transition-all ${
                      isEmailModified
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'border-input'
                    }`}
                  />
                  {isEmailModified && (
                    <span className="absolute right-2.5 top-2.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="default"
                  disabled={saveEmailMutation.isPending || !emailInput || !isEmailModified}
                  onClick={handleSaveEmail}
                  className="h-9 px-3.5 text-xs shrink-0 gap-1.5 font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  {saveEmailMutation.isPending ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Save Email
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between text-[10.5px] text-muted-foreground pt-0.5">
                <span>
                  {isEmailModified ? (
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      Email changed. Click <strong>Save Email</strong> to update this branch and regenerate the invitation.
                    </span>
                  ) : (
                    'You can change this email at any time to reassign the branch admin.'
                  )}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Saved for: {branch.name}
                </span>
              </div>
            </div>

            {/* ERP Login URL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  ERP Login
                </span>
                <span className="text-[10px] text-muted-foreground">Main Application Portal</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={loginUrl}
                  className="h-8 text-xs font-mono bg-background shadow-none select-all"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(loginUrl, 'ERP Login URL')}
                  className="h-8 px-3 text-xs shrink-0 gap-1.5 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600"
                >
                  <Copy className="h-3 w-3" />
                  {copiedLabel === 'ERP Login URL' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>

            {/* First-Time Set Password Invitation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  First-Time Set Password Invitation
                </span>
                <span className="text-[10px] text-muted-foreground">Activation Token Link</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={invitationUrl}
                  className="h-8 text-xs font-mono bg-background shadow-none select-all truncate"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(invitationUrl, 'First-Time Invitation Link')}
                  className="h-8 px-3 text-xs shrink-0 gap-1.5 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600"
                >
                  <Copy className="h-3 w-3" />
                  {copiedLabel === 'First-Time Invitation Link' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>

          {/* 2. BRANCH & COMPANY CONTEXT */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border bg-muted/30 dark:bg-muted/20 text-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Branch
              </span>
              <p className="font-bold text-foreground text-sm mt-0.5 flex items-center gap-1.5">
                <GitFork className="h-3.5 w-3.5 text-indigo-500" />
                {branch.name}
              </p>
              <span className="text-[11px] font-mono text-muted-foreground block mt-0.5">
                Code: {branch.code} • {branch.city || 'Facility HQ'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Company
              </span>
              <p className="font-bold text-foreground text-sm mt-0.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                {adminAccess?.companyName || companyName || 'Company HQ'}
              </p>
              <span className="text-[11px] font-mono text-muted-foreground block mt-0.5">
                Entity Code: {adminAccess?.companyCode || 'CORP'}
              </span>
            </div>
          </div>

          {/* 3. ACCESS SCOPE & PERMISSIONS */}
          <div className="p-4 rounded-xl border bg-gradient-to-br from-indigo-50/40 via-background to-violet-50/20 dark:from-indigo-950/20 dark:to-violet-950/10 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Access Scope
              </span>
              <Badge
                variant="outline"
                className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 text-[11px] font-semibold"
              >
                This Branch Only
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-background text-[11px] text-foreground border-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Own Branch Employees</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-background text-[11px] text-foreground border-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Own Branch Departments</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-background text-[11px] text-foreground border-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Own Branch Attendance & Leave</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-background text-[11px] text-foreground border-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Own Branch Payroll & Payslips</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-background text-[11px] text-foreground border-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Own Branch Recruitment & Requisitions</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-background text-[11px] text-foreground border-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Own Branch Organization Reports</span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-border/60 flex items-center gap-2 text-[10px] text-muted-foreground">
              <Lock className="h-3 w-3 text-amber-500 shrink-0" />
              <span>
                Backend strictly prevents viewing or modifying other branch data or changing company context.
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="px-6 py-3.5 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={resendMutation.isPending}
              onClick={() => resendMutation.mutate(emailInput)}
              className="gap-1.5 text-xs font-medium border-indigo-500/30 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
            >
              <Send className="h-3.5 w-3.5" />
              {resendMutation.isPending ? 'Sending Link...' : 'Send Invitation Link'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(loginUrl, 'Login Link')}
              className="gap-1.5 text-xs font-medium"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Login Link
            </Button>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
