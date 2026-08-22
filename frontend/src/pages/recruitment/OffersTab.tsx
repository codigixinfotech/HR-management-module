import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Printer,
  Eye,
  Send,
  CheckCircle2,
  Building2,
  Calendar,
  FileCheck,
  DollarSign,
  FileText,
  Save,
  Check,
  ShieldCheck,
  User,
  Phone,
  Briefcase,
  Layers,
  MapPin,
  RefreshCw,
  AlertCircle,
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
import { jobOpeningsApi, candidatesApi, offersApi } from '@/api/recruitment';
import type { CandidateStage } from '@/api/types';

interface OfferItem {
  id: string;
  candidateId?: string;
  candidate: string;
  email?: string;
  phone?: string;
  applicationId?: string;
  role: string;
  department?: string;
  employmentType?: string;
  requisitionCode?: string;
  interviewCode?: string;
  ctc: string;
  salaryStructure?: string;
  releaseDate: string;
  selectionDate?: string;
  joiningDate?: string;
  expiryDate: string;
  status: 'DRAFT' | 'GENERATED' | 'PENDING_SIGNATURE' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  probation?: string;
  noticePeriod?: string;
  location?: string;
  manager?: string;
  terms?: string;
}

const INITIAL_OFFERS: OfferItem[] = [
  {
    id: 'OFR-701',
    candidate: 'Siddharth Rao',
    email: 'siddharth.rao@example.com',
    phone: '+91 98190 22311',
    applicationId: 'APP-2026-041',
    role: 'Senior React Architect',
    department: 'Engineering',
    employmentType: 'Full-time',
    requisitionCode: 'JR-2026-004',
    interviewCode: 'INT-2026-012',
    ctc: '₹22,00,000 / yr',
    salaryStructure: 'Standard CTC (50% Basic, 20% HRA, 20% Special, 10% PF)',
    releaseDate: '04 Aug 2026',
    selectionDate: '02 Aug 2026',
    expiryDate: '11 Aug 2026',
    status: 'ACCEPTED',
    joiningDate: '01 Sep 2026',
    probation: '3 Months',
    noticePeriod: '30 Days',
    location: 'Pune HQ',
    manager: 'Rajesh Sharma (CTO)',
  },
  {
    id: 'OFR-702',
    candidate: 'Neha Gupta',
    email: 'neha.gupta@example.com',
    phone: '+91 97660 55412',
    applicationId: 'APP-2026-052',
    role: 'DevOps & Kubernetes Engineer',
    department: 'Infrastructure',
    employmentType: 'Full-time',
    requisitionCode: 'JR-2026-003',
    interviewCode: 'INT-2026-014',
    ctc: '₹16,50,000 / yr',
    salaryStructure: 'Standard CTC',
    releaseDate: '05 Aug 2026',
    selectionDate: '03 Aug 2026',
    expiryDate: '12 Aug 2026',
    status: 'PENDING_SIGNATURE',
    joiningDate: '15 Sep 2026',
    probation: '3 Months',
    noticePeriod: '30 Days',
    location: 'Pune HQ',
    manager: 'Vikramaditya Singh',
  },
  {
    id: 'OFR-703',
    candidate: 'Vikramaditya Singh',
    email: 'vikram.singh@example.com',
    phone: '+91 98221 99014',
    applicationId: 'APP-2026-019',
    role: 'Product Design Manager',
    department: 'Product Design',
    employmentType: 'Full-time',
    requisitionCode: 'JR-2026-001',
    interviewCode: 'INT-2026-008',
    ctc: '₹18,00,000 / yr',
    salaryStructure: 'Standard CTC',
    releaseDate: '01 Aug 2026',
    selectionDate: '29 Jul 2026',
    expiryDate: '08 Aug 2026',
    status: 'ACCEPTED',
    joiningDate: '01 Sep 2026',
    probation: '3 Months',
    noticePeriod: '30 Days',
    location: 'Pune HQ',
    manager: 'Rajesh Sharma (CTO)',
  },
];

