import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { jobOpeningsApi } from '@/api/recruitment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CareersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['public-job-openings'],
    queryFn: () => jobOpeningsApi.listPublic(),
  });

  const departmentList = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      const dName = j.department?.name || (j as any).departmentName;
      if (dName) set.add(dName);
    });
    return Array.from(set);
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const title = j.title || '';
      const code = j.requisitionCode || '';
      const location = j.workLocation || '';
      const deptName = j.department?.name || (j as any).departmentName || '';
      const compName = (j as any).company?.name || '';

      const matchesSearch =
        !searchQuery ||
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deptName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        compName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = selectedDept === 'ALL' || deptName.toLowerCase() === selectedDept.toLowerCase();
      const matchesType = selectedType === 'ALL' || j.employmentType === selectedType;

      return matchesSearch && matchesDept && matchesType;
    });
  }, [jobs, searchQuery, selectedDept, selectedType]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/careers" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-xs">
              E
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-primary">EHCM</span>
              <span className="text-xs text-muted-foreground ml-1.5 font-medium">Careers Portal</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1 text-xs py-1 px-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified Enterprise Listings
            </Badge>
            <Link to="/login">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                HR Workspace Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 via-primary/5 to-transparent border-b border-border/50 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 text-xs font-medium px-3 py-1">
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Explore Exciting Career Opportunities
          </Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Build Your Future With Us
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            Discover active job requisitions published across our corporate entities. Apply directly to verified opportunities with real-time application tracking.
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 border-0 shadow-none focus-visible:ring-0 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={selectedDept} onValueChange={setSelectedDept}>
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

                <Select value={selectedType} onValueChange={setSelectedType}>
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
        <div className="flex items-center justify-between pb-6 border-b border-border/60 mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Published Job Openings</h2>
            <p className="text-xs text-muted-foreground">
              Showing {filteredJobs.length} active position{filteredJobs.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse h-64 bg-muted/40 border-border/40" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
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
              }}
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const compName = (job as any).company?.name || 'Corporate Entity';
              const compCode = (job as any).company?.code || '';
              const deptName = job.department?.name || (job as any).departmentName || 'General';

              return (
                <Card key={job.id} className="group hover:shadow-md transition-all border-border/80 flex flex-col justify-between overflow-hidden">
                  <CardHeader className="pb-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono text-primary bg-primary/5 border-primary/20">
                        {job.requisitionCode || 'JR-2026'}
                      </Badge>
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold">
                        {job.numPositions} Position{job.numPositions === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
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
                      <Button size="sm" className="h-8 text-xs font-semibold gap-1 group-hover:bg-primary">
                        View & Apply <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8 text-center text-xs text-muted-foreground mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">EHCM Platform</span>
            <span>© {new Date().getFullYear()} Enterprise Recruitment System. All Rights Reserved.</span>
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
