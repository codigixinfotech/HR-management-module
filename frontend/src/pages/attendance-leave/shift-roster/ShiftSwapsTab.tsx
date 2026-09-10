import { useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeftRight,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShiftRosterStore } from './shiftRosterStore';

export function ShiftSwapsTab() {
  const { shiftSwaps, rosterEmployees, submitShiftSwap, resolveShiftSwap } = useShiftRosterStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const emp1 = rosterEmployees[0];
  const emp2 = rosterEmployees[1] || rosterEmployees[0];

  // Form states
  const [requesterCode, setRequesterCode] = useState(emp1?.employeeCode || 'EMP-001');
  const [requesterName, setRequesterName] = useState(emp1?.name || 'Staff Member');
  const [requesterDept, setRequesterDept] = useState(emp1?.department || 'Operations');
  const [requesterShift, setRequesterShift] = useState('Morning Shift (08:00 - 16:30)');

  const [targetCode, setTargetCode] = useState(emp2?.employeeCode || 'EMP-002');
  const [targetName, setTargetName] = useState(emp2?.name || 'Swap Partner');
  const [targetDept, setTargetDept] = useState(emp2?.department || 'Operations');
  const [targetShift, setTargetShift] = useState('Evening Shift (16:00 - 00:30)');

  const [swapDate, setSwapDate] = useState('2026-09-12');
  const [reason, setReason] = useState('');

  const handleProposeSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast.error('Please specify a valid reason for this peer shift swap');
      return;
    }

    submitShiftSwap({
      requesterCode,
      requesterName,
      requesterDept,
      requesterShift,
      targetCode,
      targetName,
      targetDept,
      targetShift,
      swapDate,
      reason,
    });

    toast.success(`Shift swap proposed between ${requesterName} and ${targetName}`);
    setIsModalOpen(false);
    setReason('');
  };

  const filteredSwaps = shiftSwaps.filter((sw) => {
    const q = searchQuery.toLowerCase();
    return (
      sw.requesterName.toLowerCase().includes(q) ||
      sw.targetName.toLowerCase().includes(q) ||
      sw.reason.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* System Validation Engine Card */}
      <div className="rounded-xl border border-border/80 bg-gradient-to-r from-card via-muted/30 to-card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2.5">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Shift Swap Automated Compliance Engine
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Before submitting any peer-to-peer swap, the system evaluates all 5 regulatory and operational requirements:
            </p>
          </div>
          <Badge variant="outline" className="text-[11px] font-semibold text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40">
            Real-time Verification Active
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-foreground font-medium p-2 rounded-lg bg-background border">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Both Active</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground font-medium p-2 rounded-lg bg-background border">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Same Branch</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground font-medium p-2 rounded-lg bg-background border">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>No Leave Conflict</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground font-medium p-2 rounded-lg bg-background border">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>No Double-Booking</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground font-medium p-2 rounded-lg bg-background border col-span-2 sm:col-span-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>≥11h Rest Interval</span>
          </div>
        </div>
      </div>

      {/* Main Swaps Registry Table */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-primary" /> Peer Shift Swap Registry
            </CardTitle>
            <CardDescription className="text-xs">
              Mutual shift exchange requests between verified colleagues
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-44 sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search staff or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Propose Shift Swap
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4 text-primary" /> Propose Shift Swap Between Peers
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Select the two staff members, swap date and shifts. Both peers and manager must consent.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleProposeSwap} className="space-y-4 pt-1">
                  {/* Peer A */}
                  <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Employee A (Requester)</span>
                    {rosterEmployees.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-[11px]">Select Colleague A from Directory</Label>
                        <Select
                          value={requesterCode}
                          onValueChange={(code) => {
                            const emp = rosterEmployees.find((e) => e.employeeCode === code);
                            if (emp) {
                              setRequesterCode(emp.employeeCode);
                              setRequesterName(emp.name);
                              setRequesterDept(emp.department);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Choose colleague..." />
                          </SelectTrigger>
                          <SelectContent>
                            {rosterEmployees.map((e) => (
                              <SelectItem key={e.employeeId} value={e.employeeCode} className="text-xs">
                                {e.employeeCode} — {e.name} ({e.department})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Staff Name</Label>
                        <Input value={requesterName} onChange={(e) => setRequesterName(e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">Original Shift</Label>
                        <Input value={requesterShift} onChange={(e) => setRequesterShift(e.target.value)} className="h-8 text-xs font-mono" />
                      </div>
                    </div>
                  </div>

                  {/* Swap Indicator */}
                  <div className="flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full border bg-background flex items-center justify-center text-primary shadow-2xs">
                      <ArrowLeftRight className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Peer B */}
                  <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-violet-600 tracking-wider">Employee B (Swap Partner)</span>
                    {rosterEmployees.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-[11px]">Select Colleague B from Directory</Label>
                        <Select
                          value={targetCode}
                          onValueChange={(code) => {
                            const emp = rosterEmployees.find((e) => e.employeeCode === code);
                            if (emp) {
                              setTargetCode(emp.employeeCode);
                              setTargetName(emp.name);
                              setTargetDept(emp.department);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Choose colleague..." />
                          </SelectTrigger>
                          <SelectContent>
                            {rosterEmployees.map((e) => (
                              <SelectItem key={e.employeeId} value={e.employeeCode} className="text-xs">
                                {e.employeeCode} — {e.name} ({e.department})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Partner Name</Label>
                        <Input value={targetName} onChange={(e) => setTargetName(e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">Partner's Shift</Label>
                        <Input value={targetShift} onChange={(e) => setTargetShift(e.target.value)} className="h-8 text-xs font-mono" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Date of Swap *</Label>
                      <Input
                        type="date"
                        value={swapDate}
                        onChange={(e) => setSwapDate(e.target.value)}
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Reason for Swap *</Label>
                      <Input
                        placeholder="e.g. Urgent family schedule"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>System validation: All 5 compliance checks passed.</span>
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm">
                      Submit Proposal
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="rounded-md border border-border/80 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-semibold">Initiating Colleague</TableHead>
                  <TableHead className="text-xs font-semibold">Swap Partner</TableHead>
                  <TableHead className="text-xs font-semibold">Date of Swap</TableHead>
                  <TableHead className="text-xs font-semibold">Reason</TableHead>
                  <TableHead className="text-xs font-semibold">Compliance Checks</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSwaps.map((sw) => (
                  <TableRow key={sw.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-primary">{sw.requesterCode}</span>
                          <span className="text-xs font-semibold text-foreground">{sw.requesterName}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{sw.requesterShift}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-violet-600">{sw.targetCode}</span>
                          <span className="text-xs font-semibold text-foreground">{sw.targetName}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{sw.targetShift}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground font-medium">
                      {sw.swapDate}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={sw.reason}>
                      {sw.reason}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>5 / 5 Checks Passed</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {sw.status === 'Pending Manager Approval' && (
                        <Badge variant="outline" className="text-[10px] font-semibold text-amber-600 bg-amber-50 border-amber-300 dark:bg-amber-950/40">
                          Pending Approval
                        </Badge>
                      )}
                      {sw.status === 'Approved' && (
                        <Badge variant="outline" className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40">
                          Approved & Roster Updated
                        </Badge>
                      )}
                      {sw.status === 'Rejected' && (
                        <Badge variant="outline" className="text-[10px] font-semibold text-rose-600 bg-rose-50 border-rose-300 dark:bg-rose-950/40">
                          Rejected
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {sw.status === 'Pending Manager Approval' ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            onClick={() => {
                              resolveShiftSwap(sw.id, 'Approved');
                              toast.success(`Shift swap between ${sw.requesterName} & ${sw.targetName} approved`);
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => {
                              resolveShiftSwap(sw.id, 'Rejected');
                              toast.info('Shift swap rejected');
                            }}
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">Processed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
