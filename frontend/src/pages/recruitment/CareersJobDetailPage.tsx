import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  Calendar,
  ArrowLeft,
  Upload,
  CheckCircle2,
  Send,
  FileText,
  DollarSign,
  Award,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { jobOpeningsApi } from '@/api/recruitment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CareersJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Application  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [candidateType, setCandidateType] = useState<'FRESHER' | 'EXPERIENCED'>('FRESHER');
  const [qualification, setQualification] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [internshipDetails, setInternshipDetails] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentCtc, setCurrentCtc] = useState('');
  const [expectedCtc, setExpectedCtc] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  // Resume file state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ['public-job-opening', id],
    queryFn: () => jobOpeningsApi.findPublic(id || ''),
    enabled: !!id,
  });

  const uploadResumeMutation = useMutation({
    mutationFn: (file: File) => jobOpeningsApi.uploadResume(file),
    onSuccess: (data) => {
      setResumeUrl(data.documentUrl);
      toast.success('Resume file uploaded successfully!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to upload resume file'),
  });

  const applyMutation = useMutation({
    mutationFn: (payload: any) => jobOpeningsApi.addCandidate(id || '', payload),
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success('Application submitted successfully!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to submit job application'),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      setIsUploading(true);
      try {
        await uploadResumeMutation.mutateAsync(file);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Valid email address is required');
      return;
    }
    if (!phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    if (candidateType === 'FRESHER') {
      if (!qualification.trim()) {
        toast.error('Qualification is required for freshers');
        return;
      }
    } else {
      if (!experience.trim()) {
        toast.error('Total Experience is required for experienced candidates');
        return;
      }
      if (job?.minExperience && job.minExperience > 0) {
        const candidateYears = parseFloat(experience);
        if (isNaN(candidateYears) || candidateYears < job.minExperience) {
          toast.error(`Candidate does not meet the minimum experience requirement of ${job.minExperience} Years.`);
          return;
        }
      }
    }

    applyMutation.mutate({
      firstName,
      lastName,
      email,
      phone,
      resumePath: resumeUrl,
      candidateType,
      qualification: qualification || job?.qualification,
      graduationYear: graduationYear || undefined,
      internshipDetails: candidateType === 'FRESHER' ? internshipDetails : undefined,
      experience: candidateType === 'FRESHER' ? '0 Years / Fresher' : experience,
      currentCompany: candidateType === 'EXPERIENCED' ? currentCompany : undefined,
      currentLocation,
      skills,
      currentCtc: candidateType === 'EXPERIENCED' && currentCtc ? parseFloat(currentCtc) : undefined,
      expectedCtc: candidateType === 'EXPERIENCED' && expectedCtc ? parseFloat(expectedCtc) : undefined,
      noticePeriod: candidateType === 'EXPERIENCED' ? noticePeriod : undefined,
      coverLetter,
      source: 'CAREERS_PORTAL',
      stage: 'APPLIED',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-muted-foreground">Loading Job Opening Details...</p>
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md text-center p-8">
          <h2 className="text-lg font-bold text-destructive mb-2">Job Opening Not Available</h2>
          <p className="text-xs text-muted-foreground mb-6">
            This job requisition may have expired, been filled, or is no longer accepting public applications.
          </p>
          <Link to="/careers">
            <Button size="sm">Return to Careers Portal</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const compName = (job as any).company?.name || 'Corporate Entity';
  const compCode = (job as any).company?.code || '';
  const deptName = job.department?.name || (job as any).departmentName || 'General';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/careers" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            <span className="text-xs font-semibold text-muted-foreground hover:text-foreground">Back to Careers</span>
          </Link>

          <Badge variant="outline" className="gap-1 text-xs py-1 px-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-mono">
            {job.requisitionCode || 'JR-2026'}
          </Badge>
        </div>
      </header>

      {/* Job Details Main Banner */}
      <div className="bg-background border-b border-border py-8 md:py-12">
        <div className="max-w-5xl mx-auto px-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              {deptName}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {job.numPositions} Open Position{job.numPositions === 1 ? '' : 's'}
            </Badge>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            {job.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-primary" />
              {compName} {compCode ? `(${compCode})` : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              {job.workLocation || 'Head Office'}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span className="capitalize">{job.employmentType?.replace('_', ' ').toLowerCase() || 'Full Time'}</span>
            </span>
            {job.experience && (
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-primary" />
                {job.experience}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {/* Left 2 Cols: Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          {job.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Job Summary & Role Description
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {job.description}
              </CardContent>
            </Card>
          )}

          {/* Responsibilities */}
          {job.responsibilities && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Key Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {job.responsibilities}
              </CardContent>
            </Card>
          )}

          {/* Required Skills & Qualifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" /> Requirements & Competencies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs md:text-sm">
              {job.qualification && (
                <div>
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">Educational Qualification</h4>
                  <p className="font-medium">{job.qualification}</p>
                </div>
              )}

              {job.requiredSkills && (
                <div>
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Required Technical & Soft Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.split(',').map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs font-normal">
                        {skill.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Action Card & Overview */}
        <div className="space-y-6">
          <Card className="sticky top-20 border-primary/30 shadow-md">
            <CardHeader className="bg-primary/5 pb-4 border-b border-border/40">
              <CardTitle className="text-lg font-bold">Apply For Position</CardTitle>
              <CardDescription className="text-xs">
                Submit your profile directly to our talent acquisition team.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-5 space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Requisition Code</span>
                  <span className="font-mono font-semibold">{job.requisitionCode || 'JR-2026'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Total Openings</span>
                  <span className="font-semibold">{job.numPositions} Positions</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Work Location</span>
                  <span className="font-semibold">{job.workLocation || 'Head Office'}</span>
                </div>
                {job.applicationDeadline && (
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Application Deadline</span>
                    <span className="font-semibold">{new Date(job.applicationDeadline).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <Button
                size="lg"
                className="w-full text-sm font-bold gap-2 shadow-md"
                onClick={() => setIsApplyOpen(true)}
              >
                <Send className="h-4 w-4" /> Apply Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Application Form Modal */}
      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {isSubmitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <DialogTitle className="text-xl font-bold">Application Submitted!</DialogTitle>
              <DialogDescription className="text-xs max-w-sm mx-auto">
                Thank you for applying for <strong>{job.title}</strong> ({job.requisitionCode}). Your application has been registered and sent directly to our recruitment team.
              </DialogDescription>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => {
                  setIsApplyOpen(false);
                  setIsSubmitted(false);
                  navigate('/careers');
                }}
              >
                Explore Other Careers
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" /> Apply for {job.title}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Requisition ID: <span className="font-mono font-semibold">{job.requisitionCode}</span> | Organization: <span className="font-semibold">{compName}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">First Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Rahul"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Last Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Sharma"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Email Address *</Label>
                  <Input
                    type="email"
                    required
                    placeholder="rahul.sharma@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Phone Number *</Label>
                  <Input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Candidate Type Eligibility Selector */}
              <div className="space-y-1.5 bg-muted/40 p-3 rounded-xl border border-border">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Applying As *</span>
                  <Badge variant="outline" className="text-[10px] bg-background">
                    {job?.candidateType === 'FRESHER'
                      ? 'Fresher Only Job'
                      : job?.candidateType === 'EXPERIENCED'
                      ? `Experienced Only Job (${job.minExperience ?? 0}+ Yrs)`
                      : 'Freshers & Experienced Eligible'}
                  </Badge>
                </Label>
                {job?.candidateType === 'BOTH' ? (
                  <Select value={candidateType} onValueChange={(v: any) => setCandidateType(v)}>
                    <SelectTrigger className="h-9 text-xs bg-background">
                      <SelectValue placeholder="Select Candidate Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FRESHER" className="text-xs font-medium">Fresher (0 Years)</SelectItem>
                      <SelectItem value="EXPERIENCED" className="text-xs font-medium">Experienced Professional</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-9 px-3 flex items-center bg-background rounded-md border border-input text-xs font-semibold text-primary">
                    {candidateType === 'FRESHER' ? 'Fresher (0 Years / Entry Level)' : `Experienced Professional (${job?.minExperience ?? 0}+ Years Required)`}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Current Location</Label>
                  <Input
                    placeholder="e.g. Mumbai / Pune"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Qualification *</Label>
                  <Input
                    placeholder="e.g. B.Tech / MCA / Graduate"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {candidateType === 'FRESHER' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Graduation / Passing Year</Label>
                      <Input
                        placeholder="e.g. 2024 / 2025"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Required / Key Skills *</Label>
                      <Input
                        placeholder="e.g. Java, React, SQL"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Internship Experience / Academic Projects</Label>
                    <Input
                      placeholder="e.g. 6 Months Full Stack Intern at ABC Corp / Final Year E-Commerce Project"
                      value={internshipDetails}
                      onChange={(e) => setInternshipDetails(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Total Experience (Years) *</Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="e.g. 3.5"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Current Company</Label>
                      <Input
                        placeholder="e.g. Tech Solutions Inc."
                        value={currentCompany}
                        onChange={(e) => setCurrentCompany(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Current CTC (₹)</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 600000"
                        value={currentCtc}
                        onChange={(e) => setCurrentCtc(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Expected CTC (₹)</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 900000"
                        value={expectedCtc}
                        onChange={(e) => setExpectedCtc(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Notice Period</Label>
                      <Input
                        placeholder="e.g. 30 Days"
                        value={noticePeriod}
                        onChange={(e) => setNoticePeriod(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Resume File Upload */}
              <div className="space-y-1.5 bg-muted/40 p-3 rounded-lg border border-border/50">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5 text-primary" /> Resume / CV Document (PDF/DOCX) *
                </Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="h-9 text-xs bg-background"
                />
                {isUploading && (
                  <p className="text-[10px] text-primary animate-pulse">Uploading resume file...</p>
                )}
                {resumeUrl && (
                  <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Resume attached successfully
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Cover Letter / Additional Info</Label>
                <Textarea
                  placeholder="Share a brief introduction or key highlights..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="h-20 text-xs"
                />
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsApplyOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={applyMutation.isPending || isUploading}
                  className="gap-1.5 font-bold"
                >
                  {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
