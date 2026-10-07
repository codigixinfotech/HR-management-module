import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, ShieldCheck, Phone, MapPin, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from '@/api/organization';
import { contractorApi, type ContractorVendor } from '@/api/contractor-management';
import type { Branch } from '@/api/types';

interface AddEditVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: ContractorVendor | null;
  companyId?: string;
  branches: Branch[];
  onSuccess: () => void;
}

export function AddEditVendorModal({
  open,
  onOpenChange,
  vendor,
  companyId,
  branches,
  onSuccess,
}: AddEditVendorModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorCode: '',
    legalName: '',
    displayName: '',
    vendorType: 'MANPOWER_AGENCY',
    registrationNumber: '',
    gstin: '',
    pan: '',
    registeredAddress: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    primaryContactName: '',
    primaryContactPhone: '',
    primaryContactEmail: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    branchId: '',
    departmentId: '',
    status: 'ACTIVE',
    remarks: '',
  });

  const targetBranchForDept =
    formData.branchId && formData.branchId !== 'ALL'
      ? formData.branchId
      : undefined;

  const { data: departments = [], isLoading: loadingDepartments } = useQuery({
    queryKey: ['departments', companyId, targetBranchForDept],
    queryFn: () => departmentsApi.list(companyId, targetBranchForDept),
    enabled: Boolean(companyId),
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        vendorCode: vendor.vendor_code || '',
        legalName: vendor.legal_name || '',
        displayName: vendor.display_name || vendor.legal_name || '',
        vendorType: vendor.vendor_type || 'MANPOWER_AGENCY',
        registrationNumber: vendor.registration_number || '',
        gstin: vendor.gstin || '',
        pan: vendor.pan || '',
        registeredAddress: vendor.registered_address || '',
        city: vendor.city || '',
        state: vendor.state || 'Maharashtra',
        pincode: vendor.pincode || '',
        primaryContactName: vendor.primary_contact_name || '',
        primaryContactPhone: vendor.primary_contact_phone || '',
        primaryContactEmail: vendor.primary_contact_email || '',
        emergencyContactName: vendor.emergency_contact_name || '',
        emergencyContactPhone: vendor.emergency_contact_phone || '',
        branchId: vendor.branch_id || (vendor.branch_name?.toLowerCase().includes('head office') ? 'HEAD_OFFICE' : ''),
        departmentId: vendor.department_id || '',
        status: vendor.status || 'ACTIVE',
        remarks: vendor.remarks || '',
      });
    } else {
      setFormData({
        vendorCode: `VND-${Math.floor(100 + Math.random() * 900)}`,
        legalName: '',
        displayName: '',
        vendorType: 'MANPOWER_AGENCY',
        registrationNumber: '',
        gstin: '',
        pan: '',
        registeredAddress: '',
        city: '',
        state: 'Maharashtra',
        pincode: '',
        primaryContactName: '',
        primaryContactPhone: '',
        primaryContactEmail: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        branchId: '',
        departmentId: '',
        status: 'ACTIVE',
        remarks: '',
      });
    }
  }, [vendor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorCode.trim() || !formData.legalName.trim()) {
      toast.error('Vendor Code and Legal Agency Name are mandatory');
      return;
    }
    if (!formData.primaryContactName.trim() || !formData.primaryContactPhone.trim() || !formData.primaryContactEmail.trim()) {
      toast.error('Primary contact person, mobile phone, and email are mandatory');
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        ...formData,
        vendorType: formData.vendorType || 'MANPOWER_AGENCY',
        branchId: formData.branchId && formData.branchId !== 'ALL' ? formData.branchId : null,
        departmentId: formData.departmentId && formData.departmentId !== 'ALL' ? formData.departmentId : null,
        companyId,
      };

      if (vendor) {
        await contractorApi.updateVendor(vendor.id, payload);
        toast.success('Contractor vendor updated successfully');
      } else {
        await contractorApi.createVendor(payload);
        toast.success('Contractor vendor registered successfully');
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-6">
        {/* ERP-Standard Header */}
        <DialogHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {vendor ? `Edit Staffing Vendor (${vendor.vendor_code})` : 'Add Staffing Vendor'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Register external contractor agency profile, statutory registrations, and plant branch mapping
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-3 pb-2 text-xs">
          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-border/40 text-indigo-700 dark:text-indigo-400 font-semibold uppercase tracking-wider text-[11px]">
              <Building2 className="h-3.5 w-3.5" />
              <span>1. Basic Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Vendor Code <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    value={formData.vendorCode}
                    onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
                    placeholder="e.g. VND-102"
                    className="h-8 text-xs font-mono"
                    disabled={!!vendor}
                    required
                  />
                  {!vendor && (
                    <span className="absolute right-2.5 top-2 text-[10px] text-muted-foreground font-mono flex items-center gap-1 pointer-events-none">
                      <Sparkles className="h-2.5 w-2.5 text-indigo-500" /> Auto
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Legal Agency Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  placeholder="e.g. TeamLease Manpower Services Pvt Ltd"
                  className="h-8 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Allocated Branch</Label>
                <Select
                  value={formData.branchId || 'ALL'}
                  onValueChange={(val) => {
                    const newBranch = val === 'ALL' ? '' : val;
                    setFormData({ ...formData, branchId: newBranch, departmentId: 'ALL' });
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Branches (Global)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs font-medium">All Branches (Global)</SelectItem>
                    <SelectItem value="HEAD_OFFICE" className="text-xs font-semibold">Head Office</SelectItem>
                    {branches
                      .filter((b) => !b.name?.toLowerCase().includes('head office'))
                      .map((b) => (
                        <SelectItem key={b.id} value={b.id} className="text-xs">
                          {b.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-foreground">Allocated Department</Label>
                  {loadingDepartments && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-2.5 w-2.5 animate-spin text-indigo-500" /> Loading...
                    </span>
                  )}
                </div>
                <Select
                  value={formData.departmentId || 'ALL'}
                  onValueChange={(val) => setFormData({ ...formData, departmentId: val === 'ALL' ? '' : val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Departments (General)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs font-medium">
                      All Departments (General)
                    </SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-xs">
                        {d.name} {d.code ? `(${d.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Display Name / Trade Brand</Label>
              <Input
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. TeamLease Staffing"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Section 2: Statutory Registration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-border/40 text-indigo-700 dark:text-indigo-400 font-semibold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>2. Statutory Registration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Registration No.</Label>
                <Input
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="REG/MH/2024/..."
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">GSTIN</Label>
                <Input
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  placeholder="27AABCT..."
                  className="h-8 text-xs font-mono uppercase bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">PAN</Label>
                <Input
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                  placeholder="AABCT..."
                  className="h-8 text-xs font-mono uppercase bg-background"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Address */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-border/40 text-indigo-700 dark:text-indigo-400 font-semibold uppercase tracking-wider text-[11px]">
              <Phone className="h-3.5 w-3.5" />
              <span>3. Contact & Address</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Contact Person <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formData.primaryContactName}
                  onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })}
                  placeholder="e.g. Ramesh Patil"
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Mobile Phone <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formData.primaryContactPhone}
                  onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })}
                  placeholder="+91 98200 12345"
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Email <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={formData.primaryContactEmail}
                  onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })}
                  placeholder="contact@agency.com"
                  className="h-8 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="space-y-1.5 sm:col-span-6">
                <Label className="text-xs font-medium text-foreground">Registered Office Address</Label>
                <Input
                  value={formData.registeredAddress}
                  onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                  placeholder="Plot No. / Industrial Area / Street"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-3">
                <Label className="text-xs font-medium text-foreground">City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Pune"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-3">
                <Label className="text-xs font-medium text-foreground">Pincode</Label>
                <Input
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="e.g. 411001"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Status & Notes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-border/40 text-indigo-700 dark:text-indigo-400 font-semibold uppercase tracking-wider text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>4. Vendor Status & Remarks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Vendor Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="h-8 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE" className="text-xs text-emerald-600 font-medium">Active</SelectItem>
                    <SelectItem value="DRAFT" className="text-xs text-slate-600">Draft</SelectItem>
                    <SelectItem value="SUSPENDED" className="text-xs text-amber-600 font-medium">Suspended</SelectItem>
                    <SelectItem value="TERMINATED" className="text-xs text-rose-600 font-medium">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-medium text-foreground">Remarks / Scope Notes</Label>
                <Input
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Contractual conditions, special staffing qualifications, etc."
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Sticky Dialog Footer */}
          <DialogFooter className="pt-3 border-t border-border flex items-center justify-between sm:justify-between sticky bottom-0 bg-background/95 backdrop-blur-sm -mx-6 -mb-6 px-6 py-3 z-10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs h-8 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="text-xs h-8 px-5 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {vendor ? 'Update Staffing Vendor' : 'Save Staffing Vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
