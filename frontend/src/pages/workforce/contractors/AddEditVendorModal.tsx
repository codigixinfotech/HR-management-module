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
import { toast } from 'sonner';
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

const VENDOR_TYPES = [
  { value: 'MANPOWER_AGENCY', label: 'Manpower Supply Agency' },
  { value: 'SECURITY_AGENCY', label: 'Security Agency' },
  { value: 'FACILITY_MANAGEMENT', label: 'Facility Management' },
  { value: 'HOUSEKEEPING', label: 'Housekeeping & Sanitation' },
  { value: 'LOGISTICS', label: 'Logistics & Warehousing' },
  { value: 'SKILLED_LABOUR', label: 'Skilled Technical Labour' },
  { value: 'OTHER', label: 'Other Contractor' },
];

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
    state: '',
    pincode: '',
    primaryContactName: '',
    primaryContactPhone: '',
    primaryContactEmail: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    branchId: '',
    status: 'ACTIVE',
    remarks: '',
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
        state: vendor.state || '',
        pincode: vendor.pincode || '',
        primaryContactName: vendor.primary_contact_name || '',
        primaryContactPhone: vendor.primary_contact_phone || '',
        primaryContactEmail: vendor.primary_contact_email || '',
        emergencyContactName: vendor.emergency_contact_name || '',
        emergencyContactPhone: vendor.emergency_contact_phone || '',
        branchId: vendor.branch_id || '',
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
        status: 'ACTIVE',
        remarks: '',
      });
    }
  }, [vendor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorCode.trim() || !formData.legalName.trim()) {
      toast.error('Vendor Code and Legal Name are mandatory');
      return;
    }
    if (!formData.primaryContactName.trim() || !formData.primaryContactPhone.trim() || !formData.primaryContactEmail.trim()) {
      toast.error('Primary contact name, phone, and email are mandatory');
      return;
    }

    try {
      setLoading(true);
      if (vendor) {
        await contractorApi.updateVendor(vendor.id, {
          ...formData,
          branchId: formData.branchId || null,
        });
        toast.success('Contractor vendor updated successfully');
      } else {
        await contractorApi.createVendor({
          ...formData,
          companyId,
          branchId: formData.branchId || null,
        });
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {vendor ? 'Edit Staffing Vendor' : 'Add Staffing Vendor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Section 1: Basic Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              1. Basic Details
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Vendor Code *</Label>
                <Input
                  value={formData.vendorCode}
                  onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })}
                  placeholder="e.g. VND-004"
                  className="h-8 text-xs font-mono"
                  disabled={!!vendor}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Vendor Type *</Label>
                <Select
                  value={formData.vendorType}
                  onValueChange={(val) => setFormData({ ...formData, vendorType: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Legal Agency Name *</Label>
                <Input
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  placeholder="e.g. TeamLease Manpower Services Pvt Ltd"
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Display Name / Trade Brand</Label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g. TeamLease Staffing"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Statutory Registration */}
          <div className="space-y-2 border-t pt-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              2. Statutory Registration
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Registration No.</Label>
                <Input
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="REG/MH/2022/..."
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">GSTIN</Label>
                <Input
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  placeholder="27AABCT..."
                  className="h-8 text-xs font-mono uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">PAN</Label>
                <Input
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                  placeholder="AABCT..."
                  className="h-8 text-xs font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Address */}
          <div className="space-y-2 border-t pt-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              3. Contact & Address
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Contact Person *</Label>
                <Input
                  value={formData.primaryContactName}
                  onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })}
                  placeholder="e.g. Ramesh Patil"
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mobile Phone *</Label>
                <Input
                  value={formData.primaryContactPhone}
                  onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })}
                  placeholder="+91 98200 12345"
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email *</Label>
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

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Registered Office Address</Label>
                <Input
                  value={formData.registeredAddress}
                  onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                  placeholder="Plot No. / Industrial Area / Street"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Pune"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Organization & Status */}
          <div className="space-y-2 border-t pt-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              4. Plant Branch & Status
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Allocated Plant Branch</Label>
                <Select
                  value={formData.branchId || 'ALL'}
                  onValueChange={(val) => setFormData({ ...formData, branchId: val === 'ALL' ? '' : val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">All Branches (Global)</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Vendor Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT" className="text-xs">Draft</SelectItem>
                    <SelectItem value="ACTIVE" className="text-xs">Active</SelectItem>
                    <SelectItem value="SUSPENDED" className="text-xs">Suspended</SelectItem>
                    <SelectItem value="TERMINATED" className="text-xs">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Remarks / Scope Notes</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Contractual conditions, special staffing qualifications, etc."
                className="text-xs h-16 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="text-xs">
              {loading ? 'Saving...' : vendor ? 'Update Vendor' : 'Save Vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
