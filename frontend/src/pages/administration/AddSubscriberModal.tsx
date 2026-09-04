import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { companiesApi } from '@/api/organization';
import { subscriptionsApi, type PlanPackageItem, type SubscribeNewCompanyPayload } from '@/api/plansApi';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Users,
  Building,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Mail,
  UserCheck,
  ExternalLink,
  Copy,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
} from 'lucide-react';

interface AddSubscriberModalProps {
  plan: PlanPackageItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const INDUSTRY_OPTIONS = [
  'Information Technology',
  'Software & SaaS',
  'Manufacturing',
  'Retail & E-commerce',
  'Healthcare & Pharmaceuticals',
  'Banking & Financial Services',
  'Education & EdTech',
  'Logistics & Supply Chain',
  'Construction & Real Estate',
  'Consulting & Professional Services',
  'Telecommunications',
  'Hospitality & Tourism',
  'Other',
];

export const AddSubscriberModal: React.FC<AddSubscriberModalProps> = ({
  plan,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [customerType, setCustomerType] = useState<'EXISTING' | 'NEW'>('EXISTING');

  // Existing company state
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  // New company state
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [industry, setIndustry] = useState('Information Technology');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Admin account state
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [sendInvitation, setSendInvitation] = useState(true);
  const [deliveryEmail, setDeliveryEmail] = useState(true);
  const [deliverySms, setDeliverySms] = useState(false);

  // Subscription state
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [autoRenew, setAutoRenew] = useState(true);
  const [price, setPrice] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING' | 'COMPLIMENTARY'>('PAID');
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Post-provisioning success dialog
  const [createdSuccessData, setCreatedSuccessData] = useState<any | null>(null);

  // Load companies
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesApi.list,
    enabled: Boolean(open),
  });

  // Check duplicate active subscription for selected existing company
  const { data: duplicateCheck } = useQuery({
    queryKey: ['subscription-check', selectedCompanyId, plan?.id],
    queryFn: () => subscriptionsApi.checkActiveSubscription(selectedCompanyId, plan!.id),
    enabled: Boolean(open && customerType === 'EXISTING' && selectedCompanyId && plan?.id),
  });

  // Calculate default price and end date when plan or billingCycle changes
  useEffect(() => {
    if (plan) {
      const calculatedPrice =
        billingCycle === 'MONTHLY'
          ? plan.monthlyPrice || plan.price
          : plan.annualPrice || plan.price * 10;
      setPrice(calculatedPrice);

      const start = new Date(startDate || new Date());
      const end = new Date(start);
      if (billingCycle === 'MONTHLY') {
        end.setMonth(end.getMonth() + 1);
      } else {
        end.setFullYear(end.getFullYear() + 1);
      }
      setEndDate(end.toISOString().split('T')[0]);

      const randomRef = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setPaymentReference(randomRef);
    }
  }, [plan, billingCycle, startDate]);