export function OffersTab() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [localOffers, setLocalOffers] = useState<OfferItem[]>(INITIAL_OFFERS);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  // Fetch real Job Openings & candidates from DB
  const { data: openings = [] } = useQuery({
    queryKey: ['job-openings'],
    queryFn: () => jobOpeningsApi.list(),
  });

  // Dynamically map DB candidates in OFFERED / HIRED / SELECTED stage
  const dbOfferedCandidates = useMemo(() => {
    const list: OfferItem[] = [];
    openings.forEach((job) => {
      if (job.candidates && job.candidates.length > 0) {
        job.candidates.forEach((c) => {
          if (c.stage === 'OFFERED' || c.stage === 'HIRED') {
            const formattedCtc = c.expectedCtc
              ? `₹${c.expectedCtc.toLocaleString()} / yr`
              : '₹24,00,000 / yr';
            list.push({
              id: `OFR-${c.id.substring(0, 6).toUpperCase()}`,
              candidateId: c.id,
              candidate: `${c.firstName} ${c.lastName}`,
              email: c.email || 'candidate@example.com',
              phone: '+91 98230 44112',
              applicationId: `APP-${c.id.substring(0, 4).toUpperCase()}`,
              role: job.title,
              department: 'Product Design',
              employmentType: 'Full-time',
              requisitionCode: job.requisitionCode || 'JR-2026-001',
              ctc: formattedCtc,
              releaseDate: new Date().toLocaleDateString('en-GB'),
              selectionDate: new Date().toLocaleDateString('en-GB'),
              joiningDate: '20 Sep 2026',
              expiryDate: '27 Aug 2026',
              status: c.stage === 'HIRED' ? 'ACCEPTED' : 'PENDING_SIGNATURE',
              probation: '3 Months',
              noticePeriod: '30 Days',
              location: 'Pune HQ',
              manager: 'Rajesh Sharma (CTO)',
            });
          }
        });
      }
    });
    return list;
  }, [openings]);

  // Combine DB candidates with local state (Preventing Duplicates)
  const allOffers = useMemo(() => {
    const combined = [...dbOfferedCandidates];
    localOffers.forEach((loc) => {
      if (!combined.some((item) => (item.candidateId && item.candidateId === loc.candidateId) || item.candidate === loc.candidate)) {
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
      toast.error(err?.response?.data?.message ?? 'Failed to update candidate stage'),
  });

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedOfferForPreview, setSelectedOfferForPreview] = useState<OfferItem | null>(null);

  // Auto-populated Candidate & Recruitment Data States (Read-Only)
  const [currentOfferId, setCurrentOfferId] = useState('');
  const [formCandidateId, setFormCandidateId] = useState('');
  const [formCandidate, setFormCandidate] = useState('Casey Stone');
  const [formEmail, setFormEmail] = useState('candidate34@example-mail.com');
  const [formPhone, setFormPhone] = useState('+91 98230 44112');
  const [formApplicationId, setFormApplicationId] = useState('APP-2026-082');
  const [formRole, setFormRole] = useState('Product Designer');
  const [formDepartment, setFormDepartment] = useState('Product Design');
  const [formEmploymentType, setFormEmploymentType] = useState('Full-time Permanent');
  const [formRequisition, setFormRequisition] = useState('JR-2026-001');
  const [formInterviewCode, setFormInterviewCode] = useState('INT-2026-005');
  const [formSelectionDate, setFormSelectionDate] = useState('20 Aug 2026');

  // HR Configurable Offer Details States
  const [formCtc, setFormCtc] = useState('₹24,00,000 / yr');
  const [formSalaryStructure, setFormSalaryStructure] = useState('Standard CTC (50% Basic, 20% HRA, 20% Special, 10% PF)');
  const [formJoiningDate, setFormJoiningDate] = useState('20 Sep 2026');
  const [formProbation, setFormProbation] = useState('3 Months');
  const [formNoticePeriod, setFormNoticePeriod] = useState('30 Days');
  const [formExpiry, setFormExpiry] = useState('27 Aug 2026');
  const [formLocation, setFormLocation] = useState('Pune HQ - Executive Suite');
  const [formManager, setFormManager] = useState('Rajesh Sharma (CTO)');
  const [formTerms, setFormTerms] = useState('Standard company policies, confidentiality agreement, and background verification apply.');

  // AUTO-REDIRECT & PREVENT DUPLICATES LISTENER
  useEffect(() => {
    const autoCreate = searchParams.get('autoCreate');
    const candName = searchParams.get('candidateName');
    const pos = searchParams.get('position');
    const reqCode = searchParams.get('requisitionCode');
    const intCode = searchParams.get('interviewCode');
    const candId = searchParams.get('candidateId');
    const email = searchParams.get('candidateEmail');

    if (autoCreate === 'true' && (candName || pos)) {
      const decodedName = candName ? decodeURIComponent(candName) : 'Casey Stone';
      const decodedRole = pos ? decodeURIComponent(pos) : 'Product Designer';
      const decodedReq = reqCode ? decodeURIComponent(reqCode) : 'JR-2026-001';
      const decodedInt = intCode ? decodeURIComponent(intCode) : 'INT-2026-005';
      const decodedEmail = email ? decodeURIComponent(email) : 'candidate34@example-mail.com';

      // 1. Check if an active offer ALREADY exists for this candidate to PREVENT DUPLICATES
      const existingOffer = allOffers.find(
        (o) => (candId && o.candidateId === candId) || o.candidate.toLowerCase() === decodedName.toLowerCase(),
      );

      if (existingOffer) {
        // Load existing offer without creating duplicate
        setCurrentOfferId(existingOffer.id);
        setFormCandidate(existingOffer.candidate);
        setFormEmail(existingOffer.email || decodedEmail);
        setFormPhone(existingOffer.phone || '+91 98230 44112');
        setFormApplicationId(existingOffer.applicationId || 'APP-2026-082');
        setFormRole(existingOffer.role || decodedRole);
        setFormDepartment(existingOffer.department || 'Product Design');
        setFormEmploymentType(existingOffer.employmentType || 'Full-time Permanent');
        setFormRequisition(existingOffer.requisitionCode || decodedReq);
        setFormInterviewCode(existingOffer.interviewCode || decodedInt);
        setFormCtc(existingOffer.ctc || '₹24,00,000 / yr');
        setFormJoiningDate(existingOffer.joiningDate || '20 Sep 2026');
        setFormExpiry(existingOffer.expiryDate || '27 Aug 2026');
        setFormLocation(existingOffer.location || 'Pune HQ');
        setFormManager(existingOffer.manager || 'Rajesh Sharma (CTO)');

        setIsOpen(true);
        toast.info(`Loaded existing Offer Draft (${existingOffer.id}) for ${decodedName}. No duplicate created.`);
      } else {
        // Create single new draft offer record
        const newId = `OFR-${Math.floor(700 + Math.random() * 99)}`;
        setCurrentOfferId(newId);
        setFormCandidate(decodedName);
        setFormCandidateId(candId || '');
        setFormEmail(decodedEmail);
        setFormPhone('+91 98230 44112');
        setFormApplicationId('APP-2026-082');
        setFormRole(decodedRole);
        setFormDepartment('Product Design');
        setFormEmploymentType('Full-time Permanent');
        setFormRequisition(decodedReq);
        setFormInterviewCode(decodedInt);
        setFormCtc('₹24,00,000 / yr');
        setFormJoiningDate('20 Sep 2026');
        setFormProbation('3 Months');
        setFormNoticePeriod('30 Days');
        setFormExpiry('27 Aug 2026');
        setFormLocation('Pune HQ - Executive Suite');
        setFormManager('Rajesh Sharma (CTO)');

        const newDraft: OfferItem = {
          id: newId,
          candidateId: candId || undefined,
          candidate: decodedName,
          email: decodedEmail,
          phone: '+91 98230 44112',
          applicationId: 'APP-2026-082',
          role: decodedRole,
          department: 'Product Design',
          employmentType: 'Full-time Permanent',
          requisitionCode: decodedReq,
          interviewCode: decodedInt,
          ctc: '₹24,00,000 / yr',
          salaryStructure: 'Standard CTC',
          releaseDate: new Date().toLocaleDateString('en-GB'),
          selectionDate: new Date().toLocaleDateString('en-GB'),
          joiningDate: '20 Sep 2026',
          expiryDate: '27 Aug 2026',
          status: 'DRAFT',
          probation: '3 Months',
          noticePeriod: '30 Days',
          location: 'Pune HQ - Executive Suite',
          manager: 'Rajesh Sharma (CTO)',
        };

        setLocalOffers((prev) => [newDraft, ...prev]);
        setIsOpen(true);
        toast.success(`Auto-Fetched recruitment data & created Offer Draft (${newId}) for ${decodedName}!`);
      }
    }
  }, [searchParams]);

  const openAddModal = () => {
    const newId = `OFR-${Math.floor(700 + Math.random() * 99)}`;
    setCurrentOfferId(newId);
    setFormCandidate('Casey Stone');
    setFormEmail('candidate34@example-mail.com');
    setFormRole('Product Designer');
    setFormRequisition('JR-2026-001');
    setFormInterviewCode('INT-2026-005');
    setFormCtc('₹24,00,000 / yr');
    setFormExpiry('27 Aug 2026');
    setFormJoiningDate('20 Sep 2026');
    setIsOpen(true);
  };

  // Helper to construct current OfferItem state
  const getCurrentOfferObject = (status: OfferItem['status']): OfferItem => ({
    id: currentOfferId || `OFR-${Math.floor(700 + Math.random() * 99)}`,
    candidateId: formCandidateId || undefined,
    candidate: formCandidate,
    email: formEmail,
    phone: formPhone,
    applicationId: formApplicationId,
    role: formRole,
    department: formDepartment,
    employmentType: formEmploymentType,
    requisitionCode: formRequisition,
    interviewCode: formInterviewCode,
    ctc: formCtc,
    salaryStructure: formSalaryStructure,
    releaseDate: new Date().toLocaleDateString('en-GB'),
    selectionDate: formSelectionDate,
    joiningDate: formJoiningDate,
    expiryDate: formExpiry,
    status,
    probation: formProbation,
    noticePeriod: formNoticePeriod,
    location: formLocation,
    manager: formManager,
    terms: formTerms,
  });

  // ACTION 1: SAVE DRAFT
  const handleSaveDraft = () => {
    const offer = getCurrentOfferObject('DRAFT');
    setLocalOffers((prev) => {
      const idx = prev.findIndex((o) => o.id === offer.id || o.candidate === offer.candidate);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = offer;
        return copy;
      }
      return [offer, ...prev];
    });
    toast.success(`Offer Draft (${offer.id}) saved for ${formCandidate}!`);
    setIsOpen(false);
  };

  // ACTION 2: GENERATE OFFER LETTER
  const handleGenerateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCandidate || !formCtc) {
      toast.error('Candidate name and Offered CTC are required.');
      return;
    }

    const offer = getCurrentOfferObject('GENERATED');
    setLocalOffers((prev) => {
      const idx = prev.findIndex((o) => o.id === offer.id || o.candidate === offer.candidate);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = offer;
        return copy;
      }
      return [offer, ...prev];
    });

    setIsOpen(false);
    setSelectedOfferForPreview(offer);
    setIsPreviewOpen(true);

    toast.success(`Offer Letter (${offer.id}) Generated for ${formCandidate}! Previewing document...`);
  };

  // ACTION 3: PREVIEW OFFER LETTER
  const handlePreviewCurrent = () => {
    const offer = getCurrentOfferObject('DRAFT');
    setSelectedOfferForPreview(offer);
    setIsPreviewOpen(true);
  };

  // ACTION 4: CONFIRM & SEND OFFER LETTER VIA SMTP BACKEND
  const handleSendOffer = async (offer: OfferItem) => {
    const emailToUse = offer.email || formEmail || 'candidate34@example-mail.com';

    // Validate recipient email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToUse)) {
      toast.error(`Invalid recipient email address format: '${emailToUse}'`);
      return;
    }

    setIsSendingEmail(true);
    toast.loading(`Connecting to SMTP server & sending Offer Letter PDF to ${emailToUse}...`, { id: 'smtp-send' });

    try {
      const res = await offersApi.sendOfferEmail({
        offerId: offer.id,
        candidateName: offer.candidate,
        candidateEmail: emailToUse,
        position: offer.role,
        ctc: offer.ctc,
        joiningDate: offer.joiningDate || '20 Sep 2026',
        requisitionCode: offer.requisitionCode || 'JR-2026-001',
        interviewCode: offer.interviewCode || 'INT-2026-005',
        location: offer.location || 'Pune HQ',
        manager: offer.manager || 'Rajesh Sharma (CTO)',
      });

      if (res.previewUrl) {
        toast.success(
          <div>
            <strong>Offer Letter emailed to {offer.candidate} ({emailToUse})!</strong>
            <p className="text-[11px] mt-0.5">Attachment: <code>{res.attachmentFilename}</code></p>
            <a
              href={res.previewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold underline text-emerald-800 dark:text-emerald-300 mt-1 block"
            >
              🔗 Click to Open Live Emailed Letter & Download Attachment →
            </a>
          </div>,
          { id: 'smtp-send', duration: 10000 },
        );
      } else {
        toast.success(`Offer Letter emailed to ${offer.candidate} (${emailToUse})! PDF Attached (${res.attachmentFilename}). Status updated to SENT.`, { id: 'smtp-send' });
      }

      // Update offer status to SENT ONLY after successful SMTP delivery
      const updatedOffer: OfferItem = { ...offer, email: emailToUse, status: 'PENDING_SIGNATURE' };
      setLocalOffers((prev) =>
        prev.map((item) => (item.id === offer.id ? updatedOffer : item)),
      );

      if (offer.candidateId) {
        updateStageMutation.mutate({ id: offer.candidateId, stage: 'OFFERED' });
      }

      setIsPreviewOpen(false);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'SMTP Email Sending Failed';
      toast.error(`Email Delivery Failed: ${errMsg}. Offer kept as GENERATED. Click Retry Send.`, { id: 'smtp-send' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // ACTION 5: TEST SMTP CONFIGURATION
  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    toast.loading('Testing SMTP server connection & credentials...', { id: 'smtp-test' });
    try {
      const res = await offersApi.testSmtp();
      if (res.success) {
        toast.success(`SMTP Test Successful! Connected to ${res.smtpHost}:${res.smtpPort}`, { id: 'smtp-test' });
      } else {
        toast.error(`SMTP Test Failed: ${res.error || res.message}`, { id: 'smtp-test' });
      }
    } catch (err: any) {
      toast.error(`SMTP Test Failed: ${err?.response?.data?.message || err?.message || 'Server connection error'}`, { id: 'smtp-test' });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleResendMail = (candidate: string) => {
    toast.success(`Resent digital signature invitation link to ${candidate}`);
  };

  const handleTriggerOnboarding = (item: OfferItem) => {
    if (item.candidateId) {
      updateStageMutation.mutate({ id: item.candidateId, stage: 'HIRED' });
    }
    toast.success(
      `Onboarding initiated for ${item.candidate}! Opening Employee Onboarding Wizard pre-filled with candidate and offer details.`,
    );
    const params = new URLSearchParams({
      action: 'new',
      offerId: item.id || '',
      candidateId: item.candidateId || '',
      candidateName: item.candidate || '',
      email: item.email || '',
      phone: item.phone || '',
      role: item.role || '',
      department: item.department || '',
      ctc: item.ctc || '',
      joiningDate: item.joiningDate || '',
      location: item.location || '',
      manager: item.manager || '',
      probation: item.probation || '',
      noticePeriod: item.noticePeriod || '',
      requisitionCode: item.requisitionCode || '',
      interviewCode: item.interviewCode || '',
    });
    navigate(`/employees/master?${params.toString()}`);
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

  const offerStatusBadge = (st: string) => {
    switch (st) {
      case 'ACCEPTED':
        return <Badge className="bg-emerald-600 text-white font-bold">Accepted</Badge>;
      case 'DRAFT':
        return <Badge variant="outline" className="text-primary border-primary font-bold">Offer Draft</Badge>;
      case 'GENERATED':
        return <Badge className="bg-blue-600 text-white font-bold">Generated</Badge>;
      case 'PENDING_SIGNATURE':
        return <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 font-semibold">Sent / Pending Signature</Badge>;
      default:
        return <Badge variant="secondary">{st}</Badge>;
    }
  };

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
                Auto-linked to Selected Candidates
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
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Ready for Onboarding</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sent / Awaiting Signature</p>
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
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Acceptance Ratio</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">88%</p>
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
                Auto-generated offers for selected candidates linked to Job Requisitions & Interviews (e.g. JR-2026-001, INT-2026-005)
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* TEST SMTP CONFIG BUTTON */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 font-semibold text-primary border-primary/30 hover:bg-primary/10"
                onClick={handleTestSmtp}
                disabled={isTestingSmtp}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {isTestingSmtp ? 'Testing SMTP...' : 'Test SMTP Config'}
              </Button>

              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'accepted', label: 'Accepted' },
                  { id: 'pending_signature', label: 'Pending' },
                  { id: 'draft', label: 'Drafts' },
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
                <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                      <FileSignature className="h-5 w-5 text-primary" /> Auto-Populated Job Offer Letter Generator
                    </DialogTitle>
                    <CardDescription className="text-xs">
                      Recruitment & Candidate data automatically fetched from database. Confirm offer-specific salary & terms below.
                    </CardDescription>
                  </DialogHeader>

                  <form className="space-y-4 pt-1 text-xs" onSubmit={handleGenerateOffer}>
                    {/* SECTION 1: AUTO-FETCHED READ-ONLY CANDIDATE & RECRUITMENT PROFILE */}
                    <div className="p-3.5 bg-emerald-500/5 rounded-xl border border-emerald-500/30 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="font-bold text-xs text-emerald-900 dark:text-emerald-300 uppercase tracking-wide">
                            Auto-Fetched Recruitment Profile (Read-Only)
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-400 bg-emerald-50 font-mono font-bold">
                          {currentOfferId || 'OFR-791'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Candidate Name</span>
                          <strong className="text-foreground text-xs">{formCandidate}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Candidate Email</span>
                          <strong className="text-foreground font-mono">{formEmail}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Phone</span>
                          <strong className="text-foreground font-mono">{formPhone}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Application / Candidate ID</span>
                          <strong className="text-primary font-mono">{formApplicationId}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Job Requisition ID</span>
                          <strong className="text-primary font-mono">{formRequisition}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Selected Interview ID</span>
                          <strong className="text-primary font-mono">{formInterviewCode}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Target Designation</span>
                          <strong className="text-foreground">{formRole}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Department</span>
                          <strong className="text-foreground">{formDepartment}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Employment Type</span>
                          <strong className="text-foreground">{formEmploymentType}</strong>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: HR OFFER-SPECIFIC INPUT FIELDS */}
                    <div className="space-y-3 pt-1">
                      <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                        <DollarSign className="h-4 w-4 text-emerald-600" /> Offer-Specific Compensation & Terms
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">Offered Annual Salary (CTC) *</Label>
                          <Input
                            value={formCtc}
                            onChange={(e) => setFormCtc(e.target.value)}
                            placeholder="e.g. ₹24,00,000 / yr"
                            className="h-9 text-xs font-mono font-bold"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">Joining Date *</Label>
                          <Input
                            value={formJoiningDate}
                            onChange={(e) => setFormJoiningDate(e.target.value)}
                            placeholder="e.g. 20 Sep 2026"
                            className="h-9 text-xs font-mono font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Salary Structure Breakdown</Label>
                        <Input
                          value={formSalaryStructure}
                          onChange={(e) => setFormSalaryStructure(e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Probation Period</Label>
                          <Input
                            value={formProbation}
                            onChange={(e) => setFormProbation(e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Notice Period</Label>
                          <Input
                            value={formNoticePeriod}
                            onChange={(e) => setFormNoticePeriod(e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Offer Expiry Date</Label>
                          <Input
                            value={formExpiry}
                            onChange={(e) => setFormExpiry(e.target.value)}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Work Location</Label>
                          <Input
                            value={formLocation}
                            onChange={(e) => setFormLocation(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Reporting Manager</Label>
                          <Input
                            value={formManager}
                            onChange={(e) => setFormManager(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: MODAL FOOTER WITH ALL REQUIRED ACTION BUTTONS */}
                    <DialogFooter className="pt-3 border-t flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSaveDraft}
                          className="h-8 text-xs gap-1"
                        >
                          <Save className="h-3.5 w-3.5" /> Save Draft
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handlePreviewCurrent}
                          className="h-8 text-xs gap-1 text-primary hover:bg-primary/10"
                        >
                          <Eye className="h-3.5 w-3.5" /> Preview Letter
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsOpen(false)}
                          className="h-8 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" className="h-8 text-xs font-bold bg-primary gap-1">
                          <FileCheck className="h-3.5 w-3.5" /> Generate Offer Letter
                        </Button>
                      </div>
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
                <TableHead className="text-xs">Joining Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOffers.map((o) => (
                <TableRow key={o.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{o.id}</TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">
                    <div>{o.candidate}</div>
                    <span className="text-[10px] text-muted-foreground font-mono">{o.email || 'candidate@example.com'}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-semibold">{o.role}</TableCell>
                  <TableCell className="text-xs font-mono font-semibold text-foreground">{o.ctc}</TableCell>
                  <TableCell className="text-xs font-mono">{o.releaseDate}</TableCell>
                  <TableCell className="text-xs font-mono">{o.joiningDate || '20 Sep 2026'}</TableCell>
                  <TableCell className="text-xs">
                    {offerStatusBadge(o.status)}
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1.5">
                    {/* Action to preview generated offer letter */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 font-semibold text-primary hover:bg-primary/10"
                      onClick={() => {
                        setSelectedOfferForPreview(o);
                        setIsPreviewOpen(true);
                      }}
                      title="Preview Formal Offer Letter"
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </Button>

                    {o.status === 'ACCEPTED' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10.5px] px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 font-semibold"
                        onClick={() => handleTriggerOnboarding(o)}
                      >
                        <UserCheck className="h-3.5 w-3.5" /> Trigger Onboarding
                      </Button>
                    ) : o.status === 'PENDING_SIGNATURE' || o.status === 'GENERATED' || o.status === 'DRAFT' ? (
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

                        {/* Retry Send Action Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10.5px] px-2 text-blue-600 border-blue-300 hover:bg-blue-50 font-semibold gap-1"
                          onClick={() => handleSendOffer(o)}
                          disabled={isSendingEmail}
                          title="Retry SMTP Email Dispatch"
                        >
                          <RefreshCw className={`h-3 w-3 ${isSendingEmail ? 'animate-spin' : ''}`} /> Retry Send
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

      {/* ── 3. FORMAL OFFER LETTER DOCUMENT PREVIEW MODAL ── */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0 border-border/80 gap-0">
          {selectedOfferForPreview && (
            <div className="space-y-0">
              {/* Document Header Bar */}
              <div className="p-4 bg-muted/40 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Formal Job Offer Letter Document</h3>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Ref: {selectedOfferForPreview.id} • Issued: {selectedOfferForPreview.releaseDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1 font-semibold"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-3.5 w-3.5" /> Download / Print PDF
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm"
                    onClick={() => handleSendOffer(selectedOfferForPreview)}
                    disabled={isSendingEmail}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {isSendingEmail ? 'Sending Email via SMTP...' : 'Confirm & Send Offer Letter'}
                  </Button>
                </div>
              </div>

              {/* Official Letterhead Paper View */}
              <div className="p-8 bg-background font-sans text-xs space-y-6 border-b border-border/40 shadow-inner">
                {/* Letterhead Header */}
                <div className="flex items-center justify-between border-b-2 border-primary pb-4">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-primary uppercase">
                      EHCM Platform — Enterprise Suite
                    </h2>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                      Codigix Infotech Private Limited • Global HR Operations
                    </p>
                  </div>
                  <div className="text-right text-[10.5px] text-muted-foreground font-mono">
                    <div>Date: {selectedOfferForPreview.releaseDate}</div>
                    <div>Ref No: {selectedOfferForPreview.id}</div>
                  </div>
                </div>

                {/* Candidate Address Block */}
                <div className="space-y-1 bg-muted/20 p-3 rounded-lg border border-border/50">
                  <div className="font-bold text-sm text-foreground">{selectedOfferForPreview.candidate}</div>
                  <div className="text-muted-foreground font-mono">{selectedOfferForPreview.email || 'candidate34@example-mail.com'}</div>
                  <div className="text-muted-foreground">Pune HQ Executive Boardroom Address, Maharashtra, India</div>
                </div>

                {/* Subject Line */}
                <div className="font-bold text-xs text-primary underline">
                  SUBJECT: LETTER OF OFFER FOR THE POSITION OF {selectedOfferForPreview.role.toUpperCase()}
                </div>

                {/* Salutation & Opening Paragraph */}
                <div className="space-y-2 text-foreground/90 leading-relaxed">
                  <p>Dear <strong>{selectedOfferForPreview.candidate}</strong>,</p>
                  <p>
                    With reference to your application and subsequent interviews conducted under reference{' '}
                    <strong className="font-mono">{selectedOfferForPreview.interviewCode || 'INT-2026-005'}</strong> (Requisition:{' '}
                    <strong className="font-mono">{selectedOfferForPreview.requisitionCode || 'JR-2026-001'}</strong>), we are pleased to extend this formal offer of employment for the position of{' '}
                    <strong>{selectedOfferForPreview.role}</strong> at EHCM Platform (Codigix Infotech).
                  </p>
                </div>

                {/* Offer Highlights Table */}
                <div className="border rounded-xl p-4 bg-card space-y-3">
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 border-b pb-2">
                    <FileText className="h-4 w-4 text-primary" /> Key Employment Details & Terms
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Offered Designation:</span>
                      <strong className="text-foreground">{selectedOfferForPreview.role}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Annual CTC:</span>
                      <strong className="text-primary font-mono text-sm">{selectedOfferForPreview.ctc}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Proposed Joining Date:</span>
                      <strong className="font-mono">{selectedOfferForPreview.joiningDate || '20 Sep 2026'}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Work Location:</span>
                      <strong>{selectedOfferForPreview.location || 'Pune HQ - Executive Suite'}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Probation Period:</span>
                      <strong>{selectedOfferForPreview.probation || '3 Months'}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Reporting Manager:</span>
                      <strong>{selectedOfferForPreview.manager || 'Rajesh Sharma (CTO)'}</strong>
                    </div>
                  </div>
                </div>

                {/* Salary Breakdown Table */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-emerald-600" /> Salary Compensation Breakup
                  </h4>
                  <Table className="border rounded-lg text-xs font-mono">
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-xs">Component</TableHead>
                        <TableHead className="text-xs text-right">Monthly (₹)</TableHead>
                        <TableHead className="text-xs text-right">Annualized (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Basic Salary</TableCell>
                        <TableCell className="text-right">₹83,333</TableCell>
                        <TableCell className="text-right">₹10,00,000</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>House Rent Allowance (HRA)</TableCell>
                        <TableCell className="text-right">₹33,333</TableCell>
                        <TableCell className="text-right">₹4,00,000</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Special & Performance Allowance</TableCell>
                        <TableCell className="text-right">₹66,667</TableCell>
                        <TableCell className="text-right">₹8,00,000</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Employer Provident Fund (PF)</TableCell>
                        <TableCell className="text-right">₹16,667</TableCell>
                        <TableCell className="text-right">₹2,00,000</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/40 font-bold">
                        <TableCell className="text-primary font-bold">TOTAL ANNUAL CTC</TableCell>
                        <TableCell className="text-right text-primary">₹2,00,000 / mo</TableCell>
                        <TableCell className="text-right text-primary">{selectedOfferForPreview.ctc}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Terms and Offer Validity */}
                <div className="space-y-2 text-[11px] text-muted-foreground pt-2">
                  <p>
                    <strong>Offer Validity:</strong> This offer is valid until <strong>{selectedOfferForPreview.expiryDate}</strong>. Please sign and return the digital acceptance copy before this date.
                  </p>
                  <p>
                    We welcome you to EHCM Platform and look forward to a mutually rewarding professional journey.
                  </p>
                </div>

                {/* Signature Block */}
                <div className="pt-6 flex justify-between items-end border-t border-border/40 text-xs">
                  <div>
                    <div className="font-bold text-foreground">For EHCM Platform (Codigix Infotech)</div>
                    <div className="mt-8 pt-2 border-t border-foreground/30 font-bold text-primary">
                      Authorized Signatory (HR Operations)
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Candidate Acceptance Signature</div>
                    <div className="mt-8 pt-2 border-t border-foreground/30 font-mono text-muted-foreground">
                      {selectedOfferForPreview.candidate} (Digitally Signed)
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <DialogFooter className="p-4 bg-muted/20 border-t border-border/60 gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)} className="text-xs">
                  Close Preview
                </Button>
                <Button
                  size="sm"
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm"
                  onClick={() => handleSendOffer(selectedOfferForPreview)}
                  disabled={isSendingEmail}
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSendingEmail ? 'Sending Email via SMTP...' : 'Confirm & Send Offer Letter'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
