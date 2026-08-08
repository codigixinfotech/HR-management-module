import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Trash2, Plus, Check } from 'lucide-react';
import { employeesApi } from '@/api/employees';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { ApprovalStatus, EmployeeStatus } from '@/api/types';

const STATUS_OPTIONS: EmployeeStatus[] = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED'];

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState('ID_PROOF');
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskOwner, setTaskOwner] = useState('HR');

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeesApi.get(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: EmployeeStatus) => employeesApi.update(id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Status updated');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => employeesApi.uploadDocument(id!, file, docType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Document uploaded');
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Upload failed'),
  });

  const removeDocMutation = useMutation({
    mutationFn: (documentId: string) => employeesApi.removeDocument(id!, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      toast.success('Document removed');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: () => employeesApi.createOnboardingTask(id!, { title: taskTitle, ownerType: taskOwner }),
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

  if (isLoading || !employee) {
    return <p className="text-sm text-muted-foreground">Loading employee...</p>;
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
          <h1 className="text-2xl font-semibold ">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {employee.employeeCode} &middot; {employee.designation?.title ?? 'No designation'}
          </p>
        </div>
        <div className="ml-auto w-40">
          <Select value={employee.status} onValueChange={(v) => statusMutation.mutate(v as EmployeeStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <InfoCard label="Company" value={employee.company?.name ?? '-'} />
        <InfoCard label="Business Unit" value={employee.businessUnit ?? 'Technology Services'} />
        <InfoCard label="Department" value={employee.department?.name ?? '-'} />
        <InfoCard label="Designation" value={employee.designation?.title ?? '-'} />
        <InfoCard label="Branch Facility" value={employee.branch?.name ?? 'Head Office'} />
        <InfoCard label="Work Location" value={employee.location ?? 'New York HQ'} />
        <InfoCard label="Shift Assignment" value={employee.shift ?? 'General Day Shift (G)'} />
        <InfoCard label="Job Grade / Level" value={`${employee.grade ?? 'E2'} / ${employee.level ?? 'L1'}`} />
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
                  <TabsTrigger value="timeline" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Career Timeline</TabsTrigger>
                  <TabsTrigger value="onboarding" className="justify-start text-xs px-3 py-2 w-full text-left font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Onboarding Tasks</TabsTrigger>
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
                      <p className="font-semibold">{employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : '12 Dec 1994'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Gender</p>
                      <p className="font-semibold uppercase">{employee.gender ?? 'MALE'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Marital Status</p>
                      <p className="font-semibold">Single</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Nationality</p>
                      <p className="font-semibold">Indian</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Blood Group</p>
                      <p className="font-semibold">O+ Positive</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Religion</p>
                      <p className="font-semibold">Hindustan / Secular</p>
                    </div>
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
                      <p className="font-semibold">{employee.phone ?? '+91 98765 43210'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Work Phone</p>
                      <p className="font-semibold">+91 20 6789 0100 ext 443</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Work Email</p>
                      <p className="font-semibold">{employee.workEmail ?? '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Personal Email</p>
                      <p className="font-semibold">personal.contact@email.com</p>
                    </div>
                  </div>
                  <div className="border-t pt-3 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-semibold">Current Address</p>
                      <p className="text-foreground leading-normal">Flat 402, Sunshine Heights, Kalyani Nagar, Pune - 411006</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-semibold">Permanent Address</p>
                      <p className="text-foreground leading-normal">Flat 402, Sunshine Heights, Kalyani Nagar, Pune - 411006</p>
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
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-semibold">Savitri Sharma</p>
                      <p className="text-[10px] text-muted-foreground">Mother &bull; Primary Nominee (50% share)</p>
                    </div>
                    <Badge variant="outline">Nominee</Badge>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-semibold">Gopal Sharma</p>
                      <p className="text-[10px] text-muted-foreground">Father &bull; Nominee (50% share)</p>
                    </div>
                    <Badge variant="outline">Nominee</Badge>
                  </div>
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
                  <div className="border-l-2 border-primary pl-3 py-1">
                    <p className="font-semibold">Bachelor of Technology in Computer Science</p>
                    <p className="text-muted-foreground">Pune Institute of Computer Technology &bull; 2013 - 2017</p>
                    <p className="text-[10px] text-primary font-medium mt-1">First Class with Distinction (GPA 8.9/10)</p>
                  </div>
                  <div className="border-l-2 border-muted pl-3 py-1">
                    <p className="font-semibold">Higher Secondary School Certificate (12th)</p>
                    <p className="text-muted-foreground">Kendriya Vidyalaya &bull; Class of 2013</p>
                  </div>
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
                  <div className="border-l-2 border-emerald-500 pl-3 py-1">
                    <p className="font-semibold">Software Developer</p>
                    <p className="text-muted-foreground">Infosys Technologies Ltd &bull; 2019 - 2022</p>
                    <p className="text-muted-foreground leading-normal mt-1">Built frontend dashboards using React, optimized SQL queries and worked in agile sprint deliveries.</p>
                  </div>
                  <div className="border-l-2 border-muted pl-3 py-1">
                    <p className="font-semibold">Junior Web Developer</p>
                    <p className="text-muted-foreground">Wipro Infotech &bull; 2017 - 2019</p>
                  </div>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Bank Name</p>
                      <p className="font-semibold">HDFC Bank Limited</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Account Number</p>
                      <p className="font-semibold font-mono">501002991823</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">IFSC Code</p>
                      <p className="font-semibold font-mono uppercase">HDFC0000104</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Branch Location</p>
                      <p className="font-semibold">Kalyani Nagar, Pune</p>
                    </div>
                  </div>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Aadhaar Number (UIDAI)</p>
                      <p className="font-semibold font-mono">4567 8901 2345</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Income Tax PAN Number</p>
                      <p className="font-semibold font-mono uppercase">ABCDE1234F</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Passport Number</p>
                      <p className="font-semibold font-mono uppercase">Z9876543</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Verification Status</p>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">VERIFIED</Badge>
                    </div>
                  </div>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Universal Account Number (UAN)</p>
                      <p className="font-semibold font-mono">100918273645</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">PF Member ID</p>
                      <p className="font-semibold font-mono">MH/BAN/0099182/000/1234567</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">ESIC IP Number</p>
                      <p className="font-semibold font-mono">3112456789</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">EPF Scheme Enrolment Date</p>
                      <p className="font-semibold">{employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '01 Jun 2022'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 9. SALARY */}
            <TabsContent value="salary" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Compensation Salary Structure</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  <div className="grid grid-cols-2 gap-4 border-b pb-3 mb-3">
                    <div>
                      <p className="text-muted-foreground">Payroll Group</p>
                      <p className="font-semibold text-primary">Standard IT Payroll Group</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total CTC (Annual Cost to Company)</p>
                      <p className="font-semibold text-lg text-foreground">₹7,20,000 / annum</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Basic Salary</span>
                      <span className="font-semibold font-mono">₹30,000 / month</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">House Rent Allowance (HRA)</span>
                      <span className="font-semibold font-mono">₹15,000 / month</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Conveyance Allowance</span>
                      <span className="font-semibold font-mono">₹3,000 / month</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Special Allowance</span>
                      <span className="font-semibold font-mono">₹12,000 / month</span>
                    </div>
                    <div className="flex justify-between pt-1 text-sm font-bold text-emerald-600">
                      <span>Gross Salary</span>
                      <span className="font-mono">₹60,000 / month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 10. DOCUMENTS */}
            <TabsContent value="documents" className="m-0">
              <Card className="shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between">
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
                      <Upload className="mr-1.5 h-4 w-4" /> Upload
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {employee.documents && employee.documents.length > 0 ? (
                    employee.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
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
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Assigned Company Assets</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-semibold">MacBook Pro M3 Pro (16-inch)</p>
                      <p className="text-[10px] text-muted-foreground">Asset Tag: AST-0022 &bull; Issued Date: {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '01 Jun 2022'}</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">ALLOCATED</Badge>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-semibold">Enterprise iPhone 15</p>
                      <p className="text-[10px] text-muted-foreground">Asset Tag: AST-0023 &bull; Issued Date: {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '01 Jun 2022'}</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">ALLOCATED</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 12. TRAINING */}
            <TabsContent value="training" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Upskilling & LMS Enrollments</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-semibold">ISO 27001 Information Security Compliance</p>
                      <p className="text-[10px] text-muted-foreground">Hours: 4.5 hrs &bull; Rating: 4.9</p>
                    </div>
                    <Badge variant="destructive">MANDATORY</Badge>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-semibold">React 19 Frontend Engineering Best Practices</p>
                      <p className="text-[10px] text-muted-foreground">Hours: 12 hrs &bull; Rating: 5.0</p>
                    </div>
                    <Badge className="bg-indigo-500/10 text-indigo-600">ELECTIVE</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 13. PERFORMANCE */}
            <TabsContent value="performance" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Performance Reviews & Appraisal KPIs</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  <div className="border-l-2 border-emerald-500 pl-3 py-1">
                    <p className="font-semibold">2026 Annual Appraisal Review</p>
                    <p className="text-muted-foreground">Score: 4.8 / 5.0 &bull; Feedback: Outstanding contribution, team player.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 14. NOTES */}
            <TabsContent value="notes" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Supervisor & Internal HR Notes</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-3">
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-md p-3">
                    <p className="font-semibold">HR Note on Promotion Nomination</p>
                    <p className="text-muted-foreground leading-normal mt-1">Recommended for promotion to Tech Lead band in upcoming cycle based on performance review.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 15. TIMELINE */}
            <TabsContent value="timeline" className="m-0 space-y-4">
              <Card className="shadow-2xs">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-sm font-semibold">Employee Career Timeline</CardTitle>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-4">
                  <div className="relative border-l pl-4 space-y-4">
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="font-semibold">Joined Company Entity</p>
                      <p className="text-muted-foreground text-[10px]">{employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '01 Jun 2022'}</p>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                      <p className="font-semibold">Department & Designation Mapped</p>
                      <p className="text-muted-foreground text-[10px]">Technology &bull; Software Engineer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 16. ONBOARDING */}
            <TabsContent value="onboarding" className="m-0">
              <Card className="shadow-2xs">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold">Onboarding Tasks</CardTitle>
                  <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="text-xs h-8">
                        <Plus className="mr-1.5 h-4 w-4" /> Add Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Onboarding Task</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label>Title</Label>
                          <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Owner</Label>
                          <Select value={taskOwner} onValueChange={setTaskOwner}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HR">HR</SelectItem>
                              <SelectItem value="IT">IT</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="MANAGER">Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          disabled={!taskTitle || createTaskMutation.isPending}
                          onClick={() => createTaskMutation.mutate()}
                        >
                          Add task
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-2">
                  {employee.onboardingTasks && employee.onboardingTasks.length > 0 ? (
                    employee.onboardingTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-[10px] text-muted-foreground">Owner: {task.ownerType}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={task.status} className="text-[10px]" />
                          {task.status !== 'APPROVED' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => completeTaskMutation.mutate(task.id)}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">No onboarding tasks yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-xs">
        <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">{label}</p>
        <p className="mt-1 text-sm font-bold text-foreground truncate">{value}</p>
      </CardContent>
    </Card>
  );
}

