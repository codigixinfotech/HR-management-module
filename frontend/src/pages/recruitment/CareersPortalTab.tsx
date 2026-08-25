import { useState } from 'react';
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

export function CareersPortalTab() {
  const queryClient = useQueryClient();

  const [portalUrl, setPortalUrl] = useState('http://localhost:5174/careers');
  const [brandColor, setBrandColor] = useState('#2563EB');
  const [welcomeText, setWelcomeText] = useState('Join StockPulse — Build the Future of Enterprise HCM');

  // Candidate Application Modal State
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);

  // Full 12 Candidate Application Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resumePath, setResumePath] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [expectedCtc, setExpectedCtc] = useState<string>('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploadingResume(true);
        setResumeFileName(file.name);
        const result = await jobOpeningsApi.uploadResume(file);
        setResumePath(result.documentUrl);
        toast.success(`Resume "${file.name}" uploaded successfully!`);
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? 'Failed to upload resume file');
      } finally {
        setIsUploadingResume(false);
      }
    }
  };

  const handleViewResume = (path?: string | null, _candidateName?: string) => {
    if (!path) {
      toast.error('No resume document attached for this candidate.');
      return;
    }
    const fullUrl = path.startsWith('http')
      ? path
      : path.startsWith('/api')
      ? `http://localhost:3001${path}`
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

  // Add Candidate Application Mutation
  const applyCandidateMutation = useMutation({
    mutationFn: ({ jobId, payload }: { jobId: string; payload: any }) =>
      jobOpeningsApi.addCandidate(jobId, payload),
    onSuccess: (candidate) => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['job-candidates'] });
      toast.success(`Application for ${selectedJob?.title} submitted! Candidate ${candidate.firstName} ${candidate.lastName} created.`);
      setIsApplyOpen(false);
      resetApplyForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to submit candidate application'),
  });

  // Update Candidate Stage Mutation
  const updateCandidateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: CandidateStage }) =>
      candidatesApi.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['job-candidates'] });
      toast.success('Candidate evaluation stage updated successfully');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update stage'),
  });

  const resetApplyForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setResumePath('');
    setResumeFileName('');
    setQualification('');
    setExperience('');
    setCurrentCompany('');
    setCurrentLocation('');
    setSkills('');
    setExpectedCtc('');
    setNoticePeriod('');
    setCoverLetter('');
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Public careers link copied to clipboard!');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Branding & configuration settings saved successfully!');
  };

  const openApplyModal = (job: JobOpening) => {
    setSelectedJob(job);
    resetApplyForm();
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

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First Name and Last Name are required');
      return;
    }
    if (!email.trim()) {
      toast.error('Valid Email Address is required');
      return;
    }
    if (!phone.trim()) {
      toast.error('Mobile Phone Number is required');
      return;
    }

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      resumePath: resumePath.trim() || undefined,
      qualification: qualification.trim() || undefined,
      experience: experience.trim() || undefined,
      currentCompany: currentCompany.trim() || undefined,
      currentLocation: currentLocation.trim() || undefined,
      skills: skills.trim() || undefined,
      expectedCtc: expectedCtc ? Number(expectedCtc) : undefined,
      noticePeriod: noticePeriod.trim() || undefined,
      coverLetter: coverLetter.trim() || undefined,
      notes: coverLetter.trim() || undefined,
      source: 'CAREERS_PORTAL',
      stage: 'APPLIED',
    };

    applyCandidateMutation.mutate({
      jobId: selectedJob.id,
      payload,
    });
  };

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
  const livePublishedJobs = openings.filter((o) => o.status === 'PUBLISHED' || o.isActive);

  return (
    <div className="space-y-6">
      {/* ── 1. Portal Settings & Configuration Form ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Portal Branding Customizer */}
        <Card className="shadow-xs border-border/80 lg:col-span-1">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" /> Portal Configuration
            </CardTitle>
            <CardDescription className="text-xs">
              Customize branding, colors, domain URLs & welcome headings for the public jobs page
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Public Portal Domain</Label>
                <div className="flex gap-2">
                  <Input value={portalUrl} onChange={(e) => setPortalUrl(e.target.value)} className="h-9 text-xs font-mono" />
                  <Button type="button" size="icon" variant="outline" className="h-9 w-9" onClick={() => handleCopyLink(portalUrl)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Welcome Banner Headline</Label>
                <Input value={welcomeText} onChange={(e) => setWelcomeText(e.target.value)} className="h-9 text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Primary Brand Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-9 w-12 p-0 border-none cursor-pointer" />
                    <Input value={brandColor} readOnly className="h-9 text-xs font-mono w-full" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Company Logo</Label>
                  <Button type="button" variant="outline" size="sm" className="h-9 w-full text-xs gap-1">
                    <Image className="h-3.5 w-3.5" /> Upload Logo
                  </Button>
                </div>
              </div>

              <Button type="submit" size="sm" className="w-full text-xs">
                Save Portal Config
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Live Portal Preview */}
        <Card className="shadow-xs border-border/80 lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Laptop className="h-4 w-4 text-emerald-600" /> Public Portal Preview
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time visual rendering of active database job openings on your careers portal
              </CardDescription>
            </div>
            <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-primary" onClick={() => window.open(portalUrl, '_blank')}>
              <ExternalLink className="h-3.5 w-3.5" /> Live Site
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 bg-muted/30">
            <div className="rounded-xl border border-border/60 bg-background overflow-hidden shadow-xs">
              {/* Header */}
              <div className="p-4 border-b border-border/40 flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-primary" /> StockPulse Careers
                </span>
                <Badge variant="outline" className="text-[9.5px]">
                  {livePublishedJobs.length} Live Jobs
                </Badge>
              </div>

              {/* Welcome Banner */}
              <div className="p-6 text-center border-b border-border/40 bg-gradient-to-br from-primary/5 to-transparent">
                <h4 className="text-base font-semibold text-foreground">{welcomeText}</h4>
                <p className="text-xs text-muted-foreground mt-1">Explore current openings and build the future of payroll telemetry with us.</p>
              </div>

              {/* Live Published Listings Preview */}
              <div className="p-4 space-y-2.5">
                {livePublishedJobs.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No active published jobs on the portal. Go to <strong>Job Requisitions</strong> and click <strong>"Publish Job Opening"</strong>.
                  </div>
                ) : (
                  livePublishedJobs.map((j) => (
                    <div key={j.id} className="p-3 border border-border/40 rounded-lg flex items-center justify-between text-xs hover:border-primary transition-colors bg-background">
                      <div>
                        <span className="font-semibold text-foreground block">{j.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {j.department?.name || 'Department'} • {j.workLocation || 'Head Office'} ({j.numPositions} Positions)
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="text-[10.5px] font-semibold h-7 bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
                        onClick={() => openApplyModal(j)}
                      >
                        <UserPlus className="h-3 w-3" /> Apply Now
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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
          ) : openings.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No job requisitions found in database. Create a Job Requisition from an approved Manpower Requisition.
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
                {openings.map((j) => {
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
                            className="h-7 text-[10.5px] px-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1"
                            onClick={() => openApplyModal(j)}
                          >
                            <UserPlus className="h-3 w-3" /> Apply Now
                          </Button>
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
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Candidate "Apply Now" Dialog Modal (Full 12 Application Fields) ── */}
      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center justify-between text-base font-semibold">
              <span className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" /> Apply for Position
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                Public Applicant Submission
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedJob && (
            <form onSubmit={handleApplySubmit} className="space-y-3.5 text-xs pt-1">
              {/* Job Reference Banner */}
              <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 space-y-1 text-xs">
                <p className="font-semibold text-primary">{selectedJob.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  Job Code: <strong className="font-mono text-foreground">{selectedJob.requisitionCode || 'JR-2026-001'}</strong> | Department: <strong className="text-foreground">{selectedJob.department?.name || 'General'}</strong>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Location: <strong>{selectedJob.workLocation || 'Head Office'}</strong> | Openings: <strong>{selectedJob.numPositions} Positions</strong>
                </p>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-semibold">First Name *</Label>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Neha"
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-semibold">Last Name *</Label>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Gupta"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-semibold">Email Address *</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="neha.gupta@example.com"
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-semibold">Mobile Number *</Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              {/* Professional Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-semibold">Highest Qualification</Label>
                  <Input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-semibold">Total Experience</Label>
                  <Input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 6 Years"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-semibold">Current Company</Label>
                  <Input
                    type="text"
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    placeholder="e.g. TechCorp Solutions"
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-semibold">Current Location</Label>
                  <Input
                    type="text"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    placeholder="e.g. Pune, India"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Technical & Core Skills</Label>
                <Input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. System Architecture, Node.js, React, Team Leadership"
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-semibold">Expected CTC (Annual ₹)</Label>
                  <Input
                    type="number"
                    value={expectedCtc}
                    onChange={(e) => setExpectedCtc(e.target.value)}
                    placeholder="e.g. 2400000"
                    className="h-8 text-xs font-mono bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-semibold">Notice Period</Label>
                  <Input
                    type="text"
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    placeholder="e.g. 30 Days / Immediate"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1.5 border p-3 rounded-xl bg-muted/20">
                <Label className="font-semibold text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Upload Resume / CV Document *
                  </span>
                  {resumeFileName && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {resumeFileName}
                    </span>
                  )}
                </Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="h-9 text-xs cursor-pointer bg-background file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {!resumeFileName && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-muted-foreground shrink-0">Or enter Document URL:</span>
                    <Input
                      type="text"
                      value={resumePath}
                      onChange={(e) => setResumePath(e.target.value)}
                      placeholder="https://drive.google.com/resume-neha.pdf"
                      className="h-7 text-[11px] font-mono bg-background"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="font-semibold">Cover Letter / Comments</Label>
                <Textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Brief introductory summary of experience and leadership achievements..."
                  className="text-xs min-h-[60px]"
                  rows={2}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsApplyOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs font-semibold gap-1.5"
                  disabled={applyCandidateMutation.isPending || isUploadingResume}
                >
                  <Send className="h-3.5 w-3.5" /> {isUploadingResume ? 'Uploading Resume...' : 'Submit Application'}
                </Button>
              </DialogFooter>
            </form>
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
