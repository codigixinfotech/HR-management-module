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
  Edit,
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
import { Pagination } from '@/components/common/Pagination';
import { useCompany } from '@/context/CompanyContext';
import { useAuthStore } from '@/stores/auth-store';
import { isSuperAdminUser, isBranchAdminUser, isCompanyAdminUser } from '@/lib/modules';

export type CtcUnit = 'YEAR' | 'LAKH' | 'CRORE';
export type CtcDisplayFormat = 'STANDARD' | 'YEAR' | 'LAKH' | 'CRORE';

/**
 * Format number to standard Indian format: ₹24,00,000 / yr
 */
export function formatStandardCtc(amount: number): string {
  const safe = Math.max(0, Math.round(amount || 0));
  const formatted = new Intl.NumberFormat('en-IN').format(safe);
  return `₹${formatted} / yr`;
}

/**
 * Format number to standard Indian currency without period suffix: ₹24,00,000
 */
export function formatInrCurrency(amount: number): string {
  const safe = Math.max(0, Math.round(amount || 0));
  return `₹${new Intl.NumberFormat('en-IN').format(safe)}`;
}

/**
 * Format number to Indian Lakh format: ₹24.00 Lakh / yr
 */
export function formatLakhCtc(amount: number): string {
  const safe = Math.max(0, amount || 0);
  const lakhs = safe / 100000;
  const formatted = lakhs.toFixed(2);
  return `₹${formatted} Lakh / yr`;
}

/**
 * Format number to Indian Crore format: ₹0.24 Crore / yr
 */
export function formatCroreCtc(amount: number): string {
  const safe = Math.max(0, amount || 0);
  const crores = safe / 10000000;
  const formatted = crores.toFixed(2);
  return `₹${formatted} Crore / yr`;
}

export function formatCtcByFormat(amount: number, format: CtcDisplayFormat): string {
  if (format === 'LAKH') return formatLakhCtc(amount);
  if (format === 'CRORE') return formatCroreCtc(amount);
  return formatStandardCtc(amount);
}

/**
 * Format input value depending on unit dropdown selection:
 * - 'YEAR': "12,00,000" or "24,00,000"
 * - 'LAKH': "12.00" (or "12")
 * - 'CRORE': "0.12" (or "0.24")
 */
export function formatInputValueForUnit(amount: number, unit: CtcUnit): string {
  const safe = Math.max(0, amount || 0);
  if (unit === 'LAKH') {
    const val = safe / 100000;
    return Number(val.toFixed(2)).toString();
  }
  if (unit === 'CRORE') {
    const val = safe / 10000000;
    return Number(val.toFixed(4)).toString();
  }
  return new Intl.NumberFormat('en-IN').format(Math.round(safe));
}

/**
 * Parses user input value based on current selected unit dropdown:
 * - If unit is 'YEAR': "12,00,000" -> 1200000
 * - If unit is 'LAKH': "12" or "12.00" -> 1200000
 * - If unit is 'CRORE': "0.12" -> 1200000
 */
export function parseCtcValueWithUnit(input: string, unit: CtcUnit): number {
  if (!input) return 0;
  const raw = input.trim().toLowerCase();

  // If user typed or pasted explicit text with crore/cr
  const croreMatch = raw.match(/([\d,.]+)\s*(?:crores?|cr\b)/i);
  if (croreMatch) {
    const val = parseFloat(croreMatch[1].replace(/,/g, ''));
    if (!isNaN(val)) return Math.round(val * 10000000);
  }

  // If user typed or pasted explicit text with lakh/lac/lpa
  const lakhMatch = raw.match(/([\d,.]+)\s*(?:lakhs?|lacs?|lpa\b)/i);
  if (lakhMatch) {
    const val = parseFloat(lakhMatch[1].replace(/,/g, ''));
    if (!isNaN(val)) return Math.round(val * 100000);
  }

  // Standard numeric extraction based on selected unit
  const cleaned = raw.replace(/[^\d.]/g, '');
  if (!cleaned) return 0;
  const val = parseFloat(cleaned);
  if (isNaN(val)) return 0;

  if (unit === 'LAKH') {
    return Math.round(val * 100000);
  }
  if (unit === 'CRORE') {
    return Math.round(val * 10000000);
  }
  return Math.round(val);
}

/**
 * Parses user input string which may be in any of the formats:
 * - "₹24,00,000 / yr", "2400000", "24,00,000"
 * - "₹24 Lakh / yr", "24 Lakh", "24.00 Lakh", "24L", "24 lac", "24 LPA"
 * - "₹0.24 Crore / yr", "0.24 Crore", "0.24 Cr", "0.24Cr"
 *
 * All three formats resolve to the identical canonical numeric amount (e.g. 2400000).
 */
