import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  ArrowRightLeft,
  Plus,
  Search,
  CheckCircle2,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';

interface TransferItem {
  id: string;
  name: string;
  fromDept: string;
  toDept: string;
  effDate: string;
  type: 'PROMOTION & TRANSFER' | 'BRANCH TRANSFER' | 'DEPARTMENT SHIFT';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

const INITIAL_TRANSFERS: TransferItem[] = [
  { id: 'TRF-101', name: 'Rajesh Sharma', fromDept: 'Frontend Engineering', toDept: 'Core Product R&D', effDate: '01 Jul 2026', type: 'PROMOTION & TRANSFER', status: 'APPROVED' },
  { id: 'TRF-102', name: 'Priya Verma', fromDept: 'Pune Branch', toDept: 'Mumbai Branch', effDate: '01 Aug 2026', type: 'BRANCH TRANSFER', status: 'APPROVED' },
  { id: 'TRF-103', name: 'Amit Patel', fromDept: 'Pune Branch', toDept: 'Bangalore HQ', effDate: '15 Aug 2026', type: 'BRANCH TRANSFER', status: 'PENDING' },
  { id: 'TRF-104', name: 'Sanjana Roy', fromDept: 'Corporate Operations', toDept: 'Human Resources', effDate: '01 Sep 2026', type: 'DEPARTMENT SHIFT', status: 'PENDING' },
];

export function TransfersPromotionsTab() {
  const [transfers, setTransfers] = useState<TransferItem[]>(INITIAL_TRANSFERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formFrom, setFormFrom] = useState('');
  const [formTo, setFormTo] = useState('');
  const [formType, setFormType] = useState<'PROMOTION & TRANSFER' | 'BRANCH TRANSFER' | 'DEPARTMENT SHIFT'>('DEPARTMENT SHIFT');
  const [formDate, setFormDate] = useState('01 Sep 2026');

  const openAddModal = () => {
    setFormName('');
    setFormFrom('');
    setFormTo('');
    setFormType('DEPARTMENT SHIFT');
    setFormDate('01 Sep 2026');
    setIsOpen(true);
  };

  const handleAddTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formFrom || !formTo) {
      toast.error('All inputs are required to queue a transfer movement');
      return;
    }

    const newTransfer: TransferItem = {
      id: `TRF-10${transfers.length + 1}`,
      name: formName,
      fromDept: formFrom,
      toDept: formTo,
      effDate: formDate,
      type: formType,
      status: 'PENDING',
    };

    setTransfers(prev => [...prev, newTransfer]);
    toast.success('Workforce transfer movement queued for approval');
    setIsOpen(false);
  };

  const handleApprove = (id: string) => {
    setTransfers(prev =>
      prev.map(t =>
        t.id === id ? { ...t, status: 'APPROVED' } : t,
      ),
    );
    toast.success('Transfer movement approved successfully!');
  };

  const filteredTransfers = useMemo(() => {
    return transfers.filter(t => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedType === 'all' ? true : t.type.toLowerCase() === selectedType.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [transfers, searchQuery, selectedType]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Workforce Movements Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Workforce Shifts</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{transfers.length} Movements</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Total movements tracked</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Approved Shifts</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {transfers.filter(t => t.status === 'APPROVED').length} Executed
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">HR payroll updated</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Awaiting Approvals</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {transfers.filter(t => t.status === 'PENDING').length} Queued
              </p>
              <p className="text-[10px] text-rose-600 font-semibold mt-1">Requires unit manager sign-off</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Internal Mobility</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">12.4% Yield</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">High retention contributor</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Transfers & Promotions Movement Register ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" /> Transfers & Promotion Mobility Movement Log
              </CardTitle>
              <CardDescription className="text-xs">
                Log and monitor employee promotions, department reallocations, and inter-branch relocations
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All Movements' },
                  { id: 'promotion & transfer', label: 'Promotion' },
                  { id: 'branch transfer', label: 'Branch Move' },
                  { id: 'department shift', label: 'Dept Shift' },
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedType === type.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter candidate or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Movement Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                    <Plus className="h-3.5 w-3.5" /> Queue Movement
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Queue Workforce Movement</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleAddTransfer}>
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
                        <Label className="text-xs">Current Unit / Branch</Label>
                        <Input
                          placeholder="e.g. Corporate Operations"
                          value={formFrom}
                          onChange={e => setFormFrom(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Target Unit / Branch</Label>
                        <Input
                          placeholder="e.g. Human Resources"
                          value={formTo}
                          onChange={e => setFormTo(e.target.value)}
                          className="h-9 text-xs font-semibold"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Movement Category Type</Label>
                        <Select value={formType} onValueChange={v => setFormType(v as any)}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PROMOTION & TRANSFER" className="text-xs">PROMOTION & TRANSFER</SelectItem>
                            <SelectItem value="BRANCH TRANSFER" className="text-xs">BRANCH TRANSFER</SelectItem>
                            <SelectItem value="DEPARTMENT SHIFT" className="text-xs">DEPARTMENT SHIFT</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Effective Date</Label>
                        <Input
                          placeholder="e.g. 01 Sep 2026"
                          value={formDate}
                          onChange={e => setFormDate(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
                        Queue Transfer
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
                <TableHead className="text-xs">Transfer ID</TableHead>
                <TableHead className="text-xs">Employee Name</TableHead>
                <TableHead className="text-xs">Previous Unit</TableHead>
                <TableHead className="text-xs">New Target Unit</TableHead>
                <TableHead className="text-xs">Effective Date</TableHead>
                <TableHead className="text-xs">Movement Type</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers.map(t => (
                <TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{t.id}</TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">{t.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-semibold">{t.fromDept}</TableCell>
                  <TableCell className="text-xs font-semibold text-foreground">
                    <div className="flex items-center gap-1">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      {t.toDept}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium">{t.effDate}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className="text-[10px] font-semibold">
                      {t.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <StatusBadge status={t.status} className="text-[10px]" />
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    {t.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10.5px] px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold"
                        onClick={() => handleApprove(t.id)}
                      >
                        Approve Shift
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
