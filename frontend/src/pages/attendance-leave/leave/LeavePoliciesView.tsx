import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Layers,
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { leaveTypesApi } from '@/api/attendance-leave';
import type { LeaveType, Company } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LeaveTypeConfigModal } from './LeaveTypeConfigModal';

interface LeavePoliciesViewProps {
  leaveTypes: LeaveType[];
  companies: Company[];
  companyId?: string;
  isLoading: boolean;
}

export function LeavePoliciesView({
  leaveTypes,
  companies,
  companyId,
  isLoading,
}: LeavePoliciesViewProps) {
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leaveTypesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      toast.success('Leave policy deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to delete leave type');
    },
  });

  const handleOpenNew = () => {
    setEditingType(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (lt: LeaveType) => {
    setEditingType(lt);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-foreground">Configured Leave Policies & Plans</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enterprise rule definitions governing accrual rates, carry forward limits, half-day sessions and sandwich logic
          </p>
        </div>

        <Button size="sm" onClick={handleOpenNew} className="h-8 text-xs font-semibold">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Leave Type
        </Button>
      </div>

      {/* Policies Table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs font-semibold">Code</TableHead>
              <TableHead className="text-xs font-semibold">Leave Name & Category</TableHead>
              <TableHead className="text-xs font-semibold text-center">Annual Quota</TableHead>
              <TableHead className="text-xs font-semibold">Accrual Method</TableHead>
              <TableHead className="text-xs font-semibold">Compensation</TableHead>
              <TableHead className="text-xs font-semibold">Carry Forward</TableHead>
              <TableHead className="text-xs font-semibold">Application Rules</TableHead>
              <TableHead className="text-xs font-semibold">Sandwich Policy</TableHead>
              <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    Loading leave policies...
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && leaveTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-xs text-muted-foreground">
                  No leave policies configured yet. Click "+ Add Leave Type" to initialize company policies.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              leaveTypes.map((lt) => {
                const cfg = lt.policyConfig;
                const accrual = cfg?.accrualMethod || (lt.code === 'CL' ? 'MONTHLY' : 'ANNUAL');
                const maxCarry = cfg?.maxCarryForwardDays ?? (lt.carryForward ? 5 : 0);
                const halfDayAllowed = cfg?.applicationRules?.allowHalfDay ?? true;
                const noticeDays = cfg?.applicationRules?.priorNoticeDays ?? 1;
                const sandwichWO = cfg?.sandwichPolicy?.weeklyOffCountAsLeave ?? false;

                return (
                  <TableRow key={lt.id} className="hover:bg-muted/30">
                    <TableCell className="py-3 font-mono text-xs font-bold text-primary">
                      {lt.code}
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="font-semibold text-xs text-foreground">{lt.name}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">
                        {lt.category || cfg?.category || 'Regular'}
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted/60">
                        {lt.annualQuota} Days
                      </span>
                    </TableCell>

                    <TableCell className="py-3 text-xs">
                      <span className="font-medium capitalize">{accrual.toLowerCase()}</span>
                      {accrual === 'MONTHLY' && (
                        <div className="text-[10px] text-muted-foreground">
                          {(lt.annualQuota / 12).toFixed(2)}/mo
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      <Badge
                        variant={lt.isPaid ? 'success' : 'secondary'}
                        className="text-[10px] py-0 px-2 font-medium"
                      >
                        {lt.isPaid ? 'Paid Leave' : 'Unpaid (LOP)'}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 text-xs">
                      {lt.carryForward || maxCarry > 0 ? (
                        <div className="space-y-0.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Max {maxCarry} Days
                          </span>
                          <div className="text-[10px] text-muted-foreground">
                            Expires: {cfg?.carryForwardExpiryMonths || 3} Mos
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not Allowed</span>
                      )}
                    </TableCell>

                    <TableCell className="py-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={halfDayAllowed ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
                            {halfDayAllowed ? '✓ Half Day' : '✕ No Half Day'}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Notice: {noticeDays} Day{noticeDays > 1 ? 's' : ''}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 text-xs">
                      {sandwichWO ? (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300">
                          Count Weekend
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Exempt Weekend</span>
                      )}
                    </TableCell>

                    <TableCell className="py-3 text-right space-x-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Edit Policy"
                        onClick={() => handleOpenEdit(lt)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        title="Delete Leave Type"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete policy ${lt.name} (${lt.code})?`)) {
                            deleteMutation.mutate(lt.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {/* Configuration Modal */}
      <LeaveTypeConfigModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        companies={companies}
        companyId={companyId}
        editingType={editingType}
      />
    </div>
  );
}
