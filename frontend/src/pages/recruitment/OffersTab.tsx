import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  FileSignature,
  Plus,
  Search,
  Clock,
  Mail,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';

interface OfferItem {
  id: string;
  candidate: string;
  role: string;
  ctc: string;
  releaseDate: string;
  expiryDate: string;
  status: 'ACCEPTED' | 'PENDING_SIGNATURE' | 'DECLINED' | 'EXPIRED';
}

const INITIAL_OFFERS: OfferItem[] = [
  { id: 'OFR-701', candidate: 'Siddharth Rao', role: 'Senior React Architect', ctc: '₹22,0,000 / yr', releaseDate: '04 Aug 2026', expiryDate: '11 Aug 2026', status: 'ACCEPTED' },
  { id: 'OFR-702', candidate: 'Neha Gupta', role: 'DevOps & Kubernetes Engineer', ctc: '₹16,50,000 / yr', releaseDate: '05 Aug 2026', expiryDate: '12 Aug 2026', status: 'PENDING_SIGNATURE' },
  { id: 'OFR-703', candidate: 'Vikramaditya Singh', role: 'Product Design Manager', ctc: '₹18,0,000 / yr', releaseDate: '01 Aug 2026', expiryDate: '08 Aug 2026', status: 'ACCEPTED' },
  { id: 'OFR-704', candidate: 'Kabir Mehta', role: 'Staff Node.js Engineer', ctc: '₹24,0,000 / yr', releaseDate: '05 Aug 2026', expiryDate: '12 Aug 2026', status: 'PENDING_SIGNATURE' },
  { id: 'OFR-705', candidate: 'Pooja Sharma', role: 'Lead Data Analyst', ctc: '₹12,0,000 / yr', releaseDate: '25 Jul 2026', expiryDate: '01 Aug 2026', status: 'DECLINED' },
];

export function OffersTab() {
  const [offers, setOffers] = useState<OfferItem[]>(INITIAL_OFFERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formCandidate, setFormCandidate] = useState('');
  const [formRole, setFormRole] = useState('Senior React Architect');
  const [formCtc, setFormCtc] = useState('₹18,00,000 / yr');
  const [formExpiry, setFormExpiry] = useState('12 Aug 2026');

  const openAddModal = () => {
    setFormCandidate('');
    setFormRole('Senior React Architect');
    setFormCtc('₹18,00,000 / yr');
    setFormExpiry('12 Aug 2026');
    setIsOpen(true);
  };

  const handleAddOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCandidate) {
      toast.error('Candidate name is required');
      return;
    }

    const newOffer: OfferItem = {
      id: `OFR-70${offers.length + 1}`,
      candidate: formCandidate,
      role: formRole,
      ctc: formCtc,
      releaseDate: '05 Aug 2026',
      expiryDate: formExpiry,
      status: 'PENDING_SIGNATURE',
    };

    setOffers(prev => [...prev, newOffer]);
    toast.success('Offer letter released and emailed successfully');
    setIsOpen(false);
  };

  const handleResendMail = (candidate: string) => {
    toast.success(`Resent digital signature invitation link to ${candidate}`);
  };

  const handleTriggerOnboarding = (candidate: string) => {
    toast.success(`Onboarding checklist created. Welcome email triggered to ${candidate}!`);
  };

  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      const matchesSearch =
        o.candidate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === 'all' ? true : o.status.toLowerCase() === selectedStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [offers, searchQuery, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Offer Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Offers Released</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">{offers.length} Released</p>
              <p className="text-[10px] text-primary font-semibold mt-1">Pending approval: 2</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <FileSignature className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Offers Accepted</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {offers.filter(o => o.status === 'ACCEPTED').length} Candidates
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Onboarding initiated</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Awaiting Signature</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">
                {offers.filter(o => o.status === 'PENDING_SIGNATURE').length} Pending
              </p>
              <p className="text-[10px] text-rose-600 font-semibold mt-1">Docusign links active</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Acceptance Rate</p>
              <p className=" text-2xl font-semibold text-foreground mt-0.5">80%</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Declined/Expired: 1</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Released Offers Directory ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-primary" /> Offer & Onboarding Tracker
              </CardTitle>
              <CardDescription className="text-xs">
                Manage candidate CTC packaging structures, Docusign electronic signature statuses, and transition triggers to the Employee Directory
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'accepted', label: 'Accepted' },
                  { id: 'pending_signature', label: 'Pending' },
                  { id: 'declined', label: 'Declined' },
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
                  placeholder="Filter candidate or role..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Release Offer Dialog */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openAddModal}>
                    <Plus className="h-3.5 w-3.5" /> Release Offer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Release Job Offer</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleAddOffer}>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Candidate Name</Label>
                      <Input
                        placeholder="e.g. Siddharth Rao"
                        value={formCandidate}
                        onChange={e => setFormCandidate(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Offered Role</Label>
                        <Select value={formRole} onValueChange={setFormRole}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Senior React Architect" className="text-xs">Senior React Architect</SelectItem>
                            <SelectItem value="DevOps & Kubernetes Engineer" className="text-xs">DevOps Engineer</SelectItem>
                            <SelectItem value="Product Design Manager" className="text-xs">Product Designer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Offered Salary (CTC)</Label>
                        <Input
                          placeholder="e.g. ₹18,00,000 / yr"
                          value={formCtc}
                          onChange={e => setFormCtc(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Offer Expiry Date</Label>
                      <Input
                        placeholder="e.g. 12 Aug 2026"
                        value={formExpiry}
                        onChange={e => setFormExpiry(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs">
                        Publish & Email Offer
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
                <TableHead className="text-xs">Offer ID</TableHead>
                <TableHead className="text-xs">Candidate Name</TableHead>
                <TableHead className="text-xs">Designation Role</TableHead>
                <TableHead className="text-xs">Offered CTC</TableHead>
                <TableHead className="text-xs">Release Date</TableHead>
                <TableHead className="text-xs">Expiry Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOffers.map(o => (
                <TableRow key={o.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{o.id}</TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">{o.candidate}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-semibold">{o.role}</TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-foreground">{o.ctc}</TableCell>
                  <TableCell className="text-xs font-mono">{o.releaseDate}</TableCell>
                  <TableCell className="text-xs font-mono">{o.expiryDate}</TableCell>
                  <TableCell className="text-xs">
                    <StatusBadge status={o.status} className="text-[10px]" />
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    {o.status === 'ACCEPTED' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10.5px] px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold"
                        onClick={() => handleTriggerOnboarding(o.candidate)}
                      >
                        Trigger Onboarding
                      </Button>
                    ) : o.status === 'PENDING_SIGNATURE' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-primary hover:text-foreground hover:bg-primary/10"
                        onClick={() => handleResendMail(o.candidate)}
                        title="Resend Signature Mail"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
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
