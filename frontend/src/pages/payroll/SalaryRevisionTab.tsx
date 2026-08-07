import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  TrendingUp,
  Plus,
  Search,
  Clock,
  DollarSign,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/status-badge';

interface RevisionRecord {
  id: string;
  name: string;
  previousCtc: string;
  newCtc: string;
  increment: string;
  effDate: string;
  status: 'APPROVED' | 'PENDING';
}

const INITIAL_REVISIONS: RevisionRecord[] = [
  { id: 'REV-01', name: 'Rajesh Sharma', previousCtc: '₹14,50,000 / yr', newCtc: '₹16,50,000 / yr', increment: '13.7%', effDate: '01 Jul 2026', status: 'APPROVED' },
  { id: 'REV-02', name: 'Priya Verma', previousCtc: '₹16,0,000 / yr', newCtc: '₹18,0,000 / yr', increment: '12.5%', effDate: '01 Aug 2026', status: 'APPROVED' },
  { id: 'REV-03', name: 'Amit Patel', previousCtc: '₹10,50,000 / yr', newCtc: '₹12,0,000 / yr', increment: '14.2%', effDate: '15 Aug 2026', status: 'PENDING' },
];

export function SalaryRevisionTab() {
  const [revisions, setRevisions] = useState<RevisionRecord[]>(INITIAL_REVISIONS);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPrev, setFormPrev] = useState('₹12,00,000 / yr');
  const [formNew, setFormNew] = useState('₹14,00,000 / yr');
  const [formEffDate, setFormEffDate] = useState('01 Sep 2026');

  const openAddModal = () => {
    setFormName('');
    setFormPrev('₹12,00,000 / yr');
    setFormNew('₹14,00,000 / yr');
    setFormEffDate('01 Sep 2026');
    setIsOpen(true);
  };

  const handleAddRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error('Employee name is required');
      return;
    }

    const newRevision: RevisionRecord = {
      id: `REV-0${revisions.length + 1}`,
      name: formName,
      previousCtc: formPrev,
      newCtc: formNew,
      increment: '16.6%', // computed mockup
      effDate: formEffDate,
      status: 'PENDING',
    };

    setRevisions(prev => [...prev, newRevision]);
    toast.success('Salary increment schedule created successfully');
    setIsOpen(false);
  };

  const handleApprove = (id: string) => {
    setRevisions(prev =>
      prev.map(r =>
        r.id === id ? { ...r, status: 'APPROVED' } : r,
      ),
    );
    toast.success('Salary increment revision approved');
  };

  const filteredRevisions = useMemo(() => {
    return revisions.filter(r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [revisions, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Increments Processed</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{revisions.length} Revisions</p>
              <p className="text-[10px] text-primary font-semibold mt-1">YTD salary revisions logged</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Average Hike</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">13.4% Hike</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Aligned with appraisal index</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Percent className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Awaiting Approvals</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {revisions.filter(r => r.status === 'PENDING').length} Pending
              </p>
              <p className="text-[10px] text-rose-600 font-semibold mt-1">Requires CEO authorization</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Revised Budget Diff</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">+₹4.2L / yr</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Within department allocation</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Salary Revisions Log Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Salary Revision & Appraisal Registry
            </CardTitle>
            <CardDescription className="text-xs">
              Monitor candidate salary increment histories, appraisal hikes, and effective execution dates
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-40 sm:w-52">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter revisions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            {/* Request Revision Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                  <Plus className="h-3.5 w-3.5" /> Log Increment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Log Salary Revision</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleAddRevision}>
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
                      <Label className="text-xs">Current CTC</Label>
                      <Input
                        placeholder="e.g. ₹12,00,000 / yr"
                        value={formPrev}
                        onChange={e => setFormPrev(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Proposed Revised CTC</Label>
                      <Input
                        placeholder="e.g. ₹14,00,000 / yr"
                        value={formNew}
                        onChange={e => setFormNew(e.target.value)}
                        className="h-9 text-xs font-mono font-semibold text-foreground"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Effective Execution Date</Label>
                    <Input
                      placeholder="e.g. 01 Sep 2026"
                      value={formEffDate}
                      onChange={e => setFormEffDate(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" size="sm" className="text-xs">
                      Publish Revision
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
                <TableHead className="text-xs">Revision ID</TableHead>
                <TableHead className="text-xs">Employee Name</TableHead>
                <TableHead className="text-xs">Previous CTC</TableHead>
                <TableHead className="text-xs">New Proposed CTC</TableHead>
                <TableHead className="text-xs">Increment Percentage</TableHead>
                <TableHead className="text-xs">Effective Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRevisions.map(r => (
                <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{r.id}</TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">{r.name}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{r.previousCtc}</TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-foreground">{r.newCtc}</TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-emerald-600">+{r.increment}</TableCell>
                  <TableCell className="text-xs font-mono">{r.effDate}</TableCell>
                  <TableCell className="text-xs">
                    <StatusBadge status={r.status} className="text-[10px]" />
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    {r.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10.5px] px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold"
                        onClick={() => handleApprove(r.id)}
                      >
                        Approve Revision
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
