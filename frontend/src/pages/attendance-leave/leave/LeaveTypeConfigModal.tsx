import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Settings2,
  Calendar,
  Layers,
  FileCheck,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { leaveTypesApi } from '@/api/attendance-leave';
import type { Company, LeaveType, LeavePolicyConfig } from '@/api/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface LeaveTypeConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
  companyId?: string;
  editingType?: LeaveType | null;
}

export function autoGenerateCode(leaveName: string): string {
  const clean = leaveName.trim();
  if (!clean) return '';

  const lower = clean.toLowerCase();
  if (lower.includes('casual')) return 'CL';
  if (lower.includes('sick')) return 'SL';
  if (lower.includes('earned') || lower.includes('privilege')) return 'EL';
  if (lower.includes('maternity')) return 'MAT';
  if (lower.includes('paternity')) return 'PAT';
  if (lower.includes('compensatory') || lower.includes('comp off') || lower.includes('compoff')) return 'CO';
  if (lower.includes('loss of pay') || lower.includes('unpaid')) return 'LOP';
  if (lower.includes('bereavement')) return 'BL';
  if (lower.includes('marriage')) return 'ML';
  if (lower.includes('study') || lower.includes('sabbatical')) return 'SAB';
  if (lower.includes('work from home') || lower.includes('wfh')) return 'WFH';
  if (lower.includes('annual')) return 'AL';

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words.map((w) => w[0].toUpperCase()).join('').slice(0, 4);
  } else if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return '';
}

function normalizeCategory(cat?: string): string {
  if (!cat) return 'Regular Annual Leave';
  const c = cat.toLowerCase();
  if (c.includes('medical') || c.includes('health')) return 'Medical / Health Leave';
  if (c.includes('unpaid') || c.includes('loss') || c.includes('lop')) return 'Unpaid / Loss of Pay (LOP)';
  if (c.includes('comp') || c.includes('compensatory')) return 'Compensatory Off';
  if (c.includes('statutory') || c.includes('maternity') || c.includes('paternity')) return 'Statutory / Maternity / Paternity';
  if (c.includes('special')) return 'Special Leave';
  if (c.includes('optional') || c.includes('restricted') || c.includes('holiday')) return 'Optional / Restricted Holiday';
  if (c.includes('other')) return 'Other';
  return 'Regular Annual Leave';
}

