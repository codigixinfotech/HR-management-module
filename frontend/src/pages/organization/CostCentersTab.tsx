import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Users,
  Search,
  Grid,
  List,
  CheckCircle2,
  Award,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface CostCenterItem {
  code: string;
  name: string;
  dept: string;
  budget: string;
  rawBudget: number;
  manager: string;
  headcount: number;
  maxCapacity: number;
  color: string;
}

interface PayGradeItem {
  grade: string;
  ctcRange: string;
  notice: string;
  probation: string;
  level: string;
  badgeColor: string;
}

const INITIAL_COST_CENTERS: CostCenterItem[] = [
  { code: 'CC-101', name: 'Corporate HQ - HR & Admin', dept: 'Human Resources', budget: '₹4,50,00,000', rawBudget: 45000000, manager: 'Admin User (CPO)', headcount: 14, maxCapacity: 16, color: 'bg-violet-500' },
  { code: 'CC-102', name: 'R&D Product Engineering', dept: 'Engineering', budget: '₹12,80,00,000', rawBudget: 128000000, manager: 'Rajesh Sharma (CTO)', headcount: 45, maxCapacity: 50, color: 'bg-primary' },
  { code: 'CC-103', name: 'Global Sales & Marketing', dept: 'Sales', budget: '₹8,20,00,000', rawBudget: 82000000, manager: 'Priya Verma (CCO)', headcount: 28, maxCapacity: 35, color: 'bg-amber-500' },
  { code: 'CC-104', name: 'Plant Operations Pune', dept: 'Operations', budget: '₹15,40,00,000', rawBudget: 154000000, manager: 'Amit Patel (CFO)', headcount: 61, maxCapacity: 70, color: 'bg-emerald-500' },
];