export function parseCtcInput(input: string | number): number {
  if (typeof input === 'number') {
    return isNaN(input) || input < 0 ? 0 : Math.round(input);
  }
  if (!input || typeof input !== 'string') return 0;

  const raw = input.trim().toLowerCase();

  // 1. Check Crore format (e.g. "₹0.24 Crore / yr", "0.24 Crore", "0.24 Cr", "0.24cr")
  const croreMatch = raw.match(/([\d,.]+)\s*(?:crores?|cr\b)/i);
  if (croreMatch) {
    const numStr = croreMatch[1].replace(/,/g, '');
    const val = parseFloat(numStr);
    if (!isNaN(val)) return Math.round(val * 10000000);
  }

  // 2. Check Lakh format (e.g. "₹24 Lakh / yr", "24.00 Lakh", "24 Lakh", "24L", "24 lac", "24 LPA")
  const lakhMatch = raw.match(/([\d,.]+)\s*(?:lakhs?|lacs?|lpa\b|l\b)/i);
  if (lakhMatch) {
    const numStr = lakhMatch[1].replace(/,/g, '');
    const val = parseFloat(numStr);
    if (!isNaN(val)) return Math.round(val * 100000);
  }

  // 3. Clean all non-digit and non-decimal characters (e.g. "₹24,00,000 / yr" -> "2400000")
  const cleaned = raw.replace(/[^\d.]/g, '');
  if (!cleaned) return 0;
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

export interface SalaryBreakdown {
  basic: number;
  hra: number;
  special: number;
  pf: number;
  basicPercent: number;
  hraPercent: number;
  specialPercent: number;
  pfPercent: number;
  totalAnnual: number;
  totalMonthly: number;
  isValid: boolean;
}

export function calculateSalaryBreakdown(
  annualCtc: number,
  percentages = { basic: 50, hra: 20, special: 20, pf: 10 }
): SalaryBreakdown {
  const safeCtc = Math.max(0, annualCtc || 0);
  const basic = Math.round((safeCtc * percentages.basic) / 100);
  const hra = Math.round((safeCtc * percentages.hra) / 100);
  const special = Math.round((safeCtc * percentages.special) / 100);
  const pf = Math.round((safeCtc * percentages.pf) / 100);
  const totalAnnual = basic + hra + special + pf;
  const totalMonthly = Math.round(totalAnnual / 12);
  const isValid =
    percentages.basic + percentages.hra + percentages.special + percentages.pf === 100 &&
    (safeCtc === 0 || Math.abs(totalAnnual - safeCtc) <= 2);

  return {
    basic,
    hra,
    special,
    pf,
    basicPercent: percentages.basic,
    hraPercent: percentages.hra,
    specialPercent: percentages.special,
    pfPercent: percentages.pf,
    totalAnnual,
    totalMonthly,
    isValid,
  };
}

export interface OfferItem {
  id: string;
  companyId?: string;
  branchId?: string;
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
  annualCTC: number; // Canonical numeric value (e.g. 2400000)
  currency: string;  // e.g. 'INR'
  ctcDisplayFormat: CtcDisplayFormat;
  ctc: string;       // Formatted string according to ctcDisplayFormat, e.g. "₹24,00,000 / yr"
  salaryStructure?: string;
  salaryBreakdown?: {
    basic: number;
    hra: number;
    special: number;
    pf: number;
    basicPercent: number;
    hraPercent: number;
    specialPercent: number;
    pfPercent: number;
  };
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
    companyId: 'cmsofshgq0014ip4cjrdes1it',
    candidate: 'Siddharth Rao',
    email: 'siddharth.rao@example.com',
    phone: '+91 98190 22311',
    applicationId: 'APP-2026-041',
    role: 'Senior React Architect',
    department: 'Engineering',
    employmentType: 'Full-time',
    requisitionCode: 'JR-2026-004',
    interviewCode: 'INT-2026-012',
    annualCTC: 2200000,
    currency: 'INR',
    ctcDisplayFormat: 'STANDARD',
    ctc: '₹22,00,000 / yr',
    salaryStructure: 'Standard CTC (50% Basic, 20% HRA, 20% Special, 10% PF)',
    salaryBreakdown: calculateSalaryBreakdown(2200000),
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
    companyId: 'cmsofshgq0014ip4cjrdes1it',
    candidate: 'Neha Gupta',
    email: 'neha.gupta@example.com',
    phone: '+91 97660 55412',
    applicationId: 'APP-2026-052',
    role: 'DevOps & Kubernetes Engineer',
    department: 'Infrastructure',
    employmentType: 'Full-time',
    requisitionCode: 'JR-2026-003',
    interviewCode: 'INT-2026-014',
    annualCTC: 1650000,
    currency: 'INR',
    ctcDisplayFormat: 'STANDARD',
    ctc: '₹16,50,000 / yr',
    salaryStructure: 'Standard CTC (50% Basic, 20% HRA, 20% Special, 10% PF)',
    salaryBreakdown: calculateSalaryBreakdown(1650000),
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
    companyId: 'cmsofshgq0014ip4cjrdes1it',
    candidate: 'Vikramaditya Singh',
    email: 'vikram.singh@example.com',
    phone: '+91 98221 99014',
    applicationId: 'APP-2026-019',
    role: 'Product Design Manager',
    department: 'Product Design',
    employmentType: 'Full-time',
    requisitionCode: 'JR-2026-001',
    interviewCode: 'INT-2026-008',
    annualCTC: 1800000,
    currency: 'INR',
    ctcDisplayFormat: 'STANDARD',
    ctc: '₹18,00,000 / yr',
    salaryStructure: 'Standard CTC (50% Basic, 20% HRA, 20% Special, 10% PF)',
    salaryBreakdown: calculateSalaryBreakdown(1800000),
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
  const { activeCompanyId } = useCompany();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = useMemo(() => isSuperAdminUser(user), [user]);
  const isBranchAdmin = useMemo(() => isBranchAdminUser(user), [user]);
  const isCompanyAdmin = useMemo(() => isCompanyAdminUser(user), [user]);

  const userCompanyId = user?.companyId || (user?.employee as any)?.companyId || '';
  const userBranchId = user?.branchId || user?.employee?.branchId || '';

  const scopedCompanyId = useMemo(() => {
    if (isBranchAdmin || isCompanyAdmin) {
      return userCompanyId;
    }
    return activeCompanyId || userCompanyId || '';
  }, [isBranchAdmin, isCompanyAdmin, userCompanyId, activeCompanyId]);

  const scopedBranchId = useMemo(() => {
    if (isBranchAdmin) {
      return userBranchId;
    }
    return '';
  }, [isBranchAdmin, userBranchId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [localOffers, setLocalOffers] = useState<OfferItem[]>(() => {
    try {
      const saved = localStorage.getItem('ehcm_recruitment_offers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_OFFERS;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ehcm_recruitment_offers', JSON.stringify(localOffers));
    } catch {}
  }, [localOffers]);

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  // Pagination State for Offers & Onboarding Table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Fetch real Job Openings & candidates from DB for current company/branch
  const { data: openings = [] } = useQuery({
    queryKey: ['job-openings', scopedCompanyId],
    queryFn: () => jobOpeningsApi.list(scopedCompanyId || undefined),
  });

  // Available candidates from current company/branch
  const eligibleCandidates = useMemo(() => {
    const list: Array<{ candidate: any; job: any }> = [];
    openings.forEach((job) => {
      (job.candidates || []).forEach((c: any) => {
        list.push({ candidate: c, job });
      });
    });
    return list;
  }, [openings]);

  // Dynamically map DB candidates in OFFERED / HIRED stage belonging to current company/branch
  const dbOfferedCandidates = useMemo(() => {
    const list: OfferItem[] = [];
    openings.forEach((job) => {
      if (job.candidates && job.candidates.length > 0) {
        job.candidates.forEach((c) => {
          if (c.stage === 'OFFERED' || c.stage === 'HIRED') {
            const numericCtc = c.expectedCtc ? parseCtcInput(c.expectedCtc) : 2400000;
            const safeCtc = numericCtc > 0 ? numericCtc : 2400000;
            const formattedCtc = formatStandardCtc(safeCtc);
            list.push({
              id: `OFR-${c.id.substring(0, 6).toUpperCase()}`,
              companyId: job.companyId,
              branchId: (c as any).branchId || job.branchId,
              candidateId: c.id,
              candidate: `${c.firstName} ${c.lastName}`,
              email: c.email || 'candidate@example.com',
              phone: (c as any).phone || '+91 98230 44112',
              applicationId: `APP-${c.id.substring(0, 4).toUpperCase()}`,
              role: job.title,
              department: (job as any).department?.name || 'Product Design',
              employmentType: job.employmentType || 'Full-time',
              requisitionCode: job.requisitionCode || 'JR-2026-001',
              annualCTC: safeCtc,
              currency: 'INR',
              ctcDisplayFormat: 'STANDARD',
              ctc: formattedCtc,
              salaryStructure: 'Standard CTC (50% Basic, 20% HRA, 20% Special, 10% PF)',
              salaryBreakdown: calculateSalaryBreakdown(safeCtc),
              releaseDate: new Date().toLocaleDateString('en-GB'),
              selectionDate: new Date().toLocaleDateString('en-GB'),
              joiningDate: '20 Sep 2026',
              expiryDate: '27 Aug 2026',
              status: c.stage === 'HIRED' ? 'ACCEPTED' : 'PENDING_SIGNATURE',
              probation: '3 Months',
              noticePeriod: '30 Days',
              location: job.workLocation || 'Pune HQ',
              manager: 'HR Administrator',
            });
          }
        });
      }
    });
    return list;
  }, [openings]);

  // Combine DB candidates with local state with strict tenant boundary enforcement
  const allOffers = useMemo(() => {
    const result: OfferItem[] = [];
    const localMapByCandidateId = new Map<string, OfferItem>();
    const localMapByName = new Map<string, OfferItem>();
    const localMapById = new Map<string, OfferItem>();

    localOffers.forEach((loc) => {
      // Exclude offers from other companies
      if (loc.companyId && scopedCompanyId && loc.companyId !== scopedCompanyId) {
        return;
      }
      // Exclude offers from other branches if Branch Admin
      if (isBranchAdmin && scopedBranchId && loc.branchId && loc.branchId !== scopedBranchId) {
        return;
      }

      if (loc.id) localMapById.set(loc.id, loc);
      if (loc.candidateId) localMapByCandidateId.set(loc.candidateId, loc);
      if (loc.candidate) localMapByName.set(loc.candidate.toLowerCase().trim(), loc);
    });

    const processedCandidateIds = new Set<string>();
    const processedNames = new Set<string>();

    // 1. Process DB candidates belonging to current company/branch
    dbOfferedCandidates.forEach((dbItem) => {
      const match =
        (dbItem.candidateId && localMapByCandidateId.get(dbItem.candidateId)) ||
        (dbItem.id && localMapById.get(dbItem.id)) ||
        (dbItem.candidate && localMapByName.get(dbItem.candidate.toLowerCase().trim()));

      if (match) {
        result.push(match);
        if (match.candidateId) processedCandidateIds.add(match.candidateId);
        if (match.candidate) processedNames.add(match.candidate.toLowerCase().trim());
      } else {
        result.push(dbItem);
        if (dbItem.candidateId) processedCandidateIds.add(dbItem.candidateId);
        if (dbItem.candidate) processedNames.add(dbItem.candidate.toLowerCase().trim());
      }
    });

    // 2. Also add any localOffers that belong to this company/branch
    localOffers.forEach((loc) => {
      // Exclude offers from other companies
      if (loc.companyId && scopedCompanyId && loc.companyId !== scopedCompanyId) {
        return;
      }
      if (isBranchAdmin && scopedBranchId && loc.branchId && loc.branchId !== scopedBranchId) {
        return;
      }

      // If loc has no companyId: only allow if candidateId or name belongs to this company's candidates
      if (!loc.companyId && scopedCompanyId) {
        const belongsToScope = eligibleCandidates.some(
          (ec) =>
            (loc.candidateId && ec.candidate.id === loc.candidateId) ||
            `${ec.candidate.firstName} ${ec.candidate.lastName}`.toLowerCase() === loc.candidate.toLowerCase().trim()
        );
        if (!belongsToScope) {
          // Foreign demo or other company offer: skip!
          return;
        }
      }

      const alreadyAdded =
        (loc.candidateId && processedCandidateIds.has(loc.candidateId)) ||
        (loc.candidate && processedNames.has(loc.candidate.toLowerCase().trim()));

      if (!alreadyAdded) {
        result.push(loc);
        if (loc.candidateId) processedCandidateIds.add(loc.candidateId);
        if (loc.candidate) processedNames.add(loc.candidate.toLowerCase().trim());
      }
    });

    return result;
  }, [dbOfferedCandidates, localOffers, scopedCompanyId, scopedBranchId, isBranchAdmin, eligibleCandidates]);

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

  // HR Configurable Offer Details States with Canonical Numeric Storage
  const [formAnnualCtc, setFormAnnualCtc] = useState<number>(2400000);
  const [formCtcInput, setFormCtcInput] = useState<string>('24,00,000');
  const [formCtcUnit, setFormCtcUnit] = useState<CtcUnit>('YEAR');

  const [formJoiningDate, setFormJoiningDate] = useState('20 Sep 2026');
  const [formProbation, setFormProbation] = useState('3 Months');
  const [formNoticePeriod, setFormNoticePeriod] = useState('30 Days');
  const [formExpiry, setFormExpiry] = useState('27 Aug 2026');
  const [formLocation, setFormLocation] = useState('Pune HQ - Executive Suite');
  const [formManager, setFormManager] = useState('Rajesh Sharma (CTO)');
  const [formTerms, setFormTerms] = useState('Standard company policies, confidentiality agreement, and background verification apply.');

  // Live Recalculated Salary Structure
  const salaryBreakdown = useMemo(() => {
    return calculateSalaryBreakdown(formAnnualCtc);
  }, [formAnnualCtc]);

  // Handle CTC user input changes (dynamic parsing according to selected unit)
  const handleCtcInputChange = (val: string) => {
    setFormCtcInput(val);
    const parsed = parseCtcValueWithUnit(val, formCtcUnit);
    if (parsed > 0) {
      setFormAnnualCtc(parsed);
    }
  };

  // Format on blur
  const handleCtcInputBlur = () => {
    const parsed = parseCtcValueWithUnit(formCtcInput, formCtcUnit);
    const finalAmount = parsed > 0 ? parsed : formAnnualCtc;
    setFormAnnualCtc(finalAmount);
    setFormCtcInput(formatInputValueForUnit(finalAmount, formCtcUnit));
  };

  // Switch display unit dropdown (₹ / Year, ₹ Lakh / Year, ₹ Crore / Year)
  const handleUnitChange = (newUnit: CtcUnit) => {
    setFormCtcUnit(newUnit);
    setFormCtcInput(formatInputValueForUnit(formAnnualCtc, newUnit));
  };

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
        setFormCandidateId(existingOffer.candidateId || candId || '');
        setFormEmail(existingOffer.email || decodedEmail);
        setFormPhone(existingOffer.phone || '+91 98230 44112');
        setFormApplicationId(existingOffer.applicationId || 'APP-2026-082');
        setFormRole(existingOffer.role || decodedRole);
        setFormDepartment(existingOffer.department || 'Product Design');
        setFormEmploymentType(existingOffer.employmentType || 'Full-time Permanent');
        setFormRequisition(existingOffer.requisitionCode || decodedReq);
        setFormInterviewCode(existingOffer.interviewCode || decodedInt);

        // Canonical numeric CTC - when reopening, always display standard ₹... / yr
        const numeric = existingOffer.annualCTC || parseCtcInput(existingOffer.ctc) || 2400000;
        setFormAnnualCtc(numeric);
        setFormCtcUnit('YEAR');
        setFormCtcInput(formatInputValueForUnit(numeric, 'YEAR'));

        setFormJoiningDate(existingOffer.joiningDate || '20 Sep 2026');
        setFormExpiry(existingOffer.expiryDate || '27 Aug 2026');
        setFormLocation(existingOffer.location || 'Pune HQ');
        setFormManager(existingOffer.manager || 'Rajesh Sharma (CTO)');

        setIsOpen(true);
        toast.info(`Loaded existing Offer Draft (${existingOffer.id}) for ${decodedName}.`);
        navigate('/recruitment/offers', { replace: true });
      } else {
        // Create single new draft offer record
        const newId = `OFR-${Math.floor(700 + Math.random() * 99)}`;
        const defaultCtc = 2400000;

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

        setFormAnnualCtc(defaultCtc);
        setFormCtcUnit('YEAR');
        setFormCtcInput(formatInputValueForUnit(defaultCtc, 'YEAR'));

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
          annualCTC: defaultCtc,
          currency: 'INR',
          ctcDisplayFormat: 'STANDARD',
          ctc: formatStandardCtc(defaultCtc),
          salaryStructure: 'Standard CTC (50% Basic, 20% HRA, 20% Special, 10% PF)',
          salaryBreakdown: calculateSalaryBreakdown(defaultCtc),
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
        navigate('/recruitment/offers', { replace: true });
      }
    }
  }, [searchParams]);

  const openAddModal = () => {
    const newId = `OFR-${Math.floor(700 + Math.random() * 99)}`;
    setCurrentOfferId(newId);

    const firstEligible = eligibleCandidates[0];
    if (firstEligible) {
      setFormCandidateId(firstEligible.candidate.id);
      setFormCandidate(`${firstEligible.candidate.firstName} ${firstEligible.candidate.lastName}`);
      setFormEmail(firstEligible.candidate.email || 'candidate@example.com');
      setFormPhone((firstEligible.candidate as any).phone || '+91 98230 44112');
      setFormApplicationId(`APP-${firstEligible.candidate.id.substring(0, 4).toUpperCase()}`);
      setFormRole(firstEligible.job.title);
      setFormDepartment((firstEligible.job as any).department?.name || 'Engineering');
      setFormEmploymentType(firstEligible.job.employmentType || 'Full-time Permanent');
      setFormRequisition(firstEligible.job.requisitionCode || 'JR-2026-001');
      setFormInterviewCode('INT-2026-005');
    } else {
      setFormCandidateId('');
      setFormCandidate('Select Candidate');
      setFormEmail('');
      setFormPhone('');
      setFormApplicationId('');
      setFormRole('');
      setFormDepartment('');
      setFormEmploymentType('Full-time Permanent');
      setFormRequisition('');
      setFormInterviewCode('');
    }

    setFormAnnualCtc(2400000);
    setFormCtcUnit('YEAR');
    setFormCtcInput(formatInputValueForUnit(2400000, 'YEAR'));

    setFormExpiry('27 Aug 2026');
    setFormJoiningDate('20 Sep 2026');
    setFormProbation('3 Months');
    setFormNoticePeriod('30 Days');
    setFormLocation('Pune HQ - Executive Suite');
    setFormManager('HR Administrator');
    setIsOpen(true);
  };

  const openEditModal = (o: OfferItem) => {
    setCurrentOfferId(o.id);
    setFormCandidateId(o.candidateId || '');
    setFormCandidate(o.candidate);
    setFormEmail(o.email || 'candidate@example.com');
    setFormPhone(o.phone || '+91 98230 44112');
    setFormApplicationId(o.applicationId || 'APP-2026-082');
    setFormRole(o.role);
    setFormDepartment(o.department || 'Product Design');
    setFormEmploymentType(o.employmentType || 'Full-time Permanent');
    setFormRequisition(o.requisitionCode || 'JR-2026-001');
    setFormInterviewCode(o.interviewCode || 'INT-2026-005');

    const numeric = o.annualCTC || parseCtcInput(o.ctc) || 2400000;
    setFormAnnualCtc(numeric);
    setFormCtcUnit('YEAR');
    setFormCtcInput(formatInputValueForUnit(numeric, 'YEAR'));

    setFormJoiningDate(o.joiningDate || '20 Sep 2026');
    setFormProbation(o.probation || '3 Months');
    setFormNoticePeriod(o.noticePeriod || '30 Days');
    setFormExpiry(o.expiryDate || '27 Aug 2026');
    setFormLocation(o.location || 'Pune HQ - Executive Suite');
    setFormManager(o.manager || 'Rajesh Sharma (CTO)');
    setFormTerms(o.terms || 'Standard company policies, confidentiality agreement, and background verification apply.');
    setIsOpen(true);
  };

  // Helper to construct current OfferItem state
  const getCurrentOfferObject = (status: OfferItem['status']): OfferItem => {
    const formatted = formatStandardCtc(formAnnualCtc);
    return {
      id: currentOfferId || `OFR-${Math.floor(700 + Math.random() * 99)}`,
      companyId: scopedCompanyId,
      branchId: scopedBranchId,
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
      annualCTC: formAnnualCtc,
      currency: 'INR',
      ctcDisplayFormat: formCtcUnit,
      ctc: formatted,
      salaryStructure: 'Standard CTC (50% Basic, 20% HRA, 20% Special, 10% PF)',
      salaryBreakdown: {
        basic: salaryBreakdown.basic,
        hra: salaryBreakdown.hra,
        special: salaryBreakdown.special,
        pf: salaryBreakdown.pf,
        basicPercent: salaryBreakdown.basicPercent,
        hraPercent: salaryBreakdown.hraPercent,
        specialPercent: salaryBreakdown.specialPercent,
        pfPercent: salaryBreakdown.pfPercent,
      },
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
    };
  };

  // ACTION 1: SAVE DRAFT / UPDATE OFFER
  const handleSaveDraft = () => {
    if (!salaryBreakdown.isValid) {
      toast.error('Cannot save: Salary structure components do not equal Annual CTC.');
      return;
    }
    const existing = allOffers.find(
      (o) =>
        (currentOfferId && o.id === currentOfferId) ||
        (formCandidateId && o.candidateId === formCandidateId) ||
        (formCandidate && o.candidate.toLowerCase().trim() === formCandidate.toLowerCase().trim())
    );
    const targetStatus = existing?.status || 'DRAFT';
    const offer = getCurrentOfferObject(targetStatus);

    setLocalOffers((prev) => {
      const idx = prev.findIndex(
        (o) =>
          (offer.id && o.id === offer.id) ||
          (offer.candidateId && o.candidateId === offer.candidateId) ||
          (offer.candidate && o.candidate.toLowerCase().trim() === offer.candidate.toLowerCase().trim())
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = offer;
        return copy;
      }
      return [offer, ...prev];
    });

    if (formCandidateId) {
      candidatesApi
        .update(formCandidateId, { expectedCtc: formatStandardCtc(formAnnualCtc) })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['job-openings'] });
        })
        .catch((err) => {
          console.error('Failed to sync expectedCtc to DB', err);
        });
    }

    toast.success(`Offer package (${offer.id}) updated with CTC ${formatStandardCtc(formAnnualCtc)}!`);
    setIsOpen(false);
  };

  // ACTION 2: GENERATE OFFER LETTER / UPDATE AND PREVIEW
  const handleGenerateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCandidate || !formAnnualCtc) {
      toast.error('Candidate name and Offered CTC are required.');
      return;
    }

    // Validate: Basic + HRA + Special + PF = Annual CTC
    if (!salaryBreakdown.isValid) {
      toast.error(
        `Validation failed: Salary components (${formatStandardCtc(salaryBreakdown.totalAnnual)}) do not equal Annual CTC (${formatStandardCtc(formAnnualCtc)}).`
      );
      return;
    }

    const existing = allOffers.find(
      (o) =>
        (currentOfferId && o.id === currentOfferId) ||
        (formCandidateId && o.candidateId === formCandidateId) ||
        (formCandidate && o.candidate.toLowerCase().trim() === formCandidate.toLowerCase().trim())
    );
    const targetStatus =
      existing?.status === 'PENDING_SIGNATURE' || existing?.status === 'ACCEPTED'
        ? existing.status
        : 'GENERATED';

    const offer = getCurrentOfferObject(targetStatus);
    setLocalOffers((prev) => {
      const idx = prev.findIndex(
        (o) =>
          (offer.id && o.id === offer.id) ||
          (offer.candidateId && o.candidateId === offer.candidateId) ||
          (offer.candidate && o.candidate.toLowerCase().trim() === offer.candidate.toLowerCase().trim())
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = offer;
        return copy;
      }
      return [offer, ...prev];
    });

    if (formCandidateId) {
      candidatesApi
        .update(formCandidateId, { expectedCtc: formatStandardCtc(formAnnualCtc) })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['job-openings'] });
        })
        .catch((err) => {
          console.error('Failed to sync expectedCtc to DB', err);
        });
    }

    setIsOpen(false);
    setSelectedOfferForPreview(offer);
    setIsPreviewOpen(true);

    toast.success(`Offer Letter (${offer.id}) Updated & Generated for ${formCandidate}! CTC: ${formatStandardCtc(formAnnualCtc)}.`);
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
                      <FileSignature className="h-5 w-5 text-primary" />
                      {currentOfferId ? `Edit Job Offer & Compensation (${currentOfferId})` : 'Auto-Populated Job Offer Letter Generator'}
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
                            Auto-Fetched Recruitment Profile
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-400 bg-emerald-50 font-mono font-bold">
                          {currentOfferId || 'OFR-791'}
                        </Badge>
                      </div>

                      {eligibleCandidates.length > 0 && (
                        <div className="space-y-1 pb-1">
                          <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Select Candidate from Current Company</Label>
                          <Select
                            value={formCandidateId}
                            onValueChange={(cId) => {
                              const match = eligibleCandidates.find((ec) => ec.candidate.id === cId);
                              if (match) {
                                setFormCandidateId(match.candidate.id);
                                setFormCandidate(`${match.candidate.firstName} ${match.candidate.lastName}`);
                                setFormEmail(match.candidate.email || '');
                                setFormPhone((match.candidate as any).phone || '+91 98230 44112');
                                setFormApplicationId(`APP-${match.candidate.id.substring(0, 4).toUpperCase()}`);
                                setFormRole(match.job.title);
                                setFormDepartment((match.job as any).department?.name || 'Operations');
                                setFormEmploymentType(match.job.employmentType || 'Full-time Permanent');
                                setFormRequisition(match.job.requisitionCode || 'JR-2026-001');
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background">
                              <SelectValue placeholder="Select candidate..." />
                            </SelectTrigger>
                            <SelectContent>
                              {eligibleCandidates.map((ec) => (
                                <SelectItem key={ec.candidate.id} value={ec.candidate.id} className="text-xs">
                                  {ec.candidate.firstName} {ec.candidate.lastName} — {ec.job.title} ({ec.candidate.stage})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

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
                    <div className="space-y-4 pt-1">
                      <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                        <DollarSign className="h-4 w-4 text-emerald-600" /> Offer-Specific Compensation & Terms
                      </h4>

                      {/* OFFERED ANNUAL SALARY (CTC) FIELD + UNIT DROPDOWN */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-foreground">
                          Offered Annual Salary (CTC) *
                        </Label>

                        {/* Compound Input: [ ₹ 12 ] │ [ ₹ Lakh / Year ▼ ] */}
                        <div className="relative flex items-center rounded-lg border border-border/80 bg-background shadow-2xs focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
                          <span className="pl-3.5 pr-2 text-sm font-bold text-foreground select-none">
                            ₹
                          </span>
                          <Input
                            type="text"
                            value={formCtcInput}
                            onChange={(e) => handleCtcInputChange(e.target.value)}
                            onBlur={handleCtcInputBlur}
                            placeholder={
                              formCtcUnit === 'LAKH'
                                ? '12'
                                : formCtcUnit === 'CRORE'
                                ? '0.12'
                                : '12,00,000'
                            }
                            className="border-0 shadow-none focus-visible:ring-0 px-1 text-sm font-bold font-mono h-10 flex-1 bg-transparent text-foreground"
                            required
                          />
                          <div className="h-6 w-px bg-border/80 my-auto shrink-0" />
                          <div className="pr-1.5 pl-1 shrink-0">
                            <Select
                              value={formCtcUnit}
                              onValueChange={(val: CtcUnit) => handleUnitChange(val)}
                            >
                              <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-muted/60 text-xs font-semibold px-2.5 rounded-md gap-1.5 focus:ring-0 focus:ring-offset-0 cursor-pointer text-foreground">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent align="end">
                                <SelectItem value="YEAR" className="text-xs font-semibold font-mono">
                                  ₹ / Year
                                </SelectItem>
                                <SelectItem value="LAKH" className="text-xs font-semibold font-mono">
                                  ₹ Lakh / Year
                                </SelectItem>
                                <SelectItem value="CRORE" className="text-xs font-semibold font-mono">
                                  ₹ Crore / Year
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Annualized + Multi-Format Summary Display */}
                        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                          <div>
                            <span className="text-muted-foreground font-sans">Annualized: </span>
                            <strong className="text-primary font-bold text-sm">{formatStandardCtc(formAnnualCtc)}</strong>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                            <span>Lakh: <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{formatLakhCtc(formAnnualCtc)}</strong></span>
                            <span>Crore: <strong className="text-blue-700 dark:text-blue-400 font-semibold">{formatCroreCtc(formAnnualCtc)}</strong></span>
                            <span className="text-[10px] text-muted-foreground/80 font-sans">(Canonical: {formAnnualCtc})</span>
                          </div>
                        </div>
                      </div>

                      {/* DYNAMIC SALARY STRUCTURE BREAKDOWN CARD */}
                      <div className="p-3.5 bg-card rounded-xl border border-border/70 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-primary" /> Salary Structure Breakdown (Auto-Calculated)
                          </Label>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono font-bold ${
                              salaryBreakdown.isValid
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-700 border-rose-500/30'
                            }`}
                          >
                            {salaryBreakdown.isValid ? '✓ 100% CTC Validated' : '⚠ Validation Mismatch'}
                          </Badge>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                          <Table className="text-xs font-mono">
                            <TableHeader className="bg-muted/40">
                              <TableRow>
                                <TableHead className="text-[11px] py-1.5">Component</TableHead>
                                <TableHead className="text-[11px] text-right py-1.5">Percentage</TableHead>
                                <TableHead className="text-[11px] text-right py-1.5">Annualized (₹ / yr)</TableHead>
                                <TableHead className="text-[11px] text-right py-1.5">Monthly (₹ / mo)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="py-1.5 font-semibold">Basic Salary</TableCell>
                                <TableCell className="py-1.5 text-right text-muted-foreground font-mono">50%</TableCell>
                                <TableCell className="py-1.5 text-right font-bold text-foreground font-mono">
                                  ₹{new Intl.NumberFormat('en-IN').format(salaryBreakdown.basic)} / yr
                                </TableCell>
                                <TableCell className="py-1.5 text-right text-muted-foreground font-mono">
                                  ₹{new Intl.NumberFormat('en-IN').format(Math.round(salaryBreakdown.basic / 12))} / mo
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="py-1.5 font-semibold">House Rent Allowance (HRA)</TableCell>
                                <TableCell className="py-1.5 text-right text-muted-foreground font-mono">20%</TableCell>
                                <TableCell className="py-1.5 text-right font-bold text-foreground font-mono">
                                  ₹{new Intl.NumberFormat('en-IN').format(salaryBreakdown.hra)} / yr
                                </TableCell>
                                <TableCell className="py-1.5 text-right text-muted-foreground font-mono">
                                  ₹{new Intl.NumberFormat('en-IN').format(Math.round(salaryBreakdown.hra / 12))} / mo
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="py-1.5 font-semibold">Special Allowance</TableCell>
                                <TableCell className="py-1.5 text-right text-muted-foreground font-mono">20%</TableCell>
                                <TableCell className="py-1.5 text-right font-bold text-foreground font-mono">
                                  ₹{new Intl.NumberFormat('en-IN').format(salaryBreakdown.special)} / yr
                                </TableCell>
                                <TableCell className="py-1.5 text-right text-muted-foreground font-mono">
                                  ₹{new Intl.NumberFormat('en-IN').format(Math.round(salaryBreakdown.special / 12))} / mo
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="py-1.5 font-semibold">Employer PF Contribution</TableCell>
                                <TableCell className="py-1.5 text-right text-muted-foreground font-mono">10%</TableCell>
                                <TableCell className="py-1.5 text-right font-bold text-foreground font-mono">
                                  ₹{new Intl.NumberFormat('en-IN').format(salaryBreakdown.pf)} / yr
                                </TableCell>
                                <TableCell className="py-1.5 text-right text-muted-foreground font-mono">
                                  ₹{new Intl.NumberFormat('en-IN').format(Math.round(salaryBreakdown.pf / 12))} / mo
                                </TableCell>
                              </TableRow>
                              <TableRow className="bg-primary/5 font-bold border-t-2 border-primary/20">
                                <TableCell className="py-2 text-primary font-bold">TOTAL ANNUAL CTC</TableCell>
                                <TableCell className="py-2 text-right text-primary font-bold font-mono">100%</TableCell>
                                <TableCell className="py-2 text-right text-primary font-bold text-sm font-mono">
                                  ₹{new Intl.NumberFormat('en-IN').format(salaryBreakdown.totalAnnual)} / yr
                                </TableCell>
                                <TableCell className="py-2 text-right text-primary font-bold font-mono">
                                  ₹{new Intl.NumberFormat('en-IN').format(salaryBreakdown.totalMonthly)} / mo
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>

                        <div className="text-[10.5px] text-muted-foreground flex items-center justify-between pt-1">
                          <span>
                            Validation: Basic (₹{new Intl.NumberFormat('en-IN').format(salaryBreakdown.basic)}) + HRA (₹{new Intl.NumberFormat('en-IN').format(salaryBreakdown.hra)}) + Special (₹{new Intl.NumberFormat('en-IN').format(salaryBreakdown.special)}) + PF (₹{new Intl.NumberFormat('en-IN').format(salaryBreakdown.pf)}) = ₹{new Intl.NumberFormat('en-IN').format(formAnnualCtc)}
                          </span>
                          <span className="text-emerald-600 font-semibold font-mono">Stored numeric: {formAnnualCtc}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
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

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Offer Expiry Date</Label>
                          <Input
                            value={formExpiry}
                            onChange={(e) => setFormExpiry(e.target.value)}
                            className="h-9 text-xs font-mono"
                          />
                        </div>
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
                          <Save className="h-3.5 w-3.5" /> {currentOfferId ? 'Save Changes' : 'Save Draft'}
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
                          <FileCheck className="h-3.5 w-3.5" /> {currentOfferId ? 'Save & Update Offer Letter' : 'Generate Offer Letter'}
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
              {(() => {
                const totalOffers = filteredOffers.length;
                const totalOfferPages = Math.max(1, Math.ceil(totalOffers / pageSize));
                const clampedOfferPage = Math.min(Math.max(1, currentPage), totalOfferPages);
                const offerStartIndex = (clampedOfferPage - 1) * pageSize;
                const paginatedOffers = filteredOffers.slice(offerStartIndex, offerStartIndex + pageSize);

                return paginatedOffers.map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{o.id}</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">
                      <div>{o.candidate}</div>
                      <span className="text-[10px] text-muted-foreground font-mono">{o.email || 'candidate@example.com'}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-semibold">{o.role}</TableCell>
                    <TableCell className="text-xs font-mono">
                      <div className="font-semibold text-foreground">
                        {formatStandardCtc(o.annualCTC || parseCtcInput(o.ctc))}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-normal">
                        {formatLakhCtc(o.annualCTC || parseCtcInput(o.ctc))} • {formatCroreCtc(o.annualCTC || parseCtcInput(o.ctc))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{o.releaseDate}</TableCell>
                    <TableCell className="text-xs font-mono">{o.joiningDate || '20 Sep 2026'}</TableCell>
                    <TableCell className="text-xs">
                      {offerStatusBadge(o.status)}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-1.5">
                      {/* Action to edit/reopen offer */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        onClick={() => openEditModal(o)}
                        title="Edit Offer Terms and CTC"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </Button>

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
                ));
              })()}
            </TableBody>
          </Table>

          {/* Global Reusable EHCM ERP Pagination Component */}
          {filteredOffers.length > 0 && (
            <Pagination
              totalRecords={filteredOffers.length}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="offers"
              className="mt-4"
            />
          )}
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
                      <strong className="text-primary font-mono text-sm">
                        {formatStandardCtc(selectedOfferForPreview.annualCTC || parseCtcInput(selectedOfferForPreview.ctc))}
                      </strong>
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
                    <DollarSign className="h-4 w-4 text-emerald-600" /> Salary Compensation Breakup (Standard Formula: 50% Basic, 20% HRA, 20% Special, 10% PF)
                  </h4>
                  {(() => {
                    const previewNumeric = selectedOfferForPreview.annualCTC || parseCtcInput(selectedOfferForPreview.ctc) || 2400000;
                    const breakdown = selectedOfferForPreview.salaryBreakdown || calculateSalaryBreakdown(previewNumeric);
                    const monthlyBasic = Math.round(breakdown.basic / 12);
                    const monthlyHra = Math.round(breakdown.hra / 12);
                    const monthlySpecial = Math.round(breakdown.special / 12);
                    const monthlyPf = Math.round(breakdown.pf / 12);
                    const monthlyTotal = Math.round(previewNumeric / 12);

                    return (
                      <Table className="border rounded-lg text-xs font-mono">
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="text-xs">Component</TableHead>
                            <TableHead className="text-xs text-right">Percentage</TableHead>
                            <TableHead className="text-xs text-right">Monthly (₹)</TableHead>
                            <TableHead className="text-xs text-right">Annualized (₹)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-sans">Basic Salary</TableCell>
                            <TableCell className="text-right text-muted-foreground">50%</TableCell>
                            <TableCell className="text-right">{formatInrCurrency(monthlyBasic)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatInrCurrency(breakdown.basic)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-sans">House Rent Allowance (HRA)</TableCell>
                            <TableCell className="text-right text-muted-foreground">20%</TableCell>
                            <TableCell className="text-right">{formatInrCurrency(monthlyHra)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatInrCurrency(breakdown.hra)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-sans">Special & Performance Allowance</TableCell>
                            <TableCell className="text-right text-muted-foreground">20%</TableCell>
                            <TableCell className="text-right">{formatInrCurrency(monthlySpecial)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatInrCurrency(breakdown.special)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-sans">Employer Provident Fund (PF)</TableCell>
                            <TableCell className="text-right text-muted-foreground">10%</TableCell>
                            <TableCell className="text-right">{formatInrCurrency(monthlyPf)}</TableCell>
                            <TableCell className="text-right font-semibold">{formatInrCurrency(breakdown.pf)}</TableCell>
                          </TableRow>
                          <TableRow className="bg-muted/40 font-bold">
                            <TableCell className="text-primary font-bold font-sans">TOTAL ANNUAL CTC</TableCell>
                            <TableCell className="text-right text-primary font-sans">100%</TableCell>
                            <TableCell className="text-right text-primary">{formatInrCurrency(monthlyTotal)} / mo</TableCell>
                            <TableCell className="text-right text-primary">{formatStandardCtc(previewNumeric)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    );
                  })()}
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
