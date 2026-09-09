import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  UserCheck,
  Package,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  User,
  Plus,
  Search,
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
import type { Asset } from '@/api/types';

const ALLOCATION_TYPES = ['New Allocation', 'Replacement', 'Temporary Issue', 'Project Allocation'];

export function AllocationTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();

  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Fixed plant machinery, heavy industrial equipment, and location-assigned assets are maintained in Asset Master/Transfer, NOT Employee Allocation
  const isFixedOrLocationAsset = (asset: Asset) => {
    if (asset.assignmentType === 'LOCATION' || asset.assignmentType === 'DEPARTMENT' || asset.status === 'IN_USE') {
      return true;
    }
    const cat = (asset.category || '').toLowerCase();
    const name = (asset.name || '').toLowerCase();
    const fixedKeywords = [
      'machinery',
      'machine',
      'plant',
      'heavy',
      'compressor',
      'generator',
      'lathe',
      'cnc',
      'milling',
      'industrial',
    ];
    return fixedKeywords.some((kw) => cat.includes(kw) || name.includes(kw));
  };

  const availableAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        (a.status === 'IN_STOCK' || a.status === 'AVAILABLE') &&
        !isFixedOrLocationAsset(a) &&
        a.assignmentType !== 'LOCATION' &&
        a.assignmentType !== 'DEPARTMENT'
    );
  }, [assets]);

  const allocatedAssets = useMemo(() => {
    return assets.filter(
      (a) => a.status === 'ALLOCATED' && (a.currentEmployeeId || (a as any).currentEmployee)
    );
  }, [assets]);

  const filteredAllocations = useMemo(() => {
    if (!searchQuery.trim()) return allocatedAssets;
    const q = searchQuery.toLowerCase();
    return allocatedAssets.filter((a) => {
      const activeAlloc = a.allocations?.find((al) => !al.returnedAt);
      const emp = activeAlloc?.employee || a.currentEmployee;
      const empName = emp
        ? `${emp.firstName} ${emp.lastName || ''} ${emp.employeeCode || ''}`.toLowerCase()
        : '';
      return (
        a.name.toLowerCase().includes(q) ||
        a.assetTag.toLowerCase().includes(q) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
        (a.category && a.category.toLowerCase().includes(q)) ||
        empName.includes(q)
      );
    });
  }, [allocatedAssets, searchQuery]);

  const openNewAllocationModal = (preselectedAsset?: Asset) => {
    if (availableAssets.length === 0) {
      toast.info('No assets currently available in stock. Register new assets or unassign items in Asset Master first.');
      return;
    }
    const assetToSelect = preselectedAsset || availableAssets[0];
    setSelectedAsset(assetToSelect);
    setSelectedAssetId(assetToSelect.id);
    setEmployeeId('');
    setAllocationDate(new Date().toISOString().split('T')[0]);
    setAllocationType('New Allocation');
    setLocation(assetToSelect.physicalLocation || assetToSelect.branch?.name || '');
    setExpectedReturnDate('');
    setRemarks('');
    setFormErrors({});
    setIsAllocateModalOpen(true);
  };

  const handleAssetChange = (newAssetId: string) => {
    setSelectedAssetId(newAssetId);
    const a = availableAssets.find((item) => item.id === newAssetId) || null;
    setSelectedAsset(a);
    if (a) {
      setLocation(a.physicalLocation || a.branch?.name || '');
    }
  };

  const validateAllocation = () => {
    const errors: Record<string, string> = {};

    if (!selectedAsset) {
      errors.assetId = 'Please select an asset to allocate.';
      toast.error('Please select an asset to allocate.');
      return false;
    }
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
      setIsAllocateModalOpen(false);
      setSelectedAsset(null);
      setSelectedAssetId('');
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

  return (
    <div className="space-y-4">
      {/* ── ACTIVE EMPLOYEE ALLOCATIONS DIRECTORY ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600" /> Active Employee Allocations
              </CardTitle>
              <CardDescription className="text-xs">
                Personal devices and equipment currently allocated to company staff
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold">
                {allocatedAssets.length} Allocated Assets
              </Badge>
              <Button
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5"
                onClick={() => openNewAllocationModal()}
              >
                <Plus className="h-3.5 w-3.5" /> Allocate Asset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search allocations by employee, asset ID, serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>
          </div>

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
              {isLoadingAssets ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    Loading employee allocations...
                  </TableCell>
                </TableRow>
              ) : filteredAllocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    {searchQuery
                      ? 'No allocations match your search query.'
                      : 'No active employee allocations recorded yet. Click "Allocate Asset" to assign equipment to an employee.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAllocations.map((a) => {
                  const activeAlloc = a.allocations?.find((al) => !al.returnedAt);
                  const emp = activeAlloc?.employee || a.currentEmployee;
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-primary">{a.assetTag}</TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">{a.name}</TableCell>
                      <TableCell className="text-xs">
                        {emp ? (
                          <div>
                            <span className="font-semibold text-foreground block">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">{emp.employeeCode}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground block">
                          {emp?.department?.name || a.department?.name || 'General Dept'}
                        </span>
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
      <Dialog
        open={isAllocateModalOpen}
        onOpenChange={(v) => {
          setIsAllocateModalOpen(v);
          if (!v) {
            setSelectedAsset(null);
            setSelectedAssetId('');
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center justify-between text-base font-semibold">
              <span className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" /> Allocate Asset to Employee
              </span>
              {selectedAsset && (
                <Badge variant="outline" className="font-mono text-xs">
                  {selectedAsset.assetTag}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign company equipment or personal device to an employee with custody details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmAllocation} className="space-y-4 text-xs pt-2">
            {/* 0. Asset Selection */}
            <div className="space-y-2 bg-muted/20 p-3 rounded-xl border border-border/50">
              <Label className="font-semibold text-primary flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" /> Select Available Asset *
              </Label>
              <Select value={selectedAssetId} onValueChange={handleAssetChange}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Choose asset from available stock..." />
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  {availableAssets.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">
                      <span className="font-mono font-bold text-primary mr-1.5">{a.assetTag}</span>
                      {a.name} ({a.category}) {a.serialNumber ? `• S/N: ${a.serialNumber}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedAsset && (
                <div className="bg-background/80 p-2.5 rounded-lg border border-border/40 flex items-center justify-between text-[11px] mt-1.5">
                  <div>
                    <strong className="text-foreground block">{selectedAsset.name}</strong>
                    <span className="text-muted-foreground">
                      {selectedAsset.category} • {selectedAsset.branch?.name || 'Main Branch'}
                      {selectedAsset.serialNumber ? ` • Serial: ${selectedAsset.serialNumber}` : ''}
                    </span>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-semibold">
                    Available in Stock
                  </Badge>
                </div>
              )}
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
                    if (formErrors.employeeId)
                      setFormErrors((p) => {
                        const n = { ...p };
                        delete n.employeeId;
                        return n;
                      });
                  }}
                >
                  <SelectTrigger
                    className={`h-8 text-xs bg-background ${formErrors.employeeId ? 'border-destructive' : ''}`}
                  >
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
                    <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">
                      Company / Entity
                    </span>
                    <strong className="text-foreground truncate block font-semibold">
                      {selectedEmp.company?.name || selectedAsset?.company?.name || 'Company'}
                    </strong>
                  </div>
                  <div className="bg-background p-2 rounded-lg border">
                    <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">Branch</span>
                    <strong className="text-foreground truncate block font-semibold">
                      {selectedEmp.branch?.name || selectedAsset?.branch?.name || 'Main Branch'}
                    </strong>
                  </div>
                  <div className="bg-background p-2 rounded-lg border">
                    <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">
                      Department
                    </span>
                    <strong className="text-foreground truncate block font-semibold">
                      {selectedEmp.department?.name || selectedAsset?.department?.name || 'General Dept'}
                    </strong>
                  </div>
                  <div className="bg-background p-2 rounded-lg border">
                    <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">
                      Designation
                    </span>
                    <strong className="text-foreground truncate block font-semibold">
                      {selectedEmp.designation?.title || 'Employee'}
                    </strong>
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
                      if (formErrors.allocationDate)
                        setFormErrors((p) => {
                          const n = { ...p };
                          delete n.allocationDate;
                          return n;
                        });
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
                  <Select value={allocationType} onValueChange={setAllocationType}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALLOCATION_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-semibold">Physical Location / Desk *</Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Floor 2, Bay 4, Desk 12"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      if (formErrors.location)
                        setFormErrors((p) => {
                          const n = { ...p };
                          delete n.location;
                          return n;
                        });
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
                onClick={() => {
                  setIsAllocateModalOpen(false);
                  setSelectedAsset(null);
                  setSelectedAssetId('');
                }}
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
    </div>
  );
}
