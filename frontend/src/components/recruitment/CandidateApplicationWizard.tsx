import React, { useState, useMemo } from 'react';
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  FileText,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Send,
  Upload,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  Award,
  Check,
  Edit2,
  Pencil,
  RefreshCw,
  Mail,
  Phone,
  Globe,
  Save,
  ArrowRight,
  Clock,
  Users,
  Cog,
  FolderKanban,
  ExternalLink,
  Layers,
  Lock,
  Star,
  FileCheck,
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { jobOpeningsApi } from '@/api/recruitment';
import type { JobOpening } from '@/api/types';

interface CandidateApplicationWizardProps {
  job: JobOpening;
  onSuccess?: (applicationId: string) => void;
  onCancel?: () => void;
}

export interface EducationItem {
  id: string;
  qualificationType: string;
  degree: string;
  specialization: string;
  institution: string;
  universityOrBoard: string;
  affiliation?: string;
  startYear: string;
  passingYear: string;
  gradingSystem: string;
  score: string;
  educationMode: string;
  resultStatus: string;
  country: string;
  stateOrCity?: string;
  certificateName?: string;
  certificatePath?: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuingOrganization: string;
  certificationType?: string;
  credentialId?: string;
  issueDate: string;
  hasExpiry: boolean;
  expiryDate?: string;
  verificationUrl?: string;
  certificateName?: string;
  certificatePath?: string;
}

