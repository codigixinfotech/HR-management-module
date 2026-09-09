import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { plansApi, type ErpModuleCatalogItem } from '@/api/plansApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles,
  Package,
  Zap,
  ArrowRight,
  ArrowLeft,
  Search,
  CheckCircle2,
  HardDrive,
  Users,
  Building,
  MapPin,
  GraduationCap
} from 'lucide-react';

interface CreatePackageWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreatePackageWizardModal: React.FC<CreatePackageWizardModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<'STANDARD_PLAN' | 'CUSTOM_PACKAGE' | 'ADD_ON'>('CUSTOM_PACKAGE');
  const [category, setCategory] = useState('Core HR');
  const [description, setDescription] = useState('');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY' | 'ONE_TIME'>('MONTHLY');
  const [price, setPrice] = useState<number>(499);
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT'>('ACTIVE');

  // Modules State
  const [selectedModules, setSelectedModules] = useState<string[]>(['employee-management']);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({ 'employee-management': true });
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>({});
  const [moduleSearch, setModuleSearch] = useState('');

  // Limits State
  const [maxEmployees, setMaxEmployees] = useState<number>(50);
  const [maxDepartments, setMaxDepartments] = useState<number>(10);
  const [maxLocations, setMaxLocations] = useState<number>(2);
  const [maxStorageGb, setMaxStorageGb] = useState<number>(10);
  const [maxLmsLearners, setMaxLmsLearners] = useState<number>(25);

  const { data: moduleCatalog = [] } = useQuery({
    queryKey: ['plans', 'module-catalog'],
    queryFn: plansApi.getModuleCatalog,
  });

  const generateCodeFromName = (val: string) => {
    setName(val);
    const generated = val
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 30);
    setCode(generated);
  };

  const handleToggleModule = (modKey: string) => {
    if (selectedModules.includes(modKey)) {
      setSelectedModules(selectedModules.filter((m) => m !== modKey));
    } else {
      setSelectedModules([...selectedModules, modKey]);
      setExpandedModules((prev) => ({ ...prev, [modKey]: true }));
    }
  };

  const handleSelectAll = () => {
    setSelectedModules(moduleCatalog.map((m) => m.key));
  };

  const handleClearAll = () => {
    setSelectedModules([]);
  };

  const toggleFeature = (featureName: string) => {
    setFeatureToggles((prev) => ({
      ...prev,
      [featureName]: prev[featureName] === false ? true : false,
    }));
  };

  const resetForm = () => {
    setStep(1);
    setName('');
    setCode('');
    setType('CUSTOM_PACKAGE');
    setDescription('');
    setPrice(499);
    setSelectedModules(['employee-management']);
    setFeatureToggles({});
  };

  const handlePublish = async () => {
    if (!name.trim()) {
      toast.error('Please enter a package name');
      setStep(1);
      return;
    }
    if (!code.trim()) {
      toast.error('Please enter a package code');
      setStep(1);
      return;
    }
    if (selectedModules.length === 0) {
      toast.error('Please select at least one module for this package');
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      await plansApi.create({
        name,
        code,
        type,
        category,
        description,
        billingCycle,
        price,
        monthlyPrice: price,
        annualPrice: price * 10,
        currency: 'INR',
        status,
        maxEmployees,
        maxDepartments,
        maxLocations,
        maxStorageGb,
        maxLmsLearners,
        includedModules: selectedModules,
        featureToggles,
      });

      toast.success(`Package "${name}" published successfully!`);
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to publish package');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group modules by category
  const filteredCatalog = moduleCatalog.filter(
    (m) =>
      m.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
      m.description.toLowerCase().includes(moduleSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  const categories = Array.from(new Set(moduleCatalog.map((m) => m.category)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Wizard Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">Create Package</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Step {step} of 4 — {step === 1 && 'Package Details'}
                  {step === 2 && 'Module Access'}
                  {step === 3 && 'Features & Usage Limits'}
                  {step === 4 && 'Review & Publish'}
                </DialogDescription>
              </div>
            </div>

            {/* Stepper indicators */}
            <div className="flex items-center gap-1.5 text-xs">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex items-center justify-center h-6 w-6 rounded-full font-mono text-[11px] transition-all ${
                    s === step
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : s < step
                      ? 'bg-emerald-500 text-white font-medium'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s < step ? <Check className="h-3 w-3" /> : s}
                </div>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Wizard Step Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* ── STEP 1: PACKAGE DETAILS ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold">Package Name *</Label>
                <Input
                  className="mt-1 h-9 text-xs"
                  placeholder="e.g. Employee Management Package"
                  value={name}
                  onChange={(e) => generateCodeFromName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Package Code (Unique Identifier) *</Label>
                  <Input
                    className="mt-1 h-9 text-xs font-mono"
                    placeholder="e.g. CUSTOM_EMP_MGMT"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Package Category</Label>
                  <select
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Core HR">Core HR</option>
                    <option value="Workforce">Workforce</option>
                    <option value="Payroll & Finance">Payroll & Finance</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Talent & Learning">Talent & Learning</option>
                    <option value="Operations & Platform">Operations & Platform</option>
                    <option value="Enterprise Bundle">Enterprise Bundle</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Package Type *</Label>
                <div className="grid grid-cols-3 gap-3 mt-1.5">
                  <div
                    onClick={() => setType('CUSTOM_PACKAGE')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      type === 'CUSTOM_PACKAGE'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      <span className="text-xs font-bold">Custom Package</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Targeted multi-module bundle (e.g. HR Essentials, Payroll).
                    </p>
                  </div>

                  <div
                    onClick={() => setType('STANDARD_PLAN')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      type === 'STANDARD_PLAN'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs font-bold">Standard Plan</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Tiered platform plan (Starter, Professional, Business, Enterprise).
                    </p>
                  </div>

                  <div
                    onClick={() => setType('ADD_ON')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      type === 'ADD_ON'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span className="text-xs font-bold">Add-on</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Single module or capacity extension added on top of a plan.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Description</Label>
                <Textarea
                  className="mt-1 text-xs"
                  rows={2}
                  placeholder="Describe the target business size and scope of this package..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Billing Frequency</Label>
                  <select
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as any)}
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly (Annual)</option>
                    <option value="ONE_TIME">One-time Perpetual</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Price (₹ INR)</Label>
                  <Input
                    type="number"
                    className="mt-1 h-9 text-xs font-mono"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Initial Status</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs ${status === 'ACTIVE' ? 'font-bold text-emerald-600' : 'text-muted-foreground'}`}>
                      {status === 'ACTIVE' ? 'Active' : 'Draft'}
                    </span>
                    <Switch
                      checked={status === 'ACTIVE'}
                      onCheckedChange={(c) => setStatus(c ? 'ACTIVE' : 'DRAFT')}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: MODULE ACCESS ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Module Master Access</h4>
                  <p className="text-xs text-muted-foreground">
                    Selected <span className="font-semibold text-primary">{selectedModules.length}</span> / {moduleCatalog.length} ERP Modules
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search modules..."
                      className="h-8 pl-8 text-xs"
                      value={moduleSearch}
                      onChange={(e) => setModuleSearch(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-8 text-xs">
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearAll} className="h-8 text-xs">
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Categorized Module List */}
              <div className="space-y-6">
                {categories.map((cat) => {
                  const catModules = filteredCatalog.filter((m) => m.category === cat);
                  if (catModules.length === 0) return null;

                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex items-center justify-between pb-1 border-b">
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">{cat}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {catModules.filter((m) => selectedModules.includes(m.key)).length} of {catModules.length} Included
                        </span>
                      </div>

                      <div className="space-y-2">
                        {catModules.map((mod) => {
                          const isIncluded = selectedModules.includes(mod.key);
                          const isExpanded = Boolean(expandedModules[mod.key]);

                          return (
                            <div
                              key={mod.key}
                              className={`rounded-xl border transition-all ${
                                isIncluded ? 'border-primary/40 bg-primary/5 shadow-2xs' : 'border-border/60 bg-card'
                              }`}
                            >
                              <div
                                className="flex items-center justify-between p-3 cursor-pointer select-none"
                                onClick={() => handleToggleModule(mod.key)}
                              >
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={isIncluded}
                                    onCheckedChange={() => handleToggleModule(mod.key)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-foreground">{mod.name}</span>
                                      <Badge variant="outline" className="text-[10px] font-mono">
                                        ₹{mod.defaultPricePerMonth}/mo
                                      </Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground line-clamp-1">{mod.description}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={isIncluded ? 'default' : 'secondary'}
                                    className="text-[10px]"
                                  >
                                    {isIncluded ? 'Included' : 'Not Included'}
                                  </Badge>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedModules((p) => ({ ...p, [mod.key]: !p[mod.key] }));
                                    }}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground"
                                  >
                                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                  </button>
                                </div>
                              </div>

                              {/* Expandable sub-features */}
                              {isExpanded && mod.features && mod.features.length > 0 && (
                                <div className="px-4 pb-3 pt-1 border-t border-border/40 bg-muted/20 animate-in fade-in duration-150">
                                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Sub-Features Access ({mod.name})
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {mod.features.map((feat) => {
                                      const isFeatureDisabled = featureToggles[feat] === false;
                                      return (
                                        <div
                                          key={feat}
                                          className="flex items-center justify-between p-1.5 rounded-md bg-background border text-[11px]"
                                        >
                                          <div className="flex items-center gap-2 truncate">
                                            <CheckCircle2
                                              className={`h-3.5 w-3.5 ${
                                                isIncluded && !isFeatureDisabled ? 'text-emerald-500' : 'text-muted-foreground/40'
                                              }`}
                                            />
                                            <span className="truncate">{feat}</span>
                                          </div>
                                          <Switch
                                            disabled={!isIncluded}
                                            checked={isIncluded && !isFeatureDisabled}
                                            onCheckedChange={() => toggleFeature(feat)}
                                            className="scale-75"
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 3: FEATURES & USAGE LIMITS ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Usage Capacity Limits</h4>
                <p className="text-xs text-muted-foreground">
                  Define tenant resource limits when a company is subscribed to this package.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border bg-card space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Maximum Employees Limit</span>
                  </div>
                  <Input
                    type="number"
                    className="h-9 text-xs font-mono"
                    value={maxEmployees}
                    onChange={(e) => setMaxEmployees(Number(e.target.value))}
                  />
                  <p className="text-[11px] text-muted-foreground">e.g. 50, 250, 1000 (-1 for Unlimited)</p>
                </div>

                <div className="p-3.5 rounded-xl border bg-card space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <HardDrive className="h-4 w-4 text-primary" />
                    <span>Cloud Storage (GB)</span>
                  </div>
                  <Input
                    type="number"
                    className="h-9 text-xs font-mono"
                    value={maxStorageGb}
                    onChange={(e) => setMaxStorageGb(Number(e.target.value))}
                  />
                  <p className="text-[11px] text-muted-foreground">e.g. 10 GB, 50 GB, 250 GB</p>
                </div>

                <div className="p-3.5 rounded-xl border bg-card space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Building className="h-4 w-4 text-primary" />
                    <span>Maximum Departments</span>
                  </div>
                  <Input
                    type="number"
                    className="h-9 text-xs font-mono"
                    value={maxDepartments}
                    onChange={(e) => setMaxDepartments(Number(e.target.value))}
                  />
                  <p className="text-[11px] text-muted-foreground">Max organizational departments allowed</p>
                </div>

                <div className="p-3.5 rounded-xl border bg-card space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Locations / Branches</span>
                  </div>
                  <Input
                    type="number"
                    className="h-9 text-xs font-mono"
                    value={maxLocations}
                    onChange={(e) => setMaxLocations(Number(e.target.value))}
                  />
                  <p className="text-[11px] text-muted-foreground">Max physical branches/sites allowed</p>
                </div>

                <div className="p-3.5 rounded-xl border bg-card space-y-1.5 col-span-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span>LMS Training Learners</span>
                  </div>
                  <Input
                    type="number"
                    className="h-9 text-xs font-mono"
                    value={maxLmsLearners}
                    onChange={(e) => setMaxLmsLearners(Number(e.target.value))}
                  />
                  <p className="text-[11px] text-muted-foreground">Max concurrent active learners in Corporate LMS</p>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: REVIEW & PUBLISH ── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{name || 'Untitled Package'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs font-medium">
                        {type === 'STANDARD_PLAN' ? 'Standard Plan' : type === 'CUSTOM_PACKAGE' ? 'Custom Package' : 'Add-on'}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-mono text-emerald-600 bg-emerald-50">
                        ₹{price} / {billingCycle.toLowerCase()}
                      </Badge>
                      <Badge variant={status === 'ACTIVE' ? 'default' : 'outline'} className="text-xs">
                        {status}
                      </Badge>
                    </div>
                  </div>
                </div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
              </div>

              {/* Summary Lists */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border bg-card space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Included Modules ({selectedModules.length})
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-1 text-xs pr-1">
                    {selectedModules.map((mKey) => {
                      const mod = moduleCatalog.find((c) => c.key === mKey);
                      return (
                        <div key={mKey} className="flex items-center gap-2 text-emerald-600 font-medium">
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-foreground">{mod?.name || mKey}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-card space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Configured Limits
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Employees:</span>
                      <span className="font-semibold font-mono">{maxEmployees}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Storage:</span>
                      <span className="font-semibold font-mono">{maxStorageGb} GB</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Departments:</span>
                      <span className="font-semibold font-mono">{maxDepartments}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Locations:</span>
                      <span className="font-semibold font-mono">{maxLocations}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">LMS Learners:</span>
                      <span className="font-semibold font-mono">{maxLmsLearners}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <DialogFooter className="px-6 py-3 border-t bg-muted/20 flex items-center justify-between sm:justify-between">
          <div>
            {step > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="gap-1.5 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>

            {step < 4 ? (
              <Button
                size="sm"
                onClick={() => {
                  if (step === 1 && !name.trim()) {
                    toast.error('Please enter a package name');
                    return;
                  }
                  if (step === 2 && selectedModules.length === 0) {
                    toast.error('Please select at least one module');
                    return;
                  }
                  setStep((s) => (s + 1) as any);
                }}
                className="gap-1.5 text-xs"
              >
                {step === 1 && 'Next: Module Access'}
                {step === 2 && 'Next: Features & Limits'}
                {step === 3 && 'Next: Review & Publish'}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={isSubmitting}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isSubmitting ? 'Publishing...' : 'Publish Package'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
