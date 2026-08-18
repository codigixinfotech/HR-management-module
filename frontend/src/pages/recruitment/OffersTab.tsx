import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FileSignature,
  Plus,
  Search,
  Clock,
  Mail,
  UserCheck,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { jobOpeningsApi, candidatesApi } from '@/api/recruitment';
import type { CandidateStage } from '@/api/types';

interface OfferItem {
  id: string;
  candidateId?: string;
  candidate: string;
  role: string;
  ctc: string;
  releaseDate: string;
  expiryDate: string;
  status: 'ACCEPTED' | 'PENDING_SIGNATURE' | 'DECLINED' | 'EXPIRED';
}

const INITIAL_OFFERS: OfferItem[] = [
  { id: 'OFR-701', candidate: 'Siddharth Rao', role: 'Senior React Architect', ctc: '₹22,00,000 / yr', releaseDate: '04 Aug 2026', expiryDate: '11 Aug 2026', status: 'ACCEPTED' },
  { id: 'OFR-702', candidate: 'Neha Gupta', role: 'DevOps & Kubernetes Engineer', ctc: '₹16,50,000 / yr', releaseDate: '05 Aug 2026', expiryDate: '12 Aug 2026', status: 'PENDING_SIGNATURE' },
  { id: 'OFR-703', candidate: 'Vikramaditya Singh', role: 'Product Design Manager', ctc: '₹18,00,000 / yr', releaseDate: '01 Aug 2026', expiryDate: '08 Aug 2026', status: 'ACCEPTED' },
];

export function OffersTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [localOffers, setLocalOffers] = useState<OfferItem[]>(INITIAL_OFFERS);

  // Fetch real Job Openings & candidates from DB
  const { data: openings = [] } = useQuery({
    queryKey: ['job-openings'],
    queryFn: () => jobOpeningsApi.list(),
  });

  // Dynamically map DB candidates in OFFERED / HIRED stage
  const dbOfferedCandidates = useMemo(() => {
    const list: OfferItem[] = [];
    openings.forEach((job) => {
      if (job.candidates && job.candidates.length > 0) {
        job.candidates.forEach((c) => {
          if (c.stage === 'OFFERED' || c.stage === 'HIRED') {
            const formattedCtc = c.expectedCtc
              ? `₹${(c.expectedCtc).toLocaleString()} / yr`
              : '₹24,00,000 / yr';
            list.push({
              id: `OFR-${c.id.substring(0, 6).toUpperCase()}`,
              candidateId: c.id,
              candidate: `${c.firstName} ${c.lastName}`,
              role: job.title,
              ctc: formattedCtc,
              releaseDate: '17 Aug 2026',
              expiryDate: '24 Aug 2026',
              status: c.stage === 'HIRED' ? 'ACCEPTED' : 'PENDING_SIGNATURE',
            });
          }
        });
      }
    });
    return list;
  }, [openings]);

  // Combine DB candidates with local static state
  const allOffers = useMemo(() => {
    const combined = [...dbOfferedCandidates];
    localOffers.forEach((loc) => {
      if (!combined.some((item) => item.candidateId && item.candidateId === loc.candidateId)) {
        combined.push(loc);
      }
    });
    return combined;
  }, [dbOfferedCandidates, localOffers]);

  // Stage Mutation for Triggering Onboarding -> HIRED
  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: CandidateStage }) =>
      candidatesApi.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message ?? 'Failed to update stage'),
  });

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [formCandidate, setFormCandidate] = useState('');
  const [formRole, setFormRole] = useState('Chief Technology Officer');
  const [formCtc, setFormCtc] = useState('₹24,00,000 / yr');
  const [formExpiry, setFormExpiry] = useState('24 Aug 2026');

  const openAddModal = () => {
    setFormCandidate('');
    setFormRole('Chief Technology Officer');
    setFormCtc('₹24,00,000 / yr');
    setFormExpiry('24 Aug 2026');
    setIsOpen(true);
  };

  const handleAddOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCandidate) {
      toast.error('Candidate name is required');
      return;
    }

    const newOffer: OfferItem = {
      id: `OFR-${Math.floor(700 + Math.random() * 99)}`,
      candidate: formCandidate,
      role: formRole,
      ctc: formCtc,
      releaseDate: '17 Aug 2026',
      expiryDate: formExpiry,
      status: 'PENDING_SIGNATURE',
    };

    setLocalOffers((prev) => [...prev, newOffer]);
    toast.success('Offer letter released and emailed to candidate successfully!');
    setIsOpen(false);
  };

  const handleResendMail = (candidate: string) => {
    toast.success(`Resent digital signature invitation link to ${candidate}`);
  };

  const handleTriggerOnboarding = (item: OfferItem) => {
    if (item.candidateId) {
      updateStageMutation.mutate({ id: item.candidateId, stage: 'HIRED' });
    }
    toast.success(
      `Onboarding initiated for ${item.candidate}! Navigating to Employee Directory...`,
    );
    navigate('/employees/directory');
  };

  const filteredOffers = useMemo(() => {
    return allOffers.filter((o) => {
      const matchesSearch =
        o.candidate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === 'all'
          ? true
          : o.status.toLowerCase() === selectedStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [allOffers, searchQuery, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top Offer Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Offers Released</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{allOffers.length} Released</p>
              <p className="text-[10px] text-primary font-semibold mt-1">
                Auto-generated from Interviews
              </p>
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
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {allOffers.filter((o) => o.status === 'ACCEPTED').length} Candidates
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
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {allOffers.filter((o) => o.status === 'PENDING_SIGNATURE').length} Pending
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
              <p className="text-2xl font-semibold text-foreground mt-0.5">85%</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">Offer-to-Join Ratio</p>
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
                Auto-generated offers for selected candidates linked to Job Requisitions (e.g. JR-2026-001)
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
                ].map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setSelectedStatus(status.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                      selectedStatus === status.id
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                        onChange={(e) => setFormCandidate(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Offered Role</Label>
                        <Input
                          value={formRole}
                          onChange={(e) => setFormRole(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Offered Salary (CTC)</Label>
                        <Input
                          placeholder="e.g. ₹24,00,000 / yr"
                          value={formCtc}
                          onChange={(e) => setFormCtc(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Offer Expiry Date</Label>
                      <Input
                        placeholder="e.g. 24 Aug 2026"
                        value={formExpiry}
                        onChange={(e) => setFormExpiry(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs font-semibold">
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
              {filteredOffers.map((o) => (
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
                        onClick={() => handleTriggerOnboarding(o)}
                      >
                        Trigger Onboarding
                      </Button>
                    ) : o.status === 'PENDING_SIGNATURE' ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10.5px] px-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50 font-semibold"
                          onClick={() => {
                            setLocalOffers((prev) =>
                              prev.map((item) =>
                                item.id === o.id ? { ...item, status: 'ACCEPTED' } : item,
                              ),
                            );
                            if (o.candidateId) {
                              updateStageMutation.mutate({ id: o.candidateId, stage: 'HIRED' });
                            }
                            toast.success(`Candidate ${o.candidate} ACCEPTED the offer!`);
                          }}
                        >
                          Mark Accepted
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary hover:text-foreground hover:bg-primary/10"
                          onClick={() => handleResendMail(o.candidate)}
                          title="Resend Signature Mail"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
