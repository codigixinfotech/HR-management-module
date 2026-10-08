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
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { departmentsApi } from '@/api/organization';
import { contractorApi, type ContractorContract, type ContractorVendor } from '@/api/contractor-management';
import type { Branch } from '@/api/types';

interface AddEditContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: ContractorContract | null;
  vendors: ContractorVendor[];
  branches: Branch[];
  companyId?: string;
  onSuccess: () => void;
}

const BILLING_TYPES = [
  { value: 'MONTHLY', label: 'Monthly Retainer' },
  { value: 'HOURLY', label: 'Hourly Rate' },
  { value: 'DAILY', label: 'Daily Rate' },
  { value: 'PER_PIECE', label: 'Per Unit / Piece Rate' },
  { value: 'FIXED', label: 'Fixed Milestone Fee' },
];

export function AddEditContractModal({
  open,
  onOpenChange,
  contract,
  vendors,
  branches,
  companyId,
  onSuccess,
}: AddEditContractModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: '',
    branchId: '',
    departmentId: '',
    contractNumber: '',
    contractType: 'MANPOWER_SUPPLY',
    contractStartDate: '',
    contractEndDate: '',
    maximumHeadcount: 10,
    billingType: 'MONTHLY',
    billingRate: '',
    paymentTerms: 'Net 30 Days',
    scopeOfWork: '',
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

  const resolveBranchId = (bId?: string | null, bName?: string | null) => {
    if (!bId && !bName) return 'ALL';
    if (
      bId === 'HEAD_OFFICE' ||
      bName?.toLowerCase().includes('head office') ||
      bName?.toLowerCase().includes('head')
    ) {
      return 'HEAD_OFFICE';
    }
    if (bId && branches.some((b) => b.id === bId)) return bId;
    const matched = branches.find((b) => b.name?.trim().toLowerCase() === bName?.trim().toLowerCase());
    if (matched) return matched.id;
    return 'ALL';
  };

  useEffect(() => {
    if (contract) {
      setFormData({
        vendorId: contract.vendor_id || '',
        branchId: resolveBranchId(contract.branch_id, contract.branch_name),
        departmentId: contract.department_id || '',
        contractNumber: contract.contract_number || '',
        contractType: contract.contract_type || 'MANPOWER_SUPPLY',
        contractStartDate: contract.contract_start_date ? contract.contract_start_date.split('T')[0] : '',
        contractEndDate: contract.contract_end_date ? contract.contract_end_date.split('T')[0] : '',
        maximumHeadcount: contract.maximum_headcount || 10,
        billingType: contract.billing_type || 'MONTHLY',
        billingRate: contract.billing_rate ? String(contract.billing_rate) : '',
        paymentTerms: contract.payment_terms || 'Net 30 Days',
        scopeOfWork: contract.scope_of_work || '',
        status: contract.status || 'ACTIVE',
        remarks: contract.remarks || '',
      });
    } else {
      setFormData({
        vendorId: vendors[0]?.id || '',
        branchId: '',
        departmentId: '',
        contractNumber: `CNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        contractType: 'MANPOWER_SUPPLY',
        contractStartDate: new Date().toISOString().split('T')[0],
        contractEndDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        maximumHeadcount: 10,
        billingType: 'MONTHLY',
        billingRate: '',
        paymentTerms: 'Net 30 Days',
        scopeOfWork: '',
        status: 'ACTIVE',
        remarks: '',
      });
    }
  }, [contract, open, vendors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId) {
      toast.error('Please select a staffing vendor');
      return;
    }
    if (!formData.contractNumber.trim()) {
      toast.error('Contract number is required');
      return;
    }
    if (!formData.contractStartDate || !formData.contractEndDate) {
      toast.error('Start and end dates are required');
      return;
    }

    try {
      setLoading(true);
      const hoBranch = branches.find((b) => b.name?.toLowerCase().includes('head office') || b.code === 'HO');
      const branchIdToSend =
        formData.branchId === 'HEAD_OFFICE'
          ? (hoBranch?.id || 'HEAD_OFFICE')
          : formData.branchId && formData.branchId !== 'ALL'
          ? formData.branchId
          : null;

      const payload: any = {
        vendorId: formData.vendorId,
        branchId: branchIdToSend,
        departmentId: formData.departmentId && formData.departmentId !== 'ALL' ? formData.departmentId : null,
        contractNumber: formData.contractNumber.trim(),
        contractType: formData.contractType || 'MANPOWER_SUPPLY',
        contractStartDate: formData.contractStartDate,
        contractEndDate: formData.contractEndDate,
        maximumHeadcount: Number(formData.maximumHeadcount) || 1,
        billingType: formData.billingType,
        billingRate: formData.billingRate ? Number(formData.billingRate) : 0,
        paymentTerms: formData.paymentTerms,
        scopeOfWork: formData.scopeOfWork || 'General Manpower Supply Agreement',
        status: formData.status,
        remarks: formData.remarks || null,
        companyId,
      };

      if (contract?.id) {
        await contractorApi.updateContract(contract.id, payload);
        toast.success('Contract updated successfully');
      } else {
        await contractorApi.createContract(payload);
        toast.success('Contract created successfully');
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contract ? 'Edit Contract' : 'Create New Contractor Contract'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Vendor Agency *</Label>
              <Select
                value={formData.vendorId}
                onValueChange={(val) => setFormData({ ...formData, vendorId: val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="Select staffing vendor" />
                </SelectTrigger>
                <SelectContent>
                  {contract?.vendor_id && !vendors.some((v) => v.id === contract.vendor_id) && (
                    <SelectItem key={contract.vendor_id} value={contract.vendor_id} className="text-xs">
                      {contract.vendor_name || 'Assigned Vendor'} {contract.vendor_code ? `(${contract.vendor_code})` : ''}
                    </SelectItem>
                  )}
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs">
                      {v.display_name || v.legal_name} ({v.vendor_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Contract Number *</Label>
              <Input
                className="h-8 text-xs mt-1"
                placeholder="e.g. CNT-2024-001"
                value={formData.contractNumber}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                required
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Allocated Branch</Label>
              <Select
                value={formData.branchId || 'ALL'}
                onValueChange={(val) => {
                  const newBranch = val === 'ALL' ? '' : val;
                  setFormData({ ...formData, branchId: newBranch, departmentId: 'ALL' });
                }}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="All Branches (Global)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs font-medium">All Branches (Global)</SelectItem>
                  <SelectItem value="HEAD_OFFICE" className="text-xs font-semibold">Head Office</SelectItem>
                  {branches
                    .filter((b) => !b.name?.toLowerCase().includes('head office'))
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Allocated Department</Label>
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
                <SelectTrigger className="h-8 text-xs mt-1">
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

            <div>
              <Label className="text-xs font-medium">Start Date *</Label>
              <Input
                type="date"
                className="h-8 text-xs mt-1"
                value={formData.contractStartDate}
                onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label className="text-xs font-medium">End Date *</Label>
              <Input
                type="date"
                className="h-8 text-xs mt-1"
                value={formData.contractEndDate}
                onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Maximum Headcount Cap</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs mt-1"
                value={formData.maximumHeadcount}
                onChange={(e) => setFormData({ ...formData, maximumHeadcount: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Billing Type</Label>
              <Select
                value={formData.billingType}
                onValueChange={(val) => setFormData({ ...formData, billingType: val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_TYPES.map((b) => (
                    <SelectItem key={b.value} value={b.value} className="text-xs">{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium">Billing Rate (₹)</Label>
              <Input
                type="number"
                className="h-8 text-xs mt-1"
                placeholder="e.g. 25000"
                value={formData.billingRate}
                onChange={(e) => setFormData({ ...formData, billingRate: e.target.value })}
              />
            </div>

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
                  <SelectItem value="DRAFT" className="text-xs">Draft</SelectItem>
                  <SelectItem value="EXPIRING" className="text-xs">Expiring</SelectItem>
                  <SelectItem value="SUSPENDED" className="text-xs">Suspended</SelectItem>
                  <SelectItem value="TERMINATED" className="text-xs">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Scope of Work</Label>
            <Textarea
              className="text-xs mt-1 min-h-[60px]"
              placeholder="Describe work deliverables, SLA terms, coverage..."
              value={formData.scopeOfWork}
              onChange={(e) => setFormData({ ...formData, scopeOfWork: e.target.value })}
            />
          </div>

          <div>
            <Label className="text-xs font-medium">Payment Terms & Remarks</Label>
            <Input
              className="h-8 text-xs mt-1"
              placeholder="e.g. Net 30 Days, Monthly invoice by 5th"
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Saving...' : contract ? 'Update Contract' : 'Create Contract'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