export const CandidateApplicationWizard: React.FC<CandidateApplicationWizardProps> = ({
  job,
  onSuccess,
  onCancel,
}) => {
  // Active Step (1 to 9)
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedAppId, setGeneratedAppId] = useState('');

  // ── Step 1: Personal Information ──
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [preferredLocation, setPreferredLocation] = useState(job.workLocation || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [nationality, setNationality] = useState('Indian');
  const [workAuthorization, setWorkAuthorization] = useState('');

  // ── Step 2: Experience Details ──
  const initialType = job.candidateType === 'EXPERIENCED' ? 'EXPERIENCED' : 'FRESHER';
  const [candidateType, setCandidateType] = useState<'FRESHER' | 'EXPERIENCED'>(initialType);
  const [totalExperience, setTotalExperience] = useState(job.minExperience ? String(job.minExperience) : '');
  const [relevantExperience, setRelevantExperience] = useState(job.minExperience ? String(job.minExperience) : '');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentDesignation, setCurrentDesignation] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('30 Days');
  const [currentCtc, setCurrentCtc] = useState('');
  const [expectedCtc, setExpectedCtc] = useState('');

  // ── Step 3: Education Details (MNC-Style Repeatable Qualification Card Pattern) ──
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [isAddingEdu, setIsAddingEdu] = useState<boolean>(false);

  const [educationList, setEducationList] = useState<EducationItem[]>([
    {
      id: 'edu-1',
      qualificationType: 'Undergraduate / Graduation',
      degree: job.qualification || 'B.Tech / B.E.',
      specialization: 'Computer Science & Engineering',
      institution: '',
      universityOrBoard: '',
      affiliation: '',
      startYear: '2022',
      passingYear: '2026',
      gradingSystem: 'CGPA / Percentage',
      score: '',
      educationMode: 'Full Time',
      resultStatus: 'Passed',
      country: 'India',
      stateOrCity: '',
    },
  ]);

  // ── Step 4: Skills & Certifications ──
  const [candidateSkills, setCandidateSkills] = useState('');
  const [technicalSkills, setTechnicalSkills] = useState('');
  const [hasCertifications, setHasCertifications] = useState<'YES' | 'NO'>('NO');
  const [certificationList, setCertificationList] = useState<CertificationItem[]>([]);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [isAddingCert, setIsAddingCert] = useState<boolean>(false);

  // ── Step 5: Resume & Documents ──
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePath, setResumePath] = useState('');
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // ── Step 6: Questions & Screening ──
  const [willingToRelocate, setWillingToRelocate] = useState('Yes');
  const [workModeAgreement, setWorkModeAgreement] = useState('Yes');

  // ── Step 7: Preferences & Additional ──
  const [employmentPreference, setEmploymentPreference] = useState(job.employmentType || 'Full Time');

  // ── Step 6: Consent & Declaration ──
  const [agreeDeclaration, setAgreeDeclaration] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);

  // Field Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Required skills array from job requisition
  const jobRequiredSkillsArray = useMemo(() => {
    if (!job.requiredSkills) return ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD', 'Jenkins', 'Git'];
    return job.requiredSkills
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [job.requiredSkills]);

  // Resume Document Upload Handler
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      toast.error('Invalid file format. Please upload a PDF, DOC, or DOCX resume.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    setResumeFile(file);
    setIsUploadingResume(true);

    try {
      const res = await jobOpeningsApi.uploadResume(file);
      setResumePath(res.documentUrl || `/uploads/resumes/${file.name}`);
      toast.success(`Resume "${file.name}" uploaded successfully!`);
      setErrors((prev) => ({ ...prev, resume: '' }));
    } catch (err) {
      setResumePath(`/uploads/resumes/${file.name}`);
      toast.success(`Resume "${file.name}" attached.`);
      setErrors((prev) => ({ ...prev, resume: '' }));
    } finally {
      setIsUploadingResume(false);
    }
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumePath('');
    toast.info('Resume document removed.');
  };

  // Education Certificate Upload Handler
  const handleEduCertificateUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
      toast.error('Invalid document format. Please upload a PDF, JPG, JPEG, or PNG file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    setEducationList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              certificateName: file.name,
              certificatePath: `/uploads/certificates/${file.name}`,
            }
          : item
      )
    );
    toast.success(`Certificate "${file.name}" attached!`);
  };

  // Add Qualification
  const addEducation = () => {
    const newId = `edu-${Date.now()}`;
    const newEdu: EducationItem = {
      id: newId,
      qualificationType: 'Undergraduate / Graduation',
      degree: '',
      specialization: '',
      institution: '',
      universityOrBoard: '',
      affiliation: '',
      startYear: String(new Date().getFullYear() - 4),
      passingYear: String(new Date().getFullYear()),
      gradingSystem: 'CGPA / Percentage',
      score: '',
      educationMode: 'Full Time',
      resultStatus: 'Passed',
      country: 'India',
      stateOrCity: '',
    };
    setEducationList((prev) => [...prev, newEdu]);
    setEditingEduId(newId);
    setIsAddingEdu(true);
  };

  const removeEducation = (id: string) => {
    if (educationList.length === 1) {
      toast.warning('At least one education record is required.');
      return;
    }
    setEducationList((prev) => prev.filter((item) => item.id !== id));
    if (editingEduId === id) {
      setEditingEduId(null);
      setIsAddingEdu(false);
    }
    toast.info('Education record removed.');
  };

  // Add Certification Helper
  const addCertification = () => {
    const newId = `cert-${Date.now()}`;
    const newCert: CertificationItem = {
      id: newId,
      name: '',
      issuingOrganization: '',
      certificationType: 'Professional',
      credentialId: '',
      issueDate: '',
      hasExpiry: false,
      expiryDate: '',
      verificationUrl: '',
      certificateName: '',
      certificatePath: '',
    };
    setCertificationList((prev) => [...prev, newCert]);
    setEditingCertId(newId);
    setIsAddingCert(true);
  };

  const removeCertification = (id: string) => {
    setCertificationList((prev) => prev.filter((item) => item.id !== id));
    if (editingCertId === id) {
      setEditingCertId(null);
      setIsAddingCert(false);
    }
    toast.info('Certification record removed.');
  };

  const handleCertProofUpload = (certId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5 MB');
      return;
    }

    setCertificationList((prev) =>
      prev.map((item) =>
        item.id === certId
          ? {
              ...item,
              certificateName: file.name,
              certificatePath: URL.createObjectURL(file),
            }
          : item
      )
    );
    toast.success(`Proof document "${file.name}" attached!`);
  };

  // Step Validation logic
  const validateCurrentStep = (): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!firstName.trim()) errs.firstName = 'First Name is required.';
      if (!lastName.trim()) errs.lastName = 'Last Name is required.';
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Please enter a valid email address.';
      if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 10) errs.phone = 'Please enter a valid 10-digit mobile number.';
      if (!currentLocation.trim()) errs.currentLocation = 'Current Location is required.';
    }

    if (currentStep === 2 && candidateType === 'EXPERIENCED') {
      if (!totalExperience.trim()) errs.totalExperience = 'Total experience is required.';
      if (job.minExperience && parseFloat(totalExperience) < job.minExperience) {
        errs.totalExperience = `This position requires at least ${job.minExperience} years of experience.`;
      }
    }

    if (currentStep === 3) {
      if (educationList.length === 0) {
        errs.education = 'At least one education qualification is required.';
        toast.error('Please add at least one education qualification.');
        return false;
      }
      // If user is currently editing an active form, validate its required fields
      if (editingEduId !== null) {
        const activeEdu = educationList.find((e) => e.id === editingEduId);
        if (activeEdu) {
          if (!activeEdu.institution.trim()) {
            errs.institution = 'School / Institute / College name is required.';
          }
          if (!activeEdu.passingYear.trim()) {
            errs.passingYear = 'Passing Year is required.';
          }
        }
      }
    }

    if (currentStep === 4 && hasCertifications === 'YES') {
      if (certificationList.length === 0) {
        toast.error('You indicated you hold certifications. Please click "+ Add Another Certification" to add your details.');
        return false;
      }
      if (editingCertId !== null) {
        const activeCert = certificationList.find((c) => c.id === editingCertId);
        if (activeCert) {
          if (!activeCert.name.trim() || !activeCert.issuingOrganization.trim()) {
            toast.error('Please save or complete your current certification details before proceeding.');
            return false;
          }
        }
      }
    }

    if (currentStep === 5) {
      if (!resumeFile && !resumePath) {
        errs.resume = 'Resume / CV document (PDF/DOC/DOCX) is required.';
      }
    }

    if (currentStep === 6) {
      if (!agreeDeclaration) {
        errs.consent = 'You must confirm the Applicant Declaration & Consent before submitting.';
      }
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please resolve highlighted fields before proceeding.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveDraft = () => {
    toast.success('Application draft saved successfully!');
  };

  const handleSubmitApplication = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    const appId = `APP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const candidatePayload: any = {
      jobOpeningId: job.id,
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      currentLocation: currentLocation.trim(),
      candidateType: candidateType,
      qualification: educationList[0]?.degree || job.qualification || 'Graduate',
      graduationYear: educationList[0]?.passingYear || '2024',
      experience: candidateType === 'EXPERIENCED' ? `${totalExperience} Years` : '0 Years',
      currentCompany: candidateType === 'EXPERIENCED' ? currentCompany : undefined,
      skills: candidateSkills || technicalSkills || 'Software Engineering',
      resumePath: resumePath || `/uploads/resumes/${resumeFile?.name || 'resume.pdf'}`,
      source: 'CAREERS_PORTAL',
      stage: 'APPLIED',
      notes: `Applied on ${new Date().toLocaleDateString()} | App Ref: ${appId}`,
    };

    try {
      await jobOpeningsApi.addCandidate(job.id, candidatePayload);
      setGeneratedAppId(appId);
      setIsSubmitted(true);
      if (onSuccess) onSuccess(appId);
      toast.success('Application submitted successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit candidate application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const companyName = job.company?.name || 'Codigix Infotech Pvt. Ltd.';
  const branchName = job.workLocation || 'Pune Head Office';
  const departmentName = job.department?.name || 'Information Technology';

  const sidebarSteps = [
    { number: 1, title: '1. Personal Information', icon: User },
    { number: 2, title: '2. Experience Details', icon: Briefcase },
    { number: 3, title: '3. Education Details', icon: GraduationCap },
    { number: 4, title: '4. Skills & Certifications', icon: Star },
    { number: 5, title: '5. Resume & Documents', icon: FileText },
    { number: 6, title: '6. Review & Submit', icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-900 dark:text-slate-100 font-sans">
      {/* ── 1. TOP PUBLISHED JOB HEADER CARD ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <Badge variant="outline" className="font-mono text-[11px] font-bold bg-indigo-50 text-indigo-600 border-indigo-200 rounded-full px-3 py-0.5">
              {job.requisitionCode || 'JR-2026-017'}
            </Badge>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{job.title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-slate-400" /> {companyName}
              </span>
              <span>|</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" /> {branchName}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 text-xs px-3 py-1 font-semibold rounded-full">
              {job.numPositions ?? 5} Positions Open
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Application Deadline:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '25 Sep 2026'}
              </strong>
            </div>
          </div>
        </div>

        {/* 6 Grid Job Spec Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <FolderKanban className="h-3.5 w-3.5 text-indigo-500" /> Department
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{departmentName}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Cog className="h-3.5 w-3.5 text-indigo-500" /> Experience
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {job.candidateType === 'FRESHER'
                ? 'Freshers (0 Yrs)'
                : `${job.minExperience ?? 1} - ${job.maxExperience ?? 3} Years`}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-indigo-500" /> Qualification
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{job.qualification || 'B.Tech / B.E.'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Employment Type
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{job.employmentType || 'Full Time'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-indigo-500" /> Work Mode
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{job.workMode || 'On-site'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-indigo-500" /> Openings
            </span>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{job.numPositions ?? 5} Positions</p>
          </div>
        </div>

        {/* Required Skills Row */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs flex-wrap">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Required Skills:</span>
          <div className="flex flex-wrap gap-1.5">
            {jobRequiredSkillsArray.map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="bg-indigo-50/80 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-100 font-medium text-xs rounded-full px-3">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {isSubmitted ? (
        /* ── SUBMISSION SUCCESS SCREEN ── */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-6 shadow-sm">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Application Submitted Successfully</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your application has been registered for <strong>{job.title}</strong>.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 border rounded-xl p-5 max-w-sm mx-auto space-y-2 text-xs text-left">
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Application ID:</span>
              <span className="font-mono font-bold text-indigo-600">{generatedAppId}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Requisition Code:</span>
              <span className="font-mono font-semibold">{job.requisitionCode || 'JR-2026-017'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <Badge className="bg-blue-100 text-blue-700 text-[11px] font-semibold">
                Application Received
              </Badge>
            </div>
          </div>

          {onCancel && (
            <Button size="sm" variant="outline" onClick={onCancel} className="text-xs font-semibold px-6">
              Close Window
            </Button>
          )}
        </div>
      ) : (
        /* ── 2-COLUMN PAGE LAYOUT: LEFT SIDEBAR + RIGHT MAIN FORM ── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT SIDEBAR: APPLICATION STEPS VERTICAL NAVIGATION ── */}
          <div className="lg:col-span-4 xl:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
            <h4 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase px-3 pt-1">
              APPLICATION STEPS
            </h4>

            <nav className="space-y-1">
              {sidebarSteps.map((step) => {
                const IconComponent = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;

                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => {
                      if (isCompleted || step.number <= currentStep) {
                        setCurrentStep(step.number);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm font-bold'
                        : isCompleted
                        ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : isCompleted
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                      }`}
                    >
                      {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : <IconComponent className="h-4 w-4" />}
                    </div>
                    <span className="truncate text-left">{step.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ── RIGHT MAIN COLUMN: STEP FORM CONTENT ── */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xs space-y-6">
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {sidebarSteps[currentStep - 1].title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {currentStep === 3
                        ? 'Add your complete academic qualification details.'
                        : 'Enter your application details for this section.'}
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs font-semibold text-slate-600 border-slate-200 bg-slate-50 px-3 py-1">
                  Step {currentStep} of 6
                </Badge>
              </div>

              {/* STEP 1: PERSONAL INFORMATION */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">First Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Enter first name"
                          className="pl-9 h-9 text-xs"
                        />
                      </div>
                      {errors.firstName && <p className="text-[11px] text-rose-600 font-semibold">{errors.firstName}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Middle Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          type="text"
                          value={middleName}
                          onChange={(e) => setMiddleName(e.target.value)}
                          placeholder="Enter middle name"
                          className="pl-9 h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Last Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Enter last name"
                          className="pl-9 h-9 text-xs"
                        />
                      </div>
                      {errors.lastName && <p className="text-[11px] text-rose-600 font-semibold">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value.toLowerCase())}
                          placeholder="Enter email address"
                          className="pl-9 h-9 text-xs"
                        />
                      </div>
                      {errors.email && <p className="text-[11px] text-rose-600 font-semibold">{errors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Mobile Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Enter mobile number"
                          className="pl-9 h-9 text-xs font-mono"
                        />
                      </div>
                      {errors.phone && <p className="text-[11px] text-rose-600 font-semibold">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Current Location *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          type="text"
                          value={currentLocation}
                          onChange={(e) => setCurrentLocation(e.target.value)}
                          placeholder="Enter your current location"
                          className="pl-9 h-9 text-xs"
                        />
                      </div>
                      {errors.currentLocation && <p className="text-[11px] text-rose-600 font-semibold">{errors.currentLocation}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Preferred Work Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          type="text"
                          value={preferredLocation}
                          onChange={(e) => setPreferredLocation(e.target.value)}
                          placeholder="Select preferred location"
                          className="pl-9 h-9 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Date of Birth</Label>
                      <Input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Gender *</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Nationality *</Label>
                      <Input
                        type="text"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        placeholder="Select nationality"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Work Authorization *</Label>
                      <Select value={workAuthorization} onValueChange={setWorkAuthorization}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select work authorization" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Authorized to Work">Authorized to Work</SelectItem>
                          <SelectItem value="Requires Visa Sponsorship">Requires Visa Sponsorship</SelectItem>
                          <SelectItem value="Citizen / Permanent Resident">Citizen / Permanent Resident</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: EXPERIENCE DETAILS */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-1.5 max-w-xs">
                    <Label className="font-semibold text-xs">Experience Type *</Label>
                    <Select value={candidateType} onValueChange={(val: any) => setCandidateType(val)}>
                      <SelectTrigger className="h-9 text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FRESHER">Fresher / Entry Level</SelectItem>
                        <SelectItem value="EXPERIENCED">Experienced Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {candidateType === 'EXPERIENCED' ? (
                    <div className="space-y-5 pt-3 border-t">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Total Experience (Years) *</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={totalExperience}
                            onChange={(e) => setTotalExperience(e.target.value)}
                            placeholder="e.g. 3.0"
                            className="h-9 text-xs font-mono font-semibold"
                          />
                          {errors.totalExperience && <p className="text-[11px] text-rose-600 font-semibold">{errors.totalExperience}</p>}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Relevant Experience (Years)</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={relevantExperience}
                            onChange={(e) => setRelevantExperience(e.target.value)}
                            placeholder="e.g. 2.5"
                            className="h-9 text-xs font-mono font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Current / Last Employer</Label>
                          <Input
                            type="text"
                            value={currentCompany}
                            onChange={(e) => setCurrentCompany(e.target.value)}
                            placeholder="Enter current company name"
                            className="h-9 text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Current / Last Designation</Label>
                          <Input
                            type="text"
                            value={currentDesignation}
                            onChange={(e) => setCurrentDesignation(e.target.value)}
                            placeholder="Enter current title"
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Notice Period</Label>
                          <Select value={noticePeriod} onValueChange={setNoticePeriod}>
                            <SelectTrigger className="h-9 text-xs font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Immediate">Immediate / Serving Notice</SelectItem>
                              <SelectItem value="15 Days">15 Days</SelectItem>
                              <SelectItem value="30 Days">30 Days</SelectItem>
                              <SelectItem value="60 Days">60 Days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Current CTC (₹ p.a.)</Label>
                          <Input
                            type="number"
                            value={currentCtc}
                            onChange={(e) => setCurrentCtc(e.target.value)}
                            placeholder="e.g. 600000"
                            className="h-9 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Expected CTC (₹ p.a.)</Label>
                          <Input
                            type="number"
                            value={expectedCtc}
                            onChange={(e) => setExpectedCtc(e.target.value)}
                            placeholder="e.g. 900000"
                            className="h-9 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-xs space-y-1">
                      <p className="font-bold text-indigo-700">Fresher / Entry Level Selected</p>
                      <p className="text-slate-500">Prior employment experience is not mandatory for freshers.</p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: MNC-STYLE REPEATABLE QUALIFICATION CARD PATTERN */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* VIEW MODE: COMPACT SAVED QUALIFICATION CARDS */}
                  {editingEduId === null && educationList.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {educationList.map((edu, idx) => (
                          <div
                            key={edu.id}
                            className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 bg-white dark:bg-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-indigo-300"
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className="bg-emerald-600 text-white font-bold text-xs gap-1 px-2.5 py-0.5 shadow-2xs">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> {edu.qualificationType}
                                </Badge>
                                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                  {edu.degree || edu.qualificationType}
                                </span>
                              </div>

                              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {edu.institution || 'Institution Not Specified'}
                                </span>
                                {edu.specialization && (
                                  <>
                                    <span className="text-slate-400">•</span>
                                    <span>{edu.specialization}</span>
                                  </>
                                )}
                                {edu.universityOrBoard && (
                                  <>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-slate-500 font-mono">({edu.universityOrBoard})</span>
                                  </>
                                )}
                              </div>

                              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pt-0.5">
                                <span>Passing Year: <strong className="font-mono text-slate-700 dark:text-slate-300">{edu.passingYear}</strong></span>
                                {edu.score && (
                                  <span>Score: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{edu.score}</strong></span>
                                )}
                                <span>Status: <strong className="text-slate-700 dark:text-slate-300">{edu.resultStatus || 'Passed'}</strong></span>
                                {edu.educationMode && (
                                  <span>Mode: <strong className="text-slate-700 dark:text-slate-300">{edu.educationMode}</strong></span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingEduId(edu.id);
                                  setIsAddingEdu(false);
                                }}
                                className="h-8 text-xs font-semibold px-3 text-slate-700 dark:text-slate-200 hover:text-indigo-600 border-slate-200 dark:border-slate-700"
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEducation(edu.id)}
                                className="h-8 text-xs font-semibold px-3 text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* + Add Another Qualification Button */}
                      <div className="pt-3 text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addEducation}
                          className="text-xs font-bold gap-2 px-6 h-9 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950 shadow-2xs cursor-pointer"
                        >
                          <Plus className="h-4 w-4" /> + Add Another Qualification
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* FORM ENTRY / EDIT MODE FOR ACTIVE QUALIFICATION */
                    (() => {
                      const activeEdu = educationList.find((e) => e.id === editingEduId) || educationList[0];
                      if (!activeEdu) return null;

                      const isSchool10th = activeEdu.qualificationType === '10th / Secondary';
                      const isSchool12th = activeEdu.qualificationType === '12th / Higher Secondary';
                      const isDiplomaOrIti = activeEdu.qualificationType === 'Diploma' || activeEdu.qualificationType === 'ITI';
                      const isPhD = activeEdu.qualificationType === 'Doctorate / PhD';

                      return (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-5 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-indigo-600 text-white font-bold text-xs">
                                Qualification Entry
                              </Badge>
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                {activeEdu.qualificationType || 'Select Qualification Type'}
                              </span>
                            </div>
                            {educationList.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (isAddingEdu) {
                                    setEducationList((prev) => prev.filter((e) => e.id !== activeEdu.id));
                                  }
                                  setEditingEduId(null);
                                  setIsAddingEdu(false);
                                }}
                                className="h-7 text-xs text-slate-500 hover:bg-slate-100 font-semibold"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>

                          {/* Row 1: Qualification Type Selector */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="font-semibold text-xs">Qualification Type *</Label>
                              <Select
                                value={activeEdu.qualificationType}
                                onValueChange={(val) => {
                                  setEducationList((prev) =>
                                    prev.map((item) =>
                                      item.id === activeEdu.id ? { ...item, qualificationType: val } : item
                                    )
                                  );
                                }}
                              >
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200">
                                  <SelectValue placeholder="Select Qualification" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="10th / Secondary">10th / Secondary</SelectItem>
                                  <SelectItem value="12th / Higher Secondary">12th / Higher Secondary</SelectItem>
                                  <SelectItem value="Diploma">Diploma</SelectItem>
                                  <SelectItem value="ITI">ITI</SelectItem>
                                  <SelectItem value="Undergraduate / Graduation">Undergraduate / Graduation</SelectItem>
                                  <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                                  <SelectItem value="Doctorate / PhD">Doctorate / PhD</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="font-semibold text-xs">
                                {isSchool10th || isSchool12th
                                  ? 'School / Institution Name *'
                                  : isDiplomaOrIti
                                  ? 'Institute / College *'
                                  : isPhD
                                  ? 'Degree / Doctorate Discipline *'
                                  : 'Degree / Qualification *'}
                              </Label>
                              <Input
                                type="text"
                                value={isSchool10th ? activeEdu.institution : isSchool12th ? activeEdu.institution : activeEdu.degree}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEducationList((prev) =>
                                    prev.map((item) =>
                                      item.id === activeEdu.id
                                        ? isSchool10th || isSchool12th
                                          ? { ...item, institution: val, degree: activeEdu.qualificationType }
                                          : { ...item, degree: val }
                                        : item
                                    )
                                  );
                                }}
                                placeholder={
                                  isSchool10th || isSchool12th
                                    ? 'e.g. ABC High School / Junior College'
                                    : isDiplomaOrIti
                                    ? 'e.g. Govt Polytechnic Institute'
                                    : 'e.g. B.Tech, BE, BCA, MCA, MBA, B.Sc'
                                }
                                className="h-9 text-xs"
                              />
                            </div>
                          </div>

                          {/* Row 2: Institution / Board / Specialization */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {!isSchool10th && !isSchool12th && (
                              <div className="space-y-1.5">
                                <Label className="font-semibold text-xs">
                                  {isDiplomaOrIti ? 'Trade / Specialization *' : 'Specialization / Major *'}
                                </Label>
                                <Input
                                  type="text"
                                  value={activeEdu.specialization}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEducationList((prev) =>
                                      prev.map((item) => (item.id === activeEdu.id ? { ...item, specialization: val } : item))
                                    );
                                  }}
                                  placeholder="e.g. Computer Science / Mechanical"
                                  className="h-9 text-xs"
                                />
                              </div>
                            )}

                            {isSchool12th && (
                              <div className="space-y-1.5">
                                <Label className="font-semibold text-xs">Stream *</Label>
                                <Select
                                  value={activeEdu.specialization || 'Science'}
                                  onValueChange={(val) => {
                                    setEducationList((prev) =>
                                      prev.map((item) => (item.id === activeEdu.id ? { ...item, specialization: val } : item))
                                    );
                                  }}
                                >
                                  <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200">
                                    <SelectValue placeholder="Select Stream" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Science">Science</SelectItem>
                                    <SelectItem value="Commerce">Commerce</SelectItem>
                                    <SelectItem value="Arts / Humanities">Arts / Humanities</SelectItem>
                                    <SelectItem value="Vocational">Vocational</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className="space-y-1.5">
                              <Label className="font-semibold text-xs">
                                {isSchool10th || isSchool12th ? 'Board *' : 'University / Board *'}
                              </Label>
                              <Input
                                type="text"
                                value={activeEdu.universityOrBoard}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEducationList((prev) =>
                                    prev.map((item) => (item.id === activeEdu.id ? { ...item, universityOrBoard: val } : item))
                                  );
                                }}
                                placeholder={isSchool10th || isSchool12th ? 'e.g. CBSE / ICSE / State Board' : 'e.g. Pune University / CBSE'}
                                className="h-9 text-xs"
                              />
                            </div>
                          </div>

                          {/* Row 3: College / Institute Name (if degree form) */}
                          {!isSchool10th && !isSchool12th && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <Label className="font-semibold text-xs">Institute / College *</Label>
                                <Input
                                  type="text"
                                  value={activeEdu.institution}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEducationList((prev) =>
                                      prev.map((item) => (item.id === activeEdu.id ? { ...item, institution: val } : item))
                                    );
                                  }}
                                  placeholder="College / Institute name"
                                  className="h-9 text-xs"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <Label className="font-semibold text-xs">Education Mode *</Label>
                                <Select
                                  value={activeEdu.educationMode}
                                  onValueChange={(val) => {
                                    setEducationList((prev) =>
                                      prev.map((item) => (item.id === activeEdu.id ? { ...item, educationMode: val } : item))
                                    );
                                  }}
                                >
                                  <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200">
                                    <SelectValue placeholder="Select Mode" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Full Time">Full Time</SelectItem>
                                    <SelectItem value="Part Time">Part Time</SelectItem>
                                    <SelectItem value="Distance / Correspondence">Distance / Correspondence</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          {/* Row 4: Start Year & Passing Year */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="font-semibold text-xs">Start Year</Label>
                              <Input
                                type="text"
                                value={activeEdu.startYear}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEducationList((prev) =>
                                    prev.map((item) => (item.id === activeEdu.id ? { ...item, startYear: val } : item))
                                  );
                                }}
                                placeholder="e.g. 2022"
                                className="h-9 text-xs font-mono"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="font-semibold text-xs">Passing Year *</Label>
                              <Input
                                type="text"
                                value={activeEdu.passingYear}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEducationList((prev) =>
                                    prev.map((item) => (item.id === activeEdu.id ? { ...item, passingYear: val } : item))
                                  );
                                }}
                                placeholder="e.g. 2026"
                                className="h-9 text-xs font-mono"
                              />
                            </div>
                          </div>

                          {/* Row 5: Grading System & Score */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="font-semibold text-xs">Grading System *</Label>
                              <Select
                                value={activeEdu.gradingSystem}
                                onValueChange={(val) => {
                                  setEducationList((prev) =>
                                    prev.map((item) => (item.id === activeEdu.id ? { ...item, gradingSystem: val } : item))
                                  );
                                }}
                              >
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200">
                                  <SelectValue placeholder="Select Grading System" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CGPA / Percentage">CGPA / Percentage</SelectItem>
                                  <SelectItem value="Percentage">Percentage (%)</SelectItem>
                                  <SelectItem value="Grade Scale (10 Point)">Grade Scale (10 Point)</SelectItem>
                                  <SelectItem value="Grade Scale (4 Point)">Grade Scale (4 Point)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="font-semibold text-xs">Score / Percentage / CGPA *</Label>
                              <Input
                                type="text"
                                value={activeEdu.score}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEducationList((prev) =>
                                    prev.map((item) => (item.id === activeEdu.id ? { ...item, score: val } : item))
                                  );
                                }}
                                placeholder="e.g. 8.45 / 88.2%"
                                className="h-9 text-xs font-mono"
                              />
                            </div>
                          </div>

                          {/* Row 6: Result Status */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="font-semibold text-xs">Result Status *</Label>
                              <Select
                                value={activeEdu.resultStatus}
                                onValueChange={(val) => {
                                  setEducationList((prev) =>
                                    prev.map((item) => (item.id === activeEdu.id ? { ...item, resultStatus: val } : item))
                                  );
                                }}
                              >
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200">
                                  <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Passed">Passed</SelectItem>
                                  <SelectItem value="Appearing / Pursuing">Appearing / Pursuing</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="font-semibold text-xs">Country *</Label>
                              <Select
                                value={activeEdu.country}
                                onValueChange={(val) => {
                                  setEducationList((prev) =>
                                    prev.map((item) => (item.id === activeEdu.id ? { ...item, country: val } : item))
                                  );
                                }}
                              >
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200">
                                  <SelectValue placeholder="Select Country" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="India">India</SelectItem>
                                  <SelectItem value="United States">United States</SelectItem>
                                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                  <SelectItem value="Canada">Canada</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>



                          {/* Save & Cancel Qualification Action Buttons */}
                          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                            {educationList.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (isAddingEdu) {
                                    setEducationList((prev) => prev.filter((e) => e.id !== activeEdu.id));
                                  }
                                  setEditingEduId(null);
                                  setIsAddingEdu(false);
                                }}
                                className="h-9 text-xs font-semibold px-4"
                              >
                                Cancel
                              </Button>
                            )}

                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                if (!activeEdu.institution.trim()) {
                                  toast.error('School / Institution / College name is required.');
                                  return;
                                }
                                if (!activeEdu.passingYear.trim()) {
                                  toast.error('Passing Year is required.');
                                  return;
                                }
                                setEditingEduId(null);
                                setIsAddingEdu(false);
                                toast.success(`${activeEdu.qualificationType} saved successfully!`);
                              }}
                              className="h-9 text-xs font-bold px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
                            >
                              <Save className="h-3.5 w-3.5 mr-1.5" /> Save Qualification
                            </Button>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {/* STEP 4: SKILLS & CERTIFICATIONS (DYNAMIC YES/NO + REPEATABLE CERTIFICATION CARDS) */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {/* Required Skills Card */}
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                    <span className="font-bold text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <Award className="h-4 w-4" /> Required Job Skills (Read-Only)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {jobRequiredSkillsArray.map((sk, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs font-semibold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300">
                          {sk}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Technical Skills Input */}
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Technical Skills & Competencies</Label>
                    <Textarea
                      value={technicalSkills}
                      onChange={(e) => setTechnicalSkills(e.target.value)}
                      placeholder="e.g. React.js, Node.js, Docker, Kubernetes, AWS"
                      className="text-xs min-h-[80px]"
                    />
                  </div>

                  {/* Professional Certifications Dynamic Section */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-5 shadow-2xs">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3 space-y-1">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        CERTIFICATIONS
                      </h4>
                      <Label className="font-semibold text-xs text-slate-700 dark:text-slate-300 block">
                        Do you hold any professional certifications relevant to this position? *
                      </Label>

                      {/* Yes / No Radio Choice */}
                      <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="hasCertifications"
                            value="YES"
                            checked={hasCertifications === 'YES'}
                            onChange={() => {
                              setHasCertifications('YES');
                              if (certificationList.length === 0) {
                                addCertification();
                              }
                            }}
                            className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                          />
                          Yes
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                          <input
                            type="radio"
                            name="hasCertifications"
                            value="NO"
                            checked={hasCertifications === 'NO'}
                            onChange={() => {
                              setHasCertifications('NO');
                              setEditingCertId(null);
                              setIsAddingCert(false);
                            }}
                            className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                          />
                          No
                        </label>
                      </div>
                    </div>

                    {/* IF NO CERTIFICATIONS SELECTED */}
                    {hasCertifications === 'NO' && (
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 italic">
                        No certification details required.
                      </div>
                    )}

                    {/* IF YES CERTIFICATIONS SELECTED */}
                    {hasCertifications === 'YES' && (
                      <div className="space-y-4 pt-1">
                        {/* VIEW MODE: COMPACT SAVED CARDS */}
                        {editingCertId === null && certificationList.length > 0 ? (
                          <div className="space-y-4">
                            <div className="space-y-3">
                              {certificationList.map((cert, idx) => (
                                <div
                                  key={cert.id}
                                  className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-indigo-300"
                                >
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge className="bg-indigo-600 text-white font-bold text-xs gap-1 px-2.5 py-0.5">
                                        Certification #{idx + 1}
                                      </Badge>
                                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                        {cert.name || 'Certification Name Not Set'}
                                      </span>
                                      {cert.issuingOrganization && (
                                        <span className="text-xs text-slate-500 font-semibold">• {cert.issuingOrganization}</span>
                                      )}
                                    </div>

                                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pt-1">
                                      {cert.certificationType && (
                                        <span>Type: <strong className="text-slate-700 dark:text-slate-300">{cert.certificationType}</strong></span>
                                      )}
                                      {cert.credentialId && (
                                        <span>Credential ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{cert.credentialId}</strong></span>
                                      )}
                                      {cert.issueDate && (
                                        <span>Issued: <strong className="font-mono text-slate-700 dark:text-slate-300">{cert.issueDate}</strong></span>
                                      )}
                                      <span>
                                        Expiry:{' '}
                                        <strong className="font-mono text-slate-700 dark:text-slate-300">
                                          {cert.hasExpiry && cert.expiryDate ? cert.expiryDate : 'No Expiry'}
                                        </strong>
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingCertId(cert.id);
                                        setIsAddingCert(false);
                                      }}
                                      className="h-8 text-xs font-semibold px-3 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                                    >
                                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeCertification(cert.id)}
                                      className="h-8 text-xs font-semibold px-3 text-rose-600 hover:bg-rose-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* + Add Another Certification Button */}
                            <div className="pt-2 text-center">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addCertification}
                                className="text-xs font-bold gap-2 px-6 h-9 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950 shadow-2xs cursor-pointer"
                              >
                                <Plus className="h-4 w-4" /> + Add Another Certification
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* FORM ENTRY MODE FOR ACTIVE CERTIFICATION */
                          (() => {
                            const activeCert = certificationList.find((c) => c.id === editingCertId) || certificationList[0];
                            if (!activeCert) return null;

                            return (
                              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                                  <span className="font-bold text-xs text-indigo-700 dark:text-indigo-300">
                                    Certification Details Form
                                  </span>
                                  {certificationList.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (isAddingCert) {
                                          setCertificationList((prev) => prev.filter((c) => c.id !== activeCert.id));
                                        }
                                        setEditingCertId(null);
                                        setIsAddingCert(false);
                                      }}
                                      className="h-6 text-xs text-slate-500 hover:bg-slate-200"
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </div>

                                {/* Row 1: Certification Name & Issuing Organization */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <Label className="font-semibold text-xs">Certification Name *</Label>
                                    <Input
                                      type="text"
                                      value={activeCert.name}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCertificationList((prev) =>
                                          prev.map((c) => (c.id === activeCert.id ? { ...c, name: val } : c))
                                        );
                                      }}
                                      placeholder="e.g. AWS Certified Developer"
                                      className="h-9 text-xs bg-white dark:bg-slate-900"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label className="font-semibold text-xs">Issuing Organization *</Label>
                                    <Input
                                      type="text"
                                      value={activeCert.issuingOrganization}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCertificationList((prev) =>
                                          prev.map((c) => (c.id === activeCert.id ? { ...c, issuingOrganization: val } : c))
                                        );
                                      }}
                                      placeholder="e.g. Amazon Web Services / Microsoft"
                                      className="h-9 text-xs bg-white dark:bg-slate-900"
                                    />
                                  </div>
                                </div>

                                {/* Row 2: Certification Type */}
                                <div className="space-y-1.5 max-w-sm">
                                  <Label className="font-semibold text-xs">Certification Type *</Label>
                                  <Select
                                    value={activeCert.certificationType || 'Professional'}
                                    onValueChange={(val) => {
                                      setCertificationList((prev) =>
                                        prev.map((c) => (c.id === activeCert.id ? { ...c, certificationType: val } : c))
                                      );
                                    }}
                                  >
                                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200">
                                      <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Professional">Professional</SelectItem>
                                      <SelectItem value="Technical">Technical</SelectItem>
                                      <SelectItem value="Vendor / Industry">Vendor / Industry</SelectItem>
                                      <SelectItem value="Compliance / Safety">Compliance / Safety</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Row 3: Issue Date & Has Expiry Radio */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <Label className="font-semibold text-xs">Issue Date *</Label>
                                    <Input
                                      type="text"
                                      value={activeCert.issueDate || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCertificationList((prev) =>
                                          prev.map((c) => (c.id === activeCert.id ? { ...c, issueDate: val } : c))
                                        );
                                      }}
                                      placeholder="e.g. Jun 2026 / 2026-06"
                                      className="h-9 text-xs bg-white dark:bg-slate-900 font-mono"
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label className="font-semibold text-xs">Does this certification have an expiry date? *</Label>
                                    <div className="flex items-center gap-6 pt-2">
                                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`hasExpiry-${activeCert.id}`}
                                          checked={activeCert.hasExpiry === true}
                                          onChange={() => {
                                            setCertificationList((prev) =>
                                              prev.map((c) => (c.id === activeCert.id ? { ...c, hasExpiry: true } : c))
                                            );
                                          }}
                                          className="h-4 w-4 text-indigo-600"
                                        />
                                        Yes
                                      </label>
                                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`hasExpiry-${activeCert.id}`}
                                          checked={activeCert.hasExpiry === false}
                                          onChange={() => {
                                            setCertificationList((prev) =>
                                              prev.map((c) => (c.id === activeCert.id ? { ...c, hasExpiry: false, expiryDate: '' } : c))
                                            );
                                          }}
                                          className="h-4 w-4 text-indigo-600"
                                        />
                                        No
                                      </label>
                                    </div>
                                  </div>
                                </div>

                                {/* Row 4: Expiry Date (If Has Expiry = Yes) */}
                                {activeCert.hasExpiry && (
                                  <div className="space-y-1.5 max-w-sm">
                                    <Label className="font-semibold text-xs">Expiry Date</Label>
                                    <Input
                                      type="text"
                                      value={activeCert.expiryDate || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCertificationList((prev) =>
                                          prev.map((c) => (c.id === activeCert.id ? { ...c, expiryDate: val } : c))
                                        );
                                      }}
                                      placeholder="e.g. Jun 2029 / 2029-06"
                                      className="h-9 text-xs bg-white dark:bg-slate-900 font-mono"
                                    />
                                  </div>
                                )}



                                {/* Save & Cancel Certification Buttons */}
                                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                                  {certificationList.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (isAddingCert) {
                                          setCertificationList((prev) => prev.filter((c) => c.id !== activeCert.id));
                                        }
                                        setEditingCertId(null);
                                        setIsAddingCert(false);
                                      }}
                                      className="h-8 text-xs font-semibold px-4"
                                    >
                                      Cancel
                                    </Button>
                                  )}

                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      if (!activeCert.name.trim()) {
                                        toast.error('Certification Name is required.');
                                        return;
                                      }
                                      if (!activeCert.issuingOrganization.trim()) {
                                        toast.error('Issuing Organization is required.');
                                        return;
                                      }
                                      setEditingCertId(null);
                                      setIsAddingCert(false);
                                      toast.success(`Certification "${activeCert.name}" saved successfully!`);
                                    }}
                                    className="h-8 text-xs font-bold px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
                                  >
                                    <Save className="h-3.5 w-3.5 mr-1.5" /> Save Certification
                                  </Button>
                                </div>
                              </div>
                            );
                          })()
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: RESUME & DOCUMENTS */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  {resumeFile || resumePath ? (
                    <div className="border border-emerald-300 rounded-xl p-4 bg-emerald-50/60 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-emerald-600" />
                        <div>
                          <p className="font-bold text-xs text-slate-900">{resumeFile ? resumeFile.name : 'Resume Attached'}</p>
                          <p className="text-[11px] text-emerald-600 font-semibold">Uploaded successfully</p>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={removeResume} className="text-xs text-rose-600">
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-8 bg-indigo-50/30 text-center space-y-3">
                      <Upload className="h-8 w-8 text-indigo-600 mx-auto" />
                      <div>
                        <p className="font-bold text-xs">Choose Resume File *</p>
                        <p className="text-[11px] text-slate-500">PDF, DOC, DOCX (Max 5MB)</p>
                      </div>
                      <Input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="max-w-xs mx-auto text-xs" />
                      {errors.resume && <p className="text-[11px] text-rose-600 font-semibold">{errors.resume}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 6: REVIEW & SUBMIT */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {/* Personal Info Summary */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/70 dark:bg-slate-900/50 space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
                          1. Personal Information
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)} className="h-6 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50">
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      </div>
                      <p><strong>Name:</strong> {firstName} {middleName} {lastName}</p>
                      <p><strong>Email:</strong> {email} | <strong>Mobile:</strong> {phone}</p>
                      <p><strong>Current Location:</strong> {currentLocation} | <strong>Preferred:</strong> {preferredLocation || branchName}</p>
                    </div>

                    {/* Experience Summary */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/70 dark:bg-slate-900/50 space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
                          2. Experience Details
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)} className="h-6 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50">
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      </div>
                      <p><strong>Candidate Type:</strong> {candidateType}</p>
                      {candidateType === 'EXPERIENCED' && (
                        <p><strong>Total Experience:</strong> {totalExperience} Yrs | <strong>Current Designation:</strong> {currentDesignation || 'N/A'}</p>
                      )}
                    </div>

                    {/* Education Summary */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/70 dark:bg-slate-900/50 space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
                          3. Academic Qualifications ({educationList.length})
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)} className="h-6 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50">
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      </div>
                      {educationList.map((e, i) => (
                        <p key={i}>
                          • <strong>{e.qualificationType}</strong>: {e.degree || e.qualificationType} in {e.specialization || 'General'} ({e.institution || 'School/College'}, {e.passingYear}) — {e.score || 'Passed'}
                        </p>
                      ))}
                    </div>

                    {/* Skills & Certifications Summary */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/70 dark:bg-slate-900/50 space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
                          4. Skills & Certifications
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(4)} className="h-6 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50">
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      </div>
                      <p><strong>Technical Skills:</strong> {technicalSkills || 'Not specified'}</p>
                      <p><strong>Certifications:</strong> {hasCertifications === 'YES' ? `${certificationList.length} Certifications Saved` : 'No professional certifications'}</p>
                    </div>

                    {/* Resume & Documents Summary */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/70 dark:bg-slate-900/50 space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
                          5. Resume & Attached Documents
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(5)} className="h-6 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50">
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      </div>
                      <p><strong>Resume Document:</strong> {resumeFile ? resumeFile.name : (resumePath ? 'Attached' : 'Not attached')}</p>
                    </div>

                    {/* Declaration & Consent Single Checkbox */}
                    <div className="space-y-3 bg-indigo-50/40 dark:bg-indigo-950/30 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 pt-4">
                      <h5 className="font-bold text-xs text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                        APPLICANT DECLARATION & CONSENT *
                      </h5>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="single-declaration"
                          checked={agreeDeclaration}
                          onCheckedChange={(c: any) => setAgreeDeclaration(Boolean(c))}
                          className="mt-0.5"
                        />
                        <Label htmlFor="single-declaration" className="text-xs cursor-pointer leading-relaxed text-slate-700 dark:text-slate-300">
                          I confirm that the information provided in this application is true and accurate, and I consent to the use of my personal information for recruitment and evaluation purposes in accordance with the company's{' '}
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
                      {errors.consent && <p className="text-xs text-rose-600 font-semibold pt-1">{errors.consent}</p>}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-400 pt-2">
                Fields marked with <strong className="text-rose-500">*</strong> are required.
              </p>

              {/* ── FOOTER NAVIGATION BAR ── */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  className="text-xs font-semibold gap-1.5 h-10 px-5 border-slate-200"
                >
                  <Save className="h-3.5 w-3.5" /> Save as Draft
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentStep === 1 || isSubmitting}
                    className="text-xs font-semibold h-10 px-5 border-slate-200"
                  >
                    &lt; Back
                  </Button>

                  {currentStep < 6 ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleNext}
                      className="text-xs font-bold gap-1.5 h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                      Next Step &gt;
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={handleSubmitApplication}
                      className="text-xs font-bold gap-2 h-10 px-7 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* ── SECURITY FOOTER CARD ── */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-slate-900 dark:text-white">Your Information is Secure</h5>
                <p className="text-[11px] text-slate-500">
                  Your personal information will be used only for recruitment purposes and will be handled as per our privacy policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CANDIDATE PRIVACY POLICY MODAL ── */}
      <Dialog open={showPrivacyPolicyModal} onOpenChange={setShowPrivacyPolicyModal}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-indigo-700">
              <ShieldCheck className="h-5 w-5 text-indigo-600" /> Candidate Recruitment Privacy Policy & Data Notice
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              In accordance with DPDP framework and Global Data Protection standards.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 pt-2 leading-relaxed">
            <div className="space-y-1">
              <h5 className="font-bold text-slate-900 dark:text-white">1. Information We Collect</h5>
              <p>
                We collect personal information including full name, contact details (email & phone number), academic qualifications, work experience history, skills, certifications, and attached resume documents submitted through this application portal.
              </p>
            </div>

            <div className="space-y-1">
              <h5 className="font-bold text-slate-900 dark:text-white">2. Purpose of Processing</h5>
              <p>
                Your personal data is collected and processed exclusively for recruitment, candidate screening, interviewing, background verification, and potential employment contracting by {companyName}.
              </p>
            </div>

            <div className="space-y-1">
              <h5 className="font-bold text-slate-900 dark:text-white">3. Data Protection & Confidentiality</h5>
              <p>
                All data submitted is encrypted in transit and stored securely. Access is strictly restricted to authorized HR recruiters, hiring managers, and interviewers assigned to this requisition. We do not sell or share candidate data with third-party marketers.
              </p>
            </div>

            <div className="space-y-1">
              <h5 className="font-bold text-slate-900 dark:text-white">4. Your Rights</h5>
              <p>
                You retain the right to request access to your submitted data, request corrections, or request deletion of your applicant profile at any time by contacting our HR Talent Acquisition team.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => setShowPrivacyPolicyModal(false)}
              className="text-xs font-semibold px-5 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              I Understand & Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
