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
  Building,
  Clock,
  Layout,
  CheckCircle2,
} from 'lucide-react';
import { branchesApi, locationsApi } from '@/api/organization';
import type { Branch, Company, Location } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ── 1. BRANCH SCHEMA ──
const branchSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  businessUnit: z.string().optional(),
  branchType: z.string().min(1, 'Branch Type is required'),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
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
  
  const [shouldAddLocationAfterSave, setShouldAddLocationAfterSave] = useState(false);
  const [shouldAddAnotherLocation, setShouldAddAnotherLocation] = useState(false);
  const [activeBranchForLocation, setActiveBranchForLocation] = useState<Branch | null>(null);

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches', companyId],
    queryFn: () => branchesApi.list(companyId),
  });

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      companyId: companyId ?? companies[0]?.id ?? '',
      code: '',
      name: '',
      businessUnit: '',
      branchType: 'Branch Office',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      manager: '',
      phone: '',
      email: '',
      timezone: 'Asia/Kolkata',
      workingCalendar: 'Standard 5-Day',
      shiftGroup: 'General Shift',
      maxCapacity: 100,
      isActive: true,
    },
  });

  const locationForm = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
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
      country: 'India',
      pincode: '',
      gps: '',
      workingHours: '09:00 AM - 06:00 PM',
      shift: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (triggerOpenWithCompanyId) {
      setEditing(null);
      const nextNum = Math.floor(Math.random() * 90 + 10);
      const autoCode = `BR-${nextNum}`;
      
      form.reset({
        companyId: triggerOpenWithCompanyId,
        code: autoCode,
        name: '',
        businessUnit: '',
        branchType: 'Branch Office',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        manager: '',
        phone: '',
        email: '',
        timezone: 'Asia/Kolkata',
        workingCalendar: 'Standard 5-Day',
        shiftGroup: 'General Shift',
        maxCapacity: 100,
        isActive: true,
      });
      setOpen(true);
      if (onTriggerHandled) {
        onTriggerHandled();
      }
    }
  }, [triggerOpenWithCompanyId, onTriggerHandled, form]);

  const upsertMutation = useMutation({
    mutationFn: async (values: BranchFormValues) => {
      const payload = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === '' ? null : v])
      ) as any;
      if (payload.maxCapacity) payload.maxCapacity = Number(payload.maxCapacity);

      return editing ? branchesApi.update(editing.id, payload) : branchesApi.create(payload);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(editing ? 'Branch updated' : 'Branch created');
      setOpen(false);
      
      if (shouldAddLocationAfterSave && data?.id) {
        triggerAddLocation(data);
      }
      
      setEditing(null);
      form.reset();
      setShouldAddLocationAfterSave(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch deleted');
    },
  });

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
      
      if (shouldAddAnotherLocation) {
        const nextNum = Math.floor(Math.random() * 90 + 10);
        const branchCode = activeBranchForLocation?.code ?? 'BR';
        locationForm.reset({
          branchId: locationForm.getValues('branchId'),
          code: `${branchCode}-LOC-${nextNum}`,
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
      } else {
        setLocationOpen(false);
      }
      setShouldAddAnotherLocation(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const triggerAddLocation = (branch: Branch) => {
    setActiveBranchForLocation(branch);
    const nextNum = Math.floor(Math.random() * 90 + 10);
    locationForm.reset({
      branchId: branch.id,
      code: `${branch.code}-LOC-${nextNum}`,
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

    form.reset({
      companyId: companyId ?? companies[0]?.id ?? '',
      code: autoCode,
      name: '',
      businessUnit: '',
      branchType: 'Branch Office',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      manager: '',
      phone: '',
      email: '',
      timezone: 'Asia/Kolkata',
      workingCalendar: 'Standard 5-Day',
      shiftGroup: 'General Shift',
      maxCapacity: 100,
      isActive: true,
    });
    setOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    form.reset({
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
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate} disabled={companies.length === 0}>
                  <Plus className="h-3.5 w-3.5" /> Add Branch Location
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Branch Facility' : 'Create New Branch Facility'}</DialogTitle>
                </DialogHeader>
                <form className="space-y-4 text-xs" onSubmit={form.handleSubmit((values) => upsertMutation.mutate(values))}>
                  <Tabs defaultValue="org" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="org">Organization</TabsTrigger>
                      <TabsTrigger value="address">Address</TabsTrigger>
                      <TabsTrigger value="contact">Contact</TabsTrigger>
                      <TabsTrigger value="ops">Operations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="org" className="space-y-4 mt-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Company Entity *</Label>
                        <Select value={form.watch('companyId')} onValueChange={(v) => form.setValue('companyId', v)}>
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
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Branch Code (Auto Generate)</Label>
                          <Input placeholder="e.g. BR-PUN" {...form.register('code')} className="h-9 text-xs font-mono" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Branch Name *</Label>
                          <Input placeholder="e.g. Pune Development Center" {...form.register('name')} className="h-9 text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Branch Type *</Label>
                          <Select value={form.watch('branchType')} onValueChange={(v) => form.setValue('branchType', v)}>
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
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Business Unit (Optional)</Label>
                          <Input placeholder="e.g. Technology" {...form.register('businessUnit')} className="h-9 text-xs" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="address" className="space-y-4 mt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Address Line 1 *</Label>
                          <Input placeholder="e.g. Plot 42, Hinjewadi Phase 3" {...form.register('addressLine1')} className="h-9 text-xs" />
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
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">State *</Label>
                          <Input placeholder="e.g. Maharashtra" {...form.register('state')} className="h-9 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">City *</Label>
                          <Input placeholder="e.g. Pune" {...form.register('city')} className="h-9 text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">PIN Code *</Label>
                          <Input placeholder="e.g. 411057" {...form.register('pincode')} className="h-9 text-xs font-mono" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-4 mt-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Branch Manager</Label>
                          <Input placeholder="e.g. Rajesh Sharma" {...form.register('manager')} className="h-9 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Phone Number</Label>
                          <Input placeholder="e.g. +91 9876543210" {...form.register('phone')} className="h-9 text-xs font-mono" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Official Email</Label>
                          <Input placeholder="e.g. pune@company.com" {...form.register('email')} className="h-9 text-xs" />
                        </div>
                      </div>
                    </TabsContent>

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

                  <DialogFooter className="flex items-center gap-2 border-t pt-3 mt-3">
                    <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    {!editing && (
                      <Button
                        type="submit"
                        size="sm"
                        variant="secondary"
                        className="text-xs"
                        disabled={upsertMutation.isPending}
                        onClick={() => setShouldAddLocationAfterSave(true)}
                      >
                        Save & Add Location
                      </Button>
                    )}
                    <Button type="submit" size="sm" className="text-xs font-semibold" disabled={upsertMutation.isPending} onClick={() => setShouldAddLocationAfterSave(false)}>
                      {editing ? 'Save Changes' : 'Create Branch'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* ── 3. SEPARATE LOCATION CREATION DIALOG ── */}
            <Dialog open={locationOpen} onOpenChange={setLocationOpen}>
              <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto text-xs">
                <DialogHeader>
                  <DialogTitle>Add Physical Location inside Branch</DialogTitle>
                </DialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={locationForm.handleSubmit((values) => createLocationMutation.mutate(values))}
                >
                  <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="info">General Info</TabsTrigger>
                      <TabsTrigger value="building">Building Details</TabsTrigger>
                      <TabsTrigger value="ops">Operations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-4 mt-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Target Branch *</Label>
                        <Select
                          value={locationForm.watch('branchId')}
                          onValueChange={(val) => locationForm.setValue('branchId', val)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select target branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches?.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Location Code (Auto Generate)</Label>
                          <Input placeholder="e.g. HYD-F1" {...locationForm.register('code')} className="h-9 text-xs font-mono" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Location Name *</Label>
                          <Input placeholder="e.g. 5th Floor - Engineering Block" {...locationForm.register('name')} className="h-9 text-xs" />
                        </div>
                      </div>
                    </TabsContent>

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
                      <div className="border-t pt-3 mt-3 grid grid-cols-3 gap-3">
                        <div className="space-y-1.5 col-span-2">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Address Override</Label>
                          <Input placeholder="Leave blank to inherit branch address" {...locationForm.register('address')} className="h-9 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">PIN Code</Label>
                          <Input placeholder="PIN" {...locationForm.register('pincode')} className="h-9 text-xs font-mono" />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="ops" className="space-y-4 mt-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">GPS Coordinates (Optional)</Label>
                          <Input placeholder="e.g. 17.4485, 78.3741" {...locationForm.register('gps')} className="h-9 text-xs font-mono" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Working Hours</Label>
                          <Input placeholder="09:00 AM - 06:00 PM" {...locationForm.register('workingHours')} className="h-9 text-xs font-mono" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Shift Group</Label>
                          <Input placeholder="General Shift" {...locationForm.register('shift')} className="h-9 text-xs" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
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

                  <DialogFooter className="flex items-center gap-2 border-t pt-3 mt-3">
                    <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setLocationOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      variant="secondary"
                      className="text-xs"
                      disabled={createLocationMutation.isPending}
                      onClick={() => setShouldAddAnotherLocation(true)}
                    >
                      Save & Add Another
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="text-xs font-semibold"
                      disabled={createLocationMutation.isPending}
                      onClick={() => setShouldAddAnotherLocation(false)}
                    >
                      Save Location
                    </Button>
                  </DialogFooter>
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
              const registeredStaff = branch.employees?.length ?? Math.floor(Math.random() * 20 + 10);
              const percentage = Math.round((registeredStaff / baseCount) * 100);

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
                        <p className="font-semibold text-foreground truncate">{branch.manager ?? 'Rajesh Sharma'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Direct Contact</span>
                        <p className="font-mono text-foreground text-[11px]">{branch.phone ?? '+91 20 6789 0100'}</p>
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
                const registeredStaff = branch.employees?.length ?? 24;

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
