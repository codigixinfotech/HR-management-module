import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Building2, CheckCircle2 } from 'lucide-react';
import { companiesApi } from '@/api/organization';
import type { Company } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useMultiStepForm, type StepConfig } from '@/hooks/useMultiStepForm';
import { MultiStepFormFooter, MultiStepTabsHeader } from '@/components/ui/multi-step-form';

const companySchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Company Name is required'),
  legalName: z.string().min(1, 'Registered Legal Name is required'),
  shortName: z.string().optional(),
  entityType: z.string().optional(),
  parentCompanyId: z.string().optional(),
  
  // Registration Details
  cin: z.string().min(1, 'CIN / Registration Number is required'),
  gst: z.string().min(1, 'GST Number is required'),
  pan: z.string().min(1, 'PAN / Tax ID is required'),
  tan: z.string().optional(),
  msme: z.string().optional(),
  
  // Location
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  currency: z.string().min(1, 'Currency is required'),
  registeredAddress: z.string().min(1, 'Registered Address is required'),
  pincode: z.string().optional(),
  
  // Contact Information
  email: z.string().min(1, 'Official Email is required').email('Invalid email address'),
  phone: z.string().min(1, 'Phone Number is required'),
  website: z.string().optional(),
  
  // Organization
  businessUnit: z.string().optional(),
  defaultBranchId: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CompanyFormValues = z.infer<typeof companySchema>;

const companySteps: StepConfig<CompanyFormValues>[] = [
  {
    id: 'basic',
    label: 'Basic Info',
    fields: ['code', 'name', 'legalName', 'shortName', 'entityType', 'parentCompanyId'],
  },
  {
    id: 'registration',
    label: 'Registration',
    fields: ['cin', 'gst', 'pan', 'tan', 'msme'],
  },
  {
    id: 'location',
    label: 'Location',
    fields: ['country', 'state', 'city', 'timezone', 'currency', 'registeredAddress', 'pincode'],
  },
  {
    id: 'contact',
    label: 'Contact & Org',
    fields: ['email', 'phone', 'website', 'businessUnit', 'defaultBranchId', 'isActive'],
  },
];

const DEFAULT_COMPANY_VALUES: CompanyFormValues = {
  code: '',
  name: '',
  legalName: '',
  shortName: '',
  entityType: 'Private Limited',
  parentCompanyId: '',
  cin: '',
  gst: '',
  pan: '',
  tan: '',
  msme: '',
  country: '',
  state: '',
  city: '',
  timezone: '',
  currency: '',
  registeredAddress: '',
  pincode: '',
  email: '',
  phone: '',
  website: '',
  businessUnit: '',
  defaultBranchId: '',
  isActive: true,
};

interface CompaniesTabProps {
  onCompanyCreated?: (companyId: string) => void;
}