const INITIAL_PAY_GRADES: PayGradeItem[] = [
  { grade: 'Executive Band (E1 - E4)', ctcRange: '₹4,00,000 - ₹12,00,000', notice: '30 Days', probation: '6 Months', level: 'Junior - Mid Level', badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { grade: 'Managerial Band (M1 - M3)', ctcRange: '₹14,00,000 - ₹28,00,000', notice: '60 Days', probation: '3 Months', level: 'Managerial', badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { grade: 'Leadership Band (L1 - L2)', ctcRange: '₹32,00,000 - ₹65,00,000', notice: '90 Days', probation: 'Confirmed', level: 'Senior Leadership / VP', badgeColor: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
];

export function CostCentersTab() {
  const [costCenters, setCostCenters] = useState<CostCenterItem[]>(INITIAL_COST_CENTERS);
  const [payGrades] = useState<PayGradeItem[]>(INITIAL_PAY_GRADES);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');

  // Dialog State
  const [isCcOpen, setIsCcOpen] = useState(false);
  const [editingCc, setEditingCc] = useState<CostCenterItem | null>(null);
  const [formCcCode, setFormCcCode] = useState('');
  const [formCcName, setFormCcName] = useState('');
  const [formCcDept, setFormCcDept] = useState('');
  const [formCcBudget, setFormCcBudget] = useState('');
  const [formCcManager, setFormCcManager] = useState('');

  const openAddCc = () => {
    setEditingCc(null);
    setFormCcCode('');
    setFormCcName('');
    setFormCcDept('Engineering');
    setFormCcBudget('₹2,50,00,000');
    setFormCcManager('');
    setIsCcOpen(true);
  };

  const openEditCc = (item: CostCenterItem) => {
    setEditingCc(item);
    setFormCcCode(item.code);
    setFormCcName(item.name);
    setFormCcDept(item.dept);
    setFormCcBudget(item.budget);
    setFormCcManager(item.manager);
    setIsCcOpen(true);
  };

  const handleSaveCc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCcCode || !formCcName) {
      toast.error('Code and Name are required');
      return;
    }

    if (editingCc) {
      setCostCenters(prev =>
        prev.map(c =>
          c.code === editingCc.code
            ? { ...c, code: formCcCode, name: formCcName, dept: formCcDept, budget: formCcBudget, manager: formCcManager }
            : c,
        ),
      );
      toast.success('Cost Center updated successfully');
    } else {
      const newCc: CostCenterItem = {
        code: formCcCode,
        name: formCcName,
        dept: formCcDept,
        budget: formCcBudget,
        rawBudget: 25000000,
        manager: formCcManager || 'Unassigned',
        headcount: 10,
        maxCapacity: 15,
        color: 'bg-primary',
      };
      setCostCenters(prev => [...prev, newCc]);
      toast.success('Cost Center created successfully');
    }
    setIsCcOpen(false);
  };

  const handleDeleteCc = (code: string) => {
    setCostCenters(prev => prev.filter(c => c.code !== code));
    toast.success('Cost Center deleted');
  };

  const filteredCostCenters = useMemo(() => {
    if (!searchQuery.trim()) return costCenters;
    const q = searchQuery.toLowerCase();
    return costCenters.filter(
      c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.dept.toLowerCase().includes(q) || c.manager.toLowerCase().includes(q),
    );
  }, [costCenters, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Performance & Financial KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Cost Centers</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{costCenters.length} Accounts</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">100% Fully Allocated</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Annual Budget</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">₹40.9 Cr</p>
              <p className="text-[10px] text-primary font-semibold mt-1">FY 2026-27 Approved</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pay Grade Scale Bands</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{payGrades.length} Tiers</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">E1 - L2 Bands Active</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Budget Variance</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">-2.8%</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Under Operating Budget</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Cost Centers Management Panel ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Corporate Financial Cost Centers
              </CardTitle>
              <CardDescription className="text-xs">
                Allocate departmental budgets, cost center managers, headcount limits and financial accountability
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                <button
                  onClick={() => setDisplayMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${displayMode === 'grid' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Grid View"
                >
                  <Grid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDisplayMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${displayMode === 'table' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                  title="Table View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter cost centers..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Cost Center Dialog */}
              <Dialog open={isCcOpen} onOpenChange={setIsCcOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddCc}>
                    <Plus className="h-3.5 w-3.5" /> Add Cost Center
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingCc ? 'Edit Cost Center' : 'Create New Cost Center'}</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleSaveCc}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Cost Center Code</Label>
                        <Input
                          placeholder="e.g. CC-105"
                          value={formCcCode}
                          onChange={e => setFormCcCode(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Department</Label>
                        <Select value={formCcDept} onValueChange={setFormCcDept}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select dept" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Engineering" className="text-xs">Engineering</SelectItem>
                            <SelectItem value="Human Resources" className="text-xs">Human Resources</SelectItem>
                            <SelectItem value="Sales" className="text-xs">Sales</SelectItem>
                            <SelectItem value="Operations" className="text-xs">Operations</SelectItem>
                            <SelectItem value="Finance" className="text-xs">Finance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Cost Center Title</Label>
                      <Input
                        placeholder="e.g. R&D Cloud Infrastructure"
                        value={formCcName}
                        onChange={e => setFormCcName(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Annual Budget</Label>
                        <Input
                          placeholder="e.g. ₹5,00,00,000"
                          value={formCcBudget}
                          onChange={e => setFormCcBudget(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Cost Center Head</Label>
                        <Input
                          placeholder="Manager Name"
                          value={formCcManager}
                          onChange={e => setFormCcManager(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
                        {editingCc ? 'Save Changes' : 'Create Cost Center'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {displayMode === 'grid' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {filteredCostCenters.map(cc => {
                const percentage = Math.round((cc.headcount / cc.maxCapacity) * 100);

                return (
                  <div
                    key={cc.code}
                    className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${cc.color}`} />
                          <span className="font-mono text-xs font-semibold text-primary">{cc.code}</span>
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {cc.dept}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditCc(cc)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteCc(cc.code)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <h3 className=" text-base font-semibold text-foreground mt-2 group-hover:text-primary transition-colors">
                        {cc.name}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Head: <strong className="text-foreground">{cc.manager}</strong></span>
                      </p>
                    </div>

                    <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Annual Allocation</span>
                        <span className="font-mono font-semibold text-sm text-foreground">{cc.budget}</span>
                      </div>

                      {/* Headcount Consumption Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground font-medium flex items-center gap-1">
                            <Users className="h-3 w-3" /> Staff Allocation
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {cc.headcount} / {cc.maxCapacity} Staff ({percentage}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${cc.color}`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {displayMode === 'table' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">CC Code</TableHead>
                  <TableHead className="text-xs">Cost Center Name</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Annual Budget</TableHead>
                  <TableHead className="text-xs">Cost Center Head</TableHead>
                  <TableHead className="text-xs">Headcount</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCostCenters.map(cc => (
                  <TableRow key={cc.code} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{cc.code}</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">{cc.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{cc.dept}</TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-foreground">{cc.budget}</TableCell>
                    <TableCell className="text-xs font-medium">{cc.manager}</TableCell>
                    <TableCell className="text-xs font-mono">{cc.headcount} / {cc.maxCapacity} Staff</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCc(cc)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCc(cc.code)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Compensation Scale & Pay Grade Framework Panel ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" /> Compensation Band & Pay Grade Framework
              </CardTitle>
              <CardDescription className="text-xs">
                Standardized salary CTC bands, probation terms & notice periods per executive level
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => alert('Add Pay Grade Band clicked')}>
              <Plus className="h-3.5 w-3.5" /> Add Grade Band
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Grade Level Band</TableHead>
                <TableHead className="text-xs">CTC Scale Range</TableHead>
                <TableHead className="text-xs">Notice Period</TableHead>
                <TableHead className="text-xs">Probation Terms</TableHead>
                <TableHead className="text-xs">Level Category</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payGrades.map((g, idx) => (
                <TableRow key={idx} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-semibold text-xs text-foreground">{g.grade}</TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-primary">{g.ctcRange}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-semibold">{g.notice}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{g.probation}</TableCell>
                  <TableCell className="text-xs">
                    <Badge className={`text-[10px] font-semibold ${g.badgeColor}`}>
                      {g.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
