import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Undo2,
  Package,
  User,
  Calendar,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Tag,
  ShieldAlert,
  Info,
  Wrench,
} from 'lucide-react';
import { assetsApi } from '@/api/asset-management';
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

const RETURN_REASONS = [
  'Employee Resignation',
  'Employee Transfer',
  'Asset Replacement',
  'Asset Upgrade',
  'Repair / Maintenance',
  'End of Assignment',
  'Employee Change',
  'Other',
];

const CONDITION_OPTIONS = ['Excellent', 'Good', 'Fair', 'Damaged', 'Lost'];

export function ReturnTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Form Fields
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnReason, setReturnReason] = useState('Employee Resignation');
  const [otherReason, setOtherReason] = useState('');
  const [returnedBy, setReturnedBy] = useState('HR / Admin User');
  const [returnLocation, setReturnLocation] = useState('');
  const [condition, setCondition] = useState('Good');
  const [accessoriesReturned, setAccessoriesReturned] = useState('');
  const [remarks, setRemarks] = useState('');

  // Inline Form Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Queries
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets', companyId],
    queryFn: () => assetsApi.list(companyId),
  });

  const allocatedAssets = assets.filter((a) => a.status === 'ALLOCATED');

  const openReturnModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setReturnReason('Employee Resignation');
    setOtherReason('');
    setReturnedBy('HR / Admin User');
    setReturnLocation(asset.physicalLocation || asset.branch?.name || 'IT Storage Room');
    setCondition('Good');
    setAccessoriesReturned('Power Adapter, Charging Cable');
    setRemarks('');
    setFormErrors({});
  };

  const validateReturn = () => {
    const errors: Record<string, string> = {};

    if (!returnDate) {
      errors.returnDate = 'Return Date is required.';
    }
    if (!returnReason) {
      errors.returnReason = 'Return Reason is required.';
    } else if (returnReason === 'Other' && !otherReason.trim()) {
      errors.otherReason = 'Please specify the return reason.';
    }

    if (!returnedBy.trim()) {
      errors.returnedBy = 'Returned By officer is required.';
    }
    if (!returnLocation.trim()) {
      errors.returnLocation = 'Return Location is required.';
    }
    if (!condition) {
      errors.condition = 'Asset Condition is required.';
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

  // Return Mutation
  const returnMutation = useMutation({
    mutationFn: (payload: any) => assetsApi.returnAsset(selectedAsset!.id, payload),
    onSuccess: (updatedAsset) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });

      let targetStatusMsg = 'Asset returned to Available Stock (IN STOCK).';
      if (updatedAsset.status === 'UNDER_MAINTENANCE') {
        targetStatusMsg = 'Asset returned and moved to UNDER MAINTENANCE due to damaged condition.';
      } else if (updatedAsset.status === 'RETIRED') {
        targetStatusMsg = 'Asset marked as LOST / RETIRED.';
      }

      toast.success(targetStatusMsg);
      setSelectedAsset(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to process asset return'),
  });

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateReturn()) return;

    returnMutation.mutate({
      returnDate,
      returnReason,
      otherReason: returnReason === 'Other' ? otherReason.trim() : undefined,
      returnedBy: returnedBy.trim(),
      returnLocation: returnLocation.trim(),
      condition,
      accessoriesReturned: accessoriesReturned.trim() || undefined,
      remarks: remarks.trim() || undefined,
    });
  };

  // Active allocation for summary banner
  const activeAlloc = selectedAsset?.allocations?.find((al) => !al.returnedAt);
  const currentEmp = activeAlloc?.employee || selectedAsset?.currentEmployee;

  return (
    <div className="space-y-6">
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Undo2 className="h-4 w-4 text-amber-600" /> Allocated Devices Available for Return
              </CardTitle>
              <CardDescription className="text-xs">
                Assets currently held by employees. Click <strong>"Return"</strong> to inspect condition and close allocation.
              </CardDescription>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold text-xs">
              {allocatedAssets.length} Allocated Assets
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Asset ID</TableHead>
                <TableHead className="text-xs">Asset Name</TableHead>
                <TableHead className="text-xs">Held By Employee</TableHead>
                <TableHead className="text-xs">Branch & Department</TableHead>
                <TableHead className="text-xs">Serial Number</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                    Loading allocated assets...
                  </TableCell>
                </TableRow>
              ) : allocatedAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                    No allocated devices found requiring return processing.
                  </TableCell>
                </TableRow>
              ) : (
                allocatedAssets.map((a) => {
                  const alloc = a.allocations?.find((al) => !al.returnedAt);
                  const emp = alloc?.employee || a.currentEmployee;
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
                        <span className="font-medium text-foreground block">{emp?.branch?.name || a.branch?.name || 'Main Branch'}</span>
                        <span className="text-[10px]">{emp?.department?.name || a.department?.name || 'General Dept'}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{a.serialNumber || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs font-semibold gap-1.5 border-amber-500/30 text-amber-700 hover:bg-amber-500/10"
                          onClick={() => openReturnModal(a)}
                        >
                          <Undo2 className="h-3.5 w-3.5" /> Return
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── ENTERPRISE ASSET RETURN CONFIRMATION MODAL ── */}
      {selectedAsset && (
        <Dialog open={!!selectedAsset} onOpenChange={(v) => !v && setSelectedAsset(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="flex items-center justify-between text-base font-semibold">
                <span className="flex items-center gap-2">
                  <Undo2 className="h-4 w-4 text-amber-600" /> Process Asset Return
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  {selectedAsset.assetTag}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Inspect physical asset condition, record return rationale, and update corporate inventory status
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmReturn} className="space-y-4 text-xs pt-2">
              {/* Read-Only Asset & Employee Summary Banner */}
              <div className="bg-muted/30 p-3 rounded-xl border border-border/60 space-y-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Asset Details</span>
                    <strong className="text-foreground text-sm font-bold">{selectedAsset.name}</strong>
                    <span className="text-muted-foreground block text-[11px]">
                      {selectedAsset.category} • S/N: {selectedAsset.serialNumber || 'N/A'}
                    </span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold text-xs">
                    Status: Allocated
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">Allocated Employee</span>
                    <strong className="text-foreground font-semibold">
                      {currentEmp ? `${currentEmp.firstName} ${currentEmp.lastName}` : 'Assigned Staff'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">Company / Entity</span>
                    <strong className="text-foreground font-semibold">{selectedAsset.company?.name || 'Company'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">Branch & Dept</span>
                    <strong className="text-foreground font-semibold">
                      {selectedAsset.branch?.name || 'Branch'} / {selectedAsset.department?.name || 'Dept'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9.5px] uppercase font-semibold">Allocation Date</span>
                    <strong className="text-foreground font-mono font-semibold">
                      {activeAlloc?.allocatedAt ? new Date(activeAlloc.allocatedAt).toLocaleDateString() : 'Active'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Transaction Details Form */}
              <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/50">
                <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5 border-b pb-1">
                  <Calendar className="h-3.5 w-3.5" /> Return Transaction & Condition Inspection
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Return Date *</Label>
                    <Input
                      type="date"
                      required
                      value={returnDate}
                      onChange={(e) => {
                        setReturnDate(e.target.value);
                        if (formErrors.returnDate) setFormErrors((p) => { const n = { ...p }; delete n.returnDate; return n; });
                      }}
                      className={`h-8 text-xs bg-background ${formErrors.returnDate ? 'border-destructive' : ''}`}
                    />
                    {formErrors.returnDate && (
                      <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3 inline" /> {formErrors.returnDate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold">Return Reason *</Label>
                    <Select
                      value={returnReason}
                      onValueChange={(val) => {
                        setReturnReason(val);
                        if (formErrors.returnReason) setFormErrors((p) => { const n = { ...p }; delete n.returnReason; return n; });
                      }}
                    >
                      <SelectTrigger className={`h-8 text-xs bg-background ${formErrors.returnReason ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {RETURN_REASONS.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {returnReason === 'Other' && (
                  <div className="space-y-1">
                    <Label className="font-semibold">Please specify the return reason *</Label>
                    <Input
                      type="text"
                      required
                      placeholder="Enter custom return reason..."
                      value={otherReason}
                      onChange={(e) => {
                        setOtherReason(e.target.value);
                        if (formErrors.otherReason) setFormErrors((p) => { const n = { ...p }; delete n.otherReason; return n; });
                      }}
                      className={`h-8 text-xs bg-background ${formErrors.otherReason ? 'border-destructive' : ''}`}
                    />
                    {formErrors.otherReason && (
                      <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3 inline" /> {formErrors.otherReason}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Returned By Officer / HR *</Label>
                    <Input
                      type="text"
                      required
                      value={returnedBy}
                      onChange={(e) => {
                        setReturnedBy(e.target.value);
                        if (formErrors.returnedBy) setFormErrors((p) => { const n = { ...p }; delete n.returnedBy; return n; });
                      }}
                      className={`h-8 text-xs bg-background ${formErrors.returnedBy ? 'border-destructive' : ''}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold">Return Storage Location *</Label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Pune HQ - IT Storage Room Desk B"
                      value={returnLocation}
                      onChange={(e) => {
                        setReturnLocation(e.target.value);
                        if (formErrors.returnLocation) setFormErrors((p) => { const n = { ...p }; delete n.returnLocation; return n; });
                      }}
                      className={`h-8 text-xs bg-background ${formErrors.returnLocation ? 'border-destructive' : ''}`}
                    />
                    {formErrors.returnLocation && (
                      <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3 inline" /> {formErrors.returnLocation}
                      </p>
                    )}
                  </div>
                </div>

                {/* Condition Inspection & Target Status Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="font-semibold">Asset Physical Condition *</Label>
                    <Select value={condition} onValueChange={setCondition}>
                      <SelectTrigger className="h-8 text-xs bg-background font-semibold">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPTIONS.map((cnd) => (
                          <SelectItem key={cnd} value={cnd} className="text-xs font-semibold">
                            {cnd}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold">Target Asset Status Impact</Label>
                    <div className="h-8 border rounded-md bg-background px-3 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground text-[11px]">New Status:</span>
                      {condition === 'Damaged' ? (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-semibold gap-1">
                          <Wrench className="h-3 w-3" /> UNDER MAINTENANCE
                        </Badge>
                      ) : condition === 'Lost' ? (
                        <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-semibold gap-1">
                          <ShieldAlert className="h-3 w-3" /> RETIRED / LOST
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-semibold gap-1">
                          <CheckCircle2 className="h-3 w-3" /> IN STOCK (Available)
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Accessories Returned</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Power Adapter, Charging Cable, Laptop Sleeve"
                    value={accessoriesReturned}
                    onChange={(e) => setAccessoriesReturned(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Operational Remarks</Label>
                  <Textarea
                    rows={2}
                    placeholder="Enter condition notes or inspection summary..."
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
                  className="text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={returnMutation.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Confirm Return
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