  // Set default company when companies load
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  // Auto-generate code when new company name changes (if user hasn't explicitly customized code)
  const handleCompanyNameChange = (val: string) => {
    setCompanyName(val);
    if (!companyCode || companyCode.startsWith('COMP-') || companyCode.length < 5) {
      const clean = val
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 4)
        .toUpperCase();
      const codeSuffix = String(companies.length + 1).padStart(3, '0');
      setCompanyCode(clean ? `${clean}-${codeSuffix}` : `COMP-${codeSuffix}`);
    }
  };

  // Sync admin name with contact person if not typed
  const handleContactPersonChange = (val: string) => {
    setContactPerson(val);
    if (!adminName || adminName === contactPerson) {
      setAdminName(val);
    }
  };

  // Sync admin email with company email if not typed
  const handleCompanyEmailChange = (val: string) => {
    setCompanyEmail(val);
    if (!adminEmail || adminEmail === companyEmail) {
      setAdminEmail(val);
    }
  };

  // Sync admin phone with contact phone
  const handleContactPhoneChange = (val: string) => {
    setContactPhone(val);
    if (!adminPhone || adminPhone === contactPhone) {
      setAdminPhone(val);
    }
  };

  if (!plan) return null;

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const moduleCount = Array.isArray(plan.includedModules) ? plan.includedModules.length : 0;

  const handleExistingSubmit = async () => {
    if (!selectedCompanyId) {
      toast.error('Please select a company');
      return;
    }

    if (duplicateCheck?.hasActive) {
      toast.error(`This company already holds an active subscription for ${plan.name}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await subscriptionsApi.subscribeCompany({
        companyId: selectedCompanyId,
        planId: plan.id,
        billingCycle,
        startDate,
        endDate,
        autoRenew,
        price,
        paymentStatus,
        paymentReference,
      });

      toast.success(`Successfully subscribed ${selectedCompany?.name} to ${plan.name}!`);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan-subscribers', plan.id] });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewSubmit = async () => {
    if (!companyName.trim()) {
      toast.error('Company Name is required');
      return;
    }
    if (!companyCode.trim()) {
      toast.error('Company Code is required');
      return;
    }
    if (!registeredAddress.trim()) {
      toast.error('Registered Address is required');
      return;
    }
    if (!contactPerson.trim()) {
      toast.error('Contact Person is required');
      return;
    }
    if (!companyEmail.trim()) {
      toast.error('Company Email is required');
      return;
    }
    if (!contactPhone.trim()) {
      toast.error('Contact Number is required');
      return;
    }
    if (!adminName.trim()) {
      toast.error('Admin Full Name is required');
      return;
    }
    if (!adminEmail.trim()) {
      toast.error('Admin Login Email is required');
      return;
    }

    const delivery: string[] = [];
    if (deliveryEmail) delivery.push('EMAIL');
    if (deliverySms) delivery.push('SMS');

    const payload: SubscribeNewCompanyPayload = {
      companyName: companyName.trim(),
      companyCode: companyCode.trim().toUpperCase(),
      industry,
      registeredAddress: registeredAddress.trim(),
      contactPerson: contactPerson.trim(),
      companyEmail: companyEmail.trim().toLowerCase(),
      contactPhone: contactPhone.trim(),
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim().toLowerCase(),
      adminPhone: adminPhone.trim() || contactPhone.trim(),
      adminUsername: adminEmail.trim().toLowerCase(),
      sendInvitation,
      invitationDelivery: delivery,
      planId: plan.id,
      billingCycle,
      startDate,
      endDate,
      autoRenew,
      price,
      paymentStatus,
      paymentReference,
    };

    setIsSubmitting(true);
    try {
      const res = await subscriptionsApi.subscribeNewCompany(payload);
      toast.success(`Organization ${res.company.name} provisioned & subscribed to ${plan.name}!`);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan-subscribers', plan.id] });

      // Show success provisioning summary
      setCreatedSuccessData(res);
      onSuccess();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Failed to create organization & subscription'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied invitation link to clipboard');
  };

  // If new company provisioning just completed, show the confirmation screen
  if (createdSuccessData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-lg font-bold text-white">
                Organization & Admin Account Provisioned!
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-white/80">
              {createdSuccessData.company.name} ({createdSuccessData.company.code}) has been created with an active subscription to{' '}
              <strong>{plan.name}</strong>.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b text-xs">
                <span className="text-muted-foreground">Company Entity</span>
                <span className="font-semibold text-foreground">
                  {createdSuccessData.company.name} ({createdSuccessData.company.code})
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b text-xs">
                <span className="text-muted-foreground">Company Admin Account</span>
                <span className="font-semibold font-mono text-foreground">
                  {createdSuccessData.adminUser.email}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b text-xs">
                <span className="text-muted-foreground">Admin Role</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                  COMPANY_ADMIN
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Plan & Validity</span>
                <span className="font-medium text-foreground">
                  {createdSuccessData.subscription.planName} • Valid until{' '}
                  {new Date(createdSuccessData.subscription.validUntil).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {createdSuccessData.invitation?.sent && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Invitation Link Generated</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    Dispatched
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  An email invitation has been generated for{' '}
                  <strong className="text-foreground">{createdSuccessData.adminUser.email}</strong> to activate their account and set their password.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    readOnly
                    value={`${window.location.origin}${createdSuccessData.invitation.invitationUrl}`}
                    className="h-8 text-[11px] font-mono bg-background"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(`${window.location.origin}${createdSuccessData.invitation.invitationUrl}`)
                    }
                    className="h-8 px-2 text-xs shrink-0 gap-1"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-3 border-t bg-muted/20">
            <Button
              size="sm"
              onClick={() => {
                setCreatedSuccessData(null);
                onOpenChange(false);
              }}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Add Subscriber</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Subscribe an organizational account to <strong className="text-foreground">{plan.name}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Package Overview Header */}
          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {plan.type === 'STANDARD_PLAN' ? (
                  <Sparkles className="h-4 w-4" />
                ) : plan.type === 'CUSTOM_PACKAGE' ? (
                  <Layers className="h-4 w-4" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-foreground">{plan.name}</span>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {moduleCount} / 25 Modules Included • Up to{' '}
                  {plan.maxEmployees === 99999 ? 'Unlimited' : plan.maxEmployees} Employees
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-bold font-mono text-emerald-600">
                ₹{price.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                / {billingCycle === 'MONTHLY' ? 'Month' : 'Year'}
              </span>
            </div>
          </div>

          {/* 1. CUSTOMER TYPE SELECTOR */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 pb-1 border-b">
              <Building className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Company / Customer
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCustomerType('EXISTING')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  customerType === 'EXISTING'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                    customerType === 'EXISTING' ? 'border-primary' : 'border-muted-foreground'
                  }`}
                >
                  {customerType === 'EXISTING' && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground block">Existing Company</span>
                  <span className="text-[10px] text-muted-foreground">
                    Select an already registered organization
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCustomerType('NEW')}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  customerType === 'NEW'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                    customerType === 'NEW' ? 'border-primary' : 'border-muted-foreground'
                  }`}
                >
                  {customerType === 'NEW' && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground block">New Company</span>
                  <span className="text-[10px] text-muted-foreground">
                    Create organization & admin login
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* ================= EXISTING COMPANY WORKFLOW ================= */}
          {customerType === 'EXISTING' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Select Company *</Label>
                  <span className="text-[10px] text-muted-foreground">
                    {companies.length} organizations in database
                  </span>
                </div>

                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs font-medium"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) — {c.city || 'India'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCompany && (
                <div className="p-3.5 rounded-xl bg-muted/40 border space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b">
                    <span className="text-xs font-bold text-foreground">
                      {selectedCompany.name} ({selectedCompany.code})
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-background">
                      {selectedCompany.entityType || 'Private Limited'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Location</span>
                      <p className="font-semibold text-foreground mt-0.5">
                        {selectedCompany.city || 'Pune'}, {selectedCompany.country || 'India'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Industry</span>
                      <p className="font-semibold text-foreground mt-0.5">
                        {selectedCompany.entityType || 'Information Technology'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Contact Email</span>
                      <p className="font-semibold text-foreground font-mono mt-0.5 truncate">
                        {selectedCompany.email || `admin@${selectedCompany.code.toLowerCase()}.com`}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Contact Phone</span>
                      <p className="font-semibold text-foreground font-mono mt-0.5">
                        {selectedCompany.phone || '+91 98765 43210'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* DUPLICATE SUBSCRIPTION WARNING */}
              {duplicateCheck?.hasActive && (
                <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        This company already has an active {duplicateCheck.subscription?.planName || plan.name} subscription.
                      </h4>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1.5 leading-relaxed">
                        Current subscription:{' '}
                        <strong className="font-mono">
                          ₹{duplicateCheck.subscription?.price?.toLocaleString()} /{' '}
                          {duplicateCheck.subscription?.billingCycle === 'MONTHLY' ? 'Month' : 'Year'}
                        </strong>
                        <br />
                        Valid until:{' '}
                        <strong className="font-mono">
                          {duplicateCheck.subscription?.validUntil
                            ? new Date(duplicateCheck.subscription.validUntil).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Active'}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false);
                        window.location.href = `/administration/subscription?companyId=${selectedCompanyId}`;
                      }}
                      className="h-7 text-xs border-amber-500/40 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 gap-1.5"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Subscription
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onOpenChange(false)}
                      className="h-7 text-xs text-muted-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= NEW COMPANY WORKFLOW ================= */}
          {customerType === 'NEW' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* COMPANY DETAILS */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 pb-1 border-b">
                  <Building className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Company Details
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Company Name *</Label>
                    <Input
                      placeholder="e.g. ABC Technologies"
                      value={companyName}
                      onChange={(e) => handleCompanyNameChange(e.target.value)}
                      className="mt-1 h-9 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Company Code *</Label>
                    <Input
                      placeholder="e.g. COMP-006"
                      value={companyCode}
                      onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                      className="mt-1 h-9 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Industry *</Label>
                    <select
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    >
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Registered Address *</Label>
                    <Input
                      placeholder="e.g. Pune, Maharashtra"
                      value={registeredAddress}
                      onChange={(e) => setRegisteredAddress(e.target.value)}
                      className="mt-1 h-9 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Contact Person *</Label>
                    <Input
                      placeholder="e.g. Rahul Sharma"
                      value={contactPerson}
                      onChange={(e) => handleContactPersonChange(e.target.value)}
                      className="mt-1 h-9 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Company Email *</Label>
                    <Input
                      type="email"
                      placeholder="e.g. admin@abctech.com"
                      value={companyEmail}
                      onChange={(e) => handleCompanyEmailChange(e.target.value)}
                      className="mt-1 h-9 text-xs font-mono"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs font-semibold">Contact Number *</Label>
                    <Input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={contactPhone}
                      onChange={(e) => handleContactPhoneChange(e.target.value)}
                      className="mt-1 h-9 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* ADMIN ACCOUNT PROVISIONING */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Admin Login
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/20 bg-primary/5">
                    Primary Administrator
                  </Badge>
                </div>

                <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
                  <p className="text-[11px] text-muted-foreground">
                    Provision the initial company administrator account to manage organization ERP settings & modules.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">Full Name *</Label>
                      <Input
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Rahul Sharma"
                        className="mt-1 h-9 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Login Email *</Label>
                      <Input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@abctech.com"
                        className="mt-1 h-9 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Phone</Label>
                      <Input
                        type="tel"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="mt-1 h-9 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Username</Label>
                      <Input
                        readOnly
                        value={adminEmail || 'admin@abctech.com'}
                        className="mt-1 h-9 text-xs font-mono bg-muted/50 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-foreground">Send Login Invitation</span>
                      <p className="text-[11px] text-muted-foreground">
                        Dispatch activation invitation link to set up their password
                      </p>
                    </div>
                    <Switch checked={sendInvitation} onCheckedChange={setSendInvitation} />
                  </div>

                  {sendInvitation && (
                    <div className="flex items-center gap-4 text-xs pt-1">
                      <span className="text-muted-foreground text-[11px]">Delivery:</span>
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-foreground">
                        <input
                          type="checkbox"
                          checked={deliveryEmail}
                          onChange={(e) => setDeliveryEmail(e.target.checked)}
                          className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span>Email</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-foreground">
                        <input
                          type="checkbox"
                          checked={deliverySms}
                          onChange={(e) => setDeliverySms(e.target.checked)}
                          className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span>SMS</span>
                      </label>
                    </div>
                  )}

                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-[11px] text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong>Security Standard:</strong> Passwords are not displayed or stored in plain-text. A secure cryptographically signed invitation will be dispatched to the administrator to set their password upon activation.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SUBSCRIPTION PARAMETERS ================= */}
          {(!duplicateCheck?.hasActive || customerType === 'NEW') && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 pb-1 border-b">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Subscription Parameters
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Billing Cycle *</Label>
                  <select
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as any)}
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="ANNUAL">Yearly (Annual)</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Start Date *</Label>
                  <Input
                    type="date"
                    className="mt-1 h-9 text-xs font-mono"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Renewal / End Date</Label>
                  <Input
                    type="date"
                    className="mt-1 h-9 text-xs font-mono"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border">
                <div>
                  <span className="text-xs font-semibold text-foreground">Auto-Renewal</span>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically generate renewal invoices at expiration
                  </p>
                </div>
                <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
              </div>
            </div>
          )}

          {/* ================= PAYMENT & BILLING ================= */}
          {(!duplicateCheck?.hasActive || customerType === 'NEW') && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 pb-1 border-b">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Payment & Billing Reference
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Subscription Price (₹)</Label>
                  <Input
                    type="number"
                    className="mt-1 h-9 text-xs font-mono"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Payment Status</Label>
                  <select
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                  >
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending Approval</option>
                    <option value="COMPLIMENTARY">Complimentary / Trial</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Payment Reference</Label>
                  <Input
                    className="mt-1 h-9 text-xs font-mono"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="PAY-2026-0001"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DIALOG FOOTER */}
        <DialogFooter className="px-6 py-3 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>

          {customerType === 'EXISTING' ? (
            duplicateCheck?.hasActive ? (
              <Button
                size="sm"
                disabled
                className="gap-1.5 text-xs bg-muted text-muted-foreground cursor-not-allowed"
              >
                Already Subscribed
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleExistingSubmit}
                disabled={isSubmitting || !selectedCompanyId}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isSubmitting ? 'Creating Subscription...' : 'Create Subscription'}
              </Button>
            )
          ) : (
            <Button
              size="sm"
              onClick={handleNewSubmit}
              disabled={isSubmitting}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isSubmitting ? 'Provisioning Organization...' : 'Create Company & Subscribe'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