export function CompaniesTab({ onCompanyCreated }: CompaniesTabProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);

  const { data: companies, isLoading } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema) as any,
    defaultValues: DEFAULT_COMPANY_VALUES,
  });

  const {
    currentStep,
    activeStepId,
    isFirstStep,
    isLastStep,
    totalSteps,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetMultiStepForm,
  } = useMultiStepForm<CompanyFormValues>({
    steps: companySteps,
    form,
  });

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    resetMultiStepForm(DEFAULT_COMPANY_VALUES);
  };

  const upsertMutation = useMutation({
    mutationFn: async (values: CompanyFormValues) => {
      const payload = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === '' ? null : v])
      ) as any;

      return editing ? companiesApi.update(editing.id, payload) : companiesApi.create(payload);
    },
    onSuccess: (data: any, _variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success(editing ? 'Corporate Entity updated' : 'Corporate Entity created');
      
      const createdCompanyId = data?.id;
      const isEditMode = !!editing;
      closeModal();
      
      if (!isEditMode && createdCompanyId && onCompanyCreated) {
        onCompanyCreated(createdCompanyId);
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companiesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      toast.success('Corporate Entity deleted');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const openCreate = () => {
    setEditing(null);
    const nextNum = (companies?.length ?? 0) + 1;
    const autoCode = `COMP-${String(nextNum).padStart(2, '0')}`;

    resetMultiStepForm({
      ...DEFAULT_COMPANY_VALUES,
      code: autoCode,
    });
    setOpen(true);
  };

  const openEdit = (company: Company) => {
    setEditing(company);
    resetMultiStepForm({
      code: company.code,
      name: company.name,
      legalName: company.legalName ?? '',
      shortName: company.shortName ?? '',
      entityType: company.entityType ?? 'Private Limited',
      parentCompanyId: company.parentCompanyId ?? '',
      cin: company.cin ?? '',
      gst: company.gst ?? '',
      pan: company.pan ?? '',
      tan: company.tan ?? '',
      msme: company.msme ?? '',
      country: company.country,
      state: company.state ?? '',
      city: company.city ?? '',
      timezone: company.timezone ?? 'Asia/Kolkata',
      currency: company.currency,
      registeredAddress: company.registeredAddress ?? '',
      pincode: company.pincode ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      website: company.website ?? '',
      businessUnit: company.businessUnit ?? '',
      defaultBranchId: company.defaultBranchId ?? '',
      isActive: company.isActive,
    });
    setOpen(true);
  };

  const handleFinalSubmit = form.handleSubmit((values) => {
    upsertMutation.mutate(values);
  });

  const handleSaveAndContinue = form.handleSubmit((values) => {
    upsertMutation.mutate(values);
  });

  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Corporate Legal Entities
            </CardTitle>
            <CardDescription className="text-xs">
              Parent holding company & registered corporate legal entities
            </CardDescription>
          </div>

          <Dialog
            open={open}
            onOpenChange={(v) => {
              if (!v) closeModal();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> Add Entity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Corporate Entity' : 'Add Corporate Entity'}</DialogTitle>
              </DialogHeader>

              <form className="space-y-4 text-xs" onSubmit={handleFinalSubmit}>
                <Tabs value={activeStepId} className="w-full">
                  <MultiStepTabsHeader
                    steps={companySteps}
                    currentStep={currentStep}
                    onSelectStep={(targetIdx) => goToStep(targetIdx)}
                  />

                  {/* STEP 1: BASIC INFO */}
                  <TabsContent value="basic" className="space-y-4 mt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Entity Code (Auto Generate) *
                        </Label>
                        <Input
                          placeholder="e.g. COMP-01"
                          {...form.register('code')}
                          className="h-9 text-xs font-mono"
                        />
                        {form.formState.errors.code && (
                          <p className="text-[10px] text-destructive">{form.formState.errors.code.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Company Name *
                        </Label>
                        <Input
                          placeholder="e.g. Codigix Technologies Pvt Ltd"
                          {...form.register('name')}
                          className="h-9 text-xs"
                        />
                        {form.formState.errors.name && (
                          <p className="text-[10px] text-destructive">{form.formState.errors.name.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Registered Legal Name *
                        </Label>
                        <Input
                          placeholder="e.g. Codigix Technologies Private Limited"
                          {...form.register('legalName')}
                          className="h-9 text-xs"
                        />
                        {form.formState.errors.legalName && (
                          <p className="text-[10px] text-destructive">{form.formState.errors.legalName.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Short Name (Optional)</Label>
                        <Input placeholder="e.g. Codigix" {...form.register('shortName')} className="h-9 text-xs" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Entity Type (Optional)</Label>
                        <Select
                          value={form.watch('entityType')}
                          onValueChange={(val) => form.setValue('entityType', val, { shouldValidate: true })}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Private Limited">Private Ltd</SelectItem>
                            <SelectItem value="Public Limited">Public Ltd</SelectItem>
                            <SelectItem value="LLP">LLP</SelectItem>
                            <SelectItem value="Partnership">Partnership</SelectItem>
                            <SelectItem value="Branch Office">Branch Office</SelectItem>
                            <SelectItem value="Subsidiary">Subsidiary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Parent Company (Optional)
                        </Label>
                        <Select
                          value={form.watch('parentCompanyId') ?? ''}
                          onValueChange={(val) => form.setValue('parentCompanyId', val, { shouldValidate: true })}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select Parent Company" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None / Independent</SelectItem>
                            {companies?.filter(c => c.id !== editing?.id).map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* STEP 2: REGISTRATION */}
                  <TabsContent value="registration" className="space-y-4 mt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">
                          CIN / Registration Number *
                        </Label>
                        <Input
                          placeholder="e.g. U72200TG2026PTC123456"
                          {...form.register('cin')}
                          className="h-9 text-xs font-mono uppercase"
                        />
                        {form.formState.errors.cin && (
                          <p className="text-[10px] text-destructive">{form.formState.errors.cin.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">GST Number *</Label>
                        <Input
                          placeholder="e.g. 36ABCDE1234F1Z5"
                          {...form.register('gst')}
                          className="h-9 text-xs font-mono uppercase"
                        />
                        {form.formState.errors.gst && (
                          <p className="text-[10px] text-destructive">{form.formState.errors.gst.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">PAN / Tax ID *</Label>
                        <Input
                          placeholder="e.g. ABCDE1234F"
                          {...form.register('pan')}
                          className="h-9 text-xs font-mono uppercase"
                        />
                        {form.formState.errors.pan && (
                          <p className="text-[10px] text-destructive">{form.formState.errors.pan.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">TAN (Optional)</Label>
                        <Input
                          placeholder="e.g. MNDA12345B"
                          {...form.register('tan')}
                          className="h-9 text-xs font-mono uppercase"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">MSME Number (Optional)</Label>
                        <Input
                          placeholder="e.g. UDYAM-TG-01-12345"
                          {...form.register('msme')}
                          className="h-9 text-xs font-mono uppercase"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* STEP 3: LOCATION */}
                  <TabsContent value="location" className="space-y-4 mt-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Country *</Label>
                        <Input placeholder="e.g. India" {...form.register('country')} className="h-9 text-xs" />
                        {form.formState.errors.country && (
                          <p className="text-[10px] text-destructive">{form.formState.errors.country.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">State *</Label>
                        <Input placeholder="e.g. Telangana" {...form.register('state')} className="h-9 text-xs" />
                        {form.formState.errors.state && (
                          <p className="text-[10px] text-destructive">{form.formState.errors.state.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">City *</Label>
                        <Input placeholder="e.g. Hyderabad" {...form.register('city')} className="h-9 text-xs" />
                        {form.formState.errors.city && (
                          <p className="text-[10px] text-destructive">{form.formState.errors.city.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Time Zone *</Label>
                        <Input placeholder="e.g. Asia/Kolkata" {...form.register('timezone')} className="h-9 text-xs font-mono" />
                        {form.formState.errors.timezone && (
                          <p className="text-[10px] text-destructive">{form.formState.errors.timezone.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Currency *</Label>
                        <Input placeholder="e.g. INR" {...form.register('currency')} className="h-9 text-xs font-mono uppercase" />
                        {form.formState.errors.currency && (
                          <p className="text-[10px] text-destructive">{form.formState.errors.currency.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">PIN / ZIP Code (Optional)</Label>
                        <Input placeholder="e.g. 500081" {...form.register('pincode')} className="h-9 text-xs font-mono" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Registered Address *</Label>
                      <textarea
                        placeholder="e.g. Floor 3, Codigix Tower, HITEC City, Hyderabad"
                        {...form.register('registeredAddress')}
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      {form.formState.errors.registeredAddress && (
                        <p className="text-[10px] text-destructive">{form.formState.errors.registeredAddress.message}</p>
                      )}
                    </div>
                  </TabsContent>

                  {/* STEP 4: CONTACT & ORG */}
                  <TabsContent value="contact" className="space-y-4 mt-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Official Email *</Label>
                        <Input placeholder="e.g. info@codigix.com" {...form.register('email')} className="h-9 text-xs" />
                        {form.formState.errors.email && (
                          <p className="text-[10px] text-destructive">{form.formState.errors.email.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Phone Number *</Label>
                        <Input placeholder="e.g. +91 9876543210" {...form.register('phone')} className="h-9 text-xs" />
                        {form.formState.errors.phone && (
                          <p className="text-[10px] text-destructive">{form.formState.errors.phone.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Website (Optional)</Label>
                        <Input placeholder="e.g. https://codigix.com" {...form.register('website')} className="h-9 text-xs" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Business Unit (Optional)</Label>
                        <Input placeholder="e.g. IT Services" {...form.register('businessUnit')} className="h-9 text-xs" />
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
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  isFirstStep={isFirstStep}
                  isLastStep={isLastStep}
                  isEditing={!!editing}
                  isSubmitting={upsertMutation.isPending}
                  createLabel="Create Entity"
                  saveLabel="Save Changes"
                  showSaveAndContinue={!editing}
                  saveAndContinueLabel="Create Entity & Add Branch"
                  onCancel={closeModal}
                  onBack={goToPreviousStep}
                  onNext={goToNextStep}
                  onSaveAndContinue={handleSaveAndContinue}
                />
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">Company Name</TableHead>
              <TableHead className="text-xs">Legal Registered Name</TableHead>
              <TableHead className="text-xs">Country & Currency</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-right text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                  Loading corporate entities...
                </TableCell>
              </TableRow>
            )}
            {companies?.map((company) => (
              <TableRow key={company.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-mono text-xs font-semibold text-primary">{company.code}</TableCell>
                <TableCell className="text-xs font-semibold text-foreground">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      {company.name}
                    </span>
                    {company.shortName && <span className="text-[10px] text-muted-foreground pl-5">{company.shortName} &bull; {company.entityType}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-medium">{company.legalName ?? company.name}</TableCell>
                <TableCell className="text-xs font-medium">
                  {company.country} ({company.currency})
                </TableCell>
                <TableCell className="text-xs">
                  <Badge className={`${company.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground'} text-[10px] font-semibold`}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> {company.isActive ? 'Active Entity' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEdit(company)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete corporate entity "${company.name}"?`)) {
                        deleteMutation.mutate(company.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
