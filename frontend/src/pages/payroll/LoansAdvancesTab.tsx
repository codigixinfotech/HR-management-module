import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  CreditCard,
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

interface LoanItem {
  id: string;
  name: string;
  principal: string;
  emiRecovered: string;
  emiRemaining: string;
  emiAmount: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

const INITIAL_LOANS: LoanItem[] = [
  { id: 'LN-501', name: 'Rajesh Sharma', principal: '₹1,50,000', emiRecovered: '₹60,000', emiRemaining: '₹90,000', emiAmount: '₹10,000 / mo', status: 'APPROVED' },
  { id: 'LN-502', name: 'Priya Verma', principal: '₹80,000', emiRecovered: '₹40,000', emiRemaining: '₹40,000', emiAmount: '₹8,000 / mo', status: 'APPROVED' },
  { id: 'LN-503', name: 'Amit Patel', principal: '₹50,000', emiRecovered: '₹0', emiRemaining: '₹50,000', emiAmount: '₹5,000 / mo', status: 'PENDING' },
];

export function LoansAdvancesTab() {
  const [loans, setLoans] = useState<LoanItem[]>(INITIAL_LOANS);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPrincipal, setFormPrincipal] = useState('₹50,000');
  const [formEmi, setFormEmi] = useState('₹5,000 / mo');

  const openAddModal = () => {
    setFormName('');
    setFormPrincipal('₹50,000');
    setFormEmi('₹5,000 / mo');
    setIsOpen(true);
  };

  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error('Employee name is required');
      return;
    }

    const newLoan: LoanItem = {
      id: `LN-50${loans.length + 1}`,
      name: formName,
      principal: formPrincipal,
      emiRecovered: '₹0',
      emiRemaining: formPrincipal,
      emiAmount: formEmi,
      status: 'PENDING',
    };

    setLoans(prev => [...prev, newLoan]);
    toast.success('Loan application logged successfully');
    setIsOpen(false);
  };

  const handleApprove = (id: string) => {
    setLoans(prev =>
      prev.map(l =>
        l.id === id ? { ...l, status: 'APPROVED' } : l,
      ),
    );
    toast.success('Loan application approved. Credit will reflect in next cycle.');
  };

  const filteredLoans = useMemo(() => {
    return loans.filter(l =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.id.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [loans, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── 1. Loan telemetry Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Sanctioned</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">₹2.8L Mapped</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">EMI recovery active</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Outstanding principal</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">₹1.8L Bal</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Declining balance logic</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Awaiting Sanction</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {loans.filter(l => l.status === 'PENDING').length} Pending
              </p>
              <p className="text-[10px] text-rose-600 font-semibold mt-1">Requires guarantor audit</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Monthly EMI Yield</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">₹18,000 / mo</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Direct salary deductions</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Loans & Advances Directory Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" /> Corporate Loan & Salary Advance Directory
            </CardTitle>
            <CardDescription className="text-xs">
              Manage interest-free staff advances, emergency personal loans, and payroll recovery monthly balances
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-40 sm:w-52">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter loan profiles..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            {/* Request Loan Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                  <Plus className="h-3.5 w-3.5" /> Sanction Advance
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Sanction Salary Advance</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleAddLoan}>
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
                      <Label className="text-xs">Principal Amount</Label>
                      <Input
                        placeholder="e.g. ₹50,000"
                        value={formPrincipal}
                        onChange={e => setFormPrincipal(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Monthly Recovery EMI</Label>
                      <Input
                        placeholder="e.g. ₹5,000 / mo"
                        value={formEmi}
                        onChange={e => setFormEmi(e.target.value)}
                        className="h-9 text-xs font-mono font-semibold"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" size="sm" className="text-xs">
                      Queue Advance
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
                <TableHead className="text-xs">Loan Ref ID</TableHead>
                <TableHead className="text-xs">Employee Name</TableHead>
                <TableHead className="text-xs">Sanctioned Principal</TableHead>
                <TableHead className="text-xs">Recovered Balance</TableHead>
                <TableHead className="text-xs">Outstanding Balance</TableHead>
                <TableHead className="text-xs">EMI Schedule</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.map(l => (
                <TableRow key={l.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{l.id}</TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {l.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium text-foreground">{l.principal}</TableCell>
                  <TableCell className="text-xs font-mono text-emerald-600 font-semibold">{l.emiRecovered}</TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-rose-600">{l.emiRemaining}</TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-primary">{l.emiAmount}</TableCell>
                  <TableCell className="text-xs">
                    <StatusBadge status={l.status} className="text-[10px]" />
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    {l.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10.5px] px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold"
                        onClick={() => handleApprove(l.id)}
                      >
                        Approve Sanction
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
