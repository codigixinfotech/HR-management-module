import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  Users,
  UserCheck,
  Calendar,
  Award,
  Briefcase,
} from 'lucide-react';
import { jobOpeningsApi } from '@/api/recruitment';
import { companiesApi } from '@/api/organization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/layout/PageHeader';
import { ManpowerPlanningTab } from './ManpowerPlanningTab';
import { RequisitionsTab } from './RequisitionsTab';
import { CareersPortalTab } from './CareersPortalTab';
import { CandidatesTab } from './CandidatesTab';
import { InterviewsTab } from './InterviewsTab';
import { AssessmentsTab } from './AssessmentsTab';
import { OffersTab } from './OffersTab';
import { RecruitmentReportsTab } from './RecruitmentReportsTab';

const jobOpeningSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  title: z.string().min(1, 'Title is required'),
  numPositions: z.number().min(1),
  description: z.string().optional(),
});

type JobOpeningFormValues = z.infer<typeof jobOpeningSchema>;

export default function JobOpeningsPage() {
  const queryClient = useQueryClient();
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = routeTab || searchParams.get('tab') || 'requisitions';
  const [open, setOpen] = useState(false);

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });
  const { data: openings } = useQuery({ queryKey: ['job-openings'], queryFn: () => jobOpeningsApi.list() });

  const form = useForm<JobOpeningFormValues>({
    resolver: zodResolver(jobOpeningSchema),
    defaultValues: { companyId: '', title: '', numPositions: 1, description: '' },
  });

  const createMutation = useMutation({
    mutationFn: (values: JobOpeningFormValues) => jobOpeningsApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      toast.success('Job opening created');
      setOpen(false);
      form.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Briefcase}
        title="Recruitment & Applicant Tracking System (ATS)"
        description="Manage job requisitions, applicant pipelines, interview panels, skill assessments & digital offers"
        badge="Q3 Hiring Campaign"
        badgeVariant="info"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => form.reset({ companyId: companies?.[0]?.id ?? '', title: '', numPositions: 1, description: '' })}>
                <Plus className="h-3.5 w-3.5" /> Post Job Opening
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Job Requisition</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
                <div className="space-y-1.5">
                  <Label className="text-xs">Company Entity</Label>
                  <Select value={form.watch('companyId')} onValueChange={(v) => form.setValue('companyId', v)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies?.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Job Position Title</Label>
                    <Input className="h-9 text-xs" {...form.register('title')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Number of Openings</Label>
                    <Input className="h-9 text-xs" type="number" min={1} {...form.register('numPositions', { valueAsNumber: true })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Job Description & Responsibilities</Label>
                  <Input className="h-9 text-xs" {...form.register('description')} />
                </div>
                <DialogFooter>
                  <Button type="submit" size="sm" className="text-xs" disabled={createMutation.isPending}>
                    Publish Opening
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Users} label="Active Requisitions" value={`${openings?.length ?? 0} Openings`} hint="Across 4 Departments" accent="info" />
        <StatCard icon={UserCheck} label="Total Applicants" value="142 Candidates" hint="28 Sourced via LinkedIn" accent="success" />
        <StatCard icon={Calendar} label="Interviews Scheduled" value="8 This Week" hint="Avg Time-to-Fill: 22 Days" accent="primary" />
        <StatCard icon={Award} label="Offers Accepted" value="3 Offers" hint="85% Offer Acceptance Rate" accent="warning" />
      </div>

      {/* Navigation Tabs */}
      {/* Render Dedicated Subpage based on activeTab */}
      {activeTab === 'requisitions' && <RequisitionsTab />}

      {activeTab === 'planning' && <ManpowerPlanningTab />}

      {activeTab === 'portal' && <CareersPortalTab />}

      {activeTab === 'candidates' && <CandidatesTab />}

      {activeTab === 'interviews' && <InterviewsTab />}

      {activeTab === 'assessments' && <AssessmentsTab />}

      {activeTab === 'offers' && <OffersTab />}

      {activeTab === 'reports' && <RecruitmentReportsTab />}
    </div>
  );
}
