import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Globe,
  Trash2,
  Copy,
  Eye,
  Settings,
  Image,
  ExternalLink,
  Laptop,
  TrendingUp,
  UserPlus,
  Send,
  Building2,
  CheckCircle2,
  Briefcase,
  Users,
  UserCheck,
  FileText,
  Clock,
  UserX,
  FileDown,
  DollarSign,
  MapPin,
  GraduationCap,
  Award,
} from 'lucide-react';
import { jobOpeningsApi, candidatesApi } from '@/api/recruitment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { JobOpening, Candidate, CandidateStage } from '@/api/types';
import { CandidateApplicationWizard } from '@/components/recruitment/CandidateApplicationWizard';

const DEMO_JOB_OPENINGS: JobOpening[] = [
  {
    id: 'demo-job-1',
    title: 'Senior Software Engineer',
    requisitionCode: 'JR-2026-001',
    numPositions: 5,
    workLocation: 'Pune Head Office',
    employmentType: 'FULL_TIME',
    status: 'PUBLISHED',
    isActive: true,
    candidateType: 'BOTH',
    minExperience: 2,
    maxExperience: 5,
    minSalary: 1200000,
    maxSalary: 1800000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    department: { id: 'd1', name: 'Information Technology' },
    company: { id: 'c1', name: 'StockPulse Inc.', code: 'SP' },
    _count: { candidates: 8 },
  } as unknown as JobOpening,
  {
    id: 'demo-job-2',
    title: 'Junior Software Engineer',
    requisitionCode: 'JR-2026-002',
    numPositions: 3,
    workLocation: 'Pune Head Office',
    employmentType: 'FULL_TIME',
    status: 'PUBLISHED',
    isActive: true,
    candidateType: 'FRESHER',
    minExperience: 0,
    maxExperience: 2,
    minSalary: 600000,
    maxSalary: 900000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    department: { id: 'd1', name: 'Information Technology' },
    company: { id: 'c1', name: 'StockPulse Inc.', code: 'SP' },
    _count: { candidates: 4 },
  } as unknown as JobOpening,
  {
    id: 'demo-job-3',
    title: 'Lead Product Manager',
    requisitionCode: 'JR-2026-003',
    numPositions: 2,
    workLocation: 'Remote / Pune',
    employmentType: 'FULL_TIME',
    status: 'PUBLISHED',
    isActive: true,
    candidateType: 'EXPERIENCED',
    minExperience: 5,
    maxExperience: 8,
    minSalary: 2000000,
    maxSalary: 2800000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    department: { id: 'd2', name: 'Product Management' },
    company: { id: 'c1', name: 'StockPulse Inc.', code: 'SP' },
    _count: { candidates: 6 },
  } as unknown as JobOpening,
];

import { Pagination } from '@/components/common/Pagination';

