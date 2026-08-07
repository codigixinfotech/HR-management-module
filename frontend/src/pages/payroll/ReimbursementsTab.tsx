import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  Briefcase,
  Paperclip,
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

interface ClaimItem {
  id: string;
  name: string;
  category: 'Travel & Cab' | 'Wifi & Mobile' | 'Client Dining' | 'L&D Subscriptions';
  amount: string;
  date: string;
  receipt: 'Attached' | 'Pending Receipt';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

const INITIAL_CLAIMS: ClaimItem[] = [
  { id: 'CLM-901', name: 'Rajesh Sharma', category: 'L&D Subscriptions', amount: '₹14,500', date: '02 Aug 2026', receipt: 'Attached', status: 'APPROVED' },
  { id: 'CLM-902', name: 'Priya Verma', category: 'Wifi & Mobile', amount: '₹2,500', date: '04 Aug 2026', receipt: 'Attached', status: 'APPROVED' },
  { id: 'CLM-903', name: 'Amit Patel', category: 'Travel & Cab', amount: '₹8,400', date: '05 Aug 2026', receipt: 'Attached', status: 'PENDING' },
];

export function ReimbursementsTab() {
  const [claims, setClaims] = useState<ClaimItem[]>(INITIAL_CLAIMS);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'Travel & Cab' | 'Wifi & Mobile' | 'Client Dining' | 'L&D Subscriptions'>('Travel & Cab');
  const [formAmount, setFormAmount] = useState('₹3,000');
  const [formReceipt, setFormReceipt] = useState<'Attached' | 'Pending Receipt'>('Attached');

  const openAddModal = () => {
    setFormName('');
    setFormCategory('Travel & Cab');
    setFormAmount('₹3,000');
    setFormReceipt('Attached');
    setIsOpen(true);
  };

  const handleAddClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error('Employee name is required');
      return;
    }

    const newClaim: ClaimItem = {
      id: `CLM-90${claims.length + 1}`,
      name: formName,
      category: formCategory,
      amount: formAmount,
      date: '05 Aug 2026',
      receipt: formReceipt,
      status: 'PENDING',
    };

    setClaims(prev => [...prev, newClaim]);
    toast.success('Reimbursement expense logged for approval');
    setIsOpen(false);
  };

  const handleApprove = (id: string) => {
    setClaims(prev =>
      prev.map(c =>
        c.id === id ? { ...c, status: 'APPROVED' } : c,
      ),
    );
    toast.success('Expense claim approved. Balance will reflect in payroll run.');
  };

  const filteredClaims = useMemo(() => {
    return claims.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [claims, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── 1. Reimbursement telemetry Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Claims</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{claims.length} Claims</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Processed monthly cycles</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Approved Claims</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {claims.filter(c => c.status === 'APPROVED').length} Settled
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Disbursed with net pay</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Awaiting Audit</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {claims.filter(c => c.status === 'PENDING').length} Pending
              </p>
              <p className="text-[10px] text-rose-600 font-semibold mt-1">Requires receipt verification</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Audit Compliance</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">100% Attached</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">GST invoice verified</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Claims Registry Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Employee Expense Reimbursement Register
            </CardTitle>
            <CardDescription className="text-xs">
              Review and approve travel claims, home broadband wifi fees, and client dinner invoices mapped to monthly pay slips
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-40 sm:w-52">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter claims..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            {/* Request Reimbursement Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                  <Plus className="h-3.5 w-3.5" /> Log Reimbursement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Log Reimbursement Claim</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleAddClaim}>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Employee Name</Label>
                    <Input
                      placeholder="e.g. Amit Patel"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Category Type</Label>
                      <Select value={formCategory} onValueChange={v => setFormCategory(v as any)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Travel & Cab" className="text-xs">Travel & Cab</SelectItem>
                          <SelectItem value="Wifi & Mobile" className="text-xs">Wifi & Mobile</SelectItem>
                          <SelectItem value="Client Dining" className="text-xs">Client Dining</SelectItem>
                          <SelectItem value="L&D Subscriptions" className="text-xs">L&D Subscriptions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Claim Amount</Label>
                      <Input
                        placeholder="e.g. ₹3,000"
                        value={formAmount}
                        onChange={e => setFormAmount(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Receipt Verification Attachment</Label>
                    <Select value={formReceipt} onValueChange={v => setFormReceipt(v as any)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select receipt attachment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Attached" className="text-xs">Attached (GST Compliant)</SelectItem>
                        <SelectItem value="Pending Receipt" className="text-xs">Pending Receipt Upload</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" size="sm" className="text-xs">
                      Submit Claim
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
                <TableHead className="text-xs">Claim ID</TableHead>
                <TableHead className="text-xs">Employee Name</TableHead>
                <TableHead className="text-xs">Expense Category</TableHead>
                <TableHead className="text-xs">Claim Amount</TableHead>
                <TableHead className="text-xs">Logged Date</TableHead>
                <TableHead className="text-xs">Receipt Upload</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.map(c => (
                <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{c.id}</TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {c.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-muted-foreground">{c.category}</TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-foreground">{c.amount}</TableCell>
                  <TableCell className="text-xs font-mono">{c.date}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className={`text-[10px] gap-1 font-semibold ${c.receipt === 'Attached' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                      <Paperclip className="h-3 w-3" />
                      {c.receipt}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <StatusBadge status={c.status} className="text-[10px]" />
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    {c.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10.5px] px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold"
                        onClick={() => handleApprove(c.id)}
                      >
                        Approve Expense
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
