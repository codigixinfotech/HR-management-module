import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Briefcase,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Globe,
  Sparkles,
  Building2,
  Calendar,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { jobOpeningsApi, manpowerRequisitionsApi } from '@/api/recruitment';
import { companiesApi, branchesApi } from '@/api/organization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { ManpowerRequisition, JobOpening, Branch } from '@/api/types';

export function RequisitionsTab() {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Create Job Requisition Dialog State
  const [isReqOpen, setIsReqOpen] = useState(false);
  const [selectedMr, setSelectedMr] = useState<ManpowerRequisition | null>(null);

  // Form fields for Create Job Requisition
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobResponsibilities, setJobResponsibilities] = useState('');
  const [jobSkills, setJobSkills] = useState('');
  const [jobQualification, setJobQualification] = useState('');
  const [jobExperience, setJobExperience] = useState('');
  const [jobMinSalary, setJobMinSalary] = useState<number>(0);
  const [jobMaxSalary, setJobMaxSalary] = useState<number>(0);
  const [jobLocation, setJobLocation] = useState('');
  const [jobEmploymentType, setJobEmploymentType] = useState('FULL_TIME');
  const [jobDeadline, setJobDeadline] = useState('');

  // Queries
  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: () => companiesApi.list() });
  const { data: branches = [] } = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });
  const { data: openings = [], isLoading: isOpeningsLoading } = useQuery({
    queryKey: ['job-openings'],
    queryFn: () => jobOpeningsApi.list(),
  });
  const { data: requisitions = [], isLoading: isMrsLoading } = useQuery({
    queryKey: ['manpower-requisitions'],
    queryFn: () => manpowerRequisitionsApi.list(),
  });

  // Approve / Reject MR Mutation
  const updateMrStatusMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) =>
      manpowerRequisitionsApi.updateStatus(id, status, rejectionReason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['manpower-requisitions'] });
      queryClient.invalidateQueries({ queryKey: ['manpower-plans'] });

      if (data.status === 'APPROVED') {
        toast.success(`Manpower Requisition ${data.mrNumber} Approved successfully.`);
      } else if (data.status === 'REJECTED') {
        toast.info(`Manpower Requisition ${data.mrNumber} set to REJECTED. Planned hires restored.`);
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update MR status'),
  });

  // Create Job Requisition Mutation
  const createJobReqMutation = useMutation({
    mutationFn: (payload: Partial<JobOpening>) => jobOpeningsApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      toast.success(`Job Requisition ${data.requisitionCode || data.title} created successfully!`);
      setIsReqOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create Job Requisition'),
  });

  // Publish Job Opening Mutation
  const publishOpeningMutation = useMutation({
    mutationFn: (id: string) => jobOpeningsApi.publish(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      toast.success(`Job Opening "${data.title}" Published to Careers & Job Portal!`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to publish job opening'),
  });

  // Handle Approve MR with Clean Confirmation Prompt
  const handleApproveMr = (mr: ManpowerRequisition) => {
    const confirmMsg = `Approve Manpower Requisition ${mr.mrNumber} for ${mr.role} (${mr.numOpenings} Openings)?`;
    if (confirm(confirmMsg)) {
      updateMrStatusMutation.mutate({ id: mr.id, status: 'APPROVED' });
    }
  };

  // Handle Reject MR
  const handleRejectMr = (mr: ManpowerRequisition) => {
    const reason = prompt(`Enter rejection reason for MR ${mr.mrNumber}:`, 'Budget constraint / position postponed');
    if (reason !== null) {
      updateMrStatusMutation.mutate({ id: mr.id, status: 'REJECTED', rejectionReason: reason });
    }
  };

  // Open Create Job Requisition Dialog for Approved MR
  const openCreateJobReqModal = (mr: ManpowerRequisition) => {
    setSelectedMr(mr);
    setJobTitle(mr.role);
    setJobDescription(
      `We are seeking a talented ${mr.role} to join our ${mr.departmentName} team. The ideal candidate will bring strong technical expertise, domain knowledge, and leadership.`
    );
    setJobResponsibilities(
      `• Lead key operational and technical projects in ${mr.departmentName}.\n• Collaborate with cross-functional teams to deliver high quality results.\n• Mentor junior team members and maintain process compliance.`
    );
    setJobSkills(mr.requiredSkills || 'Leadership, Domain Expertise, Teamwork');
    setJobQualification(mr.qualification || 'Graduate / Professional Degree');
    setJobExperience(mr.experience || '3 - 5 Years');
    setJobMinSalary(mr.minSalary || 800000);
    setJobMaxSalary(mr.maxSalary || 1200000);
    setJobLocation(mr.workLocation || 'Head Office (Pune)');
    setJobEmploymentType(mr.employmentType || 'FULL_TIME');

    // Deadline 30 days out
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);
    setJobDeadline(deadline.toISOString().split('T')[0]);

    setIsReqOpen(true);
  };

  // Handle Submit Job Requisition
  const handleSubmitJobReq = (targetStatus: 'DRAFT' | 'READY_TO_PUBLISH') => {
    if (!jobTitle.trim()) {
      toast.error('Job Title is required');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Job Description is required');
      return;
    }

    const defaultCompanyId = selectedMr?.companyId || companies[0]?.id || '';

    const payload: Partial<JobOpening> = {
      companyId: defaultCompanyId,
      departmentId: selectedMr?.departmentId || null,
      designationId: selectedMr?.designationId || null,
      manpowerRequisitionId: selectedMr?.id || null,
      mrNumber: selectedMr?.mrNumber || null,
      manpowerPlanCode: selectedMr?.manpowerPlanId || null,
      title: jobTitle,
      description: jobDescription,
      responsibilities: jobResponsibilities,
      numPositions: selectedMr?.numOpenings || 1,
      costCenter: selectedMr?.costCenter || '',
      employmentType: jobEmploymentType as any,
      priority: selectedMr?.priority as any || 'NORMAL',
      minSalary: Number(jobMinSalary) || undefined,
      maxSalary: Number(jobMaxSalary) || undefined,
      qualification: jobQualification,
      experience: jobExperience,
      requiredSkills: jobSkills,
      workLocation: jobLocation,
      applicationDeadline: jobDeadline || undefined,
      status: targetStatus,
      isActive: false,
    };

    createJobReqMutation.mutate(payload);
  };

  // Handle Publish Opening
  const handlePublishJobOpening = (opening: JobOpening) => {
    if (confirm(`Publish Job Opening "${opening.title}" (${opening.numPositions} Positions) to the Job Portal? Candidates will be able to apply.`)) {
      publishOpeningMutation.mutate(opening.id);
    }
  };

  const filteredOpenings = useMemo(() => {
    if (!openings) return [];
    return openings.filter((o) => {
      const matchesSearch =
        o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.department?.name && o.department.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.requisitionCode && o.requisitionCode.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDept =
        selectedDept === 'all' ? true : o.department?.name?.toLowerCase() === selectedDept.toLowerCase();
      return matchesSearch && matchesDept;
    });
  }, [openings, searchQuery, selectedDept]);

  const pendingMrsCount = requisitions.filter((r) => r.status === 'PENDING_APPROVAL').length;
  const approvedMrsCount = requisitions.filter((r) => r.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* ── 1. Manpower Requisitions (MR) Approvals Queue Card ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Manpower Requisitions (MR) Approval Queue
            </CardTitle>
            <CardDescription className="text-xs">
              Stage 1: Internal headcount approval required before initiating recruitment job requisitions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs font-semibold">
              {pendingMrsCount} Pending Approvals
            </Badge>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold">
              {approvedMrsCount} Approved MRs
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isMrsLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Loading manpower requisitions...
            </div>
          ) : requisitions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No Manpower Requisitions submitted yet. Go to <strong>Manpower Planning</strong> and click <strong>"Raise MR"</strong> to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">MR Number</TableHead>
                  <TableHead className="text-xs">Role / Designation</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Cost Center</TableHead>
                  <TableHead className="text-xs">Openings</TableHead>
                  <TableHead className="text-xs">Joining Date</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Stage 1 Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requisitions.map((mr) => {
                  const isPending = mr.status === 'PENDING_APPROVAL' || mr.status === 'DRAFT';
                  const isApproved = mr.status === 'APPROVED';
                  const isRejected = mr.status === 'REJECTED';

                  return (
                    <TableRow key={mr.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-primary">{mr.mrNumber}</TableCell>
                      <TableCell className="font-semibold text-xs text-foreground flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {mr.role}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-semibold">{mr.departmentName}</TableCell>
                      <TableCell className="text-xs font-mono font-medium">{mr.costCenter}</TableCell>
                      <TableCell className="text-xs font-mono font-bold text-primary">
                        +{mr.numOpenings} Openings
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {new Date(mr.joiningDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          className={`text-[10px] uppercase font-semibold ${
                            mr.priority === 'URGENT' || mr.priority === 'HIGH'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                              : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          }`}
                        >
                          {mr.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          className={`text-[10px] font-semibold ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : isRejected
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                        >
                          {mr.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 text-[10.5px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold"
                                onClick={() => handleApproveMr(mr)}
                                disabled={updateMrStatusMutation.isPending}
                              >
                                <CheckCircle2 className="h-3 w-3" /> Approve MR
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10.5px] px-2 text-rose-600 border-rose-300 hover:bg-rose-50 gap-1 font-semibold"
                                onClick={() => handleRejectMr(mr)}
                                disabled={updateMrStatusMutation.isPending}
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </>
                          )}
                          {isApproved && (
                            <Button
                              size="sm"
                              className="h-7 text-[10.5px] px-2.5 bg-primary hover:bg-primary/90 text-primary-foreground gap-1 font-semibold"
                              onClick={() => openCreateJobReqModal(mr)}
                            >
                              <Plus className="h-3 w-3" /> Create Job Requisition
                            </Button>
                          )}
                          {isRejected && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10.5px] px-2.5 text-amber-600 border-amber-300 hover:bg-amber-50 gap-1 font-semibold"
                              onClick={() => handleApproveMr(mr)}
                            >
                              Revise & Resubmit
                            </Button>
                          )}
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

      {/* ── 2. Create Job Requisition Dialog (Stage 2 Form) ── */}
      <Dialog open={isReqOpen} onOpenChange={setIsReqOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center justify-between text-base font-semibold">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Create Job Requisition (From Approved MR)
              </span>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                Stage 2: Detailed Recruitment Setup
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedMr && (
            <div className="space-y-4 text-xs pt-2">
              {/* Carried Forward Read-Only Details */}
              <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-2">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> Approved MR Reference Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">MR Number:</span>{' '}
                    <strong className="font-mono text-primary">{selectedMr.mrNumber}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Department:</span>{' '}
                    <strong>{selectedMr.departmentName}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost Center:</span>{' '}
                    <strong className="font-mono">{selectedMr.costCenter}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Openings:</span>{' '}
                    <strong className="text-primary">{selectedMr.numOpenings} Positions</strong>
                  </div>
                </div>
              </div>

              {/* Editable Job Requisition Fields */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="font-semibold">Job Title *</Label>
                  <Input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Job Description *</Label>
                  <Textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="text-xs min-h-[70px]"
                    rows={3}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Key Responsibilities</Label>
                  <Textarea
                    value={jobResponsibilities}
                    onChange={(e) => setJobResponsibilities(e.target.value)}
                    className="text-xs min-h-[70px]"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Required Qualification</Label>
                    <Input
                      type="text"
                      value={jobQualification}
                      onChange={(e) => setJobQualification(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold">Experience Required</Label>
                    <Input
                      type="text"
                      value={jobExperience}
                      onChange={(e) => setJobExperience(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="font-semibold">Required Skills</Label>
                  <Input
                    type="text"
                    value={jobSkills}
                    onChange={(e) => setJobSkills(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Min CTC (₹)</Label>
                    <Input
                      type="number"
                      value={jobMinSalary}
                      onChange={(e) => setJobMinSalary(Number(e.target.value))}
                      className="h-8 text-xs font-mono bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold">Max CTC (₹)</Label>
                    <Input
                      type="number"
                      value={jobMaxSalary}
                      onChange={(e) => setJobMaxSalary(Number(e.target.value))}
                      className="h-8 text-xs font-mono bg-background"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="font-semibold">Work Location</Label>
                    <Input
                      type="text"
                      value={jobLocation}
                      onChange={(e) => setJobLocation(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold">Application Deadline</Label>
                    <Input
                      type="date"
                      value={jobDeadline}
                      onChange={(e) => setJobDeadline(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsReqOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSubmitJobReq('DRAFT')}
                  disabled={createJobReqMutation.isPending}
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="text-xs font-semibold gap-1.5"
                  onClick={() => handleSubmitJobReq('READY_TO_PUBLISH')}
                  disabled={createJobReqMutation.isPending}
                >
                  <Sparkles className="h-3.5 w-3.5" /> Save & Set Ready to Publish
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 3. Job Requisitions & Job Openings List (Stage 2 & Stage 3) ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> Job Requisitions & Job Portal Feed
              </CardTitle>
              <CardDescription className="text-xs">
                Stage 2 & 3: Detailed recruitment requisitions and live postings published to Careers / Job Portal
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter job requisitions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {isOpeningsLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Loading job requisitions...
            </div>
          ) : filteredOpenings.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No job requisitions created yet. Click <strong>"Create Job Requisition"</strong> on an Approved MR.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Req Code / ID</TableHead>
                  <TableHead className="text-xs">MR Ref</TableHead>
                  <TableHead className="text-xs">Job Position Title</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Openings</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Created Date</TableHead>
                  <TableHead className="text-right text-xs">Stage 3 Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOpenings.map((opening) => {
                  const isPublished = opening.status === 'PUBLISHED' || opening.isActive;
                  const isReadyToPublish = opening.status === 'READY_TO_PUBLISH';
                  const isDraft = opening.status === 'DRAFT';
                  const reqCode = opening.requisitionCode || `JR-2026-0${opening.id.substring(0, 2)}`;

                  return (
                    <TableRow key={opening.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-primary">{reqCode}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground font-medium">
                        {opening.mrNumber || 'N/A'}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">{opening.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-semibold">
                        {opening.department?.name || 'General'}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-primary">
                        {opening.numPositions} Positions
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          className={`text-[10px] font-semibold ${
                            isPublished
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : isReadyToPublish
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {isPublished ? 'PUBLISHED' : isReadyToPublish ? 'READY TO PUBLISH' : 'DRAFT'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(opening.createdAt || Date.now()).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPublished ? (
                            <Button
                              size="sm"
                              className="h-7 text-[10.5px] px-2.5 bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-semibold"
                              onClick={() => handlePublishJobOpening(opening)}
                              disabled={publishOpeningMutation.isPending}
                            >
                              <Globe className="h-3 w-3" /> Publish Job Opening
                            </Button>
                          ) : (
                            <Link to={`/recruitment/candidates?jobId=${opening.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-primary font-semibold gap-1">
                                View Candidates <ArrowUpRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
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
    </div>
  );
}
