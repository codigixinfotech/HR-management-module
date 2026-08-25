import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  GitFork,
  MapPin,
  Users,
  Search,
  Grid,
  List,
} from 'lucide-react';
import { branchesApi, locationsApi } from '@/api/organization';
import { employeesApi } from '@/api/employees';
import type { Branch, Company } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useMultiStepForm, type StepConfig } from '@/hooks/useMultiStepForm';
import { MultiStepFormFooter, MultiStepTabsHeader } from '@/components/ui/multi-step-form';

// ── 1. BRANCH SCHEMA ──
const branchSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  businessUnit: z.string().optional(),
  branchType: z.string().min(1, 'Branch Type is required'),
  addressLine1: z.string().min(1, 'Address Line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  pincode: z.string().min(1, 'PIN Code is required'),
  manager: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  timezone: z.string().optional(),
  workingCalendar: z.string().optional(),
  shiftGroup: z.string().optional(),
  maxCapacity: z.any().optional(),
  isActive: z.boolean().default(true),
});

type BranchFormValues = z.infer<typeof branchSchema>;

const branchSteps: StepConfig<BranchFormValues>[] = [
  {
    id: 'org',
    label: 'Organization',
    fields: ['companyId', 'code', 'name', 'branchType', 'businessUnit'],
  },
  {
    id: 'address',
    label: 'Address',
    fields: ['addressLine1', 'addressLine2', 'country', 'state', 'city', 'pincode'],
  },
  {
    id: 'contact',
    label: 'Contact',
    fields: ['manager', 'phone', 'email'],
  },
  {
    id: 'ops',
    label: 'Operations',
    fields: ['timezone', 'workingCalendar', 'shiftGroup', 'maxCapacity', 'isActive'],
  },
];

const DEFAULT_BRANCH_VALUES: BranchFormValues = {
  companyId: '',
  code: '',
  name: '',
  businessUnit: '',
  branchType: 'Branch Office',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
  manager: '',
  phone: '',
  email: '',
  timezone: '',
  workingCalendar: 'Standard 5-Day',
  shiftGroup: 'General Shift',
  maxCapacity: 100,
  isActive: true,
};

// ── SHIFT MASTER — Single source of truth for shift timings ──
const SHIFT_MASTER: Record<string, { label: string; workingHours: string; note?: string }> = {
  'General Shift':  { label: 'General Shift (9 AM – 6 PM)',    workingHours: '09:00 AM – 06:00 PM' },
  'Morning Shift':  { label: 'Morning Shift (6 AM – 2 PM)',    workingHours: '06:00 AM – 02:00 PM' },
  'Evening Shift':  { label: 'Evening Shift (2 PM – 10 PM)',   workingHours: '02:00 PM – 10:00 PM' },
  'Night Shift':    { label: 'Night Shift (10 PM – 6 AM)',     workingHours: '10:00 PM – 06:00 AM', note: 'Cross-midnight' },
  'Flexible':       { label: 'Flexible Hours',                   workingHours: 'Based on configured rules' },
  'Rotational':     { label: 'Rotational Shift',                 workingHours: 'Based on assigned schedule' },
};

// ── 2. LOCATION SCHEMA ──
const locationSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  code: z.string().min(1, 'Location Code is required'),
  name: z.string().min(1, 'Location Name is required'),
  buildingName: z.string().optional(),
  floor: z.string().optional(),
  wing: z.string().optional(),
  roomCabin: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  gps: z.string().optional(),
  workingHours: z.string().optional(),
  shift: z.string().optional(),
  isActive: z.boolean().default(true),
});

type LocationFormValues = z.infer<typeof locationSchema>;

const locationSteps: StepConfig<LocationFormValues>[] = [
  {
    id: 'info',
    label: 'General Info',
    fields: ['branchId', 'code', 'name'],
  },
  {
    id: 'building',
    label: 'Building Details',
    fields: ['buildingName', 'floor', 'wing', 'roomCabin', 'address', 'city', 'state', 'country', 'pincode'],
  },
  {
    id: 'ops',
    label: 'Operations',
    fields: ['workingHours', 'shift', 'gps', 'isActive'],
  },
];

