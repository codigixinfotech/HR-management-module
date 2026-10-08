import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2, MapPin, Phone, Mail, Calendar, FileText,
  UserCheck, ShieldCheck, Briefcase, Hash, CheckCircle2,
  Clock, HardHat, Cpu, Pencil, Trash2
} from 'lucide-react';
import type { ContractorVendor, ContractorContract, ContractorWorker, WorkerDeployment } from '@/api/contractor-management';

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────
// 1. View Vendor Modal
// ─────────────────────────────────────────────────────────────
interface ViewVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: ContractorVendor | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ViewVendorModal({
  open,
  onOpenChange,
  vendor,
  onEdit,
  onDelete,
}: ViewVendorModalProps) {
  if (!vendor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {vendor.display_name || vendor.legal_name}
                </DialogTitle>
                <div className="text-xs font-mono text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span>{vendor.vendor_code}</span>
                  {vendor.branch_name && <span>• {vendor.branch_name}</span>}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs uppercase font-semibold">
              {vendor.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          {/* Company & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg bg-muted/40 p-3">
            <div>
              <span className="text-muted-foreground block text-[11px]">Allocated Branch</span>
              <span className="font-medium flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                {vendor.branch_name || 'All Branches / Head Office'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Allocated Department</span>
              <span className="font-medium mt-0.5 block">{vendor.department_name || 'All Departments (General)'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Legal Entity Name</span>
              <span className="font-medium mt-0.5 block truncate" title={vendor.legal_name}>{vendor.legal_name}</span>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Primary Contact Information
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border rounded-lg p-3">
              <div>
                <span className="text-[11px] text-muted-foreground block">Contact Person</span>
                <span className="font-semibold text-foreground mt-0.5 block">{vendor.primary_contact_name}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Phone</span>
                <span className="font-medium flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  {vendor.primary_contact_phone}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Email</span>
                <span className="font-medium flex items-center gap-1 mt-0.5 truncate" title={vendor.primary_contact_email}>
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  {vendor.primary_contact_email}
                </span>
              </div>
            </div>
          </div>

          {/* Statutory & Tax */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Statutory & Tax Registration
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border rounded-lg p-3 bg-muted/20">
              <div>
                <span className="text-[11px] text-muted-foreground block">GSTIN</span>
                <span className="font-mono font-medium mt-0.5 block">{vendor.gstin || '—'}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">PAN</span>
                <span className="font-mono font-medium mt-0.5 block">{vendor.pan || '—'}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Registration No</span>
                <span className="font-mono font-medium mt-0.5 block">{vendor.registration_number || '—'}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">CLRA License</span>
                <span className="font-mono font-medium mt-0.5 block">{vendor.clra_license || '—'}</span>
              </div>
            </div>
          </div>

          {/* Headcount Metrics */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border bg-card p-2.5">
              <span className="text-[10px] text-muted-foreground block uppercase font-medium">Active Contracts</span>
              <span className="text-lg font-bold text-foreground mt-0.5 block">{vendor.active_contracts_count ?? 0}</span>
            </div>
            <div className="rounded-lg border bg-card p-2.5">
              <span className="text-[10px] text-muted-foreground block uppercase font-medium">Total Workers</span>
              <span className="text-lg font-bold text-foreground mt-0.5 block">{vendor.total_workers_count ?? 0}</span>
            </div>
            <div className="rounded-lg border bg-card p-2.5">
              <span className="text-[10px] text-muted-foreground block uppercase font-medium">Deployed Headcount</span>
              <span className="text-lg font-bold text-primary mt-0.5 block">{vendor.deployed_headcount ?? 0}</span>
            </div>
          </div>

          {/* Address */}
          {(vendor.registered_address || vendor.city || vendor.state) && (
            <div className="border rounded-lg p-3">
              <span className="text-[11px] text-muted-foreground block mb-1">Registered Address</span>
              <p className="text-xs text-foreground">
                {[vendor.registered_address, vendor.city, vendor.state, vendor.pincode].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          {onDelete ? (
            <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5 text-xs" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" /> Delete Vendor
            </Button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {onEdit && (
              <Button size="sm" className="text-xs gap-1.5" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" /> Edit Vendor
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. View Contract Modal
// ─────────────────────────────────────────────────────────────
interface ViewContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractorContract | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ViewContractModal({
  open,
  onOpenChange,
  contract,
  onEdit,
  onDelete,
}: ViewContractModalProps) {
  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Contract #{contract.contract_number}
                </DialogTitle>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Vendor: <span className="font-semibold text-foreground">{contract.vendor_name}</span> ({contract.vendor_code})
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs uppercase font-semibold">
              {contract.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          {/* Contract Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border rounded-lg p-3 bg-muted/30">
            <div>
              <span className="text-[11px] text-muted-foreground block">Branch</span>
              <span className="font-medium mt-0.5 block">{contract.branch_name || 'All Branches'}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Allocated Department</span>
              <span className="font-medium mt-0.5 block">{contract.department_name || 'All Departments (General)'}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Max Headcount</span>
              <span className="font-mono font-semibold mt-0.5 block text-foreground">{contract.maximum_headcount}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Currently Deployed</span>
              <span className="font-mono font-semibold mt-0.5 block text-primary">{contract.deployed_headcount ?? 0}</span>
            </div>
          </div>

          {/* Dates & Terms */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border rounded-lg p-3">
            <div>
              <span className="text-[11px] text-muted-foreground block">Start Date</span>
              <span className="font-medium mt-0.5 block">{fmtDate(contract.contract_start_date)}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">End Date</span>
              <span className="font-medium mt-0.5 block">{fmtDate(contract.contract_end_date)}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Billing Type</span>
              <span className="font-medium mt-0.5 block">{contract.billing_type || 'Monthly'}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Billing Rate</span>
              <span className="font-mono font-semibold mt-0.5 block">
                {contract.billing_rate ? `₹${Number(contract.billing_rate).toLocaleString('en-IN')}` : '—'}
              </span>
            </div>
          </div>

          {/* Scope of Work */}
          <div className="border rounded-lg p-3">
            <span className="text-[11px] text-muted-foreground block font-medium mb-1">Scope of Work</span>
            <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
              {contract.scope_of_work || 'No scope details recorded.'}
            </p>
          </div>

          {/* Payment Terms & Remarks */}
          {(contract.payment_terms || contract.remarks) && (
            <div className="grid grid-cols-2 gap-3 border rounded-lg p-3 bg-muted/20">
              {contract.payment_terms && (
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Payment Terms</span>
                  <span className="text-xs mt-0.5 block">{contract.payment_terms}</span>
                </div>
              )}
              {contract.remarks && (
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Remarks</span>
                  <span className="text-xs mt-0.5 block">{contract.remarks}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          {onDelete ? (
            <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5 text-xs" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" /> Delete Contract
            </Button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {onEdit && (
              <Button size="sm" className="text-xs gap-1.5" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" /> Edit Contract
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. View Worker Modal
// ─────────────────────────────────────────────────────────────
interface ViewWorkerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: ContractorWorker | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ViewWorkerModal({
  open,
  onOpenChange,
  worker,
  onEdit,
  onDelete,
}: ViewWorkerModalProps) {
  if (!worker) return null;

  const fullName = [worker.first_name, worker.middle_name, worker.last_name].filter(Boolean).join(' ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
                <HardHat className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {fullName}
                </DialogTitle>
                <div className="text-xs font-mono text-muted-foreground mt-0.5">
                  Code: {worker.worker_code} • {worker.designation || 'Worker'}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs uppercase font-semibold">
              {worker.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          {/* Vendor & Skill */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border rounded-lg p-3 bg-muted/30">
            <div>
              <span className="text-[11px] text-muted-foreground block">Contractor Agency</span>
              <span className="font-semibold text-foreground mt-0.5 block">{worker.vendor_name || '—'}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Skill Profile</span>
              <span className="font-medium mt-0.5 block">{worker.skill}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Skill Level</span>
              <span className="font-medium mt-0.5 block">{worker.skill_level || 'Semi-Skilled'}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Joining Date</span>
              <span className="font-medium mt-0.5 block">{fmtDate(worker.joining_date)}</span>
            </div>
          </div>

          {/* Contact & Personal */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border rounded-lg p-3">
            <div>
              <span className="text-[11px] text-muted-foreground block">Mobile</span>
              <span className="font-mono font-medium flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {worker.mobile}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Email</span>
              <span className="font-medium mt-0.5 block truncate">{worker.email || '—'}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Gender</span>
              <span className="font-medium mt-0.5 block">{worker.gender || '—'}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Date of Birth</span>
              <span className="font-medium mt-0.5 block">{fmtDate(worker.date_of_birth)}</span>
            </div>
          </div>

          {/* Current Deployment Status */}
          <div className="border rounded-lg p-3 bg-primary/5">
            <span className="text-[11px] font-semibold text-primary block uppercase tracking-wider mb-2">
              Active Plant Floor Assignment
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-muted-foreground block">Operational Unit</span>
                <span className="font-medium mt-0.5 block">{worker.current_line_name || 'Not Assigned'}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Machine Unit</span>
                <span className="font-medium mt-0.5 block">{worker.current_machine_name || 'Not Assigned'}</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Branch</span>
                <span className="font-medium mt-0.5 block">{worker.branch_name || 'Head Office'}</span>
              </div>
            </div>
          </div>

          {/* Identification & Emergency */}
          <div className="grid grid-cols-2 gap-3 border rounded-lg p-3">
            <div>
              <span className="text-[11px] text-muted-foreground block">Government ID</span>
              <span className="font-mono font-medium mt-0.5 block">
                {worker.government_id_type ? `${worker.government_id_type}: ${worker.government_id_number || '—'}` : '—'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Emergency Contact</span>
              <span className="font-medium mt-0.5 block">
                {worker.emergency_contact_name ? `${worker.emergency_contact_name} (${worker.emergency_contact_phone || '—'})` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          {onDelete ? (
            <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5 text-xs" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" /> Delete Worker
            </Button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {onEdit && (
              <Button size="sm" className="text-xs gap-1.5" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" /> Edit Worker
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. View Deployment Modal
// ─────────────────────────────────────────────────────────────
interface ViewDeploymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deployment: WorkerDeployment | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ViewDeploymentModal({
  open,
  onOpenChange,
  deployment,
  onEdit,
  onDelete,
}: ViewDeploymentModalProps) {
  if (!deployment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Deployment Details
                </DialogTitle>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Worker: <span className="font-semibold text-foreground">{deployment.first_name} {deployment.last_name}</span> ({deployment.worker_code})
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs uppercase font-semibold">
              {deployment.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          {/* Assignment Core */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border rounded-lg p-3 bg-muted/30">
            <div>
              <span className="text-[11px] text-muted-foreground block">Operational Unit</span>
              <span className="font-semibold text-foreground mt-0.5 block">{deployment.line_name || '—'}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Machine Unit</span>
              <span className="font-semibold text-foreground mt-0.5 block">{deployment.machine_name || '—'}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Assigned Shift</span>
              <span className="font-medium mt-0.5 block">
                {deployment.shift_name || 'General Shift'}
                {deployment.shift_start_time && (
                  <span className="text-[10px] text-muted-foreground block">{deployment.shift_start_time} - {deployment.shift_end_time}</span>
                )}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Department / Function</span>
              <span className="font-medium mt-0.5 block">{deployment.department_name || 'All Departments (General)'}</span>
            </div>
          </div>

          {/* Vendor & Contract */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border rounded-lg p-3">
            <div>
              <span className="text-[11px] text-muted-foreground block">Staffing Vendor</span>
              <span className="font-medium mt-0.5 block">{deployment.vendor_name} ({deployment.vendor_code})</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Master Contract #</span>
              <span className="font-mono font-medium mt-0.5 block">{deployment.contract_number}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Branch Location</span>
              <span className="font-medium mt-0.5 block">{deployment.branch_name || 'All Branches / Head Office'}</span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 border rounded-lg p-3 bg-muted/20">
            <div>
              <span className="text-[11px] text-muted-foreground block">Deployment Start</span>
              <span className="font-medium mt-0.5 block">{fmtDate(deployment.start_date)}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Deployment End</span>
              <span className="font-medium mt-0.5 block">{fmtDate(deployment.end_date)}</span>
            </div>
          </div>

          {/* Remarks */}
          {deployment.remarks && (
            <div className="border rounded-lg p-3">
              <span className="text-[11px] text-muted-foreground block font-medium mb-1">Supervisory Remarks</span>
              <p className="text-xs text-foreground">{deployment.remarks}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          {onDelete ? (
            <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5 text-xs" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" /> Delete Deployment
            </Button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {onEdit && (
              <Button size="sm" className="text-xs gap-1.5" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" /> Edit Deployment
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
