import { useState } from 'react';
import { toast } from 'sonner';
import {
  FileDown,
  Building2,
  CheckCircle2,
  Users,
  Search,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

interface AdviceRecord {
  id: string;
  name: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  amount: string;
}

const INITIAL_ADVICES: AdviceRecord[] = [
  { id: 'ADV-001', name: 'Admin User', bankName: 'HDFC Bank', accountNo: '501002991823', ifsc: 'HDFC0000104', amount: '₹1,62,400' },
  { id: 'ADV-002', name: 'Rajesh Sharma', bankName: 'ICICI Bank', accountNo: '001201992182', ifsc: 'ICIC0000012', amount: '₹1,24,500' },
  { id: 'ADV-003', name: 'Priya Verma', bankName: 'SBI Bank', accountNo: '302910821232', ifsc: 'SBIN0001823', amount: '₹1,32,000' },
  { id: 'ADV-004', name: 'Amit Patel', bankName: 'HDFC Bank', accountNo: '501004123491', ifsc: 'HDFC0000104', amount: '₹92,800' },
];

export function BankTransferTab() {
  const [advices] = useState<AdviceRecord[]>(INITIAL_ADVICES);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDownloadAdvice = () => {
    toast.success('NEFT/RTGS Bank advice file generated in corporate .TXT format!');
  };

  const filteredAdvices = advices.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.accountNo.includes(searchQuery),
  );

  return (
    <div className="space-y-6">
      {/* ── 1. Advice Summary Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Net Disbursement</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">₹5.11L</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Sufficient reserves mapped</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account Holders</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{advices.length} Records</p>
              <p className="text-[10px] text-primary font-semibold mt-1">100% matched validation</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Format Standards</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">NEFT/RTGS</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">HDFC Corporate Banking XML</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Advice Verification</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">Validated</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">Maker-Checker dual audit ready</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Bank Advice Table ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Bank Transfer advice & disbursement file generator
            </CardTitle>
            <CardDescription className="text-xs">
              Generate formatted electronic bank payment files to disburse bulk monthly salaries directly from your HDFC/ICICI corporate bank portal
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-40 sm:w-52">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search advices..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>
            <Button size="sm" className="h-8 text-xs gap-1" onClick={handleDownloadAdvice}>
              <FileDown className="h-3.5 w-3.5" /> Export Bank advice (.TXT)
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Advice Ref</TableHead>
                <TableHead className="text-xs">Employee Name</TableHead>
                <TableHead className="text-xs">Recipient Bank</TableHead>
                <TableHead className="text-xs">Bank Account Number</TableHead>
                <TableHead className="text-xs">IFSC Code Branch</TableHead>
                <TableHead className="text-right text-xs">Salary Net Payout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdvices.map(a => (
                <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{a.id}</TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {a.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-muted-foreground">{a.bankName}</TableCell>
                  <TableCell className="text-xs font-mono font-medium text-foreground">{a.accountNo}</TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-primary">{a.ifsc}</TableCell>
                  <TableCell className="text-right text-xs font-mono font-semibold text-emerald-600">{a.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
