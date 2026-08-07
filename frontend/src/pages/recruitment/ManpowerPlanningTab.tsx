import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ManpowerPlanItem {
  id: string;
  dept: string;
  role: string;
  costCenter: string;
  budgeted: number;
  active: number;
  plannedHires: number;
  quarter: string;
  status: 'ON-TRACK' | 'UNDER-STAFFED' | 'CAP-REACHED';
}

const INITIAL_MANPOWER_PLANS: ManpowerPlanItem[] = [
  { id: 'MP-01', dept: 'Engineering', role: 'Senior Software Engineer', costCenter: 'CC-102', budgeted: 15, active: 12, plannedHires: 3, quarter: 'Q3 2026', status: 'UNDER-STAFFED' },
  { id: 'MP-02', dept: 'Engineering', role: 'DevOps Lead', costCenter: 'CC-102', budgeted: 4, active: 4, plannedHires: 0, quarter: 'Q3 2026', status: 'CAP-REACHED' },
  { id: 'MP-03', dept: 'Sales', role: 'Regional Sales Manager', costCenter: 'CC-103', budgeted: 8, active: 6, plannedHires: 2, quarter: 'Q3 2026', status: 'UNDER-STAFFED' },
  { id: 'MP-04', dept: 'Operations', role: 'Production Supervisor', costCenter: 'CC-104', budgeted: 10, active: 9, plannedHires: 1, quarter: 'Q4 2026', status: 'ON-TRACK' },
  { id: 'MP-05', dept: 'Human Resources', role: 'HR Business Partner', costCenter: 'CC-101', budgeted: 5, active: 4, plannedHires: 1, quarter: 'Q4 2026', status: 'ON-TRACK' },
];

