import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  Building2,
  Calendar,
  Sparkles,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowDown,
} from 'lucide-react';
import { formatSalaryRangeInLakhs } from '@/lib/utils';
import { jobOpeningsApi } from '@/api/recruitment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CandidateApplicationWizard } from '@/components/recruitment/CandidateApplicationWizard';
import type { JobOpening } from '@/api/types';

export default function CareersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Candidate Application Modal State
  const [selectedApplyJob, setSelectedApplyJob] = useState<JobOpening | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  // Reset page to 1 on any search or filter change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleDeptChange = (val: string) => {
    setSelectedDept(val);
    setCurrentPage(1);
  };

  const handleTypeChange = (val: string) => {
    setSelectedType(val);
    setCurrentPage(1);
  };

  // Fetch all public jobs for department filter options & total counts
  const { data: allPublicJobs = [] } = useQuery({
    queryKey: ['public-job-openings'],
    queryFn: () => jobOpeningsApi.listPublic(),
  });

  // Fetch paginated jobs dynamically from database API
  const { data: paginatedData, isLoading } = useQuery({
    queryKey: ['public-job-openings-paginated', currentPage, searchQuery, selectedDept, selectedType],
    queryFn: () =>
      jobOpeningsApi.listPublicPaginated({
        page: currentPage,
        search: searchQuery,
        department: selectedDept,
        type: selectedType,
      }),
  });

  const config = paginatedData?.config || {};
  const jobs = paginatedData?.jobs || [];
  const totalCount = paginatedData?.totalCount ?? 0;
  const totalPages = paginatedData?.totalPages ?? 1;
  const pageSize = paginatedData?.pageSize ?? (config.jobs_per_page || 10);

  const paginationEnabled = config.pagination_enabled !== false;
  const paginationStyle = config.pagination_style || 'numbered';
  const showTotalCount = config.show_total_job_count !== false;
  const showPageInfo = config.show_page_information !== false;
  const primaryColor = config.primaryColor || '#2563EB';

  const departmentList = useMemo(() => {
    const set = new Set<string>();
    allPublicJobs.forEach((j) => {
      const dName = j.department?.name || (j as any).departmentName;
      if (dName) set.add(dName);
    });
    return Array.from(set);
  }, [allPublicJobs]);

  // Handle direct navigation out of bounds
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Calculate position range text (e.g. Showing 1–10 of 18 jobs)
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/careers" className="flex items-center gap-2.5">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-xs transition-colors"
              style={{ backgroundColor: primaryColor }}
            >
              {config.companyName ? config.companyName.substring(0, 1) : 'S'}
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight" style={{ color: primaryColor }}>
                {config.companyName || 'StockPulse'}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5 font-medium">Careers Portal</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {showTotalCount && (
              <Badge variant="outline" className="gap-1 text-xs py-1 px-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> {totalCount} Verified Openings
              </Badge>
            )}
            <Link to="/login">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                HR Workspace Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="border-b border-border/50 py-12 md:py-16 transition-colors"
        style={{
          background: `linear-gradient(180deg, ${primaryColor}15 0%, ${primaryColor}05 50%, transparent 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <Badge
            className="text-xs font-medium px-3 py-1 border"
            style={{
              backgroundColor: `${primaryColor}15`,
              color: primaryColor,
              borderColor: `${primaryColor}30`,
            }}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Explore Exciting Career Opportunities
          </Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            {config.welcomeHeadline || 'Build Your Future With Us'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            {config.welcomeSubtitle ||
              'Discover active job requisitions published across our corporate entities. Apply directly to verified opportunities with real-time application tracking.'}
          </p>

          {/* Search Box */}
          <div className="pt-4 max-w-3xl mx-auto">
            <div className="p-2 bg-background rounded-xl border border-border shadow-lg flex flex-col md:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by job title, location, skill, or requisition ID..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 h-11 border-0 shadow-none focus-visible:ring-0 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={selectedDept} onValueChange={handleDeptChange}>
                  <SelectTrigger className="h-10 text-xs w-full md:w-[160px] border-border/60">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Departments</SelectItem>
                    {departmentList.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={handleTypeChange}>
                  <SelectTrigger className="h-10 text-xs w-full md:w-[150px] border-border/60">
                    <SelectValue placeholder="Employment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="INTERN">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Jobs Listing */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/60 mb-6 gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Published Job Openings</h2>
            {showPageInfo && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Showing {rangeStart}–{rangeEnd} of {totalCount} active job opening{totalCount === 1 ? '' : 's'}
              </p>
            )}
          </div>
          {showTotalCount && (
            <Badge variant="outline" className="w-fit text-xs font-mono py-1 px-3 bg-background border-border">
              Total {totalCount} Openings Matched
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse h-64 bg-muted/40 border-border/40" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mb-4">
              <Briefcase className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Published Jobs Found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
              There are currently no active job requisitions matching your search criteria. Please check back soon or try clearing your filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('ALL');
                setSelectedType('ALL');
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => {
                const compName = (job as any).company?.name || config.companyName || 'StockPulse Inc.';
                const compCode = (job as any).company?.code || '';
                const deptName = job.department?.name || (job as any).departmentName || 'General';

                return (
                  <Card key={job.id} className="group hover:shadow-md transition-all border-border/80 flex flex-col justify-between overflow-hidden">
                    <CardHeader className="pb-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono border"
                          style={{
                            backgroundColor: `${primaryColor}10`,
                            color: primaryColor,
                            borderColor: `${primaryColor}30`,
                          }}
                        >
                          {job.requisitionCode || 'JR-2026'}
                        </Badge>
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold">
                          {job.numPositions} Position{job.numPositions === 1 ? '' : 's'}
                        </Badge>
                      </div>
                      <CardTitle
                        className="text-lg font-bold transition-colors line-clamp-1 group-hover:text-primary"
                      >
                        {job.title}
                      </CardTitle>
                      <CardDescription className="text-xs flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{compName} {compCode ? `(${compCode})` : ''}</span>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 pb-5 flex-1">
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 bg-muted/30 p-2 rounded-md">
                          <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{deptName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/30 p-2 rounded-md">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{job.workLocation || 'Head Office'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/30 p-2 rounded-md">
                          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="capitalize">{job.employmentType?.replace('_', ' ').toLowerCase() || 'Full Time'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/30 p-2 rounded-md col-span-2">
                          <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate font-semibold text-[11px] text-foreground">
                            {job.candidateType === 'FRESHER'
                              ? 'Experience: Fresher / 0 Years'
                              : job.candidateType === 'EXPERIENCED'
                              ? `Experience: ${job.minExperience ?? 0}-${job.maxExperience ?? 0} Years`
                              : job.candidateType === 'BOTH'
                              ? 'Experience: Freshers & Experienced'
                              : `Experience: ${job.experience || 'Freshers & Experienced'}`}
                          </span>
                        </div>
                        {config.salaryPolicy !== 'hide' && (
                          <div
                            className="flex items-center justify-between border p-2 rounded-md col-span-2"
                            style={{
                              backgroundColor: `${primaryColor}08`,
                              borderColor: `${primaryColor}20`,
                            }}
                          >
                            <span className="text-[11px] font-medium text-muted-foreground">Offered CTC Range:</span>
                            <span className="font-mono font-bold text-xs" style={{ color: primaryColor }}>
                              {formatSalaryRangeInLakhs(job.minSalary, job.maxSalary)}
                            </span>
                          </div>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 italic">
                          "{job.description}"
                        </p>
                      )}
                    </CardContent>

                    <div className="p-4 pt-0 bg-muted/10 border-t border-border/40 flex items-center justify-between gap-2 mt-auto">
                      {job.applicationDeadline ? (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Actively Hiring
                        </span>
                      )}

                      <Link to={`/careers/job/${job.id}`}>
                        <Button
                          size="sm"
                          className="h-8 text-xs font-semibold gap-1 text-white shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {config.applyButtonText || 'View & Apply'} <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* ── Dynamic Database Driven Pagination Bar ── */}
            {paginationEnabled && totalPages > 1 && (
              <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                {showPageInfo ? (
                  <div className="text-xs text-muted-foreground font-medium">
                    Showing <strong className="text-foreground">{rangeStart}–{rangeEnd}</strong> of <strong className="text-foreground">{totalCount}</strong> jobs
                  </div>
                ) : (
                  <div />
                )}

                {/* Numbered Pagination Style */}
                {paginationStyle === 'numbered' && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-xs gap-1 font-medium disabled:opacity-40"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        const isActive = pageNum === currentPage;
                        return (
                          <Button
                            key={pageNum}
                            variant={isActive ? 'default' : 'outline'}
                            size="sm"
                            className={`h-9 w-9 text-xs font-bold font-mono transition-all ${
                              isActive ? 'text-white shadow-xs' : 'text-foreground'
                            }`}
                            style={isActive ? { backgroundColor: primaryColor } : undefined}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-xs gap-1 font-medium disabled:opacity-40"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage >= totalPages}
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Previous / Next Style */}
                {paginationStyle === 'prev_next' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 text-xs gap-1 font-medium disabled:opacity-40"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous Page
                    </Button>
                    <span className="text-xs font-mono text-muted-foreground px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 text-xs gap-1 font-medium disabled:opacity-40"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage >= totalPages}
                    >
                      Next Page <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Load More Style */}
                {paginationStyle === 'load_more' && currentPage < totalPages && (
                  <div className="w-full flex justify-center pt-2">
                    <Button
                      variant="outline"
                      size="md"
                      className="h-10 px-6 text-xs font-semibold gap-2 border-primary/30 text-primary hover:bg-primary/5"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    >
                      Load More Jobs ({totalCount - rangeEnd} Remaining) <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8 text-center text-xs text-muted-foreground mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">{config.companyName || 'StockPulse Inc.'}</span>
            <span>© {new Date().getFullYear()} Enterprise Human Capital Management. All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link to="/careers" className="hover:underline">Home</Link>
            <Link to="/login" className="hover:underline">HR Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
