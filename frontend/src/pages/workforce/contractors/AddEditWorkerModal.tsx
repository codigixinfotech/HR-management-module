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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { contractorApi, type ContractorWorker, type ContractorVendor, type ContractorContract } from '@/api/contractor-management';
import type { Branch } from '@/api/types';

interface AddEditWorkerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker?: ContractorWorker | null;
  vendors: ContractorVendor[];
  contracts: ContractorContract[];
  branches: Branch[];
  companyId?: string;
  onSuccess: () => void;
}

const SKILL_LEVELS = ['Unskilled', 'Semi-Skilled', 'Skilled', 'Highly Skilled'];
const GOVT_ID_TYPES = ['AADHAAR', 'PAN', 'VOTER_ID', 'DRIVING_LICENSE', 'PASSPORT'];

export function AddEditWorkerModal({
  open,
  onOpenChange,
  worker,
  vendors,
  contracts,
  branches,
  companyId,
  onSuccess,
}: AddEditWorkerModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: '',
    contractId: '',
    branchId: '',
    workerCode: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male',
    dateOfBirth: '',
    mobile: '',
    email: '',
    designation: 'Contract Worker',
    skill: 'General Assembly',
    skillLevel: 'Semi-Skilled',
    governmentIdType: 'AADHAAR',
    governmentIdNumber: '',
    joiningDate: '',
    status: 'ACTIVE',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  useEffect(() => {
    if (worker) {
      setFormData({
        vendorId: worker.vendor_id || '',
        contractId: worker.contract_id || '',
        branchId: worker.branch_id || '',
        workerCode: worker.worker_code || '',
        firstName: worker.first_name || '',
        middleName: worker.middle_name || '',
        lastName: worker.last_name || '',
        gender: worker.gender || 'Male',
        dateOfBirth: worker.date_of_birth ? worker.date_of_birth.split('T')[0] : '',
        mobile: worker.mobile || '',
        email: worker.email || '',
        designation: worker.designation || 'Contract Worker',
        skill: worker.skill || 'General Assembly',
        skillLevel: worker.skill_level || 'Semi-Skilled',
        governmentIdType: worker.government_id_type || 'AADHAAR',
        governmentIdNumber: worker.government_id_number || '',
        joiningDate: worker.joining_date ? worker.joining_date.split('T')[0] : '',
        status: worker.status || 'ACTIVE',
        emergencyContactName: worker.emergency_contact_name || '',
        emergencyContactPhone: worker.emergency_contact_phone || '',
      });
    } else {
      setFormData({
        vendorId: vendors[0]?.id || '',
        contractId: contracts[0]?.id || '',
        branchId: '',
        workerCode: `CW-${Math.floor(1000 + Math.random() * 9000)}`,
        firstName: '',
        middleName: '',
        lastName: '',
        gender: 'Male',
        dateOfBirth: '1995-01-01',
        mobile: '',
        email: '',
        designation: 'Contract Operator',
        skill: 'Assembly & Production',
        skillLevel: 'Semi-Skilled',
        governmentIdType: 'AADHAAR',
        governmentIdNumber: '',
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        emergencyContactName: '',
        emergencyContactPhone: '',
      });
    }
  }, [worker, open, vendors, contracts]);

  const availableContracts = formData.vendorId
    ? contracts.filter((c) => c.vendor_id === formData.vendorId)
    : contracts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId) {
      toast.error('Please select a contractor vendor');
      return;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    if (!formData.mobile.trim()) {
      toast.error('Mobile number is required');
      return;
    }
    if (!formData.joiningDate) {
      toast.error('Joining date is required');
      return;
    }

    try {
      setLoading(true);
      const chosenContractId = formData.contractId || availableContracts[0]?.id || contracts[0]?.id;
      if (!chosenContractId) {
        toast.error('Please assign or create a contract first');
        setLoading(false);
        return;
      }

      const payload: any = {
        vendorId: formData.vendorId,
        contractId: chosenContractId,
        branchId: formData.branchId || null,
        workerCode: formData.workerCode.trim(),
        firstName: formData.firstName.trim(),
        middleName: formData.middleName?.trim() || null,
        lastName: formData.lastName.trim(),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || null,
        mobile: formData.mobile.trim(),
        email: formData.email?.trim() || null,
        designation: formData.designation.trim(),
        skill: formData.skill.trim(),
        skillLevel: formData.skillLevel,
        governmentIdType: formData.governmentIdType,
        governmentIdNumber: formData.governmentIdNumber?.trim() || null,
        joiningDate: formData.joiningDate,
        status: formData.status,
        emergencyContactName: formData.emergencyContactName?.trim() || null,
        emergencyContactPhone: formData.emergencyContactPhone?.trim() || null,
        companyId,
      };

      if (worker?.id) {
        await contractorApi.updateWorker(worker.id, payload);
        toast.success('Worker updated successfully');
      } else {
        await contractorApi.createWorker(payload);
        toast.success('Worker enrolled successfully');
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save worker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{worker ? 'Edit Worker Profile' : 'Enroll New Contractor Worker'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Vendor & Contract Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Contractor Vendor *</Label>
              <Select
                value={formData.vendorId}
                onValueChange={(val) => {
                  setFormData({ ...formData, vendorId: val, contractId: '' });
                }}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Select staffing agency" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs">
                      {v.display_name || v.legal_name} ({v.vendor_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Contract Reference *</Label>
              <Select
                value={formData.contractId}
                onValueChange={(val) => setFormData({ ...formData, contractId: val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Select contract" />
                </SelectTrigger>
                <SelectContent>
                  {availableContracts.length === 0 ? (
                    <SelectItem value="none" disabled className="text-xs">No active contracts for vendor</SelectItem>
                  ) : (
                    availableContracts.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.contract_number} ({c.scope_of_work?.slice(0, 25)}...)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Personal Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-medium">Worker Code *</Label>
              <Input
                className="h-8 text-xs mt-1"
                placeholder="CW-001"
                value={formData.workerCode}
                onChange={(e) => setFormData({ ...formData, workerCode: e.target.value })}
                required
              />
            </div>
            <div>
              <Label className="text-xs font-medium">First Name *</Label>
              <Input
                className="h-8 text-xs mt-1"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Last Name *</Label>
              <Input
                className="h-8 text-xs mt-1"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-medium">Mobile Phone *</Label>
              <Input
                className="h-8 text-xs mt-1"
                placeholder="+91 98765 43210"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Email</Label>
              <Input
                type="email"
                className="h-8 text-xs mt-1"
                placeholder="worker@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(val) => setFormData({ ...formData, gender: val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male" className="text-xs">Male</SelectItem>
                  <SelectItem value="Female" className="text-xs">Female</SelectItem>
                  <SelectItem value="Other" className="text-xs">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Skill & Deployment Spec */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-medium">Skill / Trade *</Label>
              <Input
                className="h-8 text-xs mt-1"
                placeholder="e.g. CNC Operator, Fitter"
                value={formData.skill}
                onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                required
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Skill Classification</Label>
              <Select
                value={formData.skillLevel}
                onValueChange={(val) => setFormData({ ...formData, skillLevel: val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((lvl) => (
                    <SelectItem key={lvl} value={lvl} className="text-xs">{lvl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Designation</Label>
              <Input
                className="h-8 text-xs mt-1"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>
          </div>

          {/* Government ID & Joining */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-medium">ID Document Type</Label>
              <Select
                value={formData.governmentIdType}
                onValueChange={(val) => setFormData({ ...formData, governmentIdType: val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOVT_ID_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">ID Number</Label>
              <Input
                className="h-8 text-xs mt-1"
                placeholder="XXXX-XXXX-XXXX"
                value={formData.governmentIdNumber}
                onChange={(e) => setFormData({ ...formData, governmentIdNumber: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Joining Date *</Label>
              <Input
                type="date"
                className="h-8 text-xs mt-1"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Status & Emergency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-medium">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE" className="text-xs">Active</SelectItem>
                  <SelectItem value="INACTIVE" className="text-xs">Inactive</SelectItem>
                  <SelectItem value="ON_LEAVE" className="text-xs">On Leave</SelectItem>
                  <SelectItem value="EXITED" className="text-xs">Exited</SelectItem>
                  <SelectItem value="SUSPENDED" className="text-xs">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Emergency Contact Name</Label>
              <Input
                className="h-8 text-xs mt-1"
                placeholder="Guardian / Spouse"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Emergency Phone</Label>
              <Input
                className="h-8 text-xs mt-1"
                placeholder="+91..."
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Saving...' : worker ? 'Update Worker' : 'Enroll Worker'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