export function LeaveTypeConfigModal({
  open,
  onOpenChange,
  companies,
  companyId,
  editingType,
}: LeaveTypeConfigModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  const selectedCompanyId = companyId || editingType?.companyId || companies[0]?.id || '';

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [category, setCategory] = useState<string>('Regular Annual Leave');
  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [annualQuota, setAnnualQuota] = useState<number>(12);
  const [description, setDescription] = useState('');

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingType && !isCodeManuallyEdited) {
      setCode(autoGenerateCode(val));
    }
  };

  // Accrual
  const [accrualMethod, setAccrualMethod] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'JOINING_DATE' | 'NO_ACCRUAL' | 'UNLIMITED'>('MONTHLY');
  const [accrualRate, setAccrualRate] = useState<number>(1);
  const [prorateJoiners, setProrateJoiners] = useState<boolean>(true);

  // Carry Forward & Encashment
  const [carryForward, setCarryForward] = useState<boolean>(false);
  const [maxCarryForward, setMaxCarryForward] = useState<number>(5);
  const [carryForwardExpiryMonths, setCarryForwardExpiryMonths] = useState<number>(3);
  const [encashmentAllowed, setEncashmentAllowed] = useState<boolean>(false);

  // Application Rules
  const [allowFullDay, setAllowFullDay] = useState<boolean>(true);
  const [allowHalfDay, setAllowHalfDay] = useState<boolean>(true);
  const [priorNoticeDays, setPriorNoticeDays] = useState<number>(1);
  const [backdatedDays, setBackdatedDays] = useState<number>(3);
  const [commentRequired, setCommentRequired] = useState<boolean>(false);
  const [attachmentRequired, setAttachmentRequired] = useState<boolean>(false);

  // Sandwich & Combinations
  const [weeklyOffCountAsLeave, setWeeklyOffCountAsLeave] = useState<boolean>(false);
  const [holidayCountAsLeave, setHolidayCountAsLeave] = useState<boolean>(false);

  // Synchronize on open or change of editingType
  useEffect(() => {
    if (editingType) {
      setCode(editingType.code);
      setName(editingType.name);
      setCategory(normalizeCategory(editingType.category));
      setIsPaid(editingType.isPaid);
      setAnnualQuota(editingType.annualQuota);

      const cfg = editingType.policyConfig;
      setAccrualMethod(cfg?.accrualMethod || (editingType.code === 'CL' ? 'MONTHLY' : 'ANNUAL'));
      setAccrualRate(cfg?.accrualRate || 1);
      setProrateJoiners(cfg?.prorateForNewJoiners ?? true);

      setCarryForward(editingType.carryForward || cfg?.maxCarryForwardDays ? true : false);
      setMaxCarryForward(cfg?.maxCarryForwardDays ?? 5);
      setCarryForwardExpiryMonths(cfg?.carryForwardExpiryMonths ?? 3);
      setEncashmentAllowed(cfg?.encashmentAllowed ?? false);

      setAllowFullDay(cfg?.applicationRules?.allowFullDay ?? true);
      setAllowHalfDay(cfg?.applicationRules?.allowHalfDay ?? true);
      setPriorNoticeDays(cfg?.applicationRules?.priorNoticeDays ?? 1);
      setBackdatedDays(cfg?.applicationRules?.backdatedDays ?? 3);
      setCommentRequired(cfg?.applicationRules?.commentRequired ?? false);
      setAttachmentRequired(cfg?.applicationRules?.attachmentRequired ?? false);

      setWeeklyOffCountAsLeave(cfg?.sandwichPolicy?.weeklyOffCountAsLeave ?? false);
      setHolidayCountAsLeave(cfg?.sandwichPolicy?.holidayCountAsLeave ?? false);
    } else {
      // Default new form
      setCode('');
      setName('');
      setCategory('Regular');
      setIsPaid(true);
      setAnnualQuota(12);
      setDescription('');
      setAccrualMethod('MONTHLY');
      setAccrualRate(1);
      setProrateJoiners(true);
      setCarryForward(false);
      setMaxCarryForward(5);
      setCarryForwardExpiryMonths(3);
      setEncashmentAllowed(false);
      setAllowFullDay(true);
      setAllowHalfDay(true);
      setPriorNoticeDays(1);
      setBackdatedDays(3);
      setCommentRequired(false);
      setAttachmentRequired(false);
      setWeeklyOffCountAsLeave(false);
      setHolidayCountAsLeave(false);
    }
  }, [editingType, open]);

  // Mutation
  const upsertMutation = useMutation({
    mutationFn: async () => {
      const policyConfig: LeavePolicyConfig = {
        category,
        accrualMethod,
        accrualRate,
        prorateForNewJoiners: prorateJoiners,
        maxCarryForwardDays: carryForward ? maxCarryForward : 0,
        carryForwardExpiryMonths: carryForward ? carryForwardExpiryMonths : undefined,
        encashmentAllowed,
        applicationRules: {
          allowFullDay,
          allowHalfDay,
          allowQuarterDay: false,
          priorNoticeDays,
          backdatedDays,
          commentRequired,
          attachmentRequired,
        },
        sandwichPolicy: {
          weeklyOffCountAsLeave,
          holidayCountAsLeave,
        },
        combinationRules: {
          allowedCodes: ['CL', 'SL', 'EL'],
          disallowedCodes: ['LOP'],
        },
        approvalChain: {
          levels: [
            { order: 1, role: 'Reporting Manager', required: true },
            { order: 2, role: 'Department Head', required: false },
            { order: 3, role: 'HR Manager', required: true },
          ],
        },
      };

      const payload = {
        companyId: selectedCompanyId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category,
        annualQuota: Number(annualQuota),
        isPaid,
        carryForward,
        policyConfig,
      };

      if (editingType) {
        return leaveTypesApi.update(editingType.id, payload);
      } else {
        return leaveTypesApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      toast.success(editingType ? 'Leave Policy updated successfully' : 'New Leave Type created');
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to save leave type');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Leave code is required (e.g. CL, SL, EL)');
      return;
    }
    if (!name.trim()) {
      toast.error('Leave name is required');
      return;
    }
    upsertMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <div className="p-6 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent border-b">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold tracking-tight">
                    {editingType ? `Configure Policy: ${editingType.name} (${editingType.code})` : 'New Leave Type & Policy'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Keka enterprise policy rules for accrual, carry-forward, half-day, sandwich logic & multi-level workflows
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {editingType ? 'Edit Mode' : 'New Definition'}
              </Badge>
            </div>
          </DialogHeader>

          {/* Section Navigation Tabs */}
          <div className="flex flex-wrap gap-1 mt-4 p-1 rounded-lg bg-background/80 border">
            {[
              { key: 'basic', label: '1. Basic Info' },
              { key: 'accrual', label: '2. Accrual & Quota' },
              { key: 'carry', label: '3. Carry Forward' },
              { key: 'rules', label: '4. Application Rules' },
              { key: 'sandwich', label: '5. Sandwich & Combinations' },
              { key: 'approval', label: '6. Approval Chain' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Leave Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Casual Leave, Sick Leave, Paternity Leave"
                    className="text-xs"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">Official policy designation displayed to employees.</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      Leave Code <span className="text-destructive">*</span>
                    </Label>
                    {!editingType && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCodeManuallyEdited(false);
                          const generated = autoGenerateCode(name);
                          setCode(generated);
                          if (generated) {
                            toast.info(`Auto-generated code: ${generated}`);
                          } else {
                            toast.warning('Please enter a leave name first');
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3" />
                        Auto Generate
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      placeholder="e.g. CL, SL, EL, LOP"
                      className="font-mono text-xs uppercase pr-16"
                      value={code}
                      disabled={!!editingType}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setIsCodeManuallyEdited(true);
                      }}
                    />
                    {!editingType && code && !isCodeManuallyEdited && (
                      <span className="absolute right-2 top-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary uppercase border border-primary/20">
                        Auto
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Standard identifier used on muster & roster charts.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Category</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={category}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCategory(val);
                      if (val === 'Unpaid / Loss of Pay (LOP)') {
                        setIsPaid(false);
                      } else if (
                        val === 'Regular Annual Leave' ||
                        val === 'Medical / Health Leave' ||
                        val === 'Compensatory Off' ||
                        val === 'Statutory / Maternity / Paternity' ||
                        val === 'Special Leave' ||
                        val === 'Optional / Restricted Holiday' ||
                        val === 'Other'
                      ) {
                        if (!editingType) {
                          setIsPaid(true);
                        }
                      }
                    }}
                  >
                    <option value="Regular Annual Leave">Regular Annual Leave</option>
                    <option value="Medical / Health Leave">Medical / Health Leave</option>
                    <option value="Unpaid / Loss of Pay (LOP)">Unpaid / Loss of Pay (LOP)</option>
                    <option value="Compensatory Off">Compensatory Off</option>
                    <option value="Statutory / Maternity / Paternity">Statutory / Maternity / Paternity</option>
                    <option value="Special Leave">Special Leave</option>
                    <option value="Optional / Restricted Holiday">Optional / Restricted Holiday</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Compensation Type</Label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="isPaid"
                        checked={isPaid}
                        onChange={() => setIsPaid(true)}
                        className="h-4 w-4 text-primary"
                      />
                      <span>Paid Leave <span className="text-[11px] text-muted-foreground">(No salary deduction)</span></span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="isPaid"
                        checked={!isPaid}
                        onChange={() => setIsPaid(false)}
                        className="h-4 w-4 text-primary"
                      />
                      <span>Unpaid <span className="text-[11px] text-muted-foreground">(LOP)</span></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
                <span>Configure quota and accrual cycle on the next tab:</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('accrual')}>
                  Next: Accrual & Quota <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: ACCRUAL & QUOTA */}
          {activeTab === 'accrual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Annual Allocation Quota (Days)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={annualQuota}
                    onChange={(e) => setAnnualQuota(parseFloat(e.target.value) || 0)}
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Total baseline days allocated per calendar year.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Accrual Frequency</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={accrualMethod}
                    onChange={(e) => setAccrualMethod(e.target.value as any)}
                  >
                    <option value="MONTHLY">Monthly (e.g. 1 day credited per month)</option>
                    <option value="QUARTERLY">Quarterly (credited every 3 months)</option>
                    <option value="ANNUAL">Annual (all days credited on Jan 1st)</option>
                    <option value="JOINING_DATE">Joining Date Milestone Based</option>
                    <option value="NO_ACCRUAL">No Accrual (Fixed allocation)</option>
                    <option value="UNLIMITED">Unlimited Leave (On-demand approval)</option>
                  </select>
                </div>
              </div>

              {accrualMethod === 'MONTHLY' && (
                <div className="p-3.5 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-900 dark:text-blue-200">Monthly Accrual Rate:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {(annualQuota / 12).toFixed(2)} Days / Month
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-1">
                    Employees accrue leave at the start of each month automatically.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-background">
                <div>
                  <Label className="text-xs font-semibold">Prorate for Mid-Year Joiners & Exits</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically scale annual quota based on remaining active months in the year.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prorateJoiners}
                  onChange={(e) => setProrateJoiners(e.target.checked)}
                  className="h-4 w-4 rounded text-primary"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('basic')}>
                  Back
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('carry')}>
                  Next: Carry Forward <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: CARRY FORWARD & ENCASHMENT */}
          {activeTab === 'carry' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-background">
                <div>
                  <Label className="text-xs font-semibold">Enable Year-End Carry Forward</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Allow unused balance from this year to roll over to the subsequent calendar year.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={carryForward}
                  onChange={(e) => setCarryForward(e.target.checked)}
                  className="h-4 w-4 rounded text-primary"
                />
              </div>

              {carryForward && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 rounded-xl border bg-muted/20">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Max Carry Forward Limit (Days)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      value={maxCarryForward}
                      onChange={(e) => setMaxCarryForward(parseInt(e.target.value) || 0)}
                      className="text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">e.g. 5 days (excess balance will lapse).</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Lapse / Expiry Period (Months)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={carryForwardExpiryMonths}
                      onChange={(e) => setCarryForwardExpiryMonths(parseInt(e.target.value) || 0)}
                      className="text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">Carried balance expires after N months (e.g. March 31st = 3 months).</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-background">
                <div>
                  <Label className="text-xs font-semibold">Leave Encashment Eligibility</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Allow employees to convert unutilized leave balance into payroll cash reimbursement.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={encashmentAllowed}
                  onChange={(e) => setEncashmentAllowed(e.target.checked)}
                  className="h-4 w-4 rounded text-primary"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('accrual')}>
                  Back
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('rules')}>
                  Next: Application Rules <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: APPLICATION RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border bg-background flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold">Allow Half-Day Applications</Label>
                    <p className="text-[11px] text-muted-foreground">Enable 0.5 Day First Half / Second Half sessions.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowHalfDay}
                    onChange={(e) => setAllowHalfDay(e.target.checked)}
                    className="h-4 w-4 rounded text-primary"
                  />
                </div>

                <div className="p-3.5 rounded-xl border bg-background flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold">Mandatory Reason Required</Label>
                    <p className="text-[11px] text-muted-foreground">Employees must enter an explanation to submit.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={commentRequired}
                    onChange={(e) => setCommentRequired(e.target.checked)}
                    className="h-4 w-4 rounded text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Prior Notice Threshold (Days)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={priorNoticeDays}
                    onChange={(e) => setPriorNoticeDays(parseInt(e.target.value) || 0)}
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Leave must be applied at least N days before start date.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Backdated Applications Allowed (Days)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={backdatedDays}
                    onChange={(e) => setBackdatedDays(parseInt(e.target.value) || 0)}
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">Max past days allowed for retrospective submission (e.g. for sudden sickness).</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-background">
                <div>
                  <Label className="text-xs font-semibold">Mandatory Attachment (e.g. Medical Certificate)</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Require medical document upload if leave duration exceeds 2 consecutive days.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={attachmentRequired}
                  onChange={(e) => setAttachmentRequired(e.target.checked)}
                  className="h-4 w-4 rounded text-primary"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('carry')}>
                  Back
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('sandwich')}>
                  Next: Sandwich Policy <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* TAB 5: SANDWICH POLICY & COMBINATIONS */}
          {activeTab === 'sandwich' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  What is the Keka Sandwich Rule?
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  When an employee applies for leave preceding and succeeding a Weekly Off (e.g. Friday and Monday),
                  the sandwich policy determines whether the intervening Saturday & Sunday are deducted from their leave quota.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border bg-background flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold">Count Weekly Off as Leave</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Intervening weekly offs will be deducted as leave days.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={weeklyOffCountAsLeave}
                    onChange={(e) => setWeeklyOffCountAsLeave(e.target.checked)}
                    className="h-4 w-4 rounded text-primary"
                  />
                </div>

                <div className="p-3.5 rounded-xl border bg-background flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold">Count Public Holidays as Leave</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Intervening declared holidays will be deducted as leave days.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={holidayCountAsLeave}
                    onChange={(e) => setHolidayCountAsLeave(e.target.checked)}
                    className="h-4 w-4 rounded text-primary"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border bg-background space-y-2">
                <Label className="text-xs font-semibold">Combination Restrictions</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
                    ✓ Allowed with Casual Leave (CL)
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
                    ✓ Allowed with Sick Leave (SL)
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300">
                    ✕ Restricted with Loss of Pay (LOP)
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  System prevents booking back-to-back leave applications with incompatible leave types.
                </p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('rules')}>
                  Back
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('approval')}>
                  Next: Approval Chain <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* TAB 6: APPROVAL WORKFLOW CHAIN */}
          {activeTab === 'approval' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border bg-background space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">Multi-Level Approval Hierarchy</Label>
                  <span className="text-[10px] text-muted-foreground">Standard 3-Tier Enterprise Chain</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/20">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold">Reporting Manager (L1)</div>
                      <div className="text-[11px] text-muted-foreground">Direct supervisor approval • SLA: 2 Days</div>
                    </div>
                    <Badge variant="success" className="text-[10px]">Mandatory</Badge>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/20">
                    <div className="h-6 w-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold">Department Head / HOD (L2)</div>
                      <div className="text-[11px] text-muted-foreground">Required if leave exceeds 3 consecutive days</div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">Conditional</Badge>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/20">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold">HR Operations / Admin (L3)</div>
                      <div className="text-[11px] text-muted-foreground">Final audit & muster roll synchronization</div>
                    </div>
                    <Badge variant="success" className="text-[10px]">Mandatory</Badge>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('sandwich')}>
                  Back
                </Button>
                <Button type="submit" size="sm" disabled={upsertMutation.isPending} className="font-semibold">
                  {upsertMutation.isPending ? 'Saving Policy...' : editingType ? 'Update Policy' : 'Create Leave Type'}
                </Button>
              </div>
            </div>
          )}

          {activeTab !== 'approval' && (
            <DialogFooter className="pt-3 border-t flex items-center justify-between">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={upsertMutation.isPending} className="font-semibold">
                {upsertMutation.isPending ? 'Saving...' : editingType ? 'Save All Changes' : 'Create Leave Type'}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
