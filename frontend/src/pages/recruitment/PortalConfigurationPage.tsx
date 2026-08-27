import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Settings,
  Globe,
  Palette,
  LayoutGrid,
  FileCheck,
  Mail,
  Share2,
  Copy,
  ExternalLink,
  Save,
  RotateCcw,
  CheckCircle2,
  Image,
  Upload,
  Sparkles,
  ShieldCheck,
  Sliders,
  Eye,
  ChevronLeft,
  ChevronRight,
  ListFilter,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CandidateApplicationWizard } from '@/components/recruitment/CandidateApplicationWizard';
import type { JobOpening } from '@/api/types';
import { jobOpeningsApi } from '@/api/recruitment';

export function PortalConfigurationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Branding & General State
  const defaultPortalUrl =
    import.meta.env.VITE_CAREERS_PORTAL_URL ||
    (typeof window !== 'undefined' ? `${window.location.origin}/careers` : '/careers');
  const [portalUrl, setPortalUrl] = useState(defaultPortalUrl);
  const [companyName, setCompanyName] = useState('StockPulse Inc.');
  const [welcomeHeadline, setWelcomeHeadline] = useState('Join StockPulse — Build the Future of Enterprise HCM');
  const [welcomeSubtitle, setWelcomeSubtitle] = useState(
    'Explore current openings and build the future of payroll telemetry, AI analytics, and workforce automation with us.'
  );
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [applyButtonText, setApplyButtonText] = useState('Apply Now');

  // Job Listing & Pagination State
  const [paginationEnabled, setPaginationEnabled] = useState(true);
  const [jobsPerPage, setJobsPerPage] = useState('10');
  const [paginationStyle, setPaginationStyle] = useState<'numbered' | 'prev_next' | 'load_more'>('numbered');
  const [showTotalJobCount, setShowTotalJobCount] = useState(true);
  const [showPageInformation, setShowPageInformation] = useState(true);
  const [defaultSortOrder, setDefaultSortOrder] = useState('newest');
  const [rememberPageSize, setRememberPageSize] = useState(true);

  // Search & Filter Controls
  const [showDepartmentFilter, setShowDepartmentFilter] = useState(true);
  const [showLocationFilter, setShowLocationFilter] = useState(true);
  const [showTypeFilter, setShowTypeFilter] = useState(true);
  const [salaryPolicy, setSalaryPolicy] = useState('range');

  // Application Form Requirements
  const [reqPhone, setReqPhone] = useState(true);
  const [reqQualification, setReqQualification] = useState(true);
  const [reqExperience, setReqExperience] = useState(true);
  const [reqCtc, setReqCtc] = useState(false);
  const [reqNotice, setReqNotice] = useState(true);
  const [reqCoverLetter, setReqCoverLetter] = useState(false);
  const [maxFileSize, setMaxFileSize] = useState('10');
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('https://stockpulse.io/privacy');

  // Email & Notifications
  const [sendAutoAck, setSendAutoAck] = useState(true);
  const [ackSubject, setAckSubject] = useState('Thank you for applying to StockPulse');
  const [hrRecipients, setHrRecipients] = useState('hr-recruitment@stockpulse.com, hiring@stockpulse.com');

  // SEO & Social
  const [metaTitle, setMetaTitle] = useState('StockPulse Careers | Build Enterprise HCM');
  const [metaDesc, setMetaDesc] = useState('Join StockPulse and transform enterprise human capital management software.');

  // Candidate Application Modal State for Live Preview
  const [selectedPreviewJob, setSelectedPreviewJob] = useState<JobOpening | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  // Live Micro Preview Active Page State
  const [previewCurrentPage, setPreviewCurrentPage] = useState<number>(1);

  // Load database configuration
  const { data: dbConfig } = useQuery({
    queryKey: ['portal-config'],
    queryFn: () => jobOpeningsApi.getPortalConfig(),
  });

  useEffect(() => {
    if (dbConfig) {
      if (dbConfig.portalUrl) setPortalUrl(dbConfig.portalUrl);
      if (dbConfig.companyName) setCompanyName(dbConfig.companyName);
      if (dbConfig.welcomeHeadline) setWelcomeHeadline(dbConfig.welcomeHeadline);
      if (dbConfig.welcomeSubtitle) setWelcomeSubtitle(dbConfig.welcomeSubtitle);
      if (dbConfig.primaryColor) setPrimaryColor(dbConfig.primaryColor);
      if (dbConfig.applyButtonText) setApplyButtonText(dbConfig.applyButtonText);

      if (dbConfig.pagination_enabled !== undefined) setPaginationEnabled(!!dbConfig.pagination_enabled);
      if (dbConfig.jobs_per_page !== undefined) setJobsPerPage(String(dbConfig.jobs_per_page));
      if (dbConfig.pagination_style) setPaginationStyle(dbConfig.pagination_style);
      if (dbConfig.show_total_job_count !== undefined) setShowTotalJobCount(!!dbConfig.show_total_job_count);
      if (dbConfig.show_page_information !== undefined) setShowPageInformation(!!dbConfig.show_page_information);
      if (dbConfig.default_sort_order) setDefaultSortOrder(dbConfig.default_sort_order);
      if (dbConfig.remember_page_size !== undefined) setRememberPageSize(!!dbConfig.remember_page_size);

      if (dbConfig.showDepartmentFilter !== undefined) setShowDepartmentFilter(!!dbConfig.showDepartmentFilter);
      if (dbConfig.showLocationFilter !== undefined) setShowLocationFilter(!!dbConfig.showLocationFilter);
      if (dbConfig.showTypeFilter !== undefined) setShowTypeFilter(!!dbConfig.showTypeFilter);
      if (dbConfig.salaryPolicy) setSalaryPolicy(dbConfig.salaryPolicy);

      if (dbConfig.reqPhone !== undefined) setReqPhone(!!dbConfig.reqPhone);
      if (dbConfig.reqQualification !== undefined) setReqQualification(!!dbConfig.reqQualification);
      if (dbConfig.reqExperience !== undefined) setReqExperience(!!dbConfig.reqExperience);
      if (dbConfig.reqCtc !== undefined) setReqCtc(!!dbConfig.reqCtc);
      if (dbConfig.reqNotice !== undefined) setReqNotice(!!dbConfig.reqNotice);
      if (dbConfig.reqCoverLetter !== undefined) setReqCoverLetter(!!dbConfig.reqCoverLetter);
      if (dbConfig.maxFileSize) setMaxFileSize(String(dbConfig.maxFileSize));
      if (dbConfig.privacyPolicyUrl) setPrivacyPolicyUrl(dbConfig.privacyPolicyUrl);

      if (dbConfig.sendAutoAck !== undefined) setSendAutoAck(!!dbConfig.sendAutoAck);
      if (dbConfig.ackSubject) setAckSubject(dbConfig.ackSubject);
      if (dbConfig.hrRecipients) setHrRecipients(dbConfig.hrRecipients);

      if (dbConfig.metaTitle) setMetaTitle(dbConfig.metaTitle);
      if (dbConfig.metaDesc) setMetaDesc(dbConfig.metaDesc);
    }
  }, [dbConfig]);

  // Fetch job openings count
  const { data: openings = [] } = useQuery({
    queryKey: ['job-openings'],
    queryFn: () => jobOpeningsApi.list(),
  });
  const liveCount = openings.filter((o) => o.status === 'PUBLISHED' || o.isActive).length;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    toast.success('Public portal URL copied to clipboard!');
  };

  const updateConfigMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => jobOpeningsApi.updatePortalConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-config'] });
      queryClient.invalidateQueries({ queryKey: ['public-job-openings-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['public-job-openings'] });
      toast.success('Careers Portal configuration saved & synchronized live to database!');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save configuration'),
  });

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateConfigMutation.mutate({
      portalUrl,
      companyName,
      welcomeHeadline,
      welcomeSubtitle,
      primaryColor,
      applyButtonText,

      pagination_enabled: paginationEnabled,
      jobs_per_page: Number(jobsPerPage),
      pagination_style: paginationStyle,
      show_total_job_count: showTotalJobCount,
      show_page_information: showPageInformation,
      default_sort_order: defaultSortOrder,
      remember_page_size: rememberPageSize,

      showDepartmentFilter,
      showLocationFilter,
      showTypeFilter,
      salaryPolicy,

      reqPhone,
      reqQualification,
      reqExperience,
      reqCtc,
      reqNotice,
      reqCoverLetter,
      maxFileSize,
      privacyPolicyUrl,

      sendAutoAck,
      ackSubject,
      hrRecipients,

      metaTitle,
      metaDesc,
    });
  };

  const handleReset = () => {
    setWelcomeHeadline('Join StockPulse — Build the Future of Enterprise HCM');
    setWelcomeSubtitle(
      'Explore current openings and build the future of payroll telemetry, AI analytics, and workforce automation with us.'
    );
    setPrimaryColor('#2563EB');
    setApplyButtonText('Apply Now');
    setPaginationEnabled(true);
    setJobsPerPage('10');
    setPaginationStyle('numbered');
    setShowTotalJobCount(true);
    setShowPageInformation(true);
    setDefaultSortOrder('newest');
    setRememberPageSize(true);
    toast.info('Settings reset to default values.');
  };

  const presetColors = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0284C7', '#4F46E5', '#0D9488'];

  const MOCK_PREVIEW_JOBS = [
    { id: 'm1', title: 'Senior Software Engineer', dept: 'Information Technology', loc: 'Pune Head Office' },
    { id: 'm2', title: 'Junior Software Engineer', dept: 'Information Technology', loc: 'Pune Head Office (pune)' },
    { id: 'm3', title: 'devops eng', dept: 'Customer Support', loc: 'Pune Head Office (pune)' },
    { id: 'm4', title: 'Software Engineer', dept: 'Information Technology', loc: 'Mumbai Branch, Pune Head Office' },
    { id: 'm5', title: 'custmore executive', dept: 'Customer Support', loc: 'Pune Head Office (pune)' },
    { id: 'm6', title: 'Junior Software Engineer', dept: 'Information Technology', loc: 'pune ,mumbai' },
    { id: 'm7', title: 'IT Manager', dept: 'Information Technology', loc: 'remote' },
    { id: 'm8', title: 'Lead Product Manager', dept: 'Product Management', loc: 'Remote / Pune' },
    { id: 'm9', title: 'HR Operations Specialist', dept: 'Human Resources', loc: 'Mumbai Office' },
    { id: 'm10', title: 'Full Stack Web Developer', dept: 'Software Engineering', loc: 'Bangalore Tech Hub' },
    { id: 'm11', title: 'QA Automation Lead', dept: 'Quality Assurance', loc: 'Pune Head Office' },
    { id: 'm12', title: 'Cloud Solutions Architect', dept: 'Infrastructure', loc: 'Pune Head Office' },
    { id: 'm13', title: 'UI/UX Product Designer', dept: 'Design Studio', loc: 'Remote' },
    { id: 'm14', title: 'Talent Acquisition Partner', dept: 'Human Resources', loc: 'Delhi NCR' },
    { id: 'm15', title: 'Financial Systems Analyst', dept: 'Finance & Accounts', loc: 'Pune Head Office' },
    { id: 'm16', title: 'Data Telemetry Specialist', dept: 'Data Analytics', loc: 'Pune Head Office' },
    { id: 'm17', title: 'Enterprise Security Lead', dept: 'Cyber Security', loc: 'Remote' },
    { id: 'm18', title: 'Technical Writer & Doc Specialist', dept: 'Product Communications', loc: 'Pune Head Office' },
  ];

  const handleOpenApplyModal = (jobToApply?: JobOpening) => {
    const targetJobId = jobToApply?.id || (openings.length > 0 ? openings[0].id : null);
    if (targetJobId && targetJobId !== 'preview-job-1') {
      window.open(`/careers/job/${targetJobId}`, '_blank');
    } else {
      window.open('/careers', '_blank');
    }
  };

  // Calculations for dynamic preview
  const previewPageSize = Number(jobsPerPage) || 10;
  const previewTotalJobs = liveCount || (openings.length > 0 ? openings.length : MOCK_PREVIEW_JOBS.length);
  const previewTotalPages = paginationEnabled ? Math.max(1, Math.ceil(previewTotalJobs / previewPageSize)) : 1;
  const clampedPreviewPage = Math.min(Math.max(1, previewCurrentPage), previewTotalPages);
  const previewRangeStart = previewTotalJobs === 0 ? 0 : (clampedPreviewPage - 1) * previewPageSize + 1;
  const previewRangeEnd = Math.min(clampedPreviewPage * previewPageSize, previewTotalJobs);

  const previewStartIndex = (clampedPreviewPage - 1) * previewPageSize;

  return (
    <div className="space-y-6">
      {/* ── Page Header with Navigation Back to Job Portal ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5 -ml-2 mb-1"
            onClick={() => navigate('/recruitment/portal')}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Job Portal
          </Button>
          <PageHeader
            icon={Settings}
            title="Careers Portal Configuration"
            description="Customize branding, domain settings, pagination rules, application form controls & SEO options for your public job portal."
            badge="Live Portal Manager"
            badgeVariant="info"
          />
        </div>
        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => window.open(portalUrl, '_blank')}
          >
            <ExternalLink className="h-3.5 w-3.5 text-primary" /> Live Site
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" /> Reset Defaults
          </Button>
          <Button
            size="sm"
            className="h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 shadow-xs"
            onClick={() => handleSave()}
            disabled={updateConfigMutation.isPending}
          >
            <Save className="h-3.5 w-3.5" /> Save Configurations
          </Button>
        </div>
      </div>

      {/* ── Status & Domain Telemetry Banner ── */}
      <Card className="shadow-xs border-border/80 bg-gradient-to-r from-primary/5 via-background to-emerald-500/5">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">Public Careers Domain</span>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Live & Synchronized
                </Badge>
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{portalUrl}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Badge variant="outline" className="text-xs py-1 px-3 bg-background">
              <span className="font-semibold text-primary mr-1">{liveCount}</span> Active Database Openings
            </Badge>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1 font-mono" onClick={handleCopyLink}>
              <Copy className="h-3.5 w-3.5" /> Copy Domain
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Main Layout: Tabs (50%) + Live Micro Preview (50%) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Configuration Forms Tabs (50%) */}
        <div className="space-y-6">
          <Tabs defaultValue="branding" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto p-1 bg-muted/60 rounded-xl gap-1">
              <TabsTrigger value="branding" className="text-xs py-2 gap-1.5 font-medium">
                <Palette className="h-3.5 w-3.5" /> Branding
              </TabsTrigger>
              <TabsTrigger value="listings" className="text-xs py-2 gap-1.5 font-medium">
                <LayoutGrid className="h-3.5 w-3.5" /> Job Board
              </TabsTrigger>
              <TabsTrigger value="application" className="text-xs py-2 gap-1.5 font-medium">
                <FileCheck className="h-3.5 w-3.5" /> Application Form
              </TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs py-2 gap-1.5 font-medium">
                <Mail className="h-3.5 w-3.5" /> Notifications
              </TabsTrigger>
              <TabsTrigger value="seo" className="text-xs py-2 gap-1.5 font-medium">
                <Share2 className="h-3.5 w-3.5" /> SEO & Meta
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: BRANDING & APPEARANCE */}
            <TabsContent value="branding" className="mt-4 space-y-4">
              <Card className="shadow-xs border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" /> Visual Branding & Header Customizer
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Set company logos, custom headlines, primary accent colors & portal URLs for candidate experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Company Display Name</Label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Public Careers Portal URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={portalUrl}
                          onChange={(e) => setPortalUrl(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={handleCopyLink}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Welcome Banner Headline</Label>
                    <Input
                      value={welcomeHeadline}
                      onChange={(e) => setWelcomeHeadline(e.target.value)}
                      className="h-9 text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Banner Description Subtitle</Label>
                    <Textarea
                      value={welcomeSubtitle}
                      onChange={(e) => setWelcomeSubtitle(e.target.value)}
                      rows={2}
                      className="text-xs resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Primary Brand Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-9 w-12 p-0 border-none cursor-pointer rounded-lg overflow-hidden shrink-0"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-9 text-xs font-mono uppercase"
                        />
                      </div>
                      {/* Presets */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-muted-foreground mr-1">Presets:</span>
                        {presetColors.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            className="h-5 w-5 rounded-full border border-border/80 transition-transform hover:scale-110 focus:outline-none"
                            style={{ backgroundColor: hex }}
                            onClick={() => setPrimaryColor(hex)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Apply Button Text</Label>
                      <Input
                        value={applyButtonText}
                        onChange={(e) => setApplyButtonText(e.target.value)}
                        className="h-9 text-xs font-medium"
                      />
                      <span className="text-[10.5px] text-muted-foreground block">
                        Displayed on candidate job listing action buttons
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Company Header Logo</Label>
                      <div className="border border-dashed border-border rounded-xl p-3 text-center bg-muted/20 flex flex-col items-center justify-center gap-1">
                        <Image className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[11px] font-medium text-foreground">Upload Header Logo</span>
                        <span className="text-[9.5px] text-muted-foreground">PNG, SVG or JPG (Max 2MB)</span>
                        <Button variant="outline" size="sm" className="h-7 text-[10.5px] mt-1 gap-1">
                          <Upload className="h-3 w-3" /> Browse File
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Careers Portal Favicon</Label>
                      <div className="border border-dashed border-border rounded-xl p-3 text-center bg-muted/20 flex flex-col items-center justify-center gap-1">
                        <Sparkles className="h-5 w-5 text-muted-foreground" />
                        <span className="text-[11px] font-medium text-foreground">Upload Site Favicon</span>
                        <span className="text-[9.5px] text-muted-foreground">ICO, PNG (32x32 or 64x64)</span>
                        <Button variant="outline" size="sm" className="h-7 text-[10.5px] mt-1 gap-1">
                          <Upload className="h-3 w-3" /> Browse File
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: JOB BOARD & PAGINATION SETTINGS */}
            <TabsContent value="listings" className="mt-4 space-y-5">
              {/* 1. Job Listing Controls */}
              <Card className="shadow-xs border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-primary" /> Public Job Listing Controls & Search Filters
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure search filter visibility, sorting mechanisms, and salary disclosure policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Default Job Sort Order</Label>
                      <Select value={defaultSortOrder} onValueChange={setDefaultSortOrder}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select sorting" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest Jobs (Published Date)</SelectItem>
                          <SelectItem value="title">Job Title A–Z</SelectItem>
                          <SelectItem value="department">Grouped by Department</SelectItem>
                          <SelectItem value="location">Work Location</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-[10.5px] text-muted-foreground block">
                        Default ordering of job cards when candidates first visit the careers portal
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Salary Range Display Policy</Label>
                      <Select value={salaryPolicy} onValueChange={setSalaryPolicy}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select policy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="range">Display Salary Range (e.g. ₹12L - ₹18L p.a.)</SelectItem>
                          <SelectItem value="hide">Hide Salary (Competitive / Undisclosed)</SelectItem>
                          <SelectItem value="exact">Display Fixed Base Compensation</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-[10.5px] text-muted-foreground block">
                        Control whether compensation figures are publicly visible on job cards
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t">
                    <Label className="text-xs font-semibold">Candidate Search & Filter Controls</Label>
                    <div className="space-y-2.5 bg-muted/30 p-3.5 rounded-xl border border-border/60">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-foreground block">Department Filter Dropdown</span>
                          <span className="text-[10.5px] text-muted-foreground">Allow candidates to filter job listings by department</span>
                        </div>
                        <Checkbox
                          checked={showDepartmentFilter}
                          onCheckedChange={(c) => setShowDepartmentFilter(!!c)}
                        />
                      </div>

                      <div className="flex items-center justify-between border-t pt-2">
                        <div>
                          <span className="text-xs font-semibold text-foreground block">Work Location Filter</span>
                          <span className="text-[10.5px] text-muted-foreground">Allow filtering by Head Office, Regional Branches, or Remote</span>
                        </div>
                        <Checkbox
                          checked={showLocationFilter}
                          onCheckedChange={(c) => setShowLocationFilter(!!c)}
                        />
                      </div>

                      <div className="flex items-center justify-between border-t pt-2">
                        <div>
                          <span className="text-xs font-semibold text-foreground block">Employment Type Filter</span>
                          <span className="text-[10.5px] text-muted-foreground">Filter by Full-Time, Part-Time, Contract, Internship</span>
                        </div>
                        <Checkbox
                          checked={showTypeFilter}
                          onCheckedChange={(c) => setShowTypeFilter(!!c)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2. DEDICATED PAGINATION & JOB LISTING SECTION */}
              <Card className="shadow-xs border-border/80 border-primary/20">
                <CardHeader className="pb-3 border-b border-border/60 bg-primary/5">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-primary">
                    <ListFilter className="h-4 w-4" /> Pagination & Job Listing Engine
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure page size limits, navigation styles, total count indicators & persistence behavior for public job searches
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-border/80">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Enable Pagination</span>
                      <span className="text-[10.5px] text-muted-foreground">
                        Split public job listings across multiple pages when total published positions exceed page size limit
                      </span>
                    </div>
                    <Checkbox
                      checked={paginationEnabled}
                      onCheckedChange={(c) => setPaginationEnabled(!!c)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Jobs Per Page</Label>
                      <Select value={jobsPerPage} onValueChange={setJobsPerPage} disabled={!paginationEnabled}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select page size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Jobs Per Page</SelectItem>
                          <SelectItem value="10">10 Jobs Per Page (Recommended)</SelectItem>
                          <SelectItem value="15">15 Jobs Per Page</SelectItem>
                          <SelectItem value="20">20 Jobs Per Page</SelectItem>
                          <SelectItem value="25">25 Jobs Per Page</SelectItem>
                          <SelectItem value="50">50 Jobs Per Page</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-[10.5px] text-muted-foreground block">
                        Maximum number of active job cards rendered per page on the public careers portal
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Pagination Navigation Style</Label>
                      <Select
                        value={paginationStyle}
                        onValueChange={(v: any) => setPaginationStyle(v)}
                        disabled={!paginationEnabled}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="numbered">Numbered Pages (e.g. ← Previous 1 2 Next →)</SelectItem>
                          <SelectItem value="prev_next">Previous / Next Buttons</SelectItem>
                          <SelectItem value="load_more">Load More Button (Incremental Scroll)</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-[10.5px] text-muted-foreground block">
                        Visual control layout candidates use to navigate across job listing pages
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t">
                    <Label className="text-xs font-semibold">Page Information & Metadata Indicators</Label>
                    <div className="space-y-2.5 bg-muted/30 p-3.5 rounded-xl border border-border/60">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-foreground block">Show Total Job Count Badge</span>
                          <span className="text-[10.5px] text-muted-foreground">
                            Display verified openings counter header (e.g. 18 Active Openings)
                          </span>
                        </div>
                        <Checkbox
                          checked={showTotalJobCount}
                          onCheckedChange={(c) => setShowTotalJobCount(!!c)}
                        />
                      </div>

                      <div className="flex items-center justify-between border-t pt-2">
                        <div>
                          <span className="text-xs font-semibold text-foreground block">Show Page Information Subtitle</span>
                          <span className="text-[10.5px] text-muted-foreground">
                            Display position range indicator text (e.g. Showing 1–10 of 18 jobs)
                          </span>
                        </div>
                        <Checkbox
                          checked={showPageInformation}
                          onCheckedChange={(c) => setShowPageInformation(!!c)}
                        />
                      </div>

                      <div className="flex items-center justify-between border-t pt-2">
                        <div>
                          <span className="text-xs font-semibold text-foreground block">Remember Selected Page Size</span>
                          <span className="text-[10.5px] text-muted-foreground">
                            Persist candidate page size preference in local session memory
                          </span>
                        </div>
                        <Checkbox
                          checked={rememberPageSize}
                          onCheckedChange={(c) => setRememberPageSize(!!c)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: APPLICATION FORM REQUIREMENTS */}
            <TabsContent value="application" className="mt-4 space-y-4">
              <Card className="shadow-xs border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-primary" /> Application Form & Compliance Rules
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Define mandatory fields, accepted resume formats, file size limits, and privacy policy agreements
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold">Mandatory Candidate Application Fields</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/30 p-3.5 rounded-xl border border-border/60">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={reqPhone} onCheckedChange={(c) => setReqPhone(!!c)} id="f-phone" />
                        <Label htmlFor="f-phone" className="text-xs cursor-pointer font-medium">Mobile Phone Number</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={reqQualification} onCheckedChange={(c) => setReqQualification(!!c)} id="f-qual" />
                        <Label htmlFor="f-qual" className="text-xs cursor-pointer font-medium">Highest Qualification Degree</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={reqExperience} onCheckedChange={(c) => setReqExperience(!!c)} id="f-exp" />
                        <Label htmlFor="f-exp" className="text-xs cursor-pointer font-medium">Total Work Experience</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={reqCtc} onCheckedChange={(c) => setReqCtc(!!c)} id="f-ctc" />
                        <Label htmlFor="f-ctc" className="text-xs cursor-pointer font-medium">Current & Expected CTC</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={reqNotice} onCheckedChange={(c) => setReqNotice(!!c)} id="f-notice" />
                        <Label htmlFor="f-notice" className="text-xs cursor-pointer font-medium">Notice Period (Days)</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={reqCoverLetter} onCheckedChange={(c) => setReqCoverLetter(!!c)} id="f-cover" />
                        <Label htmlFor="f-cover" className="text-xs cursor-pointer font-medium">Cover Letter / Note</Label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Max Resume Attachment Size</Label>
                      <Select value={maxFileSize} onValueChange={setMaxFileSize}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 MB (Recommended)</SelectItem>
                          <SelectItem value="10">10 MB</SelectItem>
                          <SelectItem value="20">20 MB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Privacy Policy Link URL</Label>
                      <Input
                        value={privacyPolicyUrl}
                        onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: EMAIL & NOTIFICATIONS */}
            <TabsContent value="notifications" className="mt-4 space-y-4">
              <Card className="shadow-xs border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" /> Application Email Telemetry & Webhooks
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure automated candidate response emails and internal hiring team alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Auto-Send Application Acknowledgment</span>
                      <span className="text-[10.5px] text-muted-foreground">Instantly email candidates a confirmation upon application receipt</span>
                    </div>
                    <Checkbox checked={sendAutoAck} onCheckedChange={(c) => setSendAutoAck(!!c)} />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Acknowledgment Email Subject Line</Label>
                    <Input
                      value={ackSubject}
                      onChange={(e) => setAckSubject(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Internal HR Alert Recipients (Comma-separated)</Label>
                    <Input
                      value={hrRecipients}
                      onChange={(e) => setHrRecipients(e.target.value)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: SEO & META */}
            <TabsContent value="seo" className="mt-4 space-y-4">
              <Card className="shadow-xs border-border/80">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-primary" /> Search Engine Optimization & Social Metadata
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Optimize careers portal ranking on Google Search, LinkedIn, and social media preview links
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Meta Page Title</Label>
                    <Input
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Meta Search Description</Label>
                    <Textarea
                      value={metaDesc}
                      onChange={(e) => setMetaDesc(e.target.value)}
                      rows={2}
                      className="text-xs resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/recruitment/portal')}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={() => handleSave()}
              disabled={updateConfigMutation.isPending}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save Configurations
            </Button>
          </div>
        </div>

        {/* Right Column: Real-Time Interactive Micro Branding & Pagination Preview (50%) */}
        <div className="space-y-4">
          <Card className="shadow-xs border-border/80 sticky top-6">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" /> Live Portal & Pagination Preview
                </span>
                <Badge variant="outline" className="text-[9.5px]">Real-Time</Badge>
              </CardTitle>
              <CardDescription className="text-[11px]">
                Instant visual rendering of how candidates will experience your portal header, job list & pagination
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 bg-muted/30">
              <div className="rounded-xl border border-border/70 bg-background overflow-hidden shadow-xs">
                {/* Mock Header */}
                <div className="p-3 border-b border-border/40 flex items-center justify-between bg-background">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {companyName.substring(0, 1)}
                    </div>
                    <span className="font-bold text-xs text-foreground">{companyName}</span>
                  </div>
                  {showTotalJobCount && (
                    <Badge variant="outline" className="text-[9px] font-mono">
                      {previewTotalJobs} Openings
                    </Badge>
                  )}
                </div>

                {/* Mock Banner */}
                <div
                  className="p-4 text-center transition-colors border-b border-border/40"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}15 0%, transparent 100%)`,
                  }}
                >
                  <h4 className="text-xs font-bold text-foreground leading-snug">{welcomeHeadline}</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{welcomeSubtitle}</p>

                  <div className="mt-2.5">
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-md text-[9.5px] font-semibold text-white shadow-xs transition-opacity hover:opacity-90 inline-flex items-center gap-1 cursor-pointer"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => handleOpenApplyModal()}
                    >
                      {applyButtonText}
                    </button>
                  </div>
                </div>

                {/* Mock Job List Items (Sliced by previewCurrentPage) */}
                <div className="p-3 space-y-2 bg-background max-h-[420px] overflow-y-auto">
                  {(openings.length > 0 ? openings : MOCK_PREVIEW_JOBS)
                    .slice(previewStartIndex, previewStartIndex + previewPageSize)
                    .map((j: any) => (
                      <div key={j.id} className="p-2 border border-border/60 rounded-lg flex items-center justify-between text-[10.5px]">
                        <div>
                          <span className="font-bold text-foreground block">{j.title}</span>
                          <span className="text-[9.5px] text-muted-foreground">
                            {j.department?.name || j.dept || 'Department'} • {j.workLocation || j.loc || 'Head Office'}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="px-2 py-0.5 rounded text-[9px] font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                          style={{ backgroundColor: primaryColor }}
                          onClick={() => handleOpenApplyModal(j)}
                        >
                          {applyButtonText}
                        </button>
                      </div>
                    ))}
                </div>

                {/* Mock Page Information & Pagination Controls Preview (Fully Interactive) */}
                <div className="p-3 bg-muted/20 border-t border-border/40 text-[10px] space-y-2">
                  {showPageInformation && (
                    <div className="text-[9.5px] text-muted-foreground text-center font-medium">
                      Showing {previewRangeStart}–{previewRangeEnd} of {previewTotalJobs} jobs
                    </div>
                  )}

                  {paginationEnabled && (
                    <div className="flex items-center justify-center gap-1 pt-0.5">
                      {paginationStyle === 'numbered' && (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6 text-[9px] disabled:opacity-40 cursor-pointer"
                            onClick={() => setPreviewCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={clampedPreviewPage <= 1}
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>

                          {Array.from({ length: previewTotalPages }, (_, i) => i + 1).map((pageNum) => {
                            const isActive = pageNum === clampedPreviewPage;
                            return (
                              <button
                                key={pageNum}
                                type="button"
                                className={`h-6 w-6 rounded text-[9.5px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                                  isActive
                                    ? 'text-white shadow-xs font-bold'
                                    : 'border border-border/80 text-muted-foreground bg-background hover:bg-muted/50'
                                }`}
                                style={isActive ? { backgroundColor: primaryColor } : undefined}
                                onClick={() => setPreviewCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6 text-[9px] disabled:opacity-40 cursor-pointer"
                            onClick={() => setPreviewCurrentPage((p) => Math.min(previewTotalPages, p + 1))}
                            disabled={clampedPreviewPage >= previewTotalPages}
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </>
                      )}

                      {paginationStyle === 'prev_next' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[9.5px] px-2 cursor-pointer"
                            onClick={() => setPreviewCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={clampedPreviewPage <= 1}
                          >
                            ← Previous
                          </Button>
                          <span className="text-[9.5px] font-mono text-muted-foreground px-1">
                            Page {clampedPreviewPage} of {previewTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[9.5px] px-2 cursor-pointer"
                            onClick={() => setPreviewCurrentPage((p) => Math.min(previewTotalPages, p + 1))}
                            disabled={clampedPreviewPage >= previewTotalPages}
                          >
                            Next →
                          </Button>
                        </div>
                      )}

                      {paginationStyle === 'load_more' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[9.5px] px-3 font-semibold text-primary border-primary/30 cursor-pointer"
                          onClick={() => setPreviewCurrentPage((p) => Math.min(previewTotalPages, p + 1))}
                          disabled={clampedPreviewPage >= previewTotalPages}
                        >
                          Load More Jobs ({Math.max(0, previewTotalJobs - previewRangeEnd)} Remaining)
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs space-y-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Database Synchronized Engine
                </span>
                <p className="text-[10.5px] text-muted-foreground leading-normal">
                  Pagination and display configuration changes are persisted directly to the database and take immediate effect on public StockPulse Careers.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
