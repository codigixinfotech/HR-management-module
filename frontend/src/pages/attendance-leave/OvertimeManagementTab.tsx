import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Plus,
  Search,
  Clock,
  DollarSign,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/status-badge';

interface OvertimeItem {
  id: string;
  name: string;
  dept: string;
  date: string;
  hours: number;
  multiplier: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

const INITIAL_OVERTIMES: OvertimeItem[] = [
  { id: 'OT-801', name: 'Rajesh Sharma', dept: 'Engineering', date: '04 Aug 2026', hours: 2.5, multiplier: '1.5x (Weekdays)', status: 'APPROVED' },
  { id: 'OT-802', name: 'Amit Patel', dept: 'Operations & Plant', date: '04 Aug 2026', hours: 4.0, multiplier: '2.0x (Holiday)', status: 'APPROVED' },
  { id: 'OT-803', name: 'Sanjana Roy', dept: 'Customer Support', date: '05 Aug 2026', hours: 1.5, multiplier: '1.5x (Weekdays)', status: 'PENDING' },
];

export function OvertimeManagementTab() {
  const [items, setItems] = useState<OvertimeItem[]>(INITIAL_OVERTIMES);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDept, setFormDept] = useState('Engineering');
  const [formDate, setFormDate] = useState('05 Aug 2026');
  const [formHours, setFormHours] = useState('2.0');
  const [formMultiplier, setFormMultiplier] = useState('1.5x (Weekdays)');

  const openAddModal = () => {
    setFormName('');
    setFormDept('Engineering');
    setFormDate('05 Aug 2026');
    setFormHours('2.0');
    setFormMultiplier('1.5x (Weekdays)');
    setIsOpen(true);
  };

  const handleAddOt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formHours) {
      toast.error('Candidate name and hours are required');
      return;
    }

    const newOt: OvertimeItem = {
      id: `OT-80${items.length + 1}`,
      name: formName,
      dept: formDept,
      date: formDate,
      hours: parseFloat(formHours) || 0,
      multiplier: formMultiplier,
      status: 'PENDING',
    };

    setItems(prev => [...prev, newOt]);
    toast.success('Overtime log logged for verification');
    setIsOpen(false);
  };

  const handleApprove = (id: string) => {
    setItems(prev =>
      prev.map(i =>
        i.id === id ? { ...i, status: 'APPROVED' } : i,
      ),
    );
    toast.success('Overtime compensation approved');
  };

  const filteredOvertimes = useMemo(() => {
    return items.filter(i =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.id.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [items, searchQuery]);

  const totalHours = useMemo(() => {
    return items.reduce((acc, curr) => acc + (curr.status === 'APPROVED' ? curr.hours : 0), 0);
  }, [items]);

  return (
    <div className="space-y-6">
      {/* ── 1. Overtime Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Approved Overtime</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{totalHours} Hours</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Plant production line</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Awaiting Sign-off</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {items.filter(i => i.status === 'PENDING').length} Log
              </p>
              <p className="text-[10px] text-rose-600 font-semibold mt-1">Requires unit lead audit</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Overtime Multipliers</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">1.5x / 2.0x</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Compliant with Factories Act</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Coverage Rate</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">100% Mapped</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Fully payroll integrated</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Overtime Logs Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Overtime hours & compensation register
            </CardTitle>
            <CardDescription className="text-xs">
              Log, review, and approve overtime hours worked for additional hourly multiplier compensations
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-40 sm:w-52">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter logs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            {/* Request Overtime Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                  <Plus className="h-3.5 w-3.5" /> Log Overtime
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Log Employee Overtime Hours</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleAddOt}>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Employee Name</Label>
                    <Input
                      placeholder="e.g. Sanjana Roy"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Department Unit</Label>
                      <Input
                        placeholder="e.g. Engineering"
                        value={formDept}
                        onChange={e => setFormDept(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Punch Date</Label>
                      <Input
                        placeholder="e.g. 05 Aug 2026"
                        value={formDate}
                        onChange={e => setFormDate(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Extra Hours Logged</Label>
                      <Input
                        placeholder="e.g. 2.5"
                        value={formHours}
                        onChange={e => setFormHours(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rate Multiplier Category</Label>
                      <Input
                        placeholder="e.g. 1.5x (Weekdays)"
                        value={formMultiplier}
                        onChange={e => setFormMultiplier(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" size="sm" className="text-xs">
                      Submit Overtime Log
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">OT Ref ID</TableHead>
                <TableHead className="text-xs">Employee Name</TableHead>
                <TableHead className="text-xs">Department Unit</TableHead>
                <TableHead className="text-xs">Worked Date</TableHead>
                <TableHead className="text-xs">Overtime Duration</TableHead>
                <TableHead className="text-xs">Rate Multiplier</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOvertimes.map(i => (
                <TableRow key={i.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{i.id}</TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {i.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-semibold">{i.dept}</TableCell>
                  <TableCell className="text-xs font-mono">{i.date}</TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-foreground">+{i.hours} Hours</TableCell>
                  <TableCell className="text-xs text-primary font-semibold">{i.multiplier}</TableCell>
                  <TableCell className="text-xs">
                    <StatusBadge status={i.status} className="text-[10px]" />
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    {i.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10.5px] px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold"
                        onClick={() => handleApprove(i.id)}
                      >
                        Approve OT
                      </Button>
                    )}
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
