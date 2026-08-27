import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  UserCheck,
  Package,
  Building2,
  MapPin,
  Briefcase,
  Calendar,
  Tag,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Undo2,
  Clock,
  Layers,
} from 'lucide-react';
import { assetsApi } from '@/api/asset-management';
import { employeesApi } from '@/api/employees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Asset, Employee } from '@/api/types';

const ALLOCATION_TYPES = ['New Allocation', 'Replacement', 'Temporary Issue', 'Project Allocation'];

export function AllocationTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Form Fields
  const [employeeId, setEmployeeId] = useState('');
  const [allocationDate, setAllocationDate] = useState(new Date().toISOString().split('T')[0]);
  const [allocationType, setAllocationType] = useState('New Allocation');
  const [location, setLocation] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [remarks, setRemarks] = useState('');

  // Inline Form Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Queries
  const { data: assets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets', companyId],
    queryFn: () => assetsApi.list(companyId),
  });

  const { data: employeesPage } = useQuery({
    queryKey: ['employees', 'asset-allocation-picker', companyId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 200, companyId }),
  });

  const employees = employeesPage?.items ?? [];

  // Filter available employees matching asset company & ACTIVE status
  const eligibleEmployees = useMemo(() => {
    if (!selectedAsset) return employees;
    return employees.filter((e) => {
      const isCompanyMatch = !selectedAsset.companyId || e.companyId === selectedAsset.companyId;
      const isActive = e.status === 'ACTIVE' || !e.dateOfExit;
      return isCompanyMatch && isActive;
    });
  }, [employees, selectedAsset]);

  // Selected Employee Details for Auto-Fill
  const selectedEmp = useMemo(() => {
    return employees.find((e) => e.id === employeeId) || null;
  }, [employees, employeeId]);

  const openAllocationModal = (asset: Asset) => {
    if (asset.status !== 'IN_STOCK' && asset.status !== 'AVAILABLE') {
      toast.error('This asset is not available for allocation.');
      return;
    }
    setSelectedAsset(asset);
    setEmployeeId('');
    setAllocationDate(new Date().toISOString().split('T')[0]);
    setAllocationType('New Allocation');
    setLocation(asset.physicalLocation || asset.branch?.name || '');
    setExpectedReturnDate('');
    setRemarks('');
    setFormErrors({});
  };

  const validateAllocation = () => {
    const errors: Record<string, string> = {};

    if (!selectedAsset) return false;
    if (selectedAsset.status !== 'IN_STOCK' && selectedAsset.status !== 'AVAILABLE') {
      toast.error('This asset is not available for allocation.');
      return false;
    }

    if (!employeeId) {
      errors.employeeId = 'Employee is required.';
    } else if (selectedEmp) {
      if (selectedEmp.status && selectedEmp.status !== 'ACTIVE' && selectedEmp.dateOfExit) {
        errors.employeeId = 'Selected employee is inactive and cannot receive an asset.';
      }
      if (selectedAsset.companyId && selectedEmp.companyId && selectedEmp.companyId !== selectedAsset.companyId) {
        errors.employeeId = 'Selected employee does not belong to this company.';
      }
    }

    if (!allocationDate) {
      errors.allocationDate = 'Allocation Date is required.';
    }
    if (!allocationType) {
      errors.allocationType = 'Allocation Type is required.';
    }
    if (!location.trim()) {
      errors.location = 'Allocation Location is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return false;
    }

    setFormErrors({});
    return true;
  };

  // Allocation Mutation
  const allocateMutation = useMutation({
    mutationFn: (payload: any) => assetsApi.allocate(selectedAsset!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset allocated successfully.');
      setSelectedAsset(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to allocate asset'),
  });

  const handleConfirmAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAllocation()) return;

    allocateMutation.mutate({
      employeeId,
      allocationDate,
      allocationType,
      location: location.trim(),
      expectedReturnDate: expectedReturnDate || undefined,
      remarks: remarks.trim() || undefined,
    });
  };

  const availableAssets = assets.filter((a) => a.status === 'IN_STOCK' || a.status === 'AVAILABLE');
  const allocatedAssets = assets.filter((a) => a.status === 'ALLOCATED');

  return (
    <div className="space-y-6">
      {/* ── SECTION 1 — AVAILABLE STOCK DIRECTORY ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" /> Available Stock for Assignment
              </CardTitle>
              <CardDescription className="text-xs">
                In-stock corporate hardware & equipment ready for employee allocation
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-semibold text-xs">
              {availableAssets.length} In-Stock Items
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Asset ID</TableHead>
                <TableHead className="text-xs">Asset Name</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Branch Context</TableHead>
                <TableHead className="text-xs">Serial Number</TableHead>
                <TableHead className="text-xs">Purchase Cost</TableHead>
                <TableHead className="text-right text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingAssets ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                    Loading in-stock assets...
                  </TableCell>
                </TableRow>
              ) : availableAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                    No available stock found ready for allocation.
                  </TableCell>
                </TableRow>
              ) : (
                availableAssets.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-primary">{a.assetTag}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">{a.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.category}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.branch?.name || 'Main Branch'}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{a.serialNumber || 'N/A'}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      {a.value ? `₹${a.value.toLocaleString('en-IN')}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="h-7 text-xs font-semibold gap-1.5"
                        onClick={() => openAllocationModal(a)}
                      >
                        <UserCheck className="h-3.5 w-3.5" /> Allocate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── SECTION 2 — ACTIVE ALLOCATIONS DIRECTORY ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600" /> Active Employee Allocations
              </CardTitle>
              <CardDescription className="text-xs">
                Currently assigned assets across company employees and departments
              </CardDescription>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold">
              {allocatedAssets.length} Allocated Devices
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Asset ID</TableHead>
                <TableHead className="text-xs">Asset Name</TableHead>
                <TableHead className="text-xs">Allocated Employee</TableHead>
                <TableHead className="text-xs">Department & Branch</TableHead>
                <TableHead className="text-xs">Serial Number</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocatedAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                    No active employee allocations recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                allocatedAssets.map((a) => {
                  const activeAlloc = a.allocations?.find((al) => !al.returnedAt);
                  const emp = activeAlloc?.employee || a.currentEmployee;
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-primary">{a.assetTag}</TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">{a.name}</TableCell>
                      <TableCell className="text-xs">
                        {emp ? (
                          <div>
                            <span className="font-semibold text-foreground block">{emp.firstName} {emp.lastName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{emp.employeeCode}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground block">{emp?.department?.name || a.department?.name || 'General Dept'}</span>
                        <span className="text-[10px]">{emp?.branch?.name || a.branch?.name || 'Main Branch'}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{a.serialNumber || 'N/A'}</TableCell>
                      <TableCell className="text-xs">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold">
                          Allocated
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── STANDARD ENTERPRISE ASSET ALLOCATION MODAL ── */}
      {selectedAsset && (
        <Dialog open={!!selectedAsset} onOpenChange={(v) => !v && setSelectedAsset(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="flex items-center justify-between text-base font-semibold">
                <span className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" /> Allocate Asset
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  {selectedAsset.assetTag}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Record employee asset assignment, organizational mapping, and transaction metadata
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmAllocation} className="space-y-4 text-xs pt-2">
              {/* Asset Summary Banner */}
              <div className="bg-muted/30 p-3 rounded-xl border border-border/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Target Asset</span>
                  <strong className="text-foreground text-sm font-semibold">{selectedAsset.name}</strong>
                  <span className="text-muted-foreground block text-[11px]">{selectedAsset.category} • S/N: {selectedAsset.serialNumber || 'N/A'}</span>
                </div>
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-semibold text-xs">
                  Status: Available
                </Badge>
              </div>

              {/* 1. Employee Selection */}
              <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5 border-b pb-1">
                  <User className="h-3.5 w-3.5" /> Employee Selection & Organizational Details
                </h4>

                <div className="space-y-1">
                  <Label className="font-semibold">Select Employee * (Active Company Staff)</Label>
                  <Select
                    value={employeeId}
                    onValueChange={(val) => {
                      setEmployeeId(val);
                      if (formErrors.employeeId) setFormErrors((p) => { const n = { ...p }; delete n.employeeId; return n; });
                    }}
                  >
                    <SelectTrigger className={`h-8 text-xs bg-background ${formErrors.employeeId ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Choose active employee..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {eligibleEmployees.length === 0 ? (
                        <SelectItem value="none" disabled className="text-xs italic text-muted-foreground">
                          No active employees found matching company context
                        </SelectItem>
                      ) : (
                        eligibleEmployees.map((e) => (
                          <SelectItem key={e.id} value={e.id} className="text-xs">
                            {e.firstName} {e.lastName} ({e.employeeCode}) — {e.department?.name || 'General'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.employeeId && (
                    <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="h-3 w-3 inline" /> {formErrors.employeeId}
                    </p>
                  )}
                </div>

                {/* Auto-filled Employee Context Summary Cards */}
                {selectedEmp && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="bg-background p-2 rounded-lg border">
                      <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">Company / Entity</span>
                      <strong className="text-foreground truncate block font-semibold">{selectedEmp.company?.name || selectedAsset.company?.name || 'Company'}</strong>
                    </div>
                    <div className="bg-background p-2 rounded-lg border">
                      <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">Branch</span>
                      <strong className="text-foreground truncate block font-semibold">{selectedEmp.branch?.name || selectedAsset.branch?.name || 'Main Branch'}</strong>
                    </div>
                    <div className="bg-background p-2 rounded-lg border">
                      <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">Department</span>
                      <strong className="text-foreground truncate block font-semibold">{selectedEmp.department?.name || selectedAsset.department?.name || 'General Dept'}</strong>
                    </div>
                    <div className="bg-background p-2 rounded-lg border">
                      <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">Designation</span>
                      <strong className="text-foreground truncate block font-semibold">{selectedEmp.designation?.title || 'Employee'}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Allocation Transaction Details */}
              <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5 border-b pb-1">
                  <Calendar className="h-3.5 w-3.5" /> Allocation Transaction Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Allocation Date *</Label>
                    <Input
                      type="date"
                      required
                      value={allocationDate}
                      onChange={(e) => {
                        setAllocationDate(e.target.value);
                        if (formErrors.allocationDate) setFormErrors((p) => { const n = { ...p }; delete n.allocationDate; return n; });
                      }}
                      className={`h-8 text-xs bg-background ${formErrors.allocationDate ? 'border-destructive' : ''}`}
                    />
                    {formErrors.allocationDate && (
                      <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3 inline" /> {formErrors.allocationDate}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold">Allocation Type *</Label>
                    <Select
                      value={allocationType}
                      onValueChange={(val) => {
                        setAllocationType(val);
                        if (formErrors.allocationType) setFormErrors((p) => { const n = { ...p }; delete n.allocationType; return n; });
                      }}
                    >
                      <SelectTrigger className={`h-8 text-xs bg-background ${formErrors.allocationType ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALLOCATION_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs font-semibold">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Allocation Location * (Desk / Room / Floor)</Label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. IT Department - Desk 12, Floor 3"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        if (formErrors.location) setFormErrors((p) => { const n = { ...p }; delete n.location; return n; });
                      }}
                      className={`h-8 text-xs bg-background ${formErrors.location ? 'border-destructive' : ''}`}
                    />
                    {formErrors.location && (
                      <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3 inline" /> {formErrors.location}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold">Expected Return Date (Optional)</Label>
                    <Input
                      type="date"
                      value={expectedReturnDate}
                      onChange={(e) => setExpectedReturnDate(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Remarks / Allocation Purpose</Label>
                  <Textarea
                    rows={2}
                    placeholder="e.g. Laptop issued for new employee onboarding and project work..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="text-xs min-h-[50px]"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedAsset(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-semibold gap-1.5"
                  disabled={allocateMutation.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Confirm Allocation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
