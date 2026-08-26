import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Users,
  UserCheck,
  Calendar,
  Award,
  Briefcase,
} from 'lucide-react';
import { jobOpeningsApi } from '@/api/recruitment';
import { Button } from '@/components/ui/button';
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

export default function JobOpeningsPage() {
  const navigate = useNavigate();
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = routeTab || searchParams.get('tab') || 'requisitions';

  const { data: openings } = useQuery({ queryKey: ['job-openings'], queryFn: () => jobOpeningsApi.list() });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Briefcase}
        title="Recruitment & Applicant Tracking System (ATS)"
        description="Manage job requisitions, applicant pipelines, interview panels, skill assessments & digital offers"
        badge="Q3 Hiring Campaign"
        badgeVariant="info"
        actions={
          <Button
            size="sm"
            className="gap-1.5 text-xs font-semibold"
            onClick={() => navigate('/recruitment/requisitions/new')}
          >
            <Plus className="h-3.5 w-3.5" /> Post Job Opening
          </Button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Users}
          label="Active Requisitions"
          value={`${openings?.filter((o) => o.status === 'PUBLISHED' || o.isActive).length ?? 0} Requisitions`}
          hint={`${openings?.filter((o) => o.status === 'PUBLISHED' || o.isActive).reduce((acc, curr) => acc + curr.numPositions, 0) ?? 0} Open Positions`}
          accent="info"
        />
        <StatCard
          icon={UserCheck}
          label="Total Applicants"
          value={`${openings?.reduce((acc, curr) => acc + (curr._count?.candidates ?? curr.candidates?.length ?? 0), 0) ?? 0} Candidates`}
          hint="Careers & Job Portal Applications"
          accent="success"
        />
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
