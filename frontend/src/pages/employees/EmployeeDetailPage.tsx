import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Trash2, Plus, Check, Laptop, ShieldAlert, Award, FileText, CheckCircle2, Camera, AlertCircle, ShieldCheck } from 'lucide-react';
import { employeesApi } from '@/api/employees';
import { assetsApi } from '@/api/asset-management';
import { payGradesApi } from '@/api/cost-grades';
import { exitsApi } from '@/api/exits';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth-store';
import type { ApprovalStatus, EmployeeStatus } from '@/api/types';
import { RegisterFaceModal } from './RegisterFaceModal';

const STATUS_OPTIONS: EmployeeStatus[] = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'PROBATION', 'NOTICE_PERIOD', 'EXITED'];

export default function EmployeeDetailPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const authUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const id = rawId === 'me' || !rawId ? 'me' : rawId;
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dialog State controls
  const [docType, setDocType] = useState('ID_PROOF');
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskOwner, setTaskOwner] = useState('HR');

  const [isAssetOpen, setIsAssetOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [assetRemarks, setAssetRemarks] = useState('');

  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseType, setCourseType] = useState('Technical');
  const [courseStatus, setCourseStatus] = useState('In Progress');
  const [courseCert, setCourseCert] = useState('');

  const [isKpiOpen, setIsKpiOpen] = useState(false);
  const [kpiTitle, setKpiTitle] = useState('');
  const [kpiCategory, setKpiCategory] = useState('Quality');
  const [kpiTarget, setKpiTarget] = useState('');
  const [kpiWeight, setKpiWeight] = useState(10);
  const [kpiPeriod, setKpiPeriod] = useState('Q3 2026');
  const [kpiRating, setKpiRating] = useState('');
  const [kpiFeedback, setKpiFeedback] = useState('');

  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('General');
  const [noteAuthor, setNoteAuthor] = useState('HR Administrator');

  const [isRegisterFaceOpen, setIsRegisterFaceOpen] = useState(false);
  const [isViewTemplateOpen, setIsViewTemplateOpen] = useState(false);

  // Queries
  const { data: employee, isLoading, isError } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await employeesApi.get(id!);
      if (rawId === 'me' && res && authUser) {
        // Sync auth store employee state with database record
        setUser({
          ...authUser,
          employee: {
            id: res.id,
            employeeCode: res.employeeCode,
            firstName: res.firstName,
            lastName: res.lastName,
            fullName: `${res.firstName} ${res.lastName}`,
            departmentId: res.departmentId,
            departmentName: res.department?.name || null,
            designationId: res.designationId,
            designationTitle: res.designation?.title || null,
          },
        });
      }
      return res;
    },
    enabled: !!id,
    retry: 1,
  });

  const targetEmpId = employee?.id || id;

  const { data: employeeExits = [] } = useQuery({
    queryKey: ['employee-exits', targetEmpId],
    queryFn: () => exitsApi.list({ search: targetEmpId }),
    enabled: !!targetEmpId,
  });
  const activeExitRecord = employeeExits[0] || null;

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => assetsApi.list(),
  });

  const { data: payGrades = [] } = useQuery({
    queryKey: ['pay-grades'],
    queryFn: () => payGradesApi.list(),
  });

  const getGradeLevelDisplay = (gradeVal?: string | null, levelVal?: string | null) => {
    if (!gradeVal && !levelVal) return '-';
    const matched = payGrades.find(pg => pg.id === gradeVal || pg.gradeCode === gradeVal);
    if (matched) {
      const gCode = matched.gradeCode;
      const lvl = (levelVal && !levelVal.startsWith('cm') && levelVal.length <= 10) ? levelVal : matched.level;
      return `${gCode} / ${lvl || 'L1'}`;
    }
    if (gradeVal && (gradeVal.startsWith('cm') || gradeVal.length > 20)) {
      if (levelVal && !levelVal.startsWith('cm') && levelVal.length <= 10) {
        return levelVal;
      }
      return 'E2 / L1';
    }
    const g = gradeVal || '-';
    const l = levelVal || '';
    if (!l || g === l) return g;
    return `${g} / ${l}`;
  };

  const availableAssets = assets.filter(a => a.status === 'IN_STOCK');

  // Mutations
  const statusMutation = useMutation({
    mutationFn: (status: EmployeeStatus) => employeesApi.update(targetEmpId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Status updated successfully');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => employeesApi.uploadDocument(targetEmpId, file, docType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Document uploaded to vault');
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Upload failed'),
  });

  const removeDocMutation = useMutation({
    mutationFn: (documentId: string) => employeesApi.removeDocument(targetEmpId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Document removed');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: () => employeesApi.createOnboardingTask(targetEmpId, { title: taskTitle, ownerType: taskOwner }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Onboarding task added');
      setTaskOpen(false);
      setTaskTitle('');
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => employeesApi.updateOnboardingTaskStatus(taskId, 'APPROVED' as ApprovalStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Task marked complete');
    },
  });

  const allocateAssetMutation = useMutation({
    mutationFn: () => assetsApi.allocate(selectedAssetId, { employeeId: targetEmpId, remarks: assetRemarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset allocated successfully');
      setIsAssetOpen(false);
      setSelectedAssetId('');
      setAssetRemarks('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Allocation failed'),
  });

  const returnAssetMutation = useMutation({
    mutationFn: (assetId: string) => assetsApi.returnAsset(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset returned to stock');
    },
  });

  const enrollCourseMutation = useMutation({
    mutationFn: () => employeesApi.enrollInCourse(targetEmpId, {
      courseName,
      courseType,
      status: courseStatus,
      certification: courseCert || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Employee enrolled in course');
      setIsCourseOpen(false);
      setCourseName('');
      setCourseCert('');
    },
  });

  const addKpiMutation = useMutation({
    mutationFn: () => employeesApi.addKpi(targetEmpId, {
      kpi: kpiTitle,
      category: kpiCategory,
      target: kpiTarget,
      weightage: Number(kpiWeight),
      reviewPeriod: kpiPeriod,
      performanceRating: kpiRating ? Number(kpiRating) : undefined,
      managerFeedback: kpiFeedback || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Performance KPI record added');
      setIsKpiOpen(false);
      setKpiTitle('');
      setKpiTarget('');
      setKpiRating('');
      setKpiFeedback('');
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: () => employeesApi.addHrNote(targetEmpId, {
      note: noteContent,
      noteType,
      createdBy: noteAuthor,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Internal HR note recorded');
      setIsNoteOpen(false);
      setNoteContent('');
    },
  });

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-xs font-semibold text-muted-foreground">Loading employee record profile...</p>
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4 border border-border/80 rounded-2xl bg-card my-12 shadow-sm">
        <div className="flex justify-center text-amber-500">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Employee Record Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested employee record (<code className="font-mono bg-muted px-1.5 py-0.5 rounded">{id}</code>) could not be found or has been removed.
        </p>
        <Button asChild size="sm" className="font-semibold text-xs gap-1.5">
          <Link to="/employees">
            <ArrowLeft className="h-4 w-4" /> Return to Employee Directory
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-xs text-muted-foreground">
            {employee.employeeCode} &middot; {employee.designation?.title ?? 'No designation'}
          </p>
        </div>
        <div className="ml-auto w-40">
          <Select value={employee.status} onValueChange={(v) => statusMutation.mutate(v as EmployeeStatus)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <InfoCard label="Company" value={employee.company?.name ?? '-'} />
        <InfoCard label="Business Unit" value={employee.businessUnit ?? 'Technology Services'} />
        <InfoCard label="Department" value={employee.department?.name ?? '-'} />
        <InfoCard label="Designation" value={employee.designation?.title ?? '-'} />
        <InfoCard label="Branch Facility" value={employee.branch?.name ?? 'Head Office'} />
        <InfoCard label="Work Location" value={employee.location ?? 'New York HQ'} />
        <InfoCard label="Shift Assignment" value={employee.shift ?? 'General Day Shift (G)'} />
        <InfoCard label="Job Grade / Level" value={getGradeLevelDisplay(employee.grade, employee.level)} />
        <InfoCard label="Work Email" value={employee.workEmail ?? '-'} />
        <InfoCard label="Phone" value={employee.phone ?? '-'} />
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Tabs List */}
          <div className="md:w-60 shrink-0">
            <Card className="border border-border/80 shadow-2xs">
              <CardContent className="p-2">
                <TabsList className="flex flex-col h-auto bg-transparent w-full space-y-1 items-stretch">
                  <TabsTrigger value="personal" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Personal Profile</TabsTrigger>
                  <TabsTrigger value="biometric" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold text-primary">Attendance & Biometric</TabsTrigger>
                  <TabsTrigger value="contact" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Contact & Address</TabsTrigger>
                  <TabsTrigger value="family" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Family & Nominee</TabsTrigger>
                  <TabsTrigger value="education" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Education Details</TabsTrigger>
                  <TabsTrigger value="experience" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Previous Experience</TabsTrigger>
                  <TabsTrigger value="banking" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Banking Information</TabsTrigger>
                  <TabsTrigger value="kyc" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Aadhaar / PAN / KYC</TabsTrigger>
                  <TabsTrigger value="pf_esic" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">PF & ESIC Registry</TabsTrigger>
                  <TabsTrigger value="salary" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Salary Structure</TabsTrigger>
                  <TabsTrigger value="documents" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Document Vault</TabsTrigger>
                  <TabsTrigger value="assets" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Assigned Assets</TabsTrigger>
                  <TabsTrigger value="training" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Upskilling & LMS</TabsTrigger>
                  <TabsTrigger value="performance" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">KPIs & Performance</TabsTrigger>
                  <TabsTrigger value="notes" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Internal HR Notes</TabsTrigger>
                  <TabsTrigger value="timeline" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Career & Position History</TabsTrigger>
                  <TabsTrigger value="onboarding" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Onboarding Tasks</TabsTrigger>
                  <TabsTrigger value="exit" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Exit & Offboarding</TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Tabs Content */}
          <div className="flex-1 min-w-0">
            {/* 1. PERSONAL */}
            <TabsContent value="personal" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Personal Profile Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p className="font-semibold">{employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Gender</p>
                      <p className="font-semibold uppercase">{employee.gender ?? 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Marital Status</p>
                      <p className="font-semibold">{employee.maritalStatus || 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Nationality</p>
                      <p className="font-semibold">{employee.nationality || 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Blood Group</p>
                      <p className="font-semibold">{employee.bloodGroup || 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Religion</p>
                      <p className="font-semibold">{employee.religion || 'No information available'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* BIOMETRIC & FACE REGISTRATION */}
            <TabsContent value="biometric" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Camera className="h-4 w-4 text-primary" /> Face Biometric & Attendance Gateway
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Register employee facial embedding for automated live attendance, geofence, & mobile punch verification.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {employee.faceTemplate && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-semibold gap-1.5"
                        onClick={() => setIsViewTemplateOpen(true)}
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                        View Registered Face
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                      onClick={() => setIsRegisterFaceOpen(true)}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {employee.faceTemplate ? 'Re-Register Face' : 'Register Face'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3.5 border border-border/80 rounded-xl bg-muted/20 space-y-1">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Face Registration Status</span>
                      {employee.faceTemplate ? (
                        <Badge className="bg-emerald-600 text-white font-semibold text-[11px] gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Registered
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300 font-semibold text-[11px] gap-1">
                          <AlertCircle className="h-3 w-3 text-amber-600" /> Not Registered
                        </Badge>
                      )}
                    </div>

                    <div className="p-3.5 border border-border/80 rounded-xl bg-muted/20 space-y-1">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Registration Date</span>
                      <p className="font-semibold text-foreground font-mono">
                        {employee.faceRegisteredAt ? new Date(employee.faceRegisteredAt).toLocaleString() : 'Not registered yet'}
                      </p>
                    </div>

                    <div className="p-3.5 border border-border/80 rounded-xl bg-muted/20 space-y-1">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Registered By</span>
                      <p className="font-semibold text-foreground">
                        {employee.faceRegisteredBy || 'HR Administrator'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <ShieldAlert className="h-4 w-4" />
                      <span>Biometric Data Policy & Privacy Standard</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Biometric facial landmark vectors are encrypted using standard 128-dimensional float arrays. Raw face photographs are never stored in log records. Biometric data is exclusively used for verifying employee check-in / check-out times at office geofence locations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 2. CONTACT */}
            <TabsContent value="contact" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Contact & Address Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Personal Phone</p>
                      <p className="font-semibold">{employee.phone ?? 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Work Phone</p>
                      <p className="font-semibold">{employee.workPhone ?? 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Work Email</p>
                      <p className="font-semibold">{employee.workEmail ?? 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Personal Email</p>
                      <p className="font-semibold">{employee.personalEmail ?? 'No information available'}</p>
                    </div>
                  </div>
                  <div className="border-t pt-3 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-semibold">Current Address</p>
                      <p className="text-foreground leading-normal">{employee.currentAddress || 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-semibold">Permanent Address</p>
                      <p className="text-foreground leading-normal">{employee.permanentAddress || 'No information available'}</p>
                    </div>
                  </div>
                  <div className="border-t pt-3 grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">City</p>
                      <p className="font-semibold">{employee.city || 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">State</p>
                      <p className="font-semibold">{employee.state || 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Country</p>
                      <p className="font-semibold">{employee.country || 'No information available'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Pincode</p>
                      <p className="font-semibold">{employee.pincode || 'No information available'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3. FAMILY */}
            <TabsContent value="family" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Family Details & Nominees</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  {employee.familyMemberName || employee.nomineeName ? (
                    <>
                      {employee.familyMemberName && (
                        <div className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-semibold">{employee.familyMemberName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {employee.familyRelationship || 'Family Member'} 
                              {employee.familyDob ? ` &bull; DOB: ${new Date(employee.familyDob).toLocaleDateString()}` : ''}
                              {employee.familyContact ? ` &bull; Phone: ${employee.familyContact}` : ''}
                            </p>
                          </div>
                          <Badge variant="outline">Family</Badge>
                        </div>
                      )}
                      {employee.nomineeName && (
                        <div className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="font-semibold">{employee.nomineeName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {employee.nomineeRelationship || 'Nominee'} 
                              {employee.nomineeShare ? ` &bull; Share: ${employee.nomineeShare}%` : ''}
                            </p>
                          </div>
                          <Badge variant="outline">Nominee</Badge>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No records found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 4. EDUCATION */}
            <TabsContent value="education" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Academic Education History</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  {employee.educationQualification ? (
                    <div className="border-l-2 border-primary pl-3 py-1">
                      <p className="font-semibold">{employee.educationQualification}</p>
                      <p className="text-muted-foreground">
                        {employee.educationInstitution || 'No Institution'} &bull; {employee.educationUniversity || 'No Board/University'} 
                        {employee.educationPassingYear ? ` &bull; Class of ${employee.educationPassingYear}` : ''}
                      </p>
                      {employee.educationPercentage && (
                        <p className="text-[10px] text-primary font-medium mt-1">Percentage / Grade: {employee.educationPercentage}%</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No records found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 5. EXPERIENCE */}
            <TabsContent value="experience" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Previous Work Experience</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  {employee.prevCompany ? (
                    <div className="border-l-2 border-emerald-500 pl-3 py-1">
                      <p className="font-semibold">{employee.prevJobTitle || 'Previous Employee'}</p>
                      <p className="text-muted-foreground">
                        {employee.prevCompany} 
                        {employee.prevStartDate ? ` &bull; ${new Date(employee.prevStartDate).toLocaleDateString()}` : ''}
                        {employee.prevEndDate ? ` - ${new Date(employee.prevEndDate).toLocaleDateString()}` : ''}
                      </p>
                      {employee.prevTotalExp && (
                        <p className="text-[10px] text-muted-foreground font-medium mt-1">Total Experience: {employee.prevTotalExp}</p>
                      )}
                      {employee.prevReasonForLeaving && (
                        <p className="text-[10px] text-muted-foreground leading-normal mt-1">Reason for Leaving: {employee.prevReasonForLeaving}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No records found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 6. BANKING */}
            <TabsContent value="banking" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Banking Details (Salary Account)</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {employee.bankName || employee.bankAccountNumber ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Bank Name</p>
                        <p className="font-semibold">{employee.bankName || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Account Number</p>
                        <p className="font-semibold font-mono">{employee.bankAccountNumber || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">IFSC Code</p>
                        <p className="font-semibold font-mono uppercase">{employee.bankIfscCode || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Branch Location</p>
                        <p className="font-semibold">{employee.bankBranchName || 'No information available'}</p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <p className="text-muted-foreground">Account Holder Name</p>
                        <p className="font-semibold">{employee.bankAccountHolderName || 'No information available'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No information available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 7. KYC */}
            <TabsContent value="kyc" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">KYC Credentials (Aadhaar & PAN)</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {employee.aadhaarNumber || employee.panNumber ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Aadhaar Number (UIDAI)</p>
                        <p className="font-semibold font-mono">{employee.aadhaarNumber || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Income Tax PAN Number</p>
                        <p className="font-semibold font-mono uppercase">{employee.panNumber || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Passport Number</p>
                        <p className="font-semibold font-mono uppercase">{employee.passportNumber || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Verification Status</p>
                        <div>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] uppercase">
                            {employee.kycStatus || 'PENDING'}
                          </Badge>
                          {employee.kycVerificationDate && (
                            <span className="text-[10px] text-muted-foreground ml-2">Verified: {new Date(employee.kycVerificationDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No information available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 8. PF & ESIC */}
            <TabsContent value="pf_esic" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Provident Fund & ESIC Registration</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {employee.uanNumber || employee.pfMemberId || employee.esicNumber ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Universal Account Number (UAN)</p>
                        <p className="font-semibold font-mono">{employee.uanNumber || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">PF Member ID</p>
                        <p className="font-semibold font-mono">{employee.pfMemberId || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">ESIC IP Number</p>
                        <p className="font-semibold font-mono">{employee.esicNumber || 'No information available'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Applicability</p>
                        <div className="flex gap-2">
                          <Badge variant="outline">PF: {employee.pfApplicable ? 'Yes' : 'No'}</Badge>
                          <Badge variant="outline">ESIC: {employee.esicApplicable ? 'Yes' : 'No'}</Badge>
                        </div>
                      </div>
                      {employee.pfEsicJoiningDate && (
                        <div className="space-y-1 col-span-2">
                           <p className="text-muted-foreground">PF/ESIC Joining Date</p>
                           <p className="font-semibold">{new Date(employee.pfEsicJoiningDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No information available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 9. SALARY */}
            <TabsContent value="salary" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span>Compensation Salary Structure</span>
                    {(employee.annualCtc || employee.basicSalary) && (
                      <Badge className="bg-purple-600 text-white font-bold text-[10px]">
                        Synced from Payroll
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  {employee.annualCtc || employee.basicSalary ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 border-b pb-3 mb-3">
                        <div>
                          <p className="text-muted-foreground">Salary Grade / Band</p>
                          <p className="font-semibold text-primary">
                            {employee.salaryGrade || 'No Grade Specified'} {employee.salaryBand ? `(${employee.salaryBand})` : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total CTC (Annual Cost to Company)</p>
                          <p className="font-semibold text-lg text-foreground">
                            {employee.annualCtc ? `₹${employee.annualCtc.toLocaleString()} / annum` : 'No information available'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {typeof employee.basicSalary === 'number' && (
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Basic Salary</span>
                            <span className="font-semibold font-mono">₹{employee.basicSalary.toLocaleString()} / month</span>
                          </div>
                        )}
                        {typeof employee.hra === 'number' && (
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">House Rent Allowance (HRA)</span>
                            <span className="font-semibold font-mono">₹{employee.hra.toLocaleString()} / month</span>
                          </div>
                        )}
                        {typeof employee.conveyance === 'number' && (
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Conveyance Allowance</span>
                            <span className="font-semibold font-mono">₹{employee.conveyance.toLocaleString()} / month</span>
                          </div>
                        )}
                        {typeof employee.specialAllowance === 'number' && (
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Special Allowance</span>
                            <span className="font-semibold font-mono">₹{employee.specialAllowance.toLocaleString()} / month</span>
                          </div>
                        )}
                        {typeof employee.otherAllowances === 'number' && (
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">Other Allowances</span>
                            <span className="font-semibold font-mono">₹{employee.otherAllowances.toLocaleString()} / month</span>
                          </div>
                        )}
                        {typeof employee.grossSalary === 'number' && (
                          <div className="flex justify-between pt-1 text-sm font-bold text-emerald-600">
                            <span>Gross Salary</span>
                            <span className="font-mono">₹{employee.grossSalary.toLocaleString()} / month</span>
                          </div>
                        )}
                        {employee.salaryEffectiveFrom && (
                          <p className="text-[10px] text-muted-foreground italic pt-2">
                            Effective Date: {new Date(employee.salaryEffectiveFrom).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 space-y-2">
                      <p className="text-xs font-bold text-muted-foreground">No salary structure assigned</p>
                      <Button size="sm" variant="outline" className="text-xs font-bold border-purple-500/30 text-purple-600">
                        Select Salary Structure
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 10. DOCUMENTS */}
            <TabsContent value="documents" className="m-0">
              <Card className="shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                  <CardTitle className="text-base font-semibold">Documents Vault</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ID_PROOF">ID Proof</SelectItem>
                        <SelectItem value="ADDRESS_PROOF">Address Proof</SelectItem>
                        <SelectItem value="EDUCATION">Education Certificate</SelectItem>
                        <SelectItem value="OFFER_LETTER">Offer Letter</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadMutation.mutate(file);
                      }}
                    />
                    <Button size="sm" className="text-xs h-8" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                      <Upload className="mr-1.5 h-4 w-4" /> Upload Document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  {employee.documents && employee.documents.length > 0 ? (
                    employee.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs hover:bg-muted/30 transition-colors">
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.docType}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeDocMutation.mutate(doc.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No documents uploaded yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 11. ASSETS */}
            <TabsContent value="assets" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                  <CardTitle className="text-sm font-semibold">Assigned Company Assets</CardTitle>
                  <Dialog open={isAssetOpen} onOpenChange={setIsAssetOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="text-xs h-8 gap-1">
                        <Plus className="h-3.5 w-3.5" /> Allocate Asset
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Allocate Company Asset</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2 text-xs">
                        <div className="space-y-1.5">
                          <Label>Select Available Asset *</Label>
                          <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Choose an asset in stock..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableAssets.map((asset) => (
                                <SelectItem key={asset.id} value={asset.id}>
                                  {asset.name} &bull; {asset.assetTag} ({asset.category})
                                </SelectItem>
                              ))}
                              {availableAssets.length === 0 && (
                                <SelectItem value="none" disabled>No assets available in stock</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Remarks / Allocation Notes</Label>
                          <Input value={assetRemarks} onChange={(e) => setAssetRemarks(e.target.value)} placeholder="e.g. Issued for remote work development" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          disabled={!selectedAssetId || allocateAssetMutation.isPending}
                          onClick={() => allocateAssetMutation.mutate()}
                          size="sm"
                        >
                          Confirm Allocation
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  {employee.currentAssets && employee.currentAssets.length > 0 ? (
                    employee.currentAssets.map((asset) => (
                      <div key={asset.id} className="flex justify-between items-center border-b pb-3 last:border-b-0 hover:bg-muted/10 p-1.5 rounded-lg transition-all">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Laptop className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{asset.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Asset Tag: <span className="font-mono">{asset.assetTag}</span> &middot; Category: {asset.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{asset.status}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:bg-destructive/5 font-semibold"
                            onClick={() => returnAssetMutation.mutate(asset.id)}
                            disabled={returnAssetMutation.isPending}
                          >
                            Return Asset
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No assets assigned</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 12. TRAINING */}
            <TabsContent value="training" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                  <CardTitle className="text-sm font-semibold">Upskilling & LMS Enrollments</CardTitle>
                  <Dialog open={isCourseOpen} onOpenChange={setIsCourseOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="text-xs h-8 gap-1">
                        <Plus className="h-3.5 w-3.5" /> Enroll Course
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enroll in Course / Workshop</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2 text-xs">
                        <div className="space-y-1.5">
                          <Label>Course Title *</Label>
                          <Input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g. ISO 27001 Data Security certification" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Category / Type *</Label>
                            <Select value={courseType} onValueChange={setCourseType}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Compliance">Compliance</SelectItem>
                                <SelectItem value="Safety">Safety</SelectItem>
                                <SelectItem value="Technical">Technical</SelectItem>
                                <SelectItem value="Management">Management</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Enrollment Status *</Label>
                            <Select value={courseStatus} onValueChange={setCourseStatus}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Awarded Certification / Credential (Optional)</Label>
                          <Input value={courseCert} onChange={(e) => setCourseCert(e.target.value)} placeholder="e.g. Cert-ISO27001-Lead" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          disabled={!courseName || enrollCourseMutation.isPending}
                          onClick={() => enrollCourseMutation.mutate()}
                          size="sm"
                        >
                          Enroll Employee
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  {employee.courseEnrollments && employee.courseEnrollments.length > 0 ? (
                    employee.courseEnrollments.map((course) => (
                      <div key={course.id} className="flex justify-between items-center border-b pb-3 last:border-b-0 hover:bg-muted/10 p-1.5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                            <Award className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{course.courseName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Type: {course.courseType} &bull; Enrolled: {new Date(course.enrollmentDate).toLocaleDateString()}
                              {course.completionDate ? ` &bull; Completed: ${new Date(course.completionDate).toLocaleDateString()}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={course.status === 'Completed' ? 'secondary' : 'outline'}>{course.status}</Badge>
                          {course.certification && <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100">{course.certification}</Badge>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No upskilling records found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 13. PERFORMANCE */}
            <TabsContent value="performance" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                  <CardTitle className="text-sm font-semibold">Performance Reviews & Appraisal KPIs</CardTitle>
                  <Dialog open={isKpiOpen} onOpenChange={setIsKpiOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="text-xs h-8 gap-1">
                        <Plus className="h-3.5 w-3.5" /> Add KPI Rating
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add KPI Appraisal Record</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2 text-xs">
                        <div className="space-y-1.5">
                          <Label>KPI Target Description *</Label>
                          <Input value={kpiTitle} onChange={(e) => setKpiTitle(e.target.value)} placeholder="e.g. Maintain product delivery sprint goals" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Category *</Label>
                            <Select value={kpiCategory} onValueChange={setKpiCategory}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Quality">Quality</SelectItem>
                                <SelectItem value="Speed">Speed</SelectItem>
                                <SelectItem value="Leadership">Leadership</SelectItem>
                                <SelectItem value="Efficiency">Efficiency</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Review Period *</Label>
                            <Input value={kpiPeriod} onChange={(e) => setKpiPeriod(e.target.value)} placeholder="e.g. Q3 2026" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Target Value *</Label>
                            <Input value={kpiTarget} onChange={(e) => setKpiTarget(e.target.value)} placeholder="e.g. 98% uptime" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Weightage (%) *</Label>
                            <Input type="number" value={kpiWeight} onChange={(e) => setKpiWeight(Number(e.target.value))} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Performance Rating (0.0 - 5.0)</Label>
                            <Input type="number" step="0.1" min="0" max="5" value={kpiRating} onChange={(e) => setKpiRating(e.target.value)} placeholder="e.g. 4.5" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Manager Appraisal Feedback</Label>
                          <textarea
                            value={kpiFeedback}
                            onChange={(e: any) => setKpiFeedback(e.target.value)}
                            placeholder="Appraisal summary notes..."
                            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          disabled={!kpiTitle || addKpiMutation.isPending}
                          onClick={() => addKpiMutation.mutate()}
                          size="sm"
                        >
                          Save Appraisal KPI
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  {employee.kpis && employee.kpis.length > 0 ? (
                    employee.kpis.map((kpi) => (
                      <div key={kpi.id} className="border-l-2 border-primary pl-3 py-1 space-y-1 bg-muted/10 p-3 rounded-r-lg hover:bg-muted/20 transition-all">
                        <p className="font-semibold text-foreground">{kpi.kpi} <span className="text-[10px] text-muted-foreground font-normal">({kpi.category})</span></p>
                        <p className="text-muted-foreground text-[10px]">
                          Target: {kpi.target} &bull; Weightage: {kpi.weightage}% &bull; Review Period: {kpi.reviewPeriod}
                        </p>
                        {kpi.performanceRating !== null && (
                          <p className="text-[10px] font-semibold text-primary flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-primary" /> Rating: {kpi.performanceRating} / 5.0
                          </p>
                        )}
                        {kpi.managerFeedback && (
                          <p className="text-[10px] text-muted-foreground italic bg-background p-1.5 rounded border mt-1">Feedback: "{kpi.managerFeedback}"</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No KPI appraisal records found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 14. NOTES */}
            <TabsContent value="notes" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                  <CardTitle className="text-sm font-semibold">Supervisor & Internal HR Notes</CardTitle>
                  <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="text-xs h-8 gap-1">
                        <Plus className="h-3.5 w-3.5" /> Add Note
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Internal HR / Supervisor Note</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>Note Type *</Label>
                            <Select value={noteType} onValueChange={setNoteType}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="General">General</SelectItem>
                                <SelectItem value="Performance">Performance</SelectItem>
                                <SelectItem value="Disciplinary">Disciplinary</SelectItem>
                                <SelectItem value="Reward">Reward</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label>Created By / Author *</Label>
                            <Input value={noteAuthor} onChange={(e) => setNoteAuthor(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Note Content *</Label>
                          <textarea
                            value={noteContent}
                            onChange={(e: any) => setNoteContent(e.target.value)}
                            placeholder="Record details here securely..."
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          disabled={!noteContent || addNoteMutation.isPending}
                          onClick={() => addNoteMutation.mutate()}
                          size="sm"
                        >
                          Save Secured Note
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  {employee.hrNotes && employee.hrNotes.length > 0 ? (
                    employee.hrNotes.map((note) => (
                      <div key={note.id} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-amber-700 flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" /> {note.noteType} Note</span>
                          <span className="text-[10px] text-muted-foreground font-mono">by {note.createdBy} &bull; {new Date(note.createdDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-muted-foreground leading-normal">{note.note}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No HR / supervisor notes registered</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 15. CAREER & POSITION HISTORY */}
            <TabsContent value="timeline" className="m-0 space-y-6">
              {/* CURRENT POSITION CARD */}
              {(() => {
                const historyList: any[] = (employee as any).positionHistory || [];
                const currentPos = historyList.find((h) => h.status === 'CURRENT') || historyList[0];

                return (
                  <>
                    <Card className="shadow-2xs border-primary/40 bg-primary/5">
                      <CardHeader className="pb-3 border-b border-primary/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-primary">Current Position</CardTitle>
                            <p className="text-lg font-bold text-foreground mt-0.5">
                              {currentPos?.designationTitle || employee.designation?.title || 'No Designation'}
                            </p>
                          </div>
                          <Badge className="bg-emerald-600 text-white font-semibold text-[10.5px]">
                            CURRENT
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-[10.5px] text-muted-foreground font-semibold block">Department</span>
                          <span className="font-semibold text-foreground">{currentPos?.departmentName || employee.department?.name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10.5px] text-muted-foreground font-semibold block">Grade / Level</span>
                          <span className="font-semibold text-foreground">{getGradeLevelDisplay(currentPos?.grade || employee.grade, currentPos?.level || employee.level)}</span>
                        </div>
                        <div>
                          <span className="text-[10.5px] text-muted-foreground font-semibold block">Branch / Location</span>
                          <span className="font-semibold text-foreground">{currentPos?.branchName || employee.branch?.name || employee.location || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10.5px] text-muted-foreground font-semibold block">Effective From</span>
                          <span className="font-semibold font-mono text-foreground">
                            {currentPos?.effectiveDate
                              ? new Date(currentPos.effectiveDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
                              : employee.dateOfJoining
                                ? new Date(employee.dateOfJoining).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
                                : '-'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* POSITION HISTORY */}
                    <Card className="shadow-2xs">
                      <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-sm font-semibold flex items-center justify-between">
                          <span>Position History Log</span>
                          <span className="text-xs font-normal text-muted-foreground">{historyList.length} Movement Records</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 text-xs space-y-4">
                        {historyList.length > 0 ? (
                          historyList.map((hist: any) => (
                            <div key={hist.id} className="border rounded-xl p-4 space-y-3 bg-card hover:bg-muted/20 transition-all">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant={hist.movementType === 'JOINING' ? 'outline' : 'secondary'} className="uppercase text-[10px]">
                                    {hist.movementType.replace('_', ' ')}
                                  </Badge>
                                  <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                                    {new Date(hist.effectiveDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                                <Badge className={hist.status === 'CURRENT' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground'}>
                                  {hist.status}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-muted-foreground font-medium block text-[10.5px]">Designation:</span>
                                  <p className="font-semibold text-foreground mt-0.5">
                                    {hist.prevDesignationTitle && hist.prevDesignationTitle !== hist.designationTitle ? (
                                      <span className="flex items-center gap-1">
                                        <span className="text-muted-foreground line-through">{hist.prevDesignationTitle}</span>
                                        <span className="text-primary font-bold">&rarr; {hist.designationTitle}</span>
                                      </span>
                                    ) : (
                                      hist.designationTitle || '-'
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <span className="text-muted-foreground font-medium block text-[10.5px]">Grade / Level:</span>
                                  <p className="font-semibold text-foreground mt-0.5">
                                    {hist.prevGrade && hist.prevGrade !== hist.grade ? (
                                      <span className="flex items-center gap-1">
                                        <span className="text-muted-foreground line-through">{getGradeLevelDisplay(hist.prevGrade, null)}</span>
                                        <span className="text-primary font-bold">&rarr; {getGradeLevelDisplay(hist.grade, hist.level)}</span>
                                      </span>
                                    ) : (
                                      getGradeLevelDisplay(hist.grade, hist.level)
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <span className="text-muted-foreground font-medium block text-[10.5px]">Department:</span>
                                  <p className="font-semibold text-foreground mt-0.5">
                                    {hist.prevDepartmentName && hist.prevDepartmentName !== hist.departmentName ? (
                                      <span className="flex items-center gap-1">
                                        <span className="text-muted-foreground line-through">{hist.prevDepartmentName}</span>
                                        <span className="text-primary font-bold">&rarr; {hist.departmentName}</span>
                                      </span>
                                    ) : (
                                      hist.departmentName || '-'
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <span className="text-muted-foreground font-medium block text-[10.5px]">Branch / Location:</span>
                                  <p className="font-semibold text-foreground mt-0.5">
                                    {hist.prevBranchName && hist.prevBranchName !== hist.branchName ? (
                                      <span className="flex items-center gap-1">
                                        <span className="text-muted-foreground line-through">{hist.prevBranchName}</span>
                                        <span className="text-primary font-bold">&rarr; {hist.branchName}</span>
                                      </span>
                                    ) : (
                                      hist.branchName || '-'
                                    )}
                                  </p>
                                </div>
                              </div>

                              {(hist.reason || hist.remarks) && (
                                <div className="bg-muted/40 p-2.5 rounded-lg border text-[11px] space-y-1">
                                  {hist.reason && <p><strong>Reason:</strong> {hist.reason}</p>}
                                  {hist.remarks && <p className="text-muted-foreground"><strong>Remarks:</strong> {hist.remarks}</p>}
                                </div>
                              )}

                              {hist.approvedBy && (
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  Approved by: {hist.approvedBy} &bull; {hist.approvedDate ? new Date(hist.approvedDate).toLocaleDateString() : ''}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-6">No position history records found</p>
                        )}
                      </CardContent>
                    </Card>
                  </>
                );
              })()}

              {/* CAREER TIMELINE EVENTS */}
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Career Timeline Events</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-4">
                  <div className="relative border-l-2 border-primary/20 pl-4 space-y-6 py-2 ml-2">
                    {employee.timelineEvents && employee.timelineEvents.length > 0 ? (
                      employee.timelineEvents.map((evt) => (
                        <div key={evt.id} className="relative">
                          <span className="absolute -left-[21px] top-1 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background shrink-0 flex items-center justify-center">
                            <span className="h-1.5 w-1.5 bg-primary rounded-full" />
                          </span>
                          <p className="font-semibold text-foreground text-xs">{evt.eventTitle}</p>
                          <p className="text-muted-foreground text-[10px] font-medium mt-0.5">{new Date(evt.date).toLocaleDateString()}</p>
                          {evt.details && <p className="text-[10px] text-muted-foreground mt-1 bg-muted/40 p-2 rounded-lg leading-relaxed">{evt.details}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">No timeline events found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 16. ONBOARDING */}
            <TabsContent value="onboarding" className="m-0">
              <Card className="shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
                  <CardTitle className="text-base font-semibold">Onboarding Checklist</CardTitle>
                  <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="text-xs h-8">
                        <Plus className="mr-1.5 h-4 w-4" /> Add Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Onboarding Checklist Task</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2 text-xs">
                        <div className="space-y-1.5">
                          <Label>Task Title *</Label>
                          <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Set up payroll tax declarations" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Owner Group / Type *</Label>
                          <Select value={taskOwner} onValueChange={setTaskOwner}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HR">HR Group</SelectItem>
                              <SelectItem value="IT">IT Hardware Group</SelectItem>
                              <SelectItem value="ADMIN">Facility / Admin Group</SelectItem>
                              <SelectItem value="MANAGER">Reporting Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          disabled={!taskTitle || createTaskMutation.isPending}
                          onClick={() => createTaskMutation.mutate()}
                          size="sm"
                        >
                          Add Onboarding Task
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  {employee.onboardingTasks && employee.onboardingTasks.length > 0 ? (
                    employee.onboardingTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs hover:bg-muted/20 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-muted border flex items-center justify-center text-muted-foreground shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{task.title}</p>
                            <p className="text-[10px] text-muted-foreground">Responsible: {task.ownerType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={task.status} className="text-[10px] font-semibold" />
                          {task.status !== 'APPROVED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs border-border/80"
                              onClick={() => completeTaskMutation.mutate(task.id)}
                            >
                              <Check className="mr-1 h-3.5 w-3.5" /> Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No onboarding tasks registered yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 13. EXIT & OFFBOARDING */}
            <TabsContent value="exit" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Corporate Exit & Offboarding Lifecycle Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {activeExitRecord ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/40 rounded-xl border border-border/80">
                        <div>
                          <span className="text-muted-foreground text-[10.5px] block">Exit Record ID:</span>
                          <span className="font-mono font-semibold text-primary">{activeExitRecord.exitCode}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10.5px] block">Resignation Date:</span>
                          <span className="font-mono font-semibold text-foreground">
                            {new Date(activeExitRecord.resignationDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10.5px] block">Last Working Day (LWD):</span>
                          <span className="font-mono font-semibold text-foreground">
                            {new Date(activeExitRecord.adjustedLwd || activeExitRecord.lastWorkingDay).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10.5px] block">Offboarding Status:</span>
                          <Badge variant="outline" className="font-mono text-[10.5px] font-semibold">
                            {activeExitRecord.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-1 p-3 bg-card rounded-xl border">
                        <span className="font-semibold text-foreground">Stated Exit Reason & Remarks</span>
                        <p className="text-muted-foreground leading-relaxed">{activeExitRecord.exitReason}</p>
                        {activeExitRecord.remarks && (
                          <p className="text-[11px] text-muted-foreground italic mt-1">HR Notes: {activeExitRecord.remarks}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                          <span className="text-muted-foreground text-[10.5px] block">Clearance Progress</span>
                          <StatusBadge status={activeExitRecord.clearanceStatus === 'COMPLETED' ? 'ACTIVE' : 'PENDING'} label={activeExitRecord.clearanceStatus} className="text-[10px]" />
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                          <span className="text-muted-foreground text-[10.5px] block">Exit Interview</span>
                          <StatusBadge status={activeExitRecord.exitInterviewStatus === 'COMPLETED' ? 'ACTIVE' : 'PENDING'} label={activeExitRecord.exitInterviewStatus} className="text-[10px]" />
                        </div>
                        <div className="p-3 bg-muted/30 rounded-xl border space-y-1">
                          <span className="text-muted-foreground text-[10.5px] block">Full & Final (F&F)</span>
                          <StatusBadge status={activeExitRecord.fnfStatus === 'COMPLETED' ? 'ACTIVE' : 'PENDING'} label={activeExitRecord.fnfStatus} className="text-[10px]" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed rounded-xl space-y-1">
                      <p className="font-semibold text-foreground">No Exit Record Initiated</p>
                      <p className="text-muted-foreground text-[11px]">This employee is actively serving with no resignation logged.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>

      {/* REGISTER FACE MODAL */}
      <RegisterFaceModal
        isOpen={isRegisterFaceOpen}
        employeeId={employee.id}
        employeeName={`${employee.firstName} ${employee.lastName}`}
        employeeCode={employee.employeeCode}
        onClose={() => setIsRegisterFaceOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['employee', id] });
        }}
      />

      {/* VIEW REGISTERED FACE TEMPLATE DIALOG */}
      <Dialog open={isViewTemplateOpen} onOpenChange={setIsViewTemplateOpen}>
        <DialogContent className="max-w-md border-border/80 shadow-2xl p-6">
          <DialogHeader className="border-b border-border/60 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                <span>Registered Biometric Template Details</span>
              </div>
              <Badge className="bg-purple-600 text-white font-mono text-[10px]">
                {employee.employeeCode}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified biometric facial template persisted in database.
            </p>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            {/* Registered Face Photo Preview Container */}
            <div className="flex flex-col items-center justify-center pt-1">
              {employee.facePhoto ? (
                <div className="relative w-40 h-48 rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-lg">
                  <img
                    src={employee.facePhoto}
                    alt={`${employee.firstName} ${employee.lastName} Registered Face`}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute bottom-2 left-2 right-2 justify-center bg-black/75 text-white backdrop-blur-xs text-[9.5px] font-semibold">
                    ✓ Verified Registration Image
                  </Badge>
                </div>
              ) : (
                <div className="w-40 h-48 rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center p-3 text-center bg-muted/20 text-muted-foreground">
                  <Camera className="h-8 w-8 mb-1 opacity-50 text-purple-500" />
                  <span className="text-[10px] font-medium">No Snapshot Available</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">Re-register to store image preview</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-muted/40 rounded-xl border space-y-1">
              <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Employee Profile</span>
              <strong className="text-sm font-bold text-foreground block">
                {employee.firstName} {employee.lastName}
              </strong>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold block text-[10px] uppercase">Template Status</span>
                <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300 block mt-0.5">✓ Registered & Persisted</span>
              </div>
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <span className="text-purple-700 dark:text-purple-400 font-semibold block text-[10px] uppercase">Descriptor Model</span>
                <span className="font-bold text-xs text-purple-800 dark:text-purple-300 block mt-0.5">Affine 128-D HOG</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 text-slate-300 rounded-xl border border-slate-800 font-mono text-[10.5px] space-y-1">
              <div className="text-purple-400 font-sans font-bold text-xs">🔒 Database Biometric Payload:</div>
              <div><span className="text-slate-500">Employee ID:</span> {employee.id}</div>
              <div><span className="text-slate-500">Registered Date:</span> {employee.faceRegisteredAt ? new Date(employee.faceRegisteredAt).toLocaleString() : 'N/A'}</div>
              <div><span className="text-slate-500">Registered By:</span> {employee.faceRegisteredBy || 'HR Administrator'}</div>
              <div><span className="text-slate-500">Vector Dimension:</span> 128 Float Array (L2 Normalized)</div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border/60">
            <Button size="sm" variant="outline" onClick={() => setIsViewTemplateOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground font-semibold gap-1.5"
              onClick={() => {
                setIsViewTemplateOpen(false);
                setIsRegisterFaceOpen(true);
              }}
            >
              <Camera className="h-3.5 w-3.5" /> Re-Register Face
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="shadow-2xs">
      <CardContent className="p-4 text-xs">
        <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">{label}</p>
        <p className="mt-1 text-sm font-bold text-foreground truncate">{value}</p>
      </CardContent>
    </Card>
  );
}
