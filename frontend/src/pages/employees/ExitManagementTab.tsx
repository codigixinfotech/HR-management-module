import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  LogOut,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  HelpCircle,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ExitItem {
  id: string;
  name: string;
  resignDate: string;
  lastWorkingDay: string;
  reason: string;
  clearanceStatus: 'COMPLETED' | 'PENDING_CLEARANCE' | 'INITIATED';
}

const INITIAL_EXITS: ExitItem[] = [
  { id: 'EXT-301', name: 'Rohan Deshmukh', resignDate: '01 Jul 2026', lastWorkingDay: '31 Aug 2026', reason: 'Better Career Opportunity', clearanceStatus: 'INITIATED' },
  { id: 'EXT-302', name: 'Kavita Joshi', resignDate: '15 Jul 2026', lastWorkingDay: '15 Oct 2026', reason: 'Personal Reasons / Relocation', clearanceStatus: 'INITIATED' },
  { id: 'EXT-303', name: 'Sanjay Malhotra', resignDate: '01 Jun 2026', lastWorkingDay: '31 Jul 2026', reason: 'Higher Education', clearanceStatus: 'COMPLETED' },
];

export function ExitManagementTab() {
  const [exits, setExits] = useState<ExitItem[]>(INITIAL_EXITS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formResignDate, setFormResignDate] = useState('05 Aug 2026');
  const [formLwd, setFormLwd] = useState('05 Nov 2026');
  const [formReason, setFormReason] = useState('Better Career Opportunity');

  const openAddModal = () => {
    setFormName('');
    setFormResignDate('05 Aug 2026');
    setFormLwd('05 Nov 2026');
    setFormReason('Better Career Opportunity');
    setIsOpen(true);
  };

  const handleAddExit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error('Employee name is required');
      return;
    }

    const newExit: ExitItem = {
      id: `EXT-30${exits.length + 1}`,
      name: formName,
      resignDate: formResignDate,
      lastWorkingDay: formLwd,
      reason: formReason,
      clearanceStatus: 'INITIATED',
    };

    setExits(prev => [...prev, newExit]);
    toast.success('Resignation processed. Offboarding checklist initiated.');
    setIsOpen(false);
  };

  const handleClearanceApprove = (id: string) => {
    setExits(prev =>
      prev.map(e =>
        e.id === id ? { ...e, clearanceStatus: 'COMPLETED' } : e,
      ),
    );
    toast.success('Full & Final clearance completed successfully!');
  };

  const filteredExits = useMemo(() => {
    return exits.filter(e => {
      const matchesSearch =
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === 'all' ? true : e.clearanceStatus.toLowerCase() === selectedStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [exits, searchQuery, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Exit offboarding Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Exits</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {exits.filter(e => e.clearanceStatus !== 'COMPLETED').length} Employees
              </p>
              <p className="text-[10px] text-rose-600 font-semibold mt-1">Currently serving notice</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
              <LogOut className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Completed Clearances</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {exits.filter(e => e.clearanceStatus === 'COMPLETED').length} Settled
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">F&F disbursement finalized</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Attrition Index</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">3.8%</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Industry benchmark: 12%</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <TrendingDown className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Checklists Pending</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">2 Pending</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">IT & Admin clearances active</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Exit offboarding Directory ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <LogOut className="h-4 w-4 text-primary" /> Exit Management & Offboarding Register
              </CardTitle>
              <CardDescription className="text-xs">
                Manage employee resignations, serving notice periods, F&F final settlements, and exit interview clearances
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All Servicing' },
                  { id: 'initiated', label: 'Initiated' },
                  { id: 'completed', label: 'F&F Settled' },
                ].map(status => (
                  <button
                    key={status.id}
                    onClick={() => setSelectedStatus(status.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedStatus === status.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter exits..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Process Resignation Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                    <Plus className="h-3.5 w-3.5" /> Process Resignation
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Process Employee Resignation</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleAddExit}>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Employee Name</Label>
                      <Input
                        placeholder="e.g. Kavita Joshi"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Resignation Date</Label>
                        <Input
                          placeholder="e.g. 05 Aug 2026"
                          value={formResignDate}
                          onChange={e => setFormResignDate(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Last Working Day (LWD)</Label>
                        <Input
                          placeholder="e.g. 05 Nov 2026"
                          value={formLwd}
                          onChange={e => setFormLwd(e.target.value)}
                          className="h-9 text-xs font-mono font-semibold"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Exit Declared Reason</Label>
                      <Input
                        placeholder="e.g. Better Career Opportunity"
                        value={formReason}
                        onChange={e => setFormReason(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
                        Initiate Checklist
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
                <TableHead className="text-xs">Exit ID</TableHead>
                <TableHead className="text-xs">Employee Name</TableHead>
                <TableHead className="text-xs">Resignation Date</TableHead>
                <TableHead className="text-xs">Last Working Day</TableHead>
                <TableHead className="text-xs">Exit Primary Reason</TableHead>
                <TableHead className="text-xs">Clearance checklist</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExits.map(e => (
                <TableRow key={e.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{e.id}</TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">{e.name}</TableCell>
                  <TableCell className="text-xs font-mono">{e.resignDate}</TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-foreground">{e.lastWorkingDay}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-semibold">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {e.reason}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className={`text-[10px] font-semibold ${e.clearanceStatus === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20 animate-pulse'}`}>
                      {e.clearanceStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    {e.clearanceStatus !== 'COMPLETED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10.5px] px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold"
                        onClick={() => handleClearanceApprove(e.id)}
                      >
                        Sign F&F Clearance
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
