import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Briefcase,
  GraduationCap,
  Star,
  FileText,
  ShieldCheck,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Award,
  Globe,
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  FileCheck,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { JobOpening } from '@/api/types';

export interface EducationItem {
  id: string;
  qualificationType: string;
  degree: string;
  specialization?: string;
  institution?: string;
  universityOrBoard?: string;
  startYear?: string;
  passingYear: string;
  gradingSystem?: string;
  score: string;
  resultStatus?: string;
}

export interface EmployeeOption {
  id: string;
  code: string;
  name: string;
  dept?: string;
  company?: string;
  title?: string;
}

interface CandidateFullFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any, jobId: string, candidateId?: string) => void;
  jobOpenings: JobOpening[];
  employeesList?: EmployeeOption[];
  initialData?: any | null;
  isSubmitting?: boolean;
}

export const CandidateFullFormModal: React.FC<CandidateFullFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  jobOpenings,
  employeesList = [],
  initialData,
  isSubmitting = false,
}) => {
  const isEdit = Boolean(initialData?.id);

  // 1. Candidate Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [stateOrCountry, setStateOrCountry] = useState('Maharashtra, India');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  // 2. Application Details & Dynamic Referral
  const [selectedJobId, setSelectedJobId] = useState('');
  const [source, setSource] = useState('Careers Portal');
  const [channel, setChannel] = useState('Online');
  const [candidateType, setCandidateType] = useState<'FRESHER' | 'EXPERIENCED'>('EXPERIENCED');

  // Employee Referral Fields
  const [referringEmployeeId, setReferringEmployeeId] = useState('');
  const [referralRelationship, setReferralRelationship] = useState('Former Colleague');
  const [referralDate, setReferralDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [referralComments, setReferralComments] = useState('');

  // Source specific fields
  const [jobBoardName, setJobBoardName] = useState('Naukri.com');
  const [agencyName, setAgencyName] = useState('');
  const [agencyContactPerson, setAgencyContactPerson] = useState('');

  // 3. Experience Details
  const [totalExperience, setTotalExperience] = useState('3 Years');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentDesignation, setCurrentDesignation] = useState('');
  const [currentLocation, setCurrentLocation] = useState('Pune');
  const [noticePeriod, setNoticePeriod] = useState('30 Days');
  const [currentCtc, setCurrentCtc] = useState('800000');
  const [expectedCtc, setExpectedCtc] = useState('1200000');
  const [availableFrom, setAvailableFrom] = useState('');

  // 4. Multiple Education Details
  const [educationList, setEducationList] = useState<EducationItem[]>([
    {
      id: 'edu-default-1',
      qualificationType: 'Undergraduate / Graduation',
      degree: 'B.Tech',
      specialization: 'Computer Science',
      institution: 'Pune Institute of Technology',
      universityOrBoard: 'SPPU Pune University',
      startYear: '2022',
      passingYear: '2026',
      gradingSystem: 'CGPA',
      score: '8.45',
      resultStatus: 'Passed',
    },
  ]);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [isAddingEdu, setIsAddingEdu] = useState(false);

  const [qualificationType, setQualificationType] = useState('Undergraduate / Graduation');
  const [degree, setDegree] = useState('B.Tech');
  const [specialization, setSpecialization] = useState('Computer Science');
  const [institution, setInstitution] = useState('');
  const [universityOrBoard, setUniversityOrBoard] = useState('');
  const [startYear, setStartYear] = useState('2022');
  const [passingYear, setPassingYear] = useState('2026');
  const [gradingSystem, setGradingSystem] = useState('CGPA');
  const [score, setScore] = useState('8.45');
  const [resultStatus, setResultStatus] = useState('Passed');

  // 5. Skills & Competencies
  const [technicalSkills, setTechnicalSkills] = useState('');
  const [selectedSoftSkills, setSelectedSoftSkills] = useState<string[]>([
    'Communication',
    'Teamwork',
    'Problem Solving',
  ]);

  // 6. Certifications
  const [hasCertifications, setHasCertifications] = useState<'YES' | 'NO'>('NO');
  const [certName, setCertName] = useState('');
  const [certIssuingOrg, setCertIssuingOrg] = useState('');
  const [certType, setCertType] = useState('Professional');
  const [certCredentialId, setCertCredentialId] = useState('');
  const [certIssueDate, setCertIssueDate] = useState('');
  const [certExpiryDate, setCertExpiryDate] = useState('');

  // 7. Courses & Training
  const [hasCourses, setHasCourses] = useState<'YES' | 'NO'>('NO');
  const [courseName, setCourseName] = useState('');
  const [courseProvider, setCourseProvider] = useState('');
  const [courseStartDate, setCourseStartDate] = useState('');
  const [courseCompletionDate, setCourseCompletionDate] = useState('');
  const [courseStatus, setCourseStatus] = useState('Completed');

  // 8. Resume & Documents
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumePath, setResumePath] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  // 9. Screening & Preferences
  const [preferredLocation, setPreferredLocation] = useState('Pune');
  const [willingToRelocate, setWillingToRelocate] = useState<'Yes' | 'No'>('Yes');
  const [preferredWorkMode, setPreferredWorkMode] = useState('On-site');

  // 10. Declaration & Consent
  const [agreeDeclaration, setAgreeDeclaration] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);

  // Pre-fill when editing or opening modal
  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName || initialData.name?.split(' ')[0] || '');
      setLastName(initialData.lastName || initialData.name?.split(' ').slice(1).join(' ') || '');
      setEmail(initialData.email || '');
      setPhone(initialData.phone || '');
      setSelectedJobId(initialData.jobId || initialData.jobOpeningId || jobOpenings[0]?.id || '');
      setSource(initialData.source || 'Careers Portal');
      setCandidateType(initialData.candidateType === 'FRESHER' ? 'FRESHER' : 'EXPERIENCED');
      setTotalExperience(initialData.experience || '3 Years');
      setCurrentCompany(initialData.currentCompany || '');
      setCurrentDesignation(initialData.role || '');
      setCurrentLocation(initialData.currentLocation || 'Pune');
      setNoticePeriod(initialData.noticePeriod || '30 Days');
      setCurrentCtc(initialData.currentCtc ? String(initialData.currentCtc) : '800000');
      setExpectedCtc(initialData.expectedCtc ? String(initialData.expectedCtc) : '1200000');
      setTechnicalSkills(initialData.skills || '');
      setResumePath(initialData.resumePath || '');
      setResumeFileName(initialData.resumePath ? initialData.resumePath.split('/').pop() || 'resume.pdf' : '');
      setAgreeDeclaration(true);

      setEducationList([
        {
          id: 'edu-init-1',
          qualificationType: initialData.qualification || 'Undergraduate / Graduation',
          degree: initialData.degree || 'B.Tech',
          specialization: initialData.specialization || 'Computer Science',
          institution: initialData.institution || 'SPPU College of Engineering',
          universityOrBoard: 'SPPU Pune University',
          startYear: '2022',
          passingYear: initialData.graduationYear || '2026',
          score: '8.45',
          resultStatus: 'Passed',
        },
      ]);
      setIsAddingEdu(false);
      setEditingEduId(null);
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setSelectedJobId(jobOpenings[0]?.id || '');
      setSource('Careers Portal');
      setCandidateType('EXPERIENCED');
      setTotalExperience('3 Years');
      setCurrentCompany('');
      setCurrentDesignation('');
      setCurrentLocation('Pune');
      setNoticePeriod('30 Days');
      setCurrentCtc('800000');
      setExpectedCtc('1200000');
      setTechnicalSkills('');
      setResumePath('');
      setResumeFileName('');
      setAgreeDeclaration(false);

      setEducationList([
        {
          id: 'edu-default-1',
          qualificationType: 'Undergraduate / Graduation',
          degree: 'B.Tech',
          specialization: 'Computer Science',
          institution: 'Pune Institute of Technology',
          universityOrBoard: 'SPPU Pune University',
          startYear: '2022',
          passingYear: '2026',
          gradingSystem: 'CGPA',
          score: '8.45',
          resultStatus: 'Passed',
        },
      ]);
      setIsAddingEdu(false);
      setEditingEduId(null);
    }
  }, [initialData, isOpen, jobOpenings]);

  // Selected job opening object
  const activeJob = useMemo(() => {
    return jobOpenings.find((j) => j.id === selectedJobId) || jobOpenings[0];
  }, [jobOpenings, selectedJobId]);

  const requiredSkillsList = useMemo(() => {
    if (!activeJob?.requiredSkills) return ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD', 'Git'];
    return activeJob.requiredSkills.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  }, [activeJob]);

  // Selected Referring Employee Lookup
  const selectedReferringEmp = useMemo(() => {
    if (!referringEmployeeId) return null;
    const listToSearch = employeesList.length > 0 ? employeesList : [
      { id: 'emp-1', code: 'EMP-8265', name: 'Aishwarya Roy', dept: 'Human Resources', company: 'Codigix Infotech Pvt. Ltd.' },
      { id: 'emp-2', code: 'EMP-0042', name: 'Sanika Mote', dept: 'Engineering', company: 'Codigix Infotech Pvt. Ltd.' },
      { id: 'emp-3', code: 'EMP-0019', name: 'Priya Verma', dept: 'Human Resources', company: 'Codigix Infotech Pvt. Ltd.' },
      { id: 'emp-4', code: 'EMP-0105', name: 'Rajesh Sharma', dept: 'Executive Office', company: 'Codigix Infotech Pvt. Ltd.' },
    ];
    const found = listToSearch.find((e) => e.id === referringEmployeeId || e.code === referringEmployeeId);
    if (!found) return null;

    return {
      ...found,
      code: found.code || (found as any).employeeCode || `EMP-${found.id.substring(0, 4).toUpperCase()}`,
      dept: found.dept || (found as any).department?.name || 'Engineering',
      company: found.company || (found as any).company?.name || 'Codigix Infotech Pvt. Ltd.',
    };
  }, [referringEmployeeId, employeesList]);

  // Education Handlers
  const handleStartAddEducation = () => {
    setEditingEduId(null);
    setQualificationType('Undergraduate / Graduation');
    setDegree('');
    setSpecialization('');
    setInstitution('');
    setUniversityOrBoard('');
    setStartYear('');
    setPassingYear('');
    setScore('');
    setResultStatus('Passed');
    setIsAddingEdu(true);
  };

  const handleEditEducation = (item: EducationItem) => {
    setEditingEduId(item.id);
    setQualificationType(item.qualificationType || 'Undergraduate / Graduation');
    setDegree(item.degree || '');
    setSpecialization(item.specialization || '');
    setInstitution(item.institution || '');
    setUniversityOrBoard(item.universityOrBoard || '');
    setStartYear(item.startYear || '');
    setPassingYear(item.passingYear || '');
    setScore(item.score || '');
    setResultStatus(item.resultStatus || 'Passed');
    setIsAddingEdu(true);
  };

  const handleRemoveEducation = (id: string) => {
    setEducationList((prev) => prev.filter((e) => e.id !== id));
    toast.info('Academic qualification removed');
  };

  const handleSaveEducationItem = () => {
    if (!degree.trim()) {
      toast.error('Degree / Qualification is required');
      return;
    }
    if (!institution.trim()) {
      toast.error('Institute / College / School is required');
      return;
    }

    if (editingEduId) {
      setEducationList((prev) =>
        prev.map((item) =>
          item.id === editingEduId
            ? {
                ...item,
                qualificationType,
                degree: degree.trim(),
                specialization: specialization.trim(),
                institution: institution.trim(),
                universityOrBoard: universityOrBoard.trim(),
                startYear: startYear.trim(),
                passingYear: passingYear.trim() || '2026',
                score: score.trim() || 'Passed',
                resultStatus,
              }
            : item
        )
      );
      toast.success('Academic qualification updated');
    } else {
      const newItem: EducationItem = {
        id: `edu-${Date.now()}`,
        qualificationType,
        degree: degree.trim(),
        specialization: specialization.trim(),
        institution: institution.trim(),
        universityOrBoard: universityOrBoard.trim(),
        startYear: startYear.trim(),
        passingYear: passingYear.trim() || '2026',
        score: score.trim() || 'Passed',
        resultStatus,
      };
      setEducationList((prev) => [...prev, newItem]);
      toast.success('Academic qualification added');
    }

    setEditingEduId(null);
    setIsAddingEdu(false);
  };

  const handleCancelEducationForm = () => {
    setEditingEduId(null);
    setIsAddingEdu(false);
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('Resume file must be under 15 MB');
        return;
      }
      setResumeFileName(file.name);
      try {
        const objectUrl = URL.createObjectURL(file);
        setResumePath(objectUrl);
      } catch (err) {
        setResumePath(`/uploads/resumes/${file.name}`);
      }
      toast.success(`Attached "${file.name}"`);
    }
  };

  const toggleSoftSkill = (skill: string) => {
    setSelectedSoftSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First Name and Last Name are required');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid Email Address');
      return;
    }
    if (!selectedJobId) {
      toast.error('Target Job Requisition is required');
      return;
    }
    if (source === 'Employee Referral' && !referringEmployeeId) {
      toast.error('Please select the Referring Employee');
      return;
    }
    if (!agreeDeclaration) {
      toast.error('Please confirm the Applicant Declaration & Consent checkbox');
      return;
    }

    const primaryEdu = educationList[0] || {
      qualificationType: 'Undergraduate / Graduation',
      passingYear: '2026',
    };

    let notesInfo = `Submitted via ERP Candidate Module on ${new Date().toLocaleDateString()}`;
    if (source === 'Employee Referral' && selectedReferringEmp) {
      notesInfo += ` | Referred by: ${selectedReferringEmp.name} (${selectedReferringEmp.code}, ${selectedReferringEmp.dept}) - Relation: ${referralRelationship}`;
    }

    const parseCtcToNumber = (val: string | number | undefined | null) => {
      if (!val) return undefined;
      const str = String(val).trim();
      if (!str) return undefined;
      const cleaned = str.replace(/[^0-9.]/g, '');
      const num = parseFloat(cleaned);
      if (isNaN(num)) return undefined;
      if (num < 100) return num * 100000;
      return num;
    };

    const payload: any = {
      jobOpeningId: selectedJobId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      currentLocation: currentLocation.trim() || currentCity.trim() || 'Pune',
      candidateType,
      qualification: primaryEdu.qualificationType,
      graduationYear: primaryEdu.passingYear,
      experience: candidateType === 'EXPERIENCED' ? totalExperience : '0 Years',
      currentCompany: candidateType === 'EXPERIENCED' ? currentCompany : undefined,
      skills: technicalSkills || 'Software Engineering',
      currentCtc: parseCtcToNumber(currentCtc),
      expectedCtc: parseCtcToNumber(expectedCtc),
      noticePeriod,
      source,
      resumePath: resumePath || `/uploads/resumes/${resumeFileName || 'resume.pdf'}`,
      notes: notesInfo,
    };

    onSubmit(payload, selectedJobId, initialData?.id);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between">
            <div className="space-y-1">
              <Badge variant="outline" className="text-[11px] font-bold text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-900">
                {isEdit ? 'EDIT CANDIDATE PROFILE' : 'ADD NEW CANDIDATE'}
              </Badge>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isEdit ? `Edit Profile: ${initialData?.name || `${firstName} ${lastName}`}` : 'Complete Candidate Registration Form'}
              </h2>
              <p className="text-xs text-slate-500">
                Single-page comprehensive candidate profile entry for EHCM Recruitment Core.
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8 text-xs text-slate-900 dark:text-slate-100 font-sans">
            {/* ── SECTION 1: CANDIDATE INFORMATION ── */}
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider text-xs">
                <User className="h-4 w-4" /> 1. Candidate Information
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">First Name *</Label>
                  <Input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Pratham"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Last Name *</Label>
                  <Input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sharma"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Email Address *</Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. pratham@example.com"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Mobile Number *</Label>
                  <Input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Date of Birth</Label>
                  <Input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Non-Binary">Non-Binary</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Current City</Label>
                  <Input
                    type="text"
                    value={currentCity}
                    onChange={(e) => setCurrentCity(e.target.value)}
                    placeholder="e.g. Pune"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">State / Country</Label>
                  <Input
                    type="text"
                    value={stateOrCountry}
                    onChange={(e) => setStateOrCountry(e.target.value)}
                    placeholder="e.g. Maharashtra, India"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">LinkedIn Profile URL</Label>
                  <Input
                    type="text"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">GitHub / Portfolio URL</Label>
                  <Input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* ── SECTION 2: APPLICATION DETAILS & DYNAMIC REFERRAL ── */}
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider text-xs">
                <Briefcase className="h-4 w-4" /> 2. Application Details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Target Job Requisition *</Label>
                  <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Select Job Requisition" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobOpenings.map((job) => (
                        <SelectItem key={job.id} value={job.id} className="text-xs">
                          {job.title} ({job.requisitionCode || 'JR-2026'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Application Source *</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Careers Portal">Careers Portal</SelectItem>
                      <SelectItem value="Employee Referral">Employee Referral</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="Naukri / Job Board">Naukri / Job Board</SelectItem>
                      <SelectItem value="Recruitment Agency">Recruitment Agency</SelectItem>
                      <SelectItem value="Internal Transfer">Internal Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* DYNAMIC REFERRAL / SOURCE DETAILS BLOCK */}
              {source === 'Employee Referral' && (
                <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <Users className="h-4 w-4 text-indigo-600" /> Employee Referral Details
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Referring Employee *</Label>
                      <Select value={referringEmployeeId} onValueChange={setReferringEmployeeId}>
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900">
                          <SelectValue placeholder="Search employee name / ID 🔍..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(employeesList && employeesList.length > 0
                            ? employeesList
                            : [
                                { id: 'emp-1', code: 'EMP-8265', name: 'Aishwarya Roy', dept: 'Human Resources', company: 'Codigix Infotech Pvt. Ltd.' },
                                { id: 'emp-2', code: 'EMP-0042', name: 'Rajesh Kumar', dept: 'Engineering', company: 'Codigix Infotech Pvt. Ltd.' },
                                { id: 'emp-3', code: 'EMP-0019', name: 'Priya Verma', dept: 'Human Resources', company: 'Codigix Infotech Pvt. Ltd.' },
                                { id: 'emp-4', code: 'EMP-0105', name: 'Rajesh Sharma', dept: 'Executive Office', company: 'Codigix Infotech Pvt. Ltd.' },
                              ]
                          ).map((emp) => (
                            <SelectItem key={emp.id} value={emp.id} className="text-xs">
                              {emp.name} — <span className="font-mono text-indigo-600 font-bold">{emp.code}</span> ({emp.dept || 'Engineering'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Relationship with Candidate *</Label>
                      <Select value={referralRelationship} onValueChange={setReferralRelationship}>
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Former Colleague">Former Colleague</SelectItem>
                          <SelectItem value="Friend">Friend</SelectItem>
                          <SelectItem value="Relative">Relative</SelectItem>
                          <SelectItem value="College Alumni">College Alumni</SelectItem>
                          <SelectItem value="Professional Contact">Professional Contact</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Auto-populated Referring Employee Info Card */}
                  {selectedReferringEmp && (
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-200 dark:border-indigo-900 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shadow-2xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Employee ID</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedReferringEmp.code}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Department</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedReferringEmp.dept || 'Engineering'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Company</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedReferringEmp.company || 'Codigix Infotech Pvt. Ltd.'}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Referral Date *</Label>
                      <Input
                        type="date"
                        value={referralDate}
                        onChange={(e) => setReferralDate(e.target.value)}
                        className="h-9 text-xs font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Referral Comments</Label>
                      <Input
                        type="text"
                        value={referralComments}
                        onChange={(e) => setReferralComments(e.target.value)}
                        placeholder="Optional comments about the referral..."
                        className="h-9 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {source === 'Naukri / Job Board' && (
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <Label className="font-semibold text-xs">Job Board Name *</Label>
                  <Input
                    type="text"
                    value={jobBoardName}
                    onChange={(e) => setJobBoardName(e.target.value)}
                    placeholder="e.g. Naukri.com, Indeed, Monster"
                    className="h-9 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
              )}

              {source === 'Recruitment Agency' && (
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Agency Name *</Label>
                    <Input
                      type="text"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      placeholder="e.g. ABC Staffing Solutions"
                      className="h-9 text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Recruiter / Contact Person</Label>
                    <Input
                      type="text"
                      value={agencyContactPerson}
                      onChange={(e) => setAgencyContactPerson(e.target.value)}
                      placeholder="e.g. Priya Sharma (Lead Recruiter)"
                      className="h-9 text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Application Channel</Label>
                  <Select value={channel} onValueChange={setChannel}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Online">Online Portal</SelectItem>
                      <SelectItem value="Direct">Direct Applicant</SelectItem>
                      <SelectItem value="Campus Drive">Campus Recruitment</SelectItem>
                      <SelectItem value="Email Drive">Email Submission</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs">Candidate Type *</Label>
                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 font-semibold text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="candidateTypeRadio"
                        checked={candidateType === 'FRESHER'}
                        onChange={() => setCandidateType('FRESHER')}
                        className="h-4 w-4 text-indigo-600"
                      />
                      Fresher (0 Yrs)
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="candidateTypeRadio"
                        checked={candidateType === 'EXPERIENCED'}
                        onChange={() => setCandidateType('EXPERIENCED')}
                        className="h-4 w-4 text-indigo-600"
                      />
                      Experienced Professional
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 3: EXPERIENCE DETAILS ── */}
            {candidateType === 'EXPERIENCED' && (
              <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider text-xs">
                  <Building2 className="h-4 w-4" /> 3. Experience Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Total Experience</Label>
                    <Input
                      type="text"
                      value={totalExperience}
                      onChange={(e) => setTotalExperience(e.target.value)}
                      placeholder="e.g. 3 Years"
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Current / Last Company</Label>
                    <Input
                      type="text"
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value)}
                      placeholder="e.g. ABC Technologies Pvt Ltd"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Current / Last Job Title</Label>
                    <Input
                      type="text"
                      value={currentDesignation}
                      onChange={(e) => setCurrentDesignation(e.target.value)}
                      placeholder="e.g. Software Engineer"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Current Location</Label>
                    <Input
                      type="text"
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      placeholder="e.g. Pune"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Notice Period</Label>
                    <Select value={noticePeriod} onValueChange={setNoticePeriod}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Immediate">Immediate / Serving</SelectItem>
                        <SelectItem value="15 Days">15 Days</SelectItem>
                        <SelectItem value="30 Days">30 Days</SelectItem>
                        <SelectItem value="60 Days">60 Days</SelectItem>
                        <SelectItem value="90 Days">90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Current CTC (₹ in Lakhs / LPA)</Label>
                    <Input
                      type="text"
                      value={currentCtc}
                      onChange={(e) => setCurrentCtc(e.target.value)}
                      placeholder="e.g. 8.0 (in Lakhs / LPA)"
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Expected CTC (₹ in Lakhs / LPA)</Label>
                    <Input
                      type="text"
                      value={expectedCtc}
                      onChange={(e) => setExpectedCtc(e.target.value)}
                      placeholder="e.g. 12.0 (in Lakhs / LPA)"
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── SECTION 4: EDUCATION DETAILS (Multiple Repeatable Qualifications) ── */}
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider text-xs">
                  <GraduationCap className="h-4 w-4" /> 4. Education Details ({educationList.length})
                </div>
                {!isAddingEdu && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleStartAddEducation}
                    className="h-7 text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Another Qualification
                  </Button>
                )}
              </div>

              {/* Saved Education Cards List */}
              {educationList.length > 0 && (
                <div className="space-y-2.5">
                  {educationList.map((edu) => (
                    <div
                      key={edu.id}
                      className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300">
                            {edu.qualificationType}
                          </Badge>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {edu.degree} {edu.specialization ? `in ${edu.specialization}` : ''}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">
                          {edu.institution || 'School / College'} {edu.universityOrBoard ? `• ${edu.universityOrBoard}` : ''}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Passing Year: {edu.passingYear} | Score: {edu.score} {edu.gradingSystem || ''} ({edu.resultStatus || 'Passed'})
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditEducation(edu)}
                          className="h-7 w-7 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          title="Edit Qualification"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveEducation(edu.id)}
                          className="h-7 w-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Remove Qualification"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Education Entry Form (Open when adding or editing, or if list is empty) */}
              {(isAddingEdu || educationList.length === 0) && (
                <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-xs text-indigo-700 dark:text-indigo-400">
                      {editingEduId ? 'Edit Academic Qualification' : 'Add Academic Qualification'}
                    </span>
                    {educationList.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEducationForm}
                        className="h-6 text-[11px] text-slate-500"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Qualification Type *</Label>
                      <Select value={qualificationType} onValueChange={setQualificationType}>
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10th / Secondary">10th / Secondary</SelectItem>
                          <SelectItem value="12th / Higher Secondary">12th / Higher Secondary</SelectItem>
                          <SelectItem value="Diploma">Diploma</SelectItem>
                          <SelectItem value="Undergraduate / Graduation">Undergraduate / Graduation</SelectItem>
                          <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                          <SelectItem value="Doctorate / PhD">Doctorate / PhD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Degree / Qualification *</Label>
                      <Input
                        type="text"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        placeholder="e.g. B.Tech / SSC / HSC"
                        className="h-9 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Specialization / Stream</Label>
                      <Input
                        type="text"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder="e.g. Computer Science / Science"
                        className="h-9 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Institute / School / College *</Label>
                      <Input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="e.g. ABC College of Engineering / ABC High School"
                        className="h-9 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">University / Board *</Label>
                      <Input
                        type="text"
                        value={universityOrBoard}
                        onChange={(e) => setUniversityOrBoard(e.target.value)}
                        placeholder="e.g. CBSE / Maharashtra State Board / SPPU"
                        className="h-9 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Start Year</Label>
                      <Input
                        type="text"
                        value={startYear}
                        onChange={(e) => setStartYear(e.target.value)}
                        placeholder="2022"
                        className="h-9 text-xs font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Passing Year *</Label>
                      <Input
                        type="text"
                        value={passingYear}
                        onChange={(e) => setPassingYear(e.target.value)}
                        placeholder="2026"
                        className="h-9 text-xs font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Score / CGPA / % *</Label>
                      <Input
                        type="text"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        placeholder="8.45 / 85%"
                        className="h-9 text-xs font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Result Status</Label>
                      <Select value={resultStatus} onValueChange={setResultStatus}>
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Passed">Passed</SelectItem>
                          <SelectItem value="Pursuing">Pursuing / Appearing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveEducationItem}
                      className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Save className="h-3.5 w-3.5 mr-1" />
                      {editingEduId ? 'Update Qualification' : 'Save Qualification'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ── SECTION 5: SKILLS & COMPETENCIES ── */}
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider text-xs">
                <Star className="h-4 w-4" /> 5. Skills & Competencies
              </div>

              <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-1.5">
                <span className="font-bold text-[11px] text-indigo-700 dark:text-indigo-300">
                  Required Job Skills for {activeJob?.title || 'Requisition'} (Read-Only)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {requiredSkillsList.map((sk, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[11px] font-semibold bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200">
                      {sk}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-xs">Technical Skills & Technologies</Label>
                <Textarea
                  value={technicalSkills}
                  onChange={(e) => setTechnicalSkills(e.target.value)}
                  placeholder="e.g. React.js, TypeScript, Node.js, Docker, PostgreSQL, AWS"
                  className="min-h-[70px] text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-xs">Soft Skills</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Communication', 'Teamwork', 'Leadership', 'Problem Solving', 'Adaptability'].map((sk) => {
                    const isSelected = selectedSoftSkills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => toggleSoftSkill(sk)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200'
                        }`}
                      >
                        {isSelected ? `✓ ${sk}` : `+ ${sk}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── SECTION 6: CERTIFICATIONS ── */}
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider text-xs">
                <Award className="h-4 w-4" /> 6. Certifications
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-xs block">
                  Do you hold any professional certifications relevant to this position? *
                </Label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 font-semibold text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="hasCertRadio"
                      checked={hasCertifications === 'YES'}
                      onChange={() => setHasCertifications('YES')}
                      className="h-4 w-4 text-indigo-600"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 font-semibold text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="hasCertRadio"
                      checked={hasCertifications === 'NO'}
                      onChange={() => setHasCertifications('NO')}
                      className="h-4 w-4 text-indigo-600"
                    />
                    No
                  </label>
                </div>
              </div>

              {hasCertifications === 'YES' && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Certification Name</Label>
                      <Input
                        type="text"
                        value={certName}
                        onChange={(e) => setCertName(e.target.value)}
                        placeholder="e.g. AWS Certified Developer"
                        className="h-9 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Issuing Organization</Label>
                      <Input
                        type="text"
                        value={certIssuingOrg}
                        onChange={(e) => setCertIssuingOrg(e.target.value)}
                        placeholder="e.g. Amazon Web Services"
                        className="h-9 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Certification Type</Label>
                      <Select value={certType} onValueChange={setCertType}>
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Professional">Professional</SelectItem>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Vendor / Industry">Vendor / Industry</SelectItem>
                          <SelectItem value="Compliance / Safety">Compliance / Safety</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Issue Date</Label>
                      <Input
                        type="text"
                        value={certIssueDate}
                        onChange={(e) => setCertIssueDate(e.target.value)}
                        placeholder="MM/YYYY"
                        className="h-9 text-xs font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Expiry Date</Label>
                      <Input
                        type="text"
                        value={certExpiryDate}
                        onChange={(e) => setCertExpiryDate(e.target.value)}
                        placeholder="MM/YYYY"
                        className="h-9 text-xs font-mono bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── SECTION 7: RESUME & DOCUMENTS ── */}
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider text-xs">
                <FileText className="h-4 w-4" /> 7. Resume & Attached Documents
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-xs">Resume / CV Document *</Label>
                {resumeFileName ? (
                  <div className="border border-emerald-300 rounded-xl p-3 bg-emerald-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                      <FileCheck className="h-4 w-4 text-emerald-600" />
                      <span>{resumeFileName}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setResumeFileName('');
                        setResumePath('');
                      }}
                      className="h-6 text-xs text-rose-600 hover:bg-rose-100"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                    <span className="text-xs text-slate-500">📄 Upload Resume (PDF, DOC, DOCX • Max 5 MB)</span>
                    <Label htmlFor="resume-file-input" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs font-semibold pointer-events-none">
                        Choose File
                      </Button>
                    </Label>
                    <Input
                      id="resume-file-input"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeFileChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 8: DECLARATION & CONSENT ── */}
            <div className="space-y-3 bg-indigo-50/40 dark:bg-indigo-950/30 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
              <h5 className="font-bold text-xs text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                APPLICANT DECLARATION & CONSENT *
              </h5>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="full-form-declaration"
                  checked={agreeDeclaration}
                  onCheckedChange={(c: any) => setAgreeDeclaration(Boolean(c))}
                  className="mt-0.5"
                />
                <Label htmlFor="full-form-declaration" className="text-xs cursor-pointer leading-relaxed text-slate-700 dark:text-slate-300">
                  I confirm that the information provided in this application is true and accurate, and I consent to the use of candidate personal information for recruitment and evaluation purposes in accordance with the company's{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPrivacyPolicyModal(true);
                    }}
                    className="text-indigo-600 dark:text-indigo-400 font-bold underline hover:text-indigo-800 inline-block"
                  >
                    Privacy Policy
                  </button>. *
                </Label>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-9 px-5 text-xs font-semibold">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="h-9 px-7 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {isSubmitting ? 'Saving...' : isEdit ? 'Update Candidate' : 'Add Candidate'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyPolicyModal} onOpenChange={setShowPrivacyPolicyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-indigo-700 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" /> Candidate Data Privacy Policy
            </DialogTitle>
          </DialogHeader>
          <div className="text-xs space-y-2 text-slate-600 leading-relaxed pt-1">
            <p>Candidate information is securely processed under the DPDP framework exclusively for recruitment and evaluation purposes by Codigix Infotech Pvt. Ltd.</p>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setShowPrivacyPolicyModal(false)} className="text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