const DEFAULT_LOCATION_VALUES: LocationFormValues = {
  branchId: '',
  code: '',
  name: '',
  buildingName: '',
  floor: '',
  wing: '',
  roomCabin: '',
  address: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
  gps: '',
  workingHours: '',
  shift: '',
  isActive: true,
};

export function BranchesTab({
  companyId,
  companies,
  triggerOpenWithCompanyId,
  onTriggerHandled,
}: {
  companyId?: string;
  companies: Company[];
  triggerOpenWithCompanyId?: string | null;
  onTriggerHandled?: () => void;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  
  const [editing, setEditing] = useState<Branch | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');
  
  const [activeBranchForLocation, setActiveBranchForLocation] = useState<Branch | null>(null);
  const [addressOverridden, setAddressOverridden] = useState(false);

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches', companyId],
    queryFn: () => branchesApi.list(companyId),
  });

  // Fetch all employees for the Facility Manager dropdown
  const { data: employeeData } = useQuery({
    queryKey: ['employees-all', companyId],
    queryFn: () => employeesApi.list({ pageSize: 500, companyId }),
  });
  const allEmployees = employeeData?.items ?? [];

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema) as any,
    defaultValues: {
      ...DEFAULT_BRANCH_VALUES,
      companyId: companyId ?? companies[0]?.id ?? '',
    },
  });

  const branchMultiStep = useMultiStepForm<BranchFormValues>({
    steps: branchSteps,
    form,
  });

  const locationForm = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema) as any,
    defaultValues: DEFAULT_LOCATION_VALUES,
  });

  const locationMultiStep = useMultiStepForm<LocationFormValues>({
    steps: locationSteps,
    form: locationForm,
  });

  const closeBranchModal = () => {
    setOpen(false);
    setEditing(null);
    branchMultiStep.resetMultiStepForm({
      ...DEFAULT_BRANCH_VALUES,
      companyId: companyId ?? companies[0]?.id ?? '',
    });
  };

  const closeLocationModal = () => {
    setLocationOpen(false);
    setActiveBranchForLocation(null);
    setAddressOverridden(false);
    locationMultiStep.resetMultiStepForm(DEFAULT_LOCATION_VALUES);
  };

  useEffect(() => {
    if (triggerOpenWithCompanyId) {
      setEditing(null);
      const nextNum = Math.floor(Math.random() * 90 + 10);
      const autoCode = `BR-${nextNum}`;
      
      branchMultiStep.resetMultiStepForm({
        ...DEFAULT_BRANCH_VALUES,
        companyId: triggerOpenWithCompanyId,
        code: autoCode,
      });
      setOpen(true);
      if (onTriggerHandled) {
        onTriggerHandled();
      }
    }
  }, [triggerOpenWithCompanyId, onTriggerHandled]);

  const upsertMutation = useMutation({
    mutationFn: async (values: BranchFormValues) => {
      const payload = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === '' ? null : v])
      ) as any;
      if (payload.maxCapacity) payload.maxCapacity = Number(payload.maxCapacity);

      return editing ? branchesApi.update(editing.id, payload) : branchesApi.create(payload);
    },
    onSuccess: (data: any, _variables) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(editing ? 'Branch updated' : 'Branch created');
      closeBranchModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const upsertAndAddLocationMutation = useMutation({
    mutationFn: async (values: BranchFormValues) => {
      const payload = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === '' ? null : v])
      ) as any;
      if (payload.maxCapacity) payload.maxCapacity = Number(payload.maxCapacity);

      return editing ? branchesApi.update(editing.id, payload) : branchesApi.create(payload);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch created successfully');
      closeBranchModal();
      if (data?.id) {
        triggerAddLocation(data);
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch deleted');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const generateUniqueLocationCode = (branch?: Branch | null) => {
    if (!branch) return `LOC-${Date.now().toString().slice(-4)}`;
    const branchCode = branch.code || 'BR';
    const existingCodes = new Set((branch.locations ?? []).map((loc: any) => loc.code));
    let count = (branch.locations?.length ?? 0) + 1;
    let code = `${branchCode}-LOC-${String(count).padStart(2, '0')}`;
    while (existingCodes.has(code)) {
      count++;
      code = `${branchCode}-LOC-${String(count).padStart(2, '0')}`;
    }
    return code;
  };

  const createLocationMutation = useMutation({
    mutationFn: async (values: LocationFormValues) => {
      const payload = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === '' ? null : v])
      ) as any;
      return locationsApi.create(values.branchId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Location added successfully');
      closeLocationModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const createAndAddAnotherLocationMutation = useMutation({
    mutationFn: async (values: LocationFormValues) => {
      const payload = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === '' ? null : v])
      ) as any;
      return locationsApi.create(values.branchId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Location added successfully');
      
      const currentCode = locationForm.getValues('code');
      const updatedLocs = [...(activeBranchForLocation?.locations ?? []), { code: currentCode }];
      const updatedBranch = activeBranchForLocation ? { ...activeBranchForLocation, locations: updatedLocs } : null;
      setActiveBranchForLocation(updatedBranch as any);

      locationMultiStep.resetMultiStepForm({
        branchId: locationForm.getValues('branchId'),
        code: generateUniqueLocationCode(updatedBranch as any),
        name: '',
        buildingName: '',
        floor: '',
        wing: '',
        roomCabin: '',
        address: activeBranchForLocation?.addressLine1 ?? '',
        city: activeBranchForLocation?.city ?? '',
        state: activeBranchForLocation?.state ?? '',
        country: activeBranchForLocation?.country ?? '',
        pincode: activeBranchForLocation?.pincode ?? '',
        gps: '',
        workingHours: '09:00 AM - 06:00 PM',
        shift: '',
        isActive: true,
      });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const triggerAddLocation = (branch: Branch) => {
    setActiveBranchForLocation(branch);
    locationMultiStep.resetMultiStepForm({
      branchId: branch.id,
      code: generateUniqueLocationCode(branch),
      name: '',
      buildingName: '',
      floor: '',
      wing: '',
      roomCabin: '',
      address: branch.addressLine1 ?? '',
      city: branch.city ?? '',
      state: branch.state ?? '',
      country: branch.country ?? '',
      pincode: branch.pincode ?? '',
      gps: '',
      workingHours: '09:00 AM - 06:00 PM',
      shift: '',
      isActive: true,
    });
    setLocationOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    const nextNum = Math.floor(Math.random() * 90 + 10);
    const autoCode = `BR-${nextNum}`;

    branchMultiStep.resetMultiStepForm({
      ...DEFAULT_BRANCH_VALUES,
      companyId: companyId ?? companies[0]?.id ?? '',
      code: autoCode,
    });
    setOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    branchMultiStep.resetMultiStepForm({
      companyId: branch.companyId,
      code: branch.code,
      name: branch.name,
      businessUnit: branch.businessUnit ?? '',
      branchType: branch.branchType ?? 'Branch Office',
      addressLine1: branch.addressLine1 ?? '',
      addressLine2: branch.addressLine2 ?? '',
      city: branch.city ?? '',
      state: branch.state ?? '',
      country: branch.country ?? '',
      pincode: branch.pincode ?? '',
      manager: branch.manager ?? '',
      phone: branch.phone ?? '',
      email: branch.email ?? '',
      timezone: branch.timezone ?? 'Asia/Kolkata',
      workingCalendar: branch.workingCalendar ?? 'Standard 5-Day',
      shiftGroup: branch.shiftGroup ?? 'General Shift',
      maxCapacity: branch.maxCapacity ?? 100,
      isActive: branch.isActive,
    });
    setOpen(true);
  };

  const filteredBranches = useMemo(() => {
    if (!branches) return [];
    if (!searchQuery.trim()) return branches;
    const q = searchQuery.toLowerCase();
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        (b.city && b.city.toLowerCase().includes(q))
    );
  }, [branches, searchQuery]);

  const handleBranchSubmit = form.handleSubmit((values) => {
    upsertMutation.mutate(values);
  });

  const handleSaveAndAddLocation = form.handleSubmit((values) => {
    upsertAndAddLocationMutation.mutate(values);
  });

  const handleLocationSubmit = locationForm.handleSubmit((values) => {
    createLocationMutation.mutate(values);
  });

  const handleSaveAndAddAnotherLocation = locationForm.handleSubmit((values) => {
    createAndAddAnotherLocationMutation.mutate(values);
  });

  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <GitFork className="h-4 w-4 text-primary" /> Branch Facilities & Regional Hubs
            </CardTitle>
            <CardDescription className="text-xs">
              Physical office locations, manufacturing plants, registered addresses & facility managers
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
              <button
                onClick={() => setDisplayMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-all ${displayMode === 'grid' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                title="Grid View"
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDisplayMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-all ${displayMode === 'table' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search branches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            {/* Add Branch Dialog */}
            <Dialog open={open} onOpenChange={(v) => { if (!v) closeBranchModal(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate} disabled={companies.length === 0}>
                  <Plus className="h-3.5 w-3.5" /> Add Branch Location
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Branch Facility' : 'Create New Branch Facility'}</DialogTitle>
                </DialogHeader>
                <form className="space-y-4 text-xs" onSubmit={handleBranchSubmit}>
                  <Tabs value={branchMultiStep.activeStepId} className="w-full">
                    <MultiStepTabsHeader
                      steps={branchSteps}
                      currentStep={branchMultiStep.currentStep}
                      onSelectStep={(idx) => branchMultiStep.goToStep(idx)}
                    />

                    {/* STEP 1: ORGANIZATION */}
                    <TabsContent value="org" className="space-y-4 mt-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Company Entity *</Label>
                        <Select
                          value={form.watch('companyId')}
                          onValueChange={(v) => form.setValue('companyId', v, { shouldValidate: true })}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((c) => (
                              <SelectItem key={c.id} value={c.id} className="text-xs">
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.companyId && (
                          <p className="text-[10px] text-destructive">{form.formState.errors.companyId.message}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Branch Code (Auto Generate) *</Label>
                          <Input placeholder="e.g. BR-PUN" {...form.register('code')} className="h-9 text-xs font-mono" />
                          {form.formState.errors.code && (
                            <p className="text-[10px] text-destructive">{form.formState.errors.code.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Branch Name *</Label>
                          <Input placeholder="e.g. Pune Development Center" {...form.register('name')} className="h-9 text-xs" />
                          {form.formState.errors.name && (
                            <p className="text-[10px] text-destructive">{form.formState.errors.name.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Branch Type *</Label>
                          <Select
                            value={form.watch('branchType')}
                            onValueChange={(v) => form.setValue('branchType', v, { shouldValidate: true })}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Head Office">Head Office</SelectItem>
                              <SelectItem value="Branch Office">Branch Office</SelectItem>
                              <SelectItem value="Regional Office">Regional Office</SelectItem>
                              <SelectItem value="Development Center">Development Center</SelectItem>
                              <SelectItem value="Client Office">Client Office</SelectItem>
                            </SelectContent>
                          </Select>
                          {form.formState.errors.branchType && (
                            <p className="text-[10px] text-destructive">{form.formState.errors.branchType.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Business Unit (Optional)</Label>
                          <Input placeholder="e.g. Technology" {...form.register('businessUnit')} className="h-9 text-xs" />
                        </div>
                      </div>
                    </TabsContent>

                    {/* STEP 2: ADDRESS */}
                    <TabsContent value="address" className="space-y-4 mt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Address Line 1 *</Label>
                          <Input placeholder="e.g. Plot 42, Hinjewadi Phase 3" {...form.register('addressLine1')} className="h-9 text-xs" />
                          {form.formState.errors.addressLine1 && (
                            <p className="text-[10px] text-destructive">{form.formState.errors.addressLine1.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Address Line 2</Label>
                          <Input placeholder="e.g. Near Metro Station" {...form.register('addressLine2')} className="h-9 text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="space-y-1.5 col-span-2">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Country *</Label>
                          <Input placeholder="e.g. India" {...form.register('country')} className="h-9 text-xs" />
                          {form.formState.errors.country && (
                            <p className="text-[10px] text-destructive">{form.formState.errors.country.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">State *</Label>
                          <Input placeholder="e.g. Maharashtra" {...form.register('state')} className="h-9 text-xs" />
                          {form.formState.errors.state && (
                            <p className="text-[10px] text-destructive">{form.formState.errors.state.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">City *</Label>
                          <Input placeholder="e.g. Pune" {...form.register('city')} className="h-9 text-xs" />
                          {form.formState.errors.city && (
                            <p className="text-[10px] text-destructive">{form.formState.errors.city.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">PIN Code *</Label>
                          <Input placeholder="e.g. 411057" {...form.register('pincode')} className="h-9 text-xs font-mono" />
                          {form.formState.errors.pincode && (
                            <p className="text-[10px] text-destructive">{form.formState.errors.pincode.message}</p>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* STEP 3: CONTACT */}
                    <TabsContent value="contact" className="space-y-4 mt-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Facility Manager</Label>
                          <Select
                            value={form.watch('manager') ?? '__none__'}
                            onValueChange={(v) => form.setValue('manager', v === '__none__' ? '' : v)}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Not Assigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__" className="text-xs text-muted-foreground italic">Not Assigned</SelectItem>
                              {allEmployees.map((emp) => (
                                <SelectItem
                                  key={emp.id}
                                  value={`${emp.firstName} ${emp.lastName}`}
                                  className="text-xs"
                                >
                                  {emp.employeeCode} – {emp.firstName} {emp.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Phone Number</Label>
                          <Input placeholder="e.g. +91 9876543210" {...form.register('phone')} className="h-9 text-xs font-mono" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Official Email</Label>
                          <Input placeholder="e.g. branch@company.com" {...form.register('email')} className="h-9 text-xs" />
                        </div>
                      </div>
                    </TabsContent>

                    {/* STEP 4: OPERATIONS */}
                    <TabsContent value="ops" className="space-y-4 mt-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Time Zone</Label>
                          <Input placeholder="e.g. Asia/Kolkata" {...form.register('timezone')} className="h-9 text-xs font-mono" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Working Calendar</Label>
                          <Input placeholder="e.g. Standard 5-Day" {...form.register('workingCalendar')} className="h-9 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Shift Group</Label>
                          <Input placeholder="e.g. General Shift" {...form.register('shiftGroup')} className="h-9 text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Maximum Capacity</Label>
                          <Input type="number" placeholder="250" {...form.register('maxCapacity')} className="h-9 text-xs font-mono" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Status</Label>
                          <Select
                            value={form.watch('isActive') ? 'active' : 'inactive'}
                            onValueChange={(val) => form.setValue('isActive', val === 'active')}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <MultiStepFormFooter
                    currentStep={branchMultiStep.currentStep}
                    totalSteps={branchMultiStep.totalSteps}
                    isFirstStep={branchMultiStep.isFirstStep}
                    isLastStep={branchMultiStep.isLastStep}
                    isEditing={!!editing}
                    isSubmitting={upsertMutation.isPending || upsertAndAddLocationMutation.isPending}
                    createLabel="Create Branch"
                    saveLabel="Save Changes"
                    showSaveAndContinue={!editing}
                    saveAndContinueLabel="Save & Add Location"
                    onCancel={closeBranchModal}
                    onBack={branchMultiStep.goToPreviousStep}
                    onNext={branchMultiStep.goToNextStep}
                    onSaveAndContinue={handleSaveAndAddLocation}
                  />
                </form>
              </DialogContent>
            </Dialog>

            {/* ── 3. SEPARATE LOCATION CREATION DIALOG ── */}
            <Dialog open={locationOpen} onOpenChange={(v) => { if (!v) closeLocationModal(); }}>
              <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto text-xs">
                <DialogHeader>
                  <DialogTitle>Add Physical Location inside Branch</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleLocationSubmit}>
                  <Tabs value={locationMultiStep.activeStepId} className="w-full">
                    <MultiStepTabsHeader
                      steps={locationSteps}
                      currentStep={locationMultiStep.currentStep}
                      onSelectStep={(idx) => locationMultiStep.goToStep(idx)}
                    />

                    {/* ── TAB 1: GENERAL INFO ── */}
                    <TabsContent value="info" className="space-y-4 mt-3">
                      {/* Branch Context Banner */}
                      {activeBranchForLocation && (() => {
                        const b = activeBranchForLocation;
                        const company = companies.find(c => c.id === b.companyId);
                        return (
                          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 space-y-1">
                            <p className="text-[10px] uppercase font-bold text-primary tracking-wide">Inherited Context</p>
                            <div className="grid grid-cols-3 gap-2 text-[11px] mt-1">
                              <div>
                                <span className="text-muted-foreground block">Company</span>
                                <span className="font-semibold text-foreground">{company?.name ?? '—'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">Business Unit</span>
                                <span className="font-semibold text-foreground">{b.businessUnit ?? company?.businessUnit ?? '—'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">Branch</span>
                                <span className="font-semibold text-foreground">{b.name}</span>
                              </div>
                            </div>
                            {(b.city || b.state || b.country) && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                📍 {[b.addressLine1, b.city, b.state, b.country].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Target Branch *</Label>
                        <Select
                          value={locationForm.watch('branchId')}
                          onValueChange={(val) => {
                            locationForm.setValue('branchId', val, { shouldValidate: true });
                            const selected = branches?.find(b => b.id === val) ?? null;
                            setActiveBranchForLocation(selected);
                            setAddressOverridden(false);
                            if (selected) {
                              locationForm.setValue('code', generateUniqueLocationCode(selected));
                              locationForm.setValue('address', selected.addressLine1 ?? '');
                              locationForm.setValue('city', selected.city ?? '');
                              locationForm.setValue('state', selected.state ?? '');
                              locationForm.setValue('country', selected.country ?? '');
                              locationForm.setValue('pincode', selected.pincode ?? '');
                            }
                          }}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select target branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches?.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.code} – {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {locationForm.formState.errors.branchId && (
                          <p className="text-[10px] text-destructive">{locationForm.formState.errors.branchId.message}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Location Code (Auto Generate) *</Label>
                          <Input placeholder="e.g. BR-58-LOC-01" {...locationForm.register('code')} className="h-9 text-xs font-mono" />
                          {locationForm.formState.errors.code && (
                            <p className="text-[10px] text-destructive">{locationForm.formState.errors.code.message}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Location Name *</Label>
                          <Input placeholder="e.g. Hyderabad Development Center" {...locationForm.register('name')} className="h-9 text-xs" />
                          {locationForm.formState.errors.name && (
                            <p className="text-[10px] text-destructive">{locationForm.formState.errors.name.message}</p>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* ── TAB 2: BUILDING DETAILS ── */}
                    <TabsContent value="building" className="space-y-4 mt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Building Name</Label>
                          <Input placeholder="e.g. Tower A" {...locationForm.register('buildingName')} className="h-9 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Floor</Label>
                          <Input placeholder="e.g. 5" {...locationForm.register('floor')} className="h-9 text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Wing</Label>
                          <Input placeholder="e.g. East Wing" {...locationForm.register('wing')} className="h-9 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Room / Cabin</Label>
                          <Input placeholder="e.g. Room 502" {...locationForm.register('roomCabin')} className="h-9 text-xs" />
                        </div>
                      </div>

                      {/* Address Section with Inherited Indicator */}
                      <div className="border-t pt-3 mt-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Location Address</p>
                            {!addressOverridden && activeBranchForLocation && (
                              <p className="text-[10px] text-primary mt-0.5">
                                ↳ Inherited from {activeBranchForLocation.name}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAddressOverridden(!addressOverridden);
                              if (addressOverridden && activeBranchForLocation) {
                                // restore branch defaults
                                locationForm.setValue('address', activeBranchForLocation.addressLine1 ?? '');
                                locationForm.setValue('city', activeBranchForLocation.city ?? '');
                                locationForm.setValue('state', activeBranchForLocation.state ?? '');
                                locationForm.setValue('country', activeBranchForLocation.country ?? '');
                                locationForm.setValue('pincode', activeBranchForLocation.pincode ?? '');
                              }
                            }}
                            className={`text-[10px] font-semibold px-2 py-1 rounded border transition-colors ${
                              addressOverridden
                                ? 'border-destructive/40 text-destructive bg-destructive/5 hover:bg-destructive/10'
                                : 'border-primary/30 text-primary bg-primary/5 hover:bg-primary/10'
                            }`}
                          >
                            {addressOverridden ? '✕ Reset to Branch Address' : '✏ Override Address'}
                          </button>
                        </div>

                        {!addressOverridden ? (
                          <div className="rounded-md bg-muted/30 border border-border px-3 py-2.5 text-[11px] text-muted-foreground">
                            {activeBranchForLocation ? (
                              <span>
                                {[activeBranchForLocation.addressLine1, activeBranchForLocation.city, activeBranchForLocation.state, activeBranchForLocation.country].filter(Boolean).join(', ')}
                                {activeBranchForLocation.pincode && ` – ${activeBranchForLocation.pincode}`}
                              </span>
                            ) : (
                              <span className="italic">Select a branch to auto-fill address</span>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5 col-span-2">
                                <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Street Address</Label>
                                <Input placeholder="e.g. Plot 42, Hitech City" {...locationForm.register('address')} className="h-9 text-xs" />
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                              <div className="space-y-1.5 col-span-2">
                                <Label className="text-[10px] font-semibold uppercase text-muted-foreground">City</Label>
                                <Input placeholder="e.g. Hyderabad" {...locationForm.register('city')} className="h-9 text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase text-muted-foreground">State</Label>
                                <Input placeholder="e.g. Telangana" {...locationForm.register('state')} className="h-9 text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-semibold uppercase text-muted-foreground">PIN Code</Label>
                                <Input placeholder="500081" {...locationForm.register('pincode')} className="h-9 text-xs font-mono" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* ── TAB 3: OPERATIONS ── */}
                    <TabsContent value="ops" className="space-y-4 mt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Shift Group *</Label>
                          <Select
                            value={locationForm.watch('shift') ?? ''}
                            onValueChange={(v) => {
                              locationForm.setValue('shift', v);
                              const master = SHIFT_MASTER[v];
                              if (master) locationForm.setValue('workingHours', master.workingHours);
                            }}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select shift group..." />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(SHIFT_MASTER).map(([key, s]) => (
                                <SelectItem key={key} value={key} className="text-xs">
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Working Hours</Label>
                            {locationForm.watch('shift') && (
                              <span className="text-[9px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded">
                                Auto from Shift
                              </span>
                            )}
                          </div>
                          <Input
                            readOnly
                            value={locationForm.watch('workingHours') ?? ''}
                            placeholder="Select a shift to auto-fill"
                            className="h-9 text-xs font-mono bg-muted/40 cursor-not-allowed text-muted-foreground"
                          />
                          {locationForm.watch('shift') && SHIFT_MASTER[locationForm.watch('shift')!]?.note && (
                            <p className="text-[9.5px] text-amber-600 font-medium">
                              ⚠ {SHIFT_MASTER[locationForm.watch('shift')!]!.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">GPS Coordinates (Optional)</Label>
                          <Input placeholder="e.g. 17.4485, 78.3741" {...locationForm.register('gps')} className="h-9 text-xs font-mono" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Status</Label>
                          <Select
                            value={locationForm.watch('isActive') ? 'active' : 'inactive'}
                            onValueChange={(val) => locationForm.setValue('isActive', val === 'active')}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <MultiStepFormFooter
                    currentStep={locationMultiStep.currentStep}
                    totalSteps={locationMultiStep.totalSteps}
                    isFirstStep={locationMultiStep.isFirstStep}
                    isLastStep={locationMultiStep.isLastStep}
                    isEditing={false}
                    isSubmitting={createLocationMutation.isPending || createAndAddAnotherLocationMutation.isPending}
                    createLabel="Save Location"
                    saveLabel="Save Changes"
                    showSaveAndContinue={true}
                    saveAndContinueLabel="Save & Add Another"
                    onCancel={closeLocationModal}
                    onBack={locationMultiStep.goToPreviousStep}
                    onNext={locationMultiStep.goToNextStep}
                    onSaveAndContinue={handleSaveAndAddAnotherLocation}
                  />
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {isLoading && <div className="py-12 text-center text-xs text-muted-foreground">Loading branches...</div>}

        {!isLoading && displayMode === 'grid' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {filteredBranches.map((branch) => {
              const baseCount = branch.maxCapacity ?? 100;
              const registeredStaff = branch.employees?.length ?? 0;
              const percentage = baseCount > 0 ? Math.round((registeredStaff / baseCount) * 100) : 0;

              return (
                <div
                  key={branch.id}
                  className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${branch.isActive ? 'bg-emerald-500' : 'bg-muted'}`} />
                        <span className="font-mono text-xs font-semibold text-primary">{branch.code}</span>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {branch.branchType ?? 'Branch Office'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(branch)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(branch.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <h3 className=" text-lg font-semibold text-foreground mt-2 group-hover:text-primary transition-colors">
                      {branch.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>
                        {branch.addressLine1 ? `${branch.addressLine1}, ` : ''}
                        {branch.city ?? 'Location'}, {branch.state ?? ''} ({branch.country ?? ''})
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Facility Manager</span>
                        <p className={`font-semibold truncate ${branch.manager ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                          {branch.manager ?? 'Not Assigned'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Direct Contact</span>
                        <p className={`font-mono text-[11px] ${branch.phone ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {branch.phone ?? '—'}
                        </p>
                      </div>
                    </div>

                    {/* Staff Occupancy Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium flex items-center gap-1">
                          <Users className="h-3 w-3" /> Facility Capacity
                        </span>
                        <span className="font-mono font-semibold text-foreground">
                          {registeredStaff} / {baseCount} Staff ({percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full bg-primary`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Physical Locations List */}
                    <div className="mt-4 border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Physical Locations</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-[10px] text-primary gap-1"
                          onClick={() => triggerAddLocation(branch)}
                        >
                          <Plus className="h-3 w-3" /> Add Location
                        </Button>
                      </div>
                      {branch.locations && branch.locations.length > 0 ? (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                          {branch.locations.map((loc) => (
                            <div
                              key={loc.id}
                              className="flex items-center justify-between rounded bg-muted/30 px-2 py-1 text-[11px]"
                            >
                              <div>
                                <span className="font-semibold text-foreground">{loc.name}</span>
                                {loc.buildingName && (
                                  <span className="text-[9.5px] text-muted-foreground ml-1.5">
                                    ({loc.buildingName}, Floor {loc.floor ?? '-'})
                                  </span>
                                )}
                              </div>
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-[9px] px-1 py-0 border-none font-mono">
                                {loc.code}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground text-center py-2 bg-muted/10 rounded-md border border-dashed">
                          No locations configured. Click "+ Add Location" to register one.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && displayMode === 'table' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Facility Code</TableHead>
                <TableHead className="text-xs">Branch Name</TableHead>
                <TableHead className="text-xs">Facility Type</TableHead>
                <TableHead className="text-xs">City & State</TableHead>
                <TableHead className="text-xs">Occupancy</TableHead>
                <TableHead className="text-xs">Locations</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches.map((branch) => {
                const baseCount = branch.maxCapacity ?? 100;
                const registeredStaff = branch.employees?.length ?? 0;

                return (
                  <TableRow key={branch.id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">{branch.code}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">{branch.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{branch.branchType ?? 'Branch Office'}</TableCell>
                    <TableCell className="text-xs">
                      {branch.city}, {branch.state}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold">
                      {registeredStaff} / {baseCount} Staff
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {branch.locations?.length ?? 0} Areas
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-primary"
                          onClick={() => triggerAddLocation(branch)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(branch)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteMutation.mutate(branch.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}