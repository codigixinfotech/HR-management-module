import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  IdCard,
  Plus,
  Search,
  Shield,
  CreditCard,
  HeartHandshake,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface MasterRecord {
  code: string;
  name: string;
  panNumber: string;
  pfNumber: string;
  bankAccount: string;
  statutoryStatus: 'VERIFIED' | 'PENDING' | 'INCOMPLETE';
  emergencyContact: string;
}

const INITIAL_RECORDS: MasterRecord[] = [
  { code: 'EMP0001', name: 'Admin User', panNumber: 'AWKPL9918F', pfNumber: 'MH/BAN/0099182/000', bankAccount: 'HDFC Bank - 5010029918', statutoryStatus: 'VERIFIED', emergencyContact: 'Wife - 9823018231' },
  { code: 'EMP0002', name: 'Rajesh Sharma', panNumber: 'BCKPL1234A', pfNumber: 'MH/BAN/1234567/001', bankAccount: 'ICICI Bank - 0012019921', statutoryStatus: 'VERIFIED', emergencyContact: 'Father - 9822998822' },
  { code: 'EMP0003', name: 'Priya Verma', panNumber: 'ZPKPL8812C', pfNumber: 'MH/BAN/8812731/002', bankAccount: 'SBI Bank - 3029108212', statutoryStatus: 'VERIFIED', emergencyContact: 'Mother - 9766212121' },
  { code: 'EMP0004', name: 'Amit Patel', panNumber: 'XPKPL4451D', pfNumber: 'Pending Allocation', bankAccount: 'HDFC Bank - 5010041234', statutoryStatus: 'PENDING', emergencyContact: 'Brother - 9923881122' },
  { code: 'EMP0005', name: 'Sanjana Roy', panNumber: 'Incomplete', pfNumber: 'Incomplete', bankAccount: 'Incomplete', statutoryStatus: 'INCOMPLETE', emergencyContact: 'Husband - 9855123456' },
];

export function EmployeeMasterTab() {
  const [records, setRecords] = useState<MasterRecord[]>(INITIAL_RECORDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPan, setFormPan] = useState('');
  const [formPf, setFormPf] = useState('');
  const [formBank, setFormBank] = useState('');
  const [formEmergency, setFormEmergency] = useState('');

  const openAddModal = () => {
    setFormName('');
    setFormPan('');
    setFormPf('');
    setFormBank('');
    setFormEmergency('');
    setIsOpen(true);
  };

  const handleAddMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      toast.error('Employee name is required');
      return;
    }

    const calculatedStatus = formPan && formPf && formBank ? 'VERIFIED' : 'PENDING';

    const newRecord: MasterRecord = {
      code: `EMP000${records.length + 1}`,
      name: formName,
      panNumber: formPan || 'Pending',
      pfNumber: formPf || 'Pending Allocation',
      bankAccount: formBank || 'Pending Linking',
      statutoryStatus: calculatedStatus,
      emergencyContact: formEmergency || 'Pending Declaration',
    };

    setRecords(prev => [...prev, newRecord]);
    toast.success('Employee statutory master details logged');
    setIsOpen(false);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === 'all' ? true : r.statutoryStatus.toLowerCase() === selectedStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [records, searchQuery, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Master Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pan & PF Linked</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {records.filter(r => r.statutoryStatus === 'VERIFIED').length} Staff
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">100% Tax Compliant</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending Allocation</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {records.filter(r => r.statutoryStatus === 'PENDING').length} Record
              </p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">UAN allocation pending</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bank Accounts Linked</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">92% Linked</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Salary disbursement active</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Emergency Contacts</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">100% Declared</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Nominees assigned</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Statutory Master Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <IdCard className="h-4 w-4 text-primary" /> Employee Statutory & Payroll Master
              </CardTitle>
              <CardDescription className="text-xs">
                Manage income tax accounts, provident funds (PF), bank accounts, and corporate nominees
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'verified', label: 'Verified' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'incomplete', label: 'Incomplete' },
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
                  placeholder="Filter by code or name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Master Details Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                    <Plus className="h-3.5 w-3.5" /> Declare Statutory
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Declare Employee Master Statutory</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleAddMaster}>
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
                        <Label className="text-xs">PAN Tax Code</Label>
                        <Input
                          placeholder="e.g. AWKPL9918F"
                          value={formPan}
                          onChange={e => setFormPan(e.target.value)}
                          className="h-9 text-xs font-mono uppercase"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Provident Fund (PF) ID</Label>
                        <Input
                          placeholder="e.g. MH/BAN/00991"
                          value={formPf}
                          onChange={e => setFormPf(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Bank Details (Account / IFSC)</Label>
                        <Input
                          placeholder="e.g. HDFC - 50100"
                          value={formBank}
                          onChange={e => setFormBank(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Emergency Nominee Contact</Label>
                        <Input
                          placeholder="e.g. Wife - 9823"
                          value={formEmergency}
                          onChange={e => setFormEmergency(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
                        Save Declaration
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
                <TableHead className="text-xs">Emp Code</TableHead>
                <TableHead className="text-xs">Full Name</TableHead>
                <TableHead className="text-xs">PAN Number</TableHead>
                <TableHead className="text-xs">PF Account Code</TableHead>
                <TableHead className="text-xs">Bank Account Link</TableHead>
                <TableHead className="text-xs">Emergency Contact</TableHead>
                <TableHead className="text-right text-xs">Statutory Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map(r => (
                <TableRow key={r.code} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{r.code}</TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">{r.name}</TableCell>
                  <TableCell className="text-xs font-mono font-medium uppercase">{r.panNumber}</TableCell>
                  <TableCell className="text-xs font-mono">{r.pfNumber}</TableCell>
                  <TableCell className="text-xs font-mono font-medium">{r.bankAccount}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-semibold">{r.emergencyContact}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={`text-[9.5px] font-semibold ${r.statutoryStatus === 'VERIFIED'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : r.statutoryStatus === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                        }`}
                    >
                      {r.statutoryStatus}
                    </Badge>
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