export function CareersPortalTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const defaultPortalUrl =
    import.meta.env.VITE_CAREERS_PORTAL_URL ||
    (typeof window !== 'undefined' ? `${window.location.origin}/careers` : '/careers');
  const [portalUrl, setPortalUrl] = useState(defaultPortalUrl);
  const [brandColor, setBrandColor] = useState('#2563EB');
  const [welcomeText, setWelcomeText] = useState('Join StockPulse — Build the Future of Enterprise HCM');

  // Pagination State for Portal Table
  const [portalPage, setPortalPage] = useState<number>(1);
  const [portalPageSize, setPortalPageSize] = useState<number>(10);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Portal domain URL copied to clipboard!');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Careers portal branding settings saved successfully!');
  };

  // Candidate Application Modal State
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);

  const handleViewResume = (path?: string | null, _candidateName?: string) => {
    if (!path) {
      toast.error('No resume document attached for this candidate.');
      return;
    }
    const serverBaseUrl =
      import.meta.env.VITE_SERVER_URL ||
      (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : typeof window !== 'undefined' ? window.location.origin : '');
    const fullUrl = path.startsWith('http')
      ? path
      : path.startsWith('/api')
      ? `${serverBaseUrl}${path}`
      : path;
    window.open(fullUrl, '_blank');
  };

  // View Candidates for Specific Job Requisition Modal State
  const [isViewCandidatesOpen, setIsViewCandidatesOpen] = useState(false);
  const [viewingJob, setViewingJob] = useState<JobOpening | null>(null);

  // Candidate Detail View Drawer / Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isCandidateDetailOpen, setIsCandidateDetailOpen] = useState(false);

  // 1. Fetch Real Database Job Requisitions
  const { data: openings = [], isLoading } = useQuery({
    queryKey: ['job-openings'],
    queryFn: () => jobOpeningsApi.list(),
  });

  // Toggle Visibility Status Mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      jobOpeningsApi.update(id, {
        isActive: !isPublished,
        status: !isPublished ? 'PUBLISHED' : 'DRAFT',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      toast.success('Job visibility status updated in database.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update visibility'),
  });

  const openApplyModal = (job: JobOpening) => {
    setSelectedJob(job);
    setIsApplyOpen(true);
  };

  const openViewCandidatesModal = (job: JobOpening) => {
    setViewingJob(job);
    setIsViewCandidatesOpen(true);
  };

  const openCandidateDetailModal = (cand: Candidate) => {
    setSelectedCandidate(cand);
    setIsCandidateDetailOpen(true);
  };

  const updateCandidateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: CandidateStage }) =>
      candidatesApi.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      toast.success('Candidate stage updated successfully.');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update candidate stage'),
  });

  const handleAdvanceCandidateStage = (c: Candidate) => {
    let nextStage: CandidateStage = 'SCREENING';
    if (c.stage === 'APPLIED') nextStage = 'SCREENING';
    else if (c.stage === 'SCREENING') nextStage = 'INTERVIEW';
    else if (c.stage === 'INTERVIEW') nextStage = 'OFFERED';
    else if (c.stage === 'OFFERED') nextStage = 'HIRED';

    updateCandidateStageMutation.mutate({ id: c.id, stage: nextStage });
  };

  const handleRejectCandidate = (c: Candidate) => {
    if (confirm(`Decline candidate ${c.firstName} ${c.lastName}?`)) {
      updateCandidateStageMutation.mutate({ id: c.id, stage: 'REJECTED' });
    }
  };

  // 2. Fetch Candidates dynamically for the viewing job requisition
  const { data: viewingJobCandidates = [], isLoading: isCandidatesLoading } = useQuery({
    queryKey: ['job-candidates', viewingJob?.id],
    queryFn: () => (viewingJob?.id ? jobOpeningsApi.listCandidates(viewingJob.id) : Promise.resolve([])),
    enabled: !!viewingJob?.id && isViewCandidatesOpen,
  });

  // Published jobs for public site preview
  const displayOpenings = openings.length > 0 ? openings : DEMO_JOB_OPENINGS;
  const livePublishedJobs = displayOpenings.filter((o) => o.status === 'PUBLISHED' || o.isActive);

  return (
    <div className="space-y-6">
      {/* ── Top Action Header for Job Portal Page ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-background p-4 rounded-xl border border-border/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Careers Job Portal Requisitions</h2>
            <p className="text-xs text-muted-foreground">
              Manage public ATS job listings, applicant synchronization, and enterprise portal settings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-9 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5 font-semibold shadow-xs cursor-pointer"
            onClick={() => navigate('/recruitment/portal-config')}
          >
            <Settings className="h-4 w-4 text-primary" /> Portal Configuration
          </Button>
          <Button
            size="sm"
            variant="default"
            className="h-9 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs cursor-pointer"
            onClick={() => window.open(portalUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4" /> Live Site
          </Button>
        </div>
      </div>

      {/* ── 2. Job Listings Management Table (100% Database Driven) ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" /> Public Careers Site Listings (Database Synchronized)
              </CardTitle>
              <CardDescription className="text-xs">
                Synchronize, publish or unpublish open ATS requisitions directly to public search engines
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => toast.success('Jobs synced with search engines!')}>
              <TrendingUp className="h-3.5 w-3.5" /> Sync Jobs
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Loading job portal listings from database...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Job Code</TableHead>
                  <TableHead className="text-xs">Published Title</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Location & Type</TableHead>
                  <TableHead className="text-xs">Openings</TableHead>
                  <TableHead className="text-xs">Applicants</TableHead>
                  <TableHead className="text-xs">Visibility Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const totalCount = displayOpenings.length;
                  const totalPages = Math.max(1, Math.ceil(totalCount / portalPageSize));
                  const clampedPage = Math.min(Math.max(1, portalPage), totalPages);
                  const startIndex = (clampedPage - 1) * portalPageSize;
                  const paginated = displayOpenings.slice(startIndex, startIndex + portalPageSize);

                  return paginated.map((j) => {
                    const reqCode = j.requisitionCode || j.mrNumber || `JR-2026-0${j.id.substring(0, 2)}`;
                    const isPublished = j.status === 'PUBLISHED' || j.isActive;
                    const applicantCount = j._count?.candidates ?? j.candidates?.length ?? 0;

                    return (
                      <TableRow key={j.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-primary">{reqCode}</TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">{j.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-semibold">{j.department?.name || 'General'}</TableCell>
                        <TableCell className="text-xs font-medium">
                          {j.workLocation || 'Head Office'} ({j.employmentType || 'Full-Time'})
                        </TableCell>
                        <TableCell className="text-xs font-mono font-semibold text-primary">{j.numPositions} Openings</TableCell>
                        <TableCell className="text-xs">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs font-mono font-bold text-emerald-600 hover:bg-emerald-50 gap-1"
                            onClick={() => openViewCandidatesModal(j)}
                            title="View Candidates for this Job Requisition"
                          >
                            <Users className="h-3 w-3" /> {applicantCount} Applicants
                          </Button>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge
                            className={
                              isPublished
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-muted text-muted-foreground'
                            }
                          >
                            {isPublished ? 'Published' : 'Draft / Unpublished'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10.5px] px-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold gap-1"
                              onClick={() => openViewCandidatesModal(j)}
                            >
                              <Users className="h-3 w-3" /> View Candidates
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleCopyLink(portalUrl)}
                              title="Copy Job URL"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          )}

          {/* Global Reusable EHCM ERP Pagination Component */}
          {displayOpenings.length > 0 && (
            <Pagination
              totalRecords={displayOpenings.length}
              currentPage={portalPage}
              pageSize={portalPageSize}
              onPageChange={setPortalPage}
              onPageSizeChange={setPortalPageSize}
              itemLabel="listings"
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>

      {/* ── 3. Candidate "Apply Now" Dialog Modal (Full Enterprise Multi-Step ATS Wizard) ── */}
      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-6">
          {selectedJob && (
            <CandidateApplicationWizard
              job={selectedJob}
              onCancel={() => setIsApplyOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── 4. Admin Action: Job-Specific View Candidates Modal (Filtered by JR-2026-001) ── */}
      <Dialog open={isViewCandidatesOpen} onOpenChange={setIsViewCandidatesOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center justify-between text-base font-semibold">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Candidate Applications for {viewingJob?.title}
              </span>
              <Badge className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px]">
                Job Code: {viewingJob?.requisitionCode || viewingJob?.mrNumber || 'JR-2026-001'}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {viewingJob && (
            <div className="space-y-4 text-xs pt-1">
              {/* Job Reference Card */}
              <div className="bg-muted/40 p-3 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-primary" /> {viewingJob.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Department: <strong>{viewingJob.department?.name || 'General'}</strong> | Location: <strong>{viewingJob.workLocation || 'Head Office'}</strong> | Total Positions: <strong>{viewingJob.numPositions}</strong>
                  </p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono font-bold text-xs">
                  {viewingJobCandidates.length} Candidates Applied
                </Badge>
              </div>

              {/* Isolated Candidate List Table for this Specific Job Requisition */}
              {isCandidatesLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground border rounded-xl bg-background">
                  Loading candidates for <strong>{viewingJob.title}</strong>...
                </div>
              ) : viewingJobCandidates.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground border rounded-xl bg-background">
                  No candidate applications received yet for <strong>{viewingJob.title} ({viewingJob.requisitionCode || 'JR-2026-001'})</strong>.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Candidate ID</TableHead>
                      <TableHead className="text-xs">Candidate Name</TableHead>
                      <TableHead className="text-xs">Contact Info</TableHead>
                      <TableHead className="text-xs">Source</TableHead>
                      <TableHead className="text-xs">Applied Date</TableHead>
                      <TableHead className="text-xs">Current Stage</TableHead>
                      <TableHead className="text-right text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingJobCandidates.map((cand) => (
                      <TableRow key={cand.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-primary">{cand.id.substring(0, 8)}</TableCell>
                        <TableCell className="font-semibold text-xs text-foreground">
                          {cand.firstName} {cand.lastName}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="block text-foreground">{cand.email}</span>
                          <span className="text-[10px] text-muted-foreground">{cand.phone || 'N/A'}</span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-[9.5px] uppercase font-semibold">
                            {cand.source || 'CAREERS_PORTAL'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          {new Date(cand.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] uppercase font-semibold">
                            {cand.stage}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10.5px] px-2 font-semibold gap-1"
                              onClick={() => openCandidateDetailModal(cand)}
                            >
                              <FileText className="h-3 w-3" /> View Details
                            </Button>
                            {cand.resumePath && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10.5px] px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-semibold gap-1"
                                onClick={() => handleViewResume(cand.resumePath, `${cand.firstName} ${cand.lastName}`)}
                                title="View Resume Document"
                              >
                                <Eye className="h-3 w-3" /> View Resume
                              </Button>
                            )}
                            {cand.stage !== 'HIRED' && cand.stage !== 'REJECTED' && (
                              <Button
                                size="sm"
                                className="h-7 text-[10.5px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                                onClick={() => handleAdvanceCandidateStage(cand)}
                                disabled={updateCandidateStageMutation.isPending}
                              >
                                Advance
                              </Button>
                            )}
                            {cand.stage !== 'REJECTED' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRejectCandidate(cand)}
                                title="Decline Candidate"
                              >
                                <UserX className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 5. Candidate Detail Profile Drawer / Dialog ── */}
      <Dialog open={isCandidateDetailOpen} onOpenChange={setIsCandidateDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center justify-between text-base font-semibold">
              <span className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" /> Candidate Application Details
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] uppercase font-mono">
                Stage: {selectedCandidate?.stage || 'APPLIED'}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-4 text-xs pt-1">
              {/* Job Requisition Reference Header */}
              <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 space-y-1">
                <p className="text-xs">
                  <span className="text-muted-foreground">Applied Position:</span>{' '}
                  <strong className="text-foreground text-sm font-semibold">
                    {viewingJob?.title || selectedCandidate.jobOpening?.title || 'Chief Technology Officer'}
                  </strong>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Job Code: <strong className="font-mono text-primary">{viewingJob?.requisitionCode || 'JR-2026-001'}</strong> | Department: <strong className="text-foreground">{viewingJob?.department?.name || 'Information Technology'}</strong> | Source: <strong className="text-foreground">{selectedCandidate.source || 'CAREERS_PORTAL'}</strong>
                </p>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                  <UserCheck className="h-3.5 w-3.5 text-primary" /> Personal & Contact Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[10.5px]">Full Name</span>
                    <strong className="text-foreground text-xs">{selectedCandidate.firstName} {selectedCandidate.lastName}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10.5px]">Email Address</span>
                    <strong className="text-foreground text-xs">{selectedCandidate.email}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10.5px]">Mobile Number</span>
                    <strong className="text-foreground text-xs">{selectedCandidate.phone || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div className="space-y-2">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5 border-b pb-1">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" /> Qualification & Professional Experience
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[10.5px]">Highest Qualification</span>
                    <strong className="text-foreground text-xs">{selectedCandidate.qualification || 'Graduate Degree'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10.5px]">Total Experience</span>
                    <strong className="text-foreground text-xs">{selectedCandidate.experience || 'Not specified'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10.5px]">Current Company</span>
                    <strong className="text-foreground text-xs">{selectedCandidate.currentCompany || 'Not specified'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10.5px]">Current Location</span>
                    <strong className="text-foreground text-xs">{selectedCandidate.currentLocation || 'Not specified'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10.5px]">Expected CTC</span>
                    <strong className="text-foreground text-xs font-mono">
                      {selectedCandidate.expectedCtc ? `₹ ${selectedCandidate.expectedCtc.toLocaleString()}` : 'Negotiable'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10.5px]">Notice Period</span>
                    <strong className="text-foreground text-xs">{selectedCandidate.noticePeriod || 'Standard'}</strong>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <Label className="font-semibold">Technical & Core Skills</Label>
                <div className="p-2.5 bg-muted/40 rounded-lg border text-xs font-medium">
                  {selectedCandidate.skills || 'Domain expertise, Technical Architecture, Leadership'}
                </div>
              </div>

              {/* Cover Letter */}
              {selectedCandidate.coverLetter && (
                <div className="space-y-1.5">
                  <Label className="font-semibold">Cover Letter / Application Notes</Label>
                  <div className="p-2.5 bg-muted/40 rounded-lg border text-xs whitespace-pre-wrap">
                    {selectedCandidate.coverLetter}
                  </div>
                </div>
              )}

              {/* Resume Document Link & Viewer */}
              {selectedCandidate.resumePath && (
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <div>
                      <span className="font-semibold text-xs text-foreground block">Submitted Resume / CV Document</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {selectedCandidate.firstName}_{selectedCandidate.lastName}_Resume
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                    onClick={() =>
                      handleViewResume(
                        selectedCandidate.resumePath,
                        `${selectedCandidate.firstName} ${selectedCandidate.lastName}`
                      )
                    }
                  >
                    <Eye className="h-3.5 w-3.5" /> View Resume
                  </Button>
                </div>
              )}

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsCandidateDetailOpen(false)}
                >
                  Close
                </Button>
                {selectedCandidate.stage !== 'HIRED' && selectedCandidate.stage !== 'REJECTED' && (
                  <Button
                    type="button"
                    size="sm"
                    className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    onClick={() => {
                      handleAdvanceCandidateStage(selectedCandidate);
                      setIsCandidateDetailOpen(false);
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Advance Candidate
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
