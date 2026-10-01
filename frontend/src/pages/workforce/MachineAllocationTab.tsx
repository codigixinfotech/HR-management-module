import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Wrench, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { Company } from '@/api/types';
import { useWorkforceBranch } from '@/pages/workforce/WorkforceBranchContext';
import { WorkforceBranchFilter } from '@/pages/workforce/WorkforceBranchFilter';

export interface LineAllocation {
  id: string;
  line: string;
  machine: string;
  operator: string;
  shift: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE';
  efficiency: string;
  branchName?: string;
}

const INITIAL_LINE_ALLOCATIONS: LineAllocation[] = [
  { id: 'ho-1', line: 'Head Office Central Lab Rig 1', machine: 'QC Telemetry Scanner #01', operator: 'Pooja Hegde', shift: 'General (G)', status: 'OPERATIONAL', efficiency: '99.1%', branchName: 'Head Office' },
  { id: 'ho-2', line: 'Head Office Server & BMS Unit', machine: 'HVAC & Facility Controller #01', operator: 'Manoj Tiwari', shift: 'General (G)', status: 'OPERATIONAL', efficiency: '97.8%', branchName: 'Head Office' },
  { id: '1', line: 'Pune Plant Line 1', machine: 'CNC Automated Lathe #04', operator: 'Amit Patel', shift: 'Morning (A)', status: 'OPERATIONAL', efficiency: '98.5%', branchName: 'Pune Manufacturing Plant' },
  { id: '2', line: 'Pune Plant Line 2', machine: 'Robotic Welding Arm #02', operator: 'Rajesh Sharma', shift: 'General (G)', status: 'OPERATIONAL', efficiency: '96.2%', branchName: 'Pune Manufacturing Plant' },
  { id: '3', line: 'Pune Plant Line 3', machine: 'Conveyor Packaging System', operator: 'Contractor Group B', shift: 'Evening (B)', status: 'MAINTENANCE', efficiency: '84.0%', branchName: 'Pune Manufacturing Plant' },
  { id: '4', line: 'Pune Plant Line 4', machine: 'High-Speed Stamping Press', operator: 'Vikas Deshmukh', shift: 'Morning (A)', status: 'OPERATIONAL', efficiency: '95.1%', branchName: 'Pune Manufacturing Plant' },
  { id: '5', line: 'Pune Plant Line 5', machine: 'Automated Injection Molding', operator: 'Sunil Rao', shift: 'Night (C)', status: 'OPERATIONAL', efficiency: '94.8%', branchName: 'Pune Manufacturing Plant' },
];

export function MachineAllocationTab({ companyId, companies }: { companyId?: string; companies?: Company[] }) {
  const {
    selectedBranch,
    setSelectedBranch,
    branches,
    isBranchAdmin,
    isSuperOrCompanyAdmin,
    assignedBranchName,
    matchBranch,
  } = useWorkforceBranch();

  const [allocations, setAllocations] = useState<LineAllocation[]>(INITIAL_LINE_ALLOCATIONS);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);

  // New allocation form state
  const [formData, setFormData] = useState({
    line: '',
    machine: '',
    operator: '',
    shift: 'Morning (A)',
    efficiency: '95.0%',
    status: 'OPERATIONAL' as 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE',
  });

  const filtered = allocations.filter((l) => {
    const matchesSearch =
      l.line.toLowerCase().includes(search.toLowerCase()) ||
      l.machine.toLowerCase().includes(search.toLowerCase()) ||
      l.operator.toLowerCase().includes(search.toLowerCase()) ||
      l.shift.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = matchBranch({
      branchName: l.branchName || l.line,
      location: l.line,
    });
    return matchesSearch && matchesBranch;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.line || !formData.machine || !formData.operator) {
      toast.error('Please enter production line, machine name and operator name');
      return;
    }

    const newAllocation: LineAllocation = {
      id: String(Date.now()),
      line: formData.line,
      machine: formData.machine,
      operator: formData.operator,
      shift: formData.shift,
      efficiency: formData.efficiency || '95.0%',
      status: formData.status,
    };

    setAllocations([newAllocation, ...allocations]);
    toast.success('Machine line operator assigned successfully');
    setOpenModal(false);
    setFormData({
      line: '',
      machine: '',
      operator: '',
      shift: 'Morning (A)',
      efficiency: '95.0%',
      status: 'OPERATIONAL',
    });
  };

  const handleToggleStatus = (id: string) => {
    setAllocations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'OPERATIONAL' ? 'MAINTENANCE' : 'OPERATIONAL';
          toast.info(`Updated status of ${item.line} to ${nextStatus}`);
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">Assembly Line & Machine Operator Allocation</CardTitle>
            <CardDescription>Assign certified operators and supervisors to factory floor machinery</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search line, machine, operator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* Branch Filter (Matching Employee Master Page) */}
            <WorkforceBranchFilter
              isSuperOrCompanyAdmin={isSuperOrCompanyAdmin}
              isBranchAdmin={isBranchAdmin}
              selectedBranch={selectedBranch}
              onBranchChange={setSelectedBranch}
              branches={branches}
              assignedBranchName={assignedBranchName}
            />

            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Assign Line Operator
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Assign Line Operator</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Production Line</Label>
                    <Input
                      placeholder="e.g. Pune Plant Line 6"
                      value={formData.line}
                      onChange={(e) => setFormData({ ...formData, line: e.target.value })}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Machine / Equipment</Label>
                    <Input
                      placeholder="e.g. Hydraulic Press Station #03"
                      value={formData.machine}
                      onChange={(e) => setFormData({ ...formData, machine: e.target.value })}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Assigned Certified Operator</Label>
                    <Input
                      placeholder="e.g. Rahul Patil"
                      value={formData.operator}
                      onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Shift Duty</Label>
                      <Select
                        value={formData.shift}
                        onValueChange={(val) => setFormData({ ...formData, shift: val })}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Morning (A)" className="text-xs">Morning (A)</SelectItem>
                          <SelectItem value="Evening (B)" className="text-xs">Evening (B)</SelectItem>
                          <SelectItem value="Night (C)" className="text-xs">Night (C)</SelectItem>
                          <SelectItem value="General (G)" className="text-xs">General (G)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Target Efficiency</Label>
                      <Input
                        placeholder="e.g. 96.0%"
                        value={formData.efficiency}
                        onChange={(e) => setFormData({ ...formData, efficiency: e.target.value })}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setOpenModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm">
                      Assign Operator
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Production Line</TableHead>
                  <TableHead className="text-xs">Machine Equipment</TableHead>
                  <TableHead className="text-xs">Assigned Operator</TableHead>
                  <TableHead className="text-xs">Shift Duty</TableHead>
                  <TableHead className="text-xs">Line Efficiency</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                      No line allocations found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-semibold text-xs">{l.line}</TableCell>
                      <TableCell className="font-medium text-xs">{l.machine}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{l.operator}</TableCell>
                      <TableCell className="text-xs font-mono">{l.shift}</TableCell>
                      <TableCell className="text-xs font-semibold text-success">{l.efficiency}</TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge
                          status={l.status === 'OPERATIONAL' ? 'OPERATIONAL' : 'ON_HOLD'}
                          label={l.status === 'OPERATIONAL' ? 'Operational' : 'Maintenance'}
                          className="text-[10px]"
                        />
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(l.id)}
                          className="h-7 px-2 text-[11px]"
                          title="Toggle Status"
                        >
                          {l.status === 'OPERATIONAL' ? (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Mark Maint.
                            </span>
                          ) : (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Set Active
                            </span>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
