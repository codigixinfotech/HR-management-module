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
import { formatSalaryRangeInLakhs } from '@/lib/utils';
import { jobOpeningsApi } from '@/api/recruitment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CandidateApplicationWizard } from '@/components/recruitment/CandidateApplicationWizard';

export default function CareersJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'DETAILS' | 'APPLY_PAGE'>('DETAILS');

  const { data: job, isLoading, isError } = useQuery({
    queryKey: ['public-job-opening', id],
    queryFn: () => jobOpeningsApi.findPublic(id || ''),
    enabled: !!id,
  });

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
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 py-6 px-4 sm:px-6 lg:px-8">
      <CandidateApplicationWizard
        job={job}
        onCancel={() => navigate('/careers')}
      />
    </div>
  );
}
