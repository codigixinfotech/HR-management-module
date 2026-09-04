import { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Calendar,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  MapPin,
  CheckSquare,
  ArrowLeft,
  UploadCloud,
  FileText,
  UserCheck,
  BookOpenCheck,
  Bell,
  Award,
  Sliders,
  RefreshCw,
  Wand2,
  Search,
  Building2,
  Edit,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { employeesApi } from '@/api/employees';
import type { TrainingBatch, TrainingProgram } from './types';

interface CreateProgramFormProps {
  initialData?: TrainingProgram | null;
  onBack: () => void;
  onSave: (program: TrainingProgram) => void;
}

export function CreateProgramForm({ initialData, onBack, onSave }: CreateProgramFormProps) {
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    employeesApi.list({ pageSize: 1000 }).then((res: any) => {
      const rawList: any[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.items)
        ? res.data.items
        : [];

      if (rawList.length > 0) {
        const mapped = rawList.map((e: any) => ({
          id: e.id,
          name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.name || e.employeeCode || 'Employee',
          department: typeof e.department === 'string' ? e.department : e.department?.name || 'Operations',
          designation: typeof e.designation === 'string' ? e.designation : e.designation?.title || 'Staff',
          company: e.company?.name || 'EHCM Enterprise Corp',
          grade: e.grade?.name || 'G3',
          location: e.branch?.name || 'Main Campus',
        }));
        setEmployees(mapped);
      }
    }).catch((err) => console.warn('Failed to load employees in CreateProgramModal:', err));
  }, []);
  const [activeSection, setActiveSection] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to generate fresh code
  const generateNewCode = () => `TRN-2026-${Math.floor(100 + Math.random() * 900)}`;

  // ① Basic Information & Objective
  const [name, setName] = useState(initialData?.name || '');
  const [code, setCode] = useState(initialData?.code || generateNewCode());
  const [category, setCategory] = useState(initialData?.category || 'Safety');
  const [trainingType, setTrainingType] = useState<'Mandatory' | 'Optional' | 'Recommended' | 'Remedial' | 'Development' | 'Technical' | 'Compliance'>(initialData?.type || 'Mandatory');
  const [description, setDescription] = useState(initialData?.description || '');
  const [objective, setObjective] = useState(initialData?.objective || '');

  // Company Selection Filter
  const [selectedCompany, setSelectedCompany] = useState<string>('All');

  // ② Trainer / Provider with Searchable Combobox
  const [trainerType, setTrainerType] = useState<'Internal' | 'External'>(initialData?.trainerType || 'Internal');
  const [selectedInternalTrainer, setSelectedInternalTrainer] = useState(initialData?.trainerType === 'Internal' ? initialData?.trainer || '' : '');
  const [trainerSearchQuery, setTrainerSearchQuery] = useState('');
  const [isTrainerDropdownOpen, setIsTrainerDropdownOpen] = useState(false);

  const [externalTrainer, setExternalTrainer] = useState(initialData?.trainerType === 'External' ? initialData?.trainer || '' : '');
  const [provider, setProvider] = useState(initialData?.provider || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || '');
  const [contactNumber, setContactNumber] = useState(initialData?.contactNumber || '');

  // Filtered internal trainers from Employee Master
  const filteredInternalTrainers = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedCompany !== 'All' && emp.company && emp.company !== selectedCompany) return false;
      if (!trainerSearchQuery) return true;
      const q = trainerSearchQuery.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.id.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q) ||
        (emp.company && emp.company.toLowerCase().includes(q))
      );
    });
  }, [employees, trainerSearchQuery, selectedCompany]);

  // ③ Target Employees with Search & Company-wise Filtering
  const [assignBy, setAssignBy] = useState<string>(initialData?.assignBy || 'Department');
  const [selectedDept, setSelectedDept] = useState<string>(initialData?.targetDepartment || 'All');
  const [selectedDesignation, setSelectedDesignation] = useState<string>(initialData?.targetDesignation || 'All');
  const [selectedGrade, setSelectedGrade] = useState<string>(initialData?.targetGrade || 'All');
  const [selectedLocation, setSelectedLocation] = useState<string>(initialData?.targetLocation || 'All');
  const [targetEmpSearch, setTargetEmpSearch] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>(
    initialData?.employeeStatuses?.map((e) => e.employeeId) || []
  );

  // Filtered employees roster from Employee Master
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (selectedCompany !== 'All' && e.company && e.company !== selectedCompany) return false;
      if (selectedDept !== 'All' && e.department !== selectedDept) return false;
      if (selectedLocation !== 'All' && e.location !== selectedLocation) return false;
      if (targetEmpSearch) {
        const q = targetEmpSearch.toLowerCase();
        const matchesName = e.name.toLowerCase().includes(q);
        const matchesCode = e.id.toLowerCase().includes(q);
        const matchesDesig = e.designation.toLowerCase().includes(q);
        const matchesComp = e.company ? e.company.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesCode && !matchesDesig && !matchesComp) return false;
      }
      return true;
    });
  }, [employees, selectedCompany, selectedDept, selectedLocation, targetEmpSearch]);

  // ④ Schedule & Sessions
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(initialData?.startDate || todayStr);
  const [endDate, setEndDate] = useState(initialData?.endDate || todayStr);
  const [startTime, setStartTime] = useState(initialData?.startTime || '10:00 AM');
  const [endTime, setEndTime] = useState(initialData?.endTime || '01:00 PM');
  const [durationHours, setDurationHours] = useState<number>(initialData?.durationHours || 3);
  const [deliveryMode, setDeliveryMode] = useState<'Classroom' | 'Online' | 'Hybrid'>(initialData?.deliveryMode || 'Classroom');
  const [location, setLocation] = useState(initialData?.location || '');
  const [meetingLink, setMeetingLink] = useState(initialData?.deliveryMode !== 'Classroom' ? initialData?.location || '' : '');
  const [capacity, setCapacity] = useState<number>(initialData?.capacity || 50);
  const [batches, setBatches] = useState<TrainingBatch[]>(initialData?.batches || []);

  // ⑤ Attendance & Completion Rules
  const [attendanceRequired, setAttendanceRequired] = useState<boolean>(initialData?.attendanceRequired ?? true);
  const [minAttendance, setMinAttendance] = useState<number>(initialData?.minAttendance || 80);
  const [attendanceMethod, setAttendanceMethod] = useState<'Manual' | 'QR Check-in' | 'Employee Check-in'>(initialData?.attendanceMethod || 'QR Check-in');
  const [completionBasis, setCompletionBasis] = useState<'Attendance' | 'Trainer Confirmation' | 'Attendance + Trainer Confirmation'>(initialData?.completionBasis || 'Attendance + Trainer Confirmation');
  const [trainerConfirmationReq, setTrainerConfirmationReq] = useState<boolean>(initialData?.trainerConfirmationReq ?? true);

  // ⑥ Assessment / Certification / Skill Update
  const [assessmentRequired, setAssessmentRequired] = useState<boolean>(initialData?.assessmentRequired ?? false);
  const [assessmentType, setAssessmentType] = useState<'Quiz' | 'Written Test' | 'Practical Evaluation'>(initialData?.assessmentType || 'Quiz');
  const [assessmentName, setAssessmentName] = useState(initialData?.assessmentName || '');
  const [passingScore, setPassingScore] = useState<number>(initialData?.passingScore || 60);
  const [attemptsAllowed, setAttemptsAllowed] = useState<number>(initialData?.attemptsAllowed || 2);

  const [certificateRequired, setCertificateRequired] = useState<boolean>(initialData?.certificateRequired ?? false);
  const [certificateType, setCertificateType] = useState(initialData?.certificateType || '');

  const [updateSkillMatrix, setUpdateSkillMatrix] = useState<boolean>(initialData?.updateSkillMatrix ?? false);
  const [skillName, setSkillName] = useState(initialData?.skillName || '');
  const [skillLevel, setSkillLevel] = useState(initialData?.skillLevel || 'Intermediate');
  const [skillImprovement, setSkillImprovement] = useState(initialData?.skillImprovement || '+1 Level');

  // ⑦ Notifications & Documents
  const [notifyAssigned, setNotifyAssigned] = useState<boolean>(initialData?.notifyAssigned ?? true);
  const [notifyReminder, setNotifyReminder] = useState<boolean>(initialData?.notifyReminder ?? true);
  const [notifyTrainer, setNotifyTrainer] = useState<boolean>(initialData?.notifyTrainer ?? true);
  const [notifyManager, setNotifyManager] = useState<boolean>(initialData?.notifyManager ?? true);
  const [reminderTiming, setReminderTiming] = useState(initialData?.reminderTiming || '1 Day Before');
  const [documents, setDocuments] = useState<{ name: string; size: string; type: string; url?: string }[]>(initialData?.documents || []);

  // Action to Load Sample Template
  const handleLoadSampleTemplate = () => {
    setName('Annual Workplace Safety Training 2026');
    setCategory('Safety');
    setTrainingType('Mandatory');
    setDescription('Annual workplace safety training covering fire safety, hazard prevention and emergency response.');
    setObjective('Improve employee awareness of workplace hazards, emergency procedures and safe working practices.');
    setSelectedCompany('Codigix Manufacturing Ltd');
    setTrainerType('External');
    setExternalTrainer('Rajesh Sharma');
    setProvider('SafetyFirst Corp & Internal EHS');
    setContactEmail('trainer@safetyfirst.example');
    setContactNumber('+91 98765 43210');
    setSelectedDept('Manufacturing');
    setSelectedGrade('G3 - G6');
    setSelectedLocation('Plant A');
    setSelectedEmpIds(['EMP-016', 'EMP-008', 'EMP-007', 'EMP-005']);
    setStartDate('2026-09-10');
    setEndDate('2026-09-10');
    setStartTime('10:00 AM');
    setEndTime('01:00 PM');
    setDurationHours(3);
    setDeliveryMode('Classroom');
    setLocation('Training Room 1');
    setBatches([
      { id: 'BCH-A', name: 'Safety Batch A', date: '2026-09-10', time: '10:00 AM – 01:00 PM', location: 'Training Room 1', trainer: 'Rajesh Sharma', capacity: 30, assignedCount: 30 },
      { id: 'BCH-B', name: 'Safety Batch B', date: '2026-09-12', time: '10:00 AM – 01:00 PM', location: 'Training Room 2', trainer: 'Rajesh Sharma', capacity: 30, assignedCount: 30 },
    ]);
    setAttendanceRequired(true);
    setMinAttendance(80);
    setAttendanceMethod('QR Check-in');
    setCompletionBasis('Attendance + Trainer Confirmation');
    setAssessmentRequired(true);
    setAssessmentType('Quiz');
    setAssessmentName('Workplace Safety Final Assessment');
    setPassingScore(60);
    setAttemptsAllowed(2);
    setCertificateRequired(true);
    setCertificateType('Training Completion Certificate');
    setUpdateSkillMatrix(true);
    setSkillName('Workplace Safety');
    setSkillLevel('Intermediate');
    setSkillImprovement('+1 Level');
    setDocuments([
      { name: 'Safety_Training_Agenda_2026.pdf', size: '1.2 MB', type: 'PDF' },
      { name: 'OSHA_Emergency_Response_SOP.docx', size: '850 KB', type: 'DOC' },
    ]);
    toast.info('Sample template data loaded into form!');
  };

  const handleToggleEmployee = (id: string) => {
    if (selectedEmpIds.includes(id)) {
      setSelectedEmpIds(selectedEmpIds.filter((e) => e !== id));
    } else {
      setSelectedEmpIds([...selectedEmpIds, id]);
    }
  };

  const handleSelectAllFilteredEmployees = () => {
    const filteredIds = filteredEmployees.map((e) => e.id);
    const allSelected = filteredIds.every((id) => selectedEmpIds.includes(id));
    if (allSelected) {
      setSelectedEmpIds(selectedEmpIds.filter((id) => !filteredIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedEmpIds, ...filteredIds]));
      setSelectedEmpIds(combined);
    }
  };

  const handleAddBatch = () => {
    const activeTrainer = trainerType === 'Internal' ? selectedInternalTrainer : externalTrainer;
    const newBatch: TrainingBatch = {
      id: `BCH-${String.fromCharCode(65 + batches.length)}`,
      name: `Session ${batches.length + 1} (${String.fromCharCode(65 + batches.length)})`,
      date: startDate || todayStr,
      time: `${startTime} – ${endTime}`,
      location: deliveryMode === 'Classroom' ? (location || 'Training Room 1') : (meetingLink || 'Virtual Meeting'),
      trainer: activeTrainer || 'Trainer',
      capacity: capacity || 30,
      assignedCount: 0,
    };
    setBatches([...batches, newBatch]);
  };

  const handleRemoveBatch = (id: string) => {
    setBatches(batches.filter((b) => b.id !== id));
  };

  // Real File Upload Handler using System File Picker
  const handleTriggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      let formattedSize = '1.2 MB';
      if (file.size < 1024 * 1024) {
        formattedSize = `${Math.round(file.size / 1024)} KB`;
      } else {
        formattedSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';

      const reader = new FileReader();
      reader.onload = () => {
        const fileDataUrl = reader.result as string;
        const newDoc = {
          name: file.name,
          size: formattedSize,
          type: ext,
          url: fileDataUrl,
        };
        setDocuments([...documents, newDoc]);
        toast.success(`Attached "${file.name}" to training documents.`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Download Handler for Uploaded or Sample Documents
  const handleDownloadDocument = (doc: { name: string; size: string; type: string; url?: string }) => {
    if (doc.url) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${doc.name}...`);
    } else {
      const content = `Codigix HR Management System\nTraining Document: ${doc.name}\nSize: ${doc.size}\nType: ${doc.type}\nStatus: Verified Document\nDate: ${new Date().toLocaleDateString()}`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success(`Downloading ${doc.name}...`);
    }
  };

  const handlePublish = (asDraft = false) => {
    if (!name.trim()) {
      toast.error('Please enter a Program Name.');
      return;
    }

    const activeTrainer = trainerType === 'Internal' ? selectedInternalTrainer : externalTrainer;

    const programToSave: TrainingProgram = {
      id: initialData ? initialData.id : `PRG-${Date.now().toString().slice(-4)}`,
      code: code || generateNewCode(),
      name: name.trim(),
      category: category || 'Safety',
      type: trainingType,
      description: description.trim() || 'No description provided.',
      objective: objective.trim() || 'No training objective specified.',

      trainerType,
      trainer: activeTrainer || 'Unassigned Trainer',
      provider: trainerType === 'External' ? (provider || 'External Vendor') : 'Internal HR & Operations',
      contactEmail: trainerType === 'External' ? contactEmail : undefined,
      contactNumber: trainerType === 'External' ? contactNumber : undefined,

      startDate,
      endDate,
      startTime,
      endTime,
      durationHours,
      deliveryMode,
      location: deliveryMode === 'Classroom' ? (location || 'Main Auditorium') : (meetingLink || 'Virtual LMS Room'),
      capacity,
      batches,

      assignBy,
      targetDepartment: selectedDept,
      targetDesignation: selectedDesignation,
      targetGrade: selectedGrade,
      targetLocation: selectedLocation,
      employeeCount: selectedEmpIds.length || filteredEmployees.length || 0,

      attendanceRequired,
      minAttendance,
      attendanceMethod,
      completionBasis,
      trainerConfirmationReq,

      assessmentRequired,
      assessmentType: assessmentRequired ? assessmentType : undefined,
      assessmentName: assessmentRequired ? (assessmentName || `${name} Assessment`) : undefined,
      passingScore: assessmentRequired ? passingScore : undefined,
      attemptsAllowed: assessmentRequired ? attemptsAllowed : undefined,

      certificateRequired,
      certificateType: certificateRequired ? (certificateType || `${name} Certificate`) : undefined,

      updateSkillMatrix,
      skillName: updateSkillMatrix ? (skillName || category) : undefined,
      skillLevel: updateSkillMatrix ? skillLevel : undefined,
      skillImprovement: updateSkillMatrix ? skillImprovement : undefined,

      notifyAssigned,
      notifyReminder,
      notifyTrainer,
      notifyManager,
      reminderTiming,

      documents,

      progress: initialData ? initialData.progress : (asDraft ? 0 : 5),
      status: asDraft ? 'Draft' : (initialData?.status || 'Active'),

      employeeStatuses: selectedEmpIds.map((empId) => {
        const existing = initialData?.employeeStatuses?.find((e) => e.employeeId === empId);
        if (existing) return existing;
        const emp = employees.find((e) => e.id === empId);
        return {
          employeeId: empId,
          employeeName: emp?.name || 'Employee',
          department: emp?.department || 'Operations',
          grade: emp?.grade || 'G3',
          status: asDraft ? 'Assigned' : 'Enrolled',
          attendancePercent: 0,
        };
      }),
    };

    onSave(programToSave);

    if (!asDraft && notifyAssigned) {
      toast.success(initialData ? `Training Program updated successfully!` : `Training Published! Notification sent to all ${selectedEmpIds.length} assigned employees on Employee Portal.`, {
        duration: 4000,
      });
    } else {
      toast.info(asDraft ? 'Training Program saved as Draft.' : 'Training Program saved successfully.');
    }

    onBack();
  };

  const sections = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Trainer / Provider' },
    { num: 3, label: 'Target Employees' },
    { num: 4, label: 'Schedule & Sessions' },
    { num: 5, label: 'Attendance & Rules' },
    { num: 6, label: 'Assessment & Skill' },
    { num: 7, label: 'Notifications & Docs' },
    { num: 8, label: 'Review & Publish' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hidden File Input for Document Selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
      />

      {/* Top Back Navigation Bar & Quick Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5 text-xs">
          <ArrowLeft className="h-4 w-4" /> Back to Training Programs
        </Button>

        <div className="flex items-center gap-2">
          {!initialData && (
            <Button variant="ghost" size="sm" onClick={handleLoadSampleTemplate} className="gap-1.5 text-xs text-primary hover:bg-primary/10">
              <Wand2 className="h-3.5 w-3.5" /> Fill Sample Template
            </Button>
          )}
          <span className="text-xs text-muted-foreground font-mono">http://localhost:5174/learning/training-programs</span>
        </div>
      </div>

      {/* Main Form Page Container */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">
                {initialData ? `EDIT TRAINING PROGRAM: ${initialData.code}` : 'CREATE TRAINING PROGRAM'}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {initialData ? 'Modify and update training details, trainer, schedule, or assigned employees.' : 'Create and manage internal or external employee training programs across company entities.'}
            </p>
          </div>
        </div>

        {/* Section Navigation Bar */}
        <div className="flex items-center justify-between border-b px-6 py-2 bg-muted/10 overflow-x-auto text-xs font-medium gap-2 shrink-0">
          {sections.map((s) => (
            <button
              key={s.num}
              onClick={() => {
                setActiveSection(s.num);
                const el = document.getElementById(`section-${s.num}`);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeSection === s.num
                  ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                activeSection === s.num ? 'bg-primary-foreground text-primary font-bold' : 'bg-muted text-muted-foreground'
              }`}>
                {s.num}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-8">
          {/* ① Basic Information & Objective */}
          <section id="section-1" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </span>
              <h3 className="text-base font-bold">Basic Information & Objective</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="progName" className="text-xs font-medium">
                  Program Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="progName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter training program title..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="progCode" className="text-xs font-medium flex items-center gap-1">
                    Program Code <span className="text-destructive">*</span>
                  </Label>
                  {!initialData && (
                    <button
                      type="button"
                      onClick={() => setCode(generateNewCode())}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1 font-sans"
                    >
                      <RefreshCw className="h-2.5 w-2.5" /> Regenerate
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="progCode"
                    value={code}
                    readOnly
                    className="text-xs font-mono bg-muted/50 cursor-not-allowed"
                  />
                  <Badge variant="secondary" className="text-[10px] font-mono shrink-0 bg-primary/10 text-primary border-primary/30">
                    {initialData ? 'Existing Code' : 'Auto-generated'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Training Category <span className="text-destructive">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Safety">Safety</SelectItem>
                    <SelectItem value="Leadership">Leadership</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                    <SelectItem value="Quality">Quality & Operations</SelectItem>
                    <SelectItem value="Induction">Induction & Onboarding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Training Type <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={trainingType}
                  onValueChange={(val) => setTrainingType(val as any)}
                  className="flex flex-wrap gap-2 pt-1"
                >
                  {['Mandatory', 'Optional', 'Recommended', 'Remedial'].map((t) => (
                    <div key={t} className="flex items-center space-x-1.5 border rounded-lg px-3 py-1.5 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value={t} id={`type-${t}`} />
                      <Label htmlFor={`type-${t}`} className="text-xs cursor-pointer">
                        {t}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="progDesc" className="text-xs font-medium">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="progDesc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a detailed description of topics covered and training agenda..."
                  className="text-xs"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="progObj" className="text-xs font-medium">
                  Training Objective <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="progObj"
                  rows={2}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Specify key learning outcomes, target skill gains, or compliance goals..."
                  className="text-xs"
                />
              </div>
            </div>
          </section>

          {/* ② Trainer / Provider */}
          <section id="section-2" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                2
              </span>
              <h3 className="text-base font-bold">Trainer / Provider</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Trainer Type *</Label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="trainerType"
                      checked={trainerType === 'Internal'}
                      onChange={() => setTrainerType('Internal')}
                      className="text-primary"
                    />
                    Internal Trainer (Select from Employee Master)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="trainerType"
                      checked={trainerType === 'External'}
                      onChange={() => setTrainerType('External')}
                      className="text-primary"
                    />
                    External Provider / Agency
                  </label>
                </div>
              </div>

              {trainerType === 'Internal' ? (
                <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" /> Select Internal Trainer (Employee Master) *
                    </Label>
                    {selectedCompany !== 'All' && (
                      <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                        Filtered by {selectedCompany}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Searchable Input */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search employee name, code, designation, department, company..."
                      value={trainerSearchQuery}
                      onChange={(e) => {
                        setTrainerSearchQuery(e.target.value);
                        setIsTrainerDropdownOpen(true);
                      }}
                      onFocus={() => setIsTrainerDropdownOpen(true)}
                      className="pl-8 text-xs h-9 bg-background"
                    />

                    {/* Search Dropdown Popup */}
                    {isTrainerDropdownOpen && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y animate-in fade-in duration-100">
                        {filteredInternalTrainers.length === 0 ? (
                          <div className="p-3 text-xs text-center text-muted-foreground">
                            No matching employees found in Employee Master.
                          </div>
                        ) : (
                          filteredInternalTrainers.map((emp) => {
                            const isSelected = selectedInternalTrainer === emp.name;
                            return (
                              <div
                                key={emp.id}
                                onClick={() => {
                                  setSelectedInternalTrainer(emp.name);
                                  setIsTrainerDropdownOpen(false);
                                  setTrainerSearchQuery('');
                                }}
                                className={`flex items-center justify-between p-2.5 text-xs cursor-pointer hover:bg-primary/10 transition-colors ${
                                  isSelected ? 'bg-primary/10 font-bold' : ''
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground">{emp.name}</span>
                                    <Badge variant="outline" className="text-[10px] font-mono">{emp.id}</Badge>
                                    {emp.company && (
                                      <Badge variant="secondary" className="text-[9px] bg-muted text-muted-foreground">
                                        {emp.company}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {emp.designation} • {emp.department} ({emp.location})
                                  </p>
                                </div>
                                {isSelected && <Check className="h-4 w-4 text-primary" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {selectedInternalTrainer ? (
                    <div className="flex items-center justify-between p-2.5 bg-primary/10 border border-primary/30 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-primary" />
                        <span>Selected Trainer: <strong>{selectedInternalTrainer}</strong></span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedInternalTrainer('')} className="h-6 text-[11px] text-muted-foreground hover:text-destructive">
                        Change Trainer
                      </Button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                      Please search and select an internal trainer from the Employee Master above.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Trainer / Instructor Name *</Label>
                    <Input
                      value={externalTrainer}
                      onChange={(e) => setExternalTrainer(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Sharma"
                      className="text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Provider / Organization</Label>
                    <Input
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      placeholder="e.g. SafetyFirst Corp & Internal EHS"
                      className="text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Contact Email</Label>
                    <Input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="trainer@agency.example"
                      className="text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Contact Phone Number</Label>
                    <Input
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="text-xs bg-background"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ③ Target Employees with Company-wise Selection */}
          <section id="section-3" className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  3
                </span>
                <h3 className="text-base font-bold">Target Employees (Company-wise Selection)</h3>
              </div>
              <Badge variant="default" className="text-xs px-3 py-1 bg-primary text-primary-foreground">
                <Users className="h-3.5 w-3.5 mr-1" /> {selectedEmpIds.length} Eligible Employees Selected
              </Badge>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-medium">Assign By *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  'All Employees',
                  'Company',
                  'Department',
                  'Designation',
                  'Grade',
                  'Location',
                ].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAssignBy(m)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs text-center transition-all ${
                      assignBy === m
                        ? 'border-primary bg-primary/10 font-bold text-primary'
                        : 'border-border bg-background hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter controls + Search Bar */}
            <div className="space-y-3 p-4 bg-muted/40 rounded-lg border">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search target employee name, employee ID, designation, or company..."
                  value={targetEmpSearch}
                  onChange={(e) => setTargetEmpSearch(e.target.value)}
                  className="pl-8 text-xs h-8 bg-background"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-primary flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Company *
                  </Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger className="text-xs h-8 bg-background font-semibold border-primary/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Companies</SelectItem>
                      <SelectItem value="Codigix Infotech Pvt Ltd">Codigix Infotech Pvt Ltd</SelectItem>
                      <SelectItem value="Codigix Manufacturing Ltd">Codigix Manufacturing Ltd</SelectItem>
                      <SelectItem value="Codigix Tech Services">Codigix Tech Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Department *</Label>
                  <Select value={selectedDept} onValueChange={setSelectedDept}>
                    <SelectTrigger className="text-xs h-8 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Departments</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="QA">QA</SelectItem>
                      <SelectItem value="Production">Production</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="EHS">EHS</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Designation</Label>
                  <Input value={selectedDesignation} onChange={(e) => setSelectedDesignation(e.target.value)} className="text-xs h-8 bg-background" placeholder="All" />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Grade</Label>
                  <Input value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="text-xs h-8 bg-background" placeholder="All Grades" />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="text-xs h-8 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Locations</SelectItem>
                      <SelectItem value="Plant A">Plant A</SelectItem>
                      <SelectItem value="Plant B">Plant B</SelectItem>
                      <SelectItem value="HQ Tech Park">HQ Tech Park</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden space-y-0">
              <div className="flex items-center justify-between px-3 py-2 bg-muted/60 text-xs font-semibold border-b">
                <span>Matching Employee Master List ({filteredEmployees.length})</span>
                <Button variant="ghost" size="sm" onClick={handleSelectAllFilteredEmployees} className="h-6 text-[11px] gap-1">
                  <CheckSquare className="h-3 w-3" /> Select All Filtered
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y">
                {filteredEmployees.length === 0 ? (
                  <div className="p-4 text-xs text-center text-muted-foreground">
                    No employees match the company, department, or search criteria.
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isChecked = selectedEmpIds.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => handleToggleEmployee(emp.id)}
                        className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer hover:bg-muted/40 transition-colors ${
                          isChecked ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox checked={isChecked} onCheckedChange={() => handleToggleEmployee(emp.id)} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{emp.name}</span>
                              <Badge variant="outline" className="text-[10px] font-mono">{emp.id}</Badge>
                              {emp.company && (
                                <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                                  {emp.company}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">{emp.designation}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                          <span>Dept: <strong className="text-foreground">{emp.department}</strong></span>
                          <span>Grade: <strong className="text-foreground">{emp.grade}</strong></span>
                          <span>Loc: <strong className="text-foreground">{emp.location}</strong></span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          {/* ④ Schedule & Sessions */}
          <section id="section-4" className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  4
                </span>
                <h3 className="text-base font-bold">Training Schedule & Sessions</h3>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={handleAddBatch} className="gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add Session / Batch
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3 p-3 bg-muted/20 rounded-lg border">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Start Date *</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs h-8 bg-background" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">End Date *</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs h-8 bg-background" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Start Time *</Label>
                <Input value={startTime} onChange={(e) => setStartTime(e.target.value)} className="text-xs h-8 bg-background" placeholder="10:00 AM" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">End Time *</Label>
                <Input value={endTime} onChange={(e) => setEndTime(e.target.value)} className="text-xs h-8 bg-background" placeholder="01:00 PM" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium">Duration (Hours)</Label>
                <Input type="number" value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className="text-xs h-8 bg-background" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Delivery Mode *</Label>
                <RadioGroup
                  value={deliveryMode}
                  onValueChange={(val) => setDeliveryMode(val as any)}
                  className="flex gap-4 pt-1"
                >
                  {['Classroom', 'Online', 'Hybrid'].map((m) => (
                    <div key={m} className="flex items-center space-x-1.5 cursor-pointer">
                      <RadioGroupItem value={m} id={`del-${m}`} />
                      <Label htmlFor={`del-${m}`} className="text-xs cursor-pointer">{m}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {deliveryMode === 'Classroom' ? (
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-medium">Classroom Location *</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Training Room 1 / Auditorium" className="text-xs" />
                </div>
              ) : (
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-medium">Meeting Link / Virtual Room *</Label>
                  <Input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meeting.example/training-room" className="text-xs" />
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-xs font-semibold">Configured Sessions / Batches ({batches.length})</Label>
              {batches.length === 0 ? (
                <div className="p-4 border border-dashed rounded-lg text-center text-xs text-muted-foreground">
                  No sessions configured. Click "+ Add Session / Batch" to split employees into multiple time slots.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {batches.map((b) => (
                    <Card key={b.id} className="shadow-2xs border bg-card">
                      <CardHeader className="py-2.5 px-3 border-b flex flex-row items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <CardTitle className="text-xs font-bold">{b.name}</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveBatch(b.id)} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-3 text-[11px] space-y-1.5 text-muted-foreground">
                        <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> Date: {b.date} • {b.time}</p>
                        <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {b.location}</p>
                        <p className="flex items-center justify-between font-semibold text-foreground pt-1 border-t mt-1">
                          <span>Capacity:</span> <span>{b.capacity} Seats</span>
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ⑤ Attendance & Completion Rules */}
          <section id="section-5" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                5
              </span>
              <h3 className="text-base font-bold">Attendance & Completion Rules</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 border p-3 rounded-lg bg-card">
                <div className="flex items-center space-x-2">
                  <Checkbox id="attReq" checked={attendanceRequired} onCheckedChange={(c) => setAttendanceRequired(!!c)} />
                  <Label htmlFor="attReq" className="text-xs font-semibold cursor-pointer">Attendance Required *</Label>
                </div>
                <div className="space-y-1 pt-1">
                  <Label className="text-[11px] text-muted-foreground">Minimum Attendance %</Label>
                  <Input type="number" value={minAttendance} onChange={(e) => setMinAttendance(Number(e.target.value))} className="text-xs h-8" />
                </div>
              </div>

              <div className="space-y-2 border p-3 rounded-lg bg-card sm:col-span-2">
                <Label className="text-xs font-semibold">Attendance Capture Method *</Label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {['Manual', 'QR Check-in', 'Employee Check-in'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setAttendanceMethod(m as any)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs text-center transition-all ${
                        attendanceMethod === m
                          ? 'border-primary bg-primary/10 font-bold text-primary'
                          : 'border-border bg-background hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-xs font-semibold">Completion Determination Criteria *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  'Attendance',
                  'Trainer Confirmation',
                  'Attendance + Trainer Confirmation',
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCompletionBasis(c as any)}
                    className={`p-3 rounded-lg border text-xs text-left transition-all ${
                      completionBasis === c
                        ? 'border-primary bg-primary/10 font-bold text-primary shadow-2xs'
                        : 'border-border bg-background hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{c}</span>
                      {completionBasis === c && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
              <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Activity Completion Logic
              </p>
              <div className="flex flex-wrap items-center justify-between text-xs font-medium gap-2 pt-1 text-muted-foreground">
                <span className="px-2.5 py-1 rounded bg-background border">Attendance ≥ {minAttendance}%</span>
                <span>+</span>
                <span className="px-2.5 py-1 rounded bg-background border">Trainer Confirmation ({trainerConfirmationReq ? 'Yes' : 'No'})</span>
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="px-3 py-1 rounded bg-emerald-500 text-white font-bold">TRAINING ACTIVITY COMPLETED</span>
              </div>
            </div>
          </section>

          {/* ⑥ Assessment / Certification / Skill Update */}
          <section id="section-6" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                6
              </span>
              <h3 className="text-base font-bold">Assessment, Certification & Skill Matrix (Optional)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Assessment */}
              <Card className={`border transition-all ${assessmentRequired ? 'border-primary/50 bg-primary/5' : 'bg-card'}`}>
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
                  <div className="flex items-center gap-2">
                    <BookOpenCheck className="h-4 w-4 text-primary" />
                    <CardTitle className="text-xs font-bold">Assessment</CardTitle>
                  </div>
                  <Checkbox checked={assessmentRequired} onCheckedChange={(c) => setAssessmentRequired(!!c)} />
                </CardHeader>
                <CardContent className="p-3 text-xs space-y-2">
                  {assessmentRequired ? (
                    <>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Assessment Title</Label>
                        <Input value={assessmentName} onChange={(e) => setAssessmentName(e.target.value)} placeholder="e.g. Safety Exam" className="text-xs h-7 bg-background" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Assessment Type</Label>
                        <Select value={assessmentType} onValueChange={(val) => setAssessmentType(val as any)}>
                          <SelectTrigger className="text-xs h-7 bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Quiz">Quiz</SelectItem>
                            <SelectItem value="Written Test">Written Test</SelectItem>
                            <SelectItem value="Practical Evaluation">Practical Evaluation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Passing Score %</Label>
                          <Input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} className="text-xs h-7 bg-background" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Attempts</Label>
                          <Input type="number" value={attemptsAllowed} onChange={(e) => setAttemptsAllowed(Number(e.target.value))} className="text-xs h-7 bg-background" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-muted-foreground py-2">No assessment required for this training.</p>
                  )}
                </CardContent>
              </Card>

              {/* Certification */}
              <Card className={`border transition-all ${certificateRequired ? 'border-amber-500/50 bg-amber-500/5' : 'bg-card'}`}>
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-xs font-bold">Certification</CardTitle>
                  </div>
                  <Checkbox checked={certificateRequired} onCheckedChange={(c) => setCertificateRequired(!!c)} />
                </CardHeader>
                <CardContent className="p-3 text-xs space-y-2">
                  {certificateRequired ? (
                    <div className="space-y-1">
                      <Label className="text-[11px]">Certificate Title</Label>
                      <Input value={certificateType} onChange={(e) => setCertificateType(e.target.value)} placeholder="e.g. Completion Certificate" className="text-xs h-7 bg-background" />
                      <p className="text-[10px] text-muted-foreground pt-1">
                        Auto-issued when Attendance & Assessment criteria are met.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground py-2">No certificate generation.</p>
                  )}
                </CardContent>
              </Card>

              {/* Skill Matrix */}
              <Card className={`border transition-all ${updateSkillMatrix ? 'border-indigo-500/50 bg-indigo-500/5' : 'bg-card'}`}>
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-indigo-500" />
                    <CardTitle className="text-xs font-bold">Skill Matrix Update</CardTitle>
                  </div>
                  <Checkbox checked={updateSkillMatrix} onCheckedChange={(c) => setUpdateSkillMatrix(!!c)} />
                </CardHeader>
                <CardContent className="p-3 text-xs space-y-2">
                  {updateSkillMatrix ? (
                    <>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Mapped Skill</Label>
                        <Input value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="e.g. Workplace Safety" className="text-xs h-7 bg-background" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Target Level</Label>
                          <Input value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} className="text-xs h-7 bg-background" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Improvement</Label>
                          <Input value={skillImprovement} onChange={(e) => setSkillImprovement(e.target.value)} className="text-xs h-7 bg-background" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-muted-foreground py-2">Does not update skill matrix.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ⑦ Notifications & Documents */}
          <section id="section-7" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                7
              </span>
              <h3 className="text-base font-bold">Notifications & Documents</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Notifications */}
              <div className="space-y-3 p-4 border rounded-lg bg-card">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <Label className="text-xs font-bold uppercase tracking-wider">Automated Notifications & Portal Alerts</Label>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="notAssigned" checked={notifyAssigned} onCheckedChange={(c) => setNotifyAssigned(!!c)} />
                    <Label htmlFor="notAssigned" className="text-xs font-medium cursor-pointer">
                      Notify assigned employees on Employee Portal upon publish
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="notRemind" checked={notifyReminder} onCheckedChange={(c) => setNotifyReminder(!!c)} />
                    <Label htmlFor="notRemind" className="text-xs font-medium cursor-pointer">
                      Send automated reminder before training date
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="notTrainer" checked={notifyTrainer} onCheckedChange={(c) => setNotifyTrainer(!!c)} />
                    <Label htmlFor="notTrainer" className="text-xs font-medium cursor-pointer">
                      Notify trainer / instructor with attendee roster
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="notManager" checked={notifyManager} onCheckedChange={(c) => setNotifyManager(!!c)} />
                    <Label htmlFor="notManager" className="text-xs font-medium cursor-pointer">
                      Notify department manager
                    </Label>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t">
                  <Label className="text-[11px] text-muted-foreground">Reminder Schedule</Label>
                  <Select value={reminderTiming} onValueChange={setReminderTiming}>
                    <SelectTrigger className="text-xs h-8 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 Day Before">1 Day Before</SelectItem>
                      <SelectItem value="2 Days Before">2 Days Before</SelectItem>
                      <SelectItem value="1 Week Before">1 Week Before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-3 p-4 border rounded-lg bg-card">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <Label className="text-xs font-bold uppercase tracking-wider">Training Documents & Materials</Label>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={handleTriggerFileUpload} className="h-7 text-xs gap-1">
                    <UploadCloud className="h-3.5 w-3.5" /> Upload Document
                  </Button>
                </div>

                <div className="space-y-2 pt-1">
                  {documents.length === 0 ? (
                    <div className="p-4 border border-dashed rounded text-center text-xs text-muted-foreground">
                      No documents attached. Click "+ Upload Document" to select SOPs, slides, or PDF guides from disk.
                    </div>
                  ) : (
                    documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded border bg-muted/40 text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-semibold text-foreground">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground">{doc.size} • {doc.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleDownloadDocument(doc)} className="h-6 w-6 text-primary hover:bg-primary/10" title="Download Document">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDocuments(documents.filter((_, i) => i !== idx))} className="h-6 w-6 text-muted-foreground hover:text-destructive" title="Remove Document">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ⑧ Review & Publish */}
          <section id="section-8" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                8
              </span>
              <h3 className="text-base font-bold">Review Training Program</h3>
            </div>

            <Card className="border-primary/50 shadow-md">
              <CardHeader className="bg-primary/10 py-3">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>REVIEW TRAINING PROGRAM SUMMARY</span>
                  <Badge variant="outline" className="text-xs font-mono">{code}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-xs space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b pb-3">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Program Name:</span>
                    <strong className="text-foreground text-sm">{name || 'Untitled Program'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Type & Category:</span>
                    <strong className="text-foreground">{trainingType} ({category})</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Trainer:</span>
                    <strong className="text-foreground">{trainerType === 'Internal' ? (selectedInternalTrainer || 'Unassigned') : (externalTrainer || 'External Vendor')}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Provider:</span>
                    <strong className="text-foreground">{provider || 'Internal HR'}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-muted-foreground border-b pb-3">
                  <div>
                    <span>Target Workforce:</span> <strong className="text-foreground">{selectedEmpIds.length} Employees ({selectedCompany === 'All' ? 'All Companies' : selectedCompany})</strong>
                  </div>
                  <div>
                    <span>Date & Time:</span> <strong className="text-foreground">{startDate} ({startTime})</strong>
                  </div>
                  <div>
                    <span>Duration & Mode:</span> <strong className="text-foreground">{durationHours} Hours ({deliveryMode})</strong>
                  </div>
                  <div>
                    <span>Batches Scheduled:</span> <strong className="text-foreground">{batches.length} Sessions</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-muted-foreground">
                  <div>
                    <span>Attendance Required:</span> <strong className="text-foreground">{minAttendance}% ({attendanceMethod})</strong>
                  </div>
                  <div>
                    <span>Assessment:</span> <strong className="text-foreground">{assessmentRequired ? `${assessmentType} (${passingScore}% Pass)` : 'No'}</strong>
                  </div>
                  <div>
                    <span>Certificate:</span> <strong className="text-foreground">{certificateRequired ? (certificateType || 'Completion Cert') : 'No'}</strong>
                  </div>
                  <div>
                    <span>Skill Matrix:</span> <strong className="text-foreground">{updateSkillMatrix ? `${skillName || category} (${skillImprovement})` : 'No'}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t px-6 py-3 bg-muted/30">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-xs">
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePublish(true)} className="text-xs">
              Save as Draft
            </Button>
            <Button size="sm" onClick={() => handlePublish(false)} className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
              <Check className="h-4 w-4" /> {initialData ? 'Update Training Program' : 'Publish Training Program'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