export function ManpowerPlanningTab() {
  const [plans, setPlans] = useState<ManpowerPlanItem[]>(INITIAL_MANPOWER_PLANS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ManpowerPlanItem | null>(null);
  const [formDept, setFormDept] = useState('Engineering');
  const [formRole, setFormRole] = useState('');
  const [formCostCenter, setFormCostCenter] = useState('CC-102');
  const [formBudgeted, setFormBudgeted] = useState(5);
  const [formActive, setFormActive] = useState(4);
  const [formPlannedHires, setFormPlannedHires] = useState(1);
  const [formQuarter, setFormQuarter] = useState('Q3 2026');

  const openAddModal = () => {
    setEditingPlan(null);
    setFormDept('Engineering');
    setFormRole('');
    setFormCostCenter('CC-102');
    setFormBudgeted(5);
    setFormActive(4);
    setFormPlannedHires(1);
    setFormQuarter('Q3 2026');
    setIsOpen(true);
  };

  const openEditModal = (plan: ManpowerPlanItem) => {
    setEditingPlan(plan);
    setFormDept(plan.dept);
    setFormRole(plan.role);
    setFormCostCenter(plan.costCenter);
    setFormBudgeted(plan.budgeted);
    setFormActive(plan.active);
    setFormPlannedHires(plan.plannedHires);
    setFormQuarter(plan.quarter);
    setIsOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRole) {
      toast.error('Role Title is required');
      return;
    }

    const calculatedStatus = formActive >= formBudgeted ? 'CAP-REACHED' : formPlannedHires > 0 ? 'UNDER-STAFFED' : 'ON-TRACK';

    if (editingPlan) {
      setPlans(prev =>
        prev.map(p =>
          p.id === editingPlan.id
            ? {
              ...p,
              dept: formDept,
              role: formRole,
              costCenter: formCostCenter,
              budgeted: formBudgeted,
              active: formActive,
              plannedHires: formPlannedHires,
              quarter: formQuarter,
              status: calculatedStatus,
            }
            : p,
        ),
      );
      toast.success('Manpower Forecast updated');
    } else {
      const newPlan: ManpowerPlanItem = {
        id: `MP-0${plans.length + 1}`,
        dept: formDept,
        role: formRole,
        costCenter: formCostCenter,
        budgeted: formBudgeted,
        active: formActive,
        plannedHires: formPlannedHires,
        quarter: formQuarter,
        status: calculatedStatus,
      };
      setPlans(prev => [...prev, newPlan]);
      toast.success('Forecast Plan added successfully');
    }
    setIsOpen(false);
  };

  const handleDeletePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
    toast.success('Manpower plan archived');
  };

  const initiateRequisition = (role: string) => {
    toast.success(`Initiated job requisition for "${role}"`);
  };

  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchesSearch =
        p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.costCenter.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === 'all' ? true : p.dept.toLowerCase() === selectedDept.toLowerCase();
      return matchesSearch && matchesDept;
    });
  }, [plans, searchQuery, selectedDept]);

  const totalBudgeted = plans.reduce((acc, curr) => acc + curr.budgeted, 0);
  const totalActive = plans.reduce((acc, curr) => acc + curr.active, 0);
  const totalPlanned = plans.reduce((acc, curr) => acc + curr.plannedHires, 0);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Manpower Planning KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Budgeted Roles</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{totalBudgeted} Positions</p>
              <p className="text-[10px] text-primary font-semibold mt-1">FY 2026-27 Approved</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Filled Roles</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{totalActive} Staff</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">88.5% Occupancy Rate</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Planned Q3/Q4 Hires</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">+{totalPlanned} Openings</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Recruitment In Progress</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Remaining Budget Cap</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{totalBudgeted - totalActive} Positions</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Available Headcount</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Manpower Planning Master Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" /> Departmental Manpower Planning & Forecast
              </CardTitle>
              <CardDescription className="text-xs">
                Headcount forecasting, position budgets, cost center mapping and requisition controls
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'engineering', label: 'Engineering' },
                  { id: 'sales', label: 'Sales' },
                  { id: 'operations', label: 'Operations' },
                  { id: 'human resources', label: 'HR' },
                ].map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedDept === dept.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {dept.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter forecasted roles..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Manpower Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                    <Plus className="h-3.5 w-3.5" /> Add Forecast Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingPlan ? 'Edit Manpower Plan' : 'Add Headcount Forecast Plan'}</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleSavePlan}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Department</Label>
                        <Select value={formDept} onValueChange={setFormDept}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select dept" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Engineering" className="text-xs">Engineering</SelectItem>
                            <SelectItem value="Sales" className="text-xs">Sales</SelectItem>
                            <SelectItem value="Operations" className="text-xs">Operations</SelectItem>
                            <SelectItem value="Human Resources" className="text-xs">Human Resources</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Cost Center</Label>
                        <Select value={formCostCenter} onValueChange={setFormCostCenter}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select CC" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CC-101" className="text-xs">CC-101 (HR)</SelectItem>
                            <SelectItem value="CC-102" className="text-xs">CC-102 (Eng)</SelectItem>
                            <SelectItem value="CC-103" className="text-xs">CC-103 (Sales)</SelectItem>
                            <SelectItem value="CC-104" className="text-xs">CC-104 (Ops)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Target Job Designation Role</Label>
                      <Input
                        placeholder="e.g. Senior Software Engineer"
                        value={formRole}
                        onChange={e => setFormRole(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Budgeted Cap</Label>
                        <Input
                          type="number"
                          value={formBudgeted}
                          onChange={e => setFormBudgeted(parseInt(e.target.value) || 0)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Active Staff</Label>
                        <Input
                          type="number"
                          value={formActive}
                          onChange={e => setFormActive(parseInt(e.target.value) || 0)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Planned Hires</Label>
                        <Input
                          type="number"
                          value={formPlannedHires}
                          onChange={e => setFormPlannedHires(parseInt(e.target.value) || 0)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Target Hiring Quarter</Label>
                      <Select value={formQuarter} onValueChange={setFormQuarter}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select quarter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Q3 2026" className="text-xs">Q3 2026</SelectItem>
                          <SelectItem value="Q4 2026" className="text-xs">Q4 2026</SelectItem>
                          <SelectItem value="Q1 2027" className="text-xs">Q1 2027</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
                        Publish Forecast
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">ID</TableHead>
                <TableHead className="text-xs">Target Position Role</TableHead>
                <TableHead className="text-xs">Department</TableHead>
                <TableHead className="text-xs">Cost Center</TableHead>
                <TableHead className="text-xs">Budget vs Active</TableHead>
                <TableHead className="text-xs">Target Hires</TableHead>
                <TableHead className="text-xs">Hiring Quarter</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.map(p => {
                const percentage = Math.round((p.active / p.budgeted) * 100);

                return (
                  <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{p.id}</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {p.role}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-semibold">{p.dept}</TableCell>
                    <TableCell className="text-xs font-mono font-medium">{p.costCenter}</TableCell>
                    <TableCell className="text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{p.active} / {p.budgeted}</span>
                        <span className="text-[10px] text-muted-foreground">({percentage}%)</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-primary">+{p.plannedHires} Hires</TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">{p.quarter}</TableCell>
                    <TableCell className="text-xs">
                      <Badge
                        className={`text-[10px] font-semibold ${p.status === 'CAP-REACHED'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : p.status === 'UNDER-STAFFED'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-1">
                      {p.plannedHires > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10.5px] px-2 text-primary border-primary/30 hover:bg-primary/10 gap-1 font-semibold"
                          onClick={() => initiateRequisition(p.role)}
                        >
                          Raise MR
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditModal(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeletePlan(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
