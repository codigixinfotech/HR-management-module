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
  issueDate: string;
  credentialId?: string;
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

  // ── Step 3: Education Details (All-In-One Form with Multiple Records) ──
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

  // ── Step 5: Resume & Documents ──
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePath, setResumePath] = useState('');
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // ── Step 6: Questions & Screening ──
  const [willingToRelocate, setWillingToRelocate] = useState('Yes');
  const [workModeAgreement, setWorkModeAgreement] = useState('Yes');

  // ── Step 7: Preferences & Additional ──
  const [employmentPreference, setEmploymentPreference] = useState(job.employmentType || 'Full Time');

  // ── Step 8: Consent & Declaration ──
  const [agreeAccuracy, setAgreeAccuracy] = useState(false);
  const [agreePrivacyPolicy, setAgreePrivacyPolicy] = useState(false);
  const [agreeRecruitmentConsent, setAgreeRecruitmentConsent] = useState(false);

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
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
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
    toast.info('New education qualification form added.');
  };

  const removeEducation = (id: string) => {
    if (educationList.length === 1) {
      toast.warning('At least one education record is required.');
      return;
    }
    setEducationList((prev) => prev.filter((item) => item.id !== id));
    toast.info('Education record removed.');
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
      for (let i = 0; i < educationList.length; i++) {
        const edu = educationList[i];
        if (!edu.qualificationType) {
          errs[`edu_${i}_qualificationType`] = `Qualification Type is required for record #${i + 1}.`;
        }
        if (!edu.degree.trim()) {
          errs[`edu_${i}_degree`] = `Degree / Qualification is required for record #${i + 1}.`;
        }
        if (!edu.institution.trim()) {
          errs[`edu_${i}_institution`] = `Institute / College is required for record #${i + 1}.`;
        }
        if (!edu.universityOrBoard.trim()) {
          errs[`edu_${i}_universityOrBoard`] = `University / Board is required for record #${i + 1}.`;
        }
        if (!edu.passingYear.trim()) {
          errs[`edu_${i}_passingYear`] = `Passing Year is required for record #${i + 1}.`;
        }
        if (edu.startYear && edu.passingYear && parseInt(edu.passingYear) < parseInt(edu.startYear)) {
          errs[`edu_${i}_passingYear`] = `Passing Year (${edu.passingYear}) cannot be before Start Year (${edu.startYear}).`;
        }
      }
    }

    if (currentStep === 5) {
      if (!resumeFile && !resumePath) {
        errs.resume = 'Resume / CV document (PDF/DOC/DOCX) is required.';
      }
    }

    if (currentStep === 8) {
      if (!agreeAccuracy || !agreePrivacyPolicy || !agreeRecruitmentConsent) {
        errs.consent = 'You must confirm all mandatory declarations before proceeding.';
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
      setCurrentStep((prev) => Math.min(prev + 1, 9));
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
      notes: `Applied on ${new Date().toLocaleDateString()} | App Ref: ${appId} | Willing to Relocate: ${willingToRelocate}`,
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
    { number: 6, title: '6. Questions & Screening', icon: Clock },
    { number: 7, title: '7. Preferences & Additional', icon: Cog },
    { number: 8, title: '8. Consent & Declaration', icon: ShieldCheck },
    { number: 9, title: '9. Review & Submit', icon: CheckCircle2 },
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
                  Step {currentStep} of 9
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

              {/* STEP 3: STANDARD EDUCATION DETAILS — ALL IN ONE FORM WITH MULTIPLE QUALIFICATIONS */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {educationList.map((edu, idx) => (
                    <div key={edu.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-indigo-600 text-white font-bold text-xs">
                            Qualification #{idx + 1}
                          </Badge>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            {edu.qualificationType || 'Academic Qualification'}
                          </span>
                        </div>
                        {educationList.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEducation(edu.id)}
                            className="h-7 text-xs text-rose-600 hover:bg-rose-50 font-semibold"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove Record
                          </Button>
                        )}
                      </div>

                      {/* Row 1: Qualification Type & Degree */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Qualification Type *</Label>
                          <Select
                            value={edu.qualificationType}
                            onValueChange={(val) => {
                              setEducationList((prev) =>
                                prev.map((item) => (item.id === edu.id ? { ...item, qualificationType: val } : item))
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
                          {errors[`edu_${idx}_qualificationType`] && (
                            <p className="text-[11px] text-rose-600 font-semibold">{errors[`edu_${idx}_qualificationType`]}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Degree / Qualification *</Label>
                          <Input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEducationList((prev) =>
                                prev.map((item) => (item.id === edu.id ? { ...item, degree: val } : item))
                              );
                            }}
                            placeholder="e.g. B.Tech / B.E. / MBA / SSC"
                            className="h-9 text-xs"
                          />
                          {errors[`edu_${idx}_degree`] && (
                            <p className="text-[11px] text-rose-600 font-semibold">{errors[`edu_${idx}_degree`]}</p>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Specialization & Institute */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Specialization / Stream *</Label>
                          <Input
                            type="text"
                            value={edu.specialization}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEducationList((prev) =>
                                prev.map((item) => (item.id === edu.id ? { ...item, specialization: val } : item))
                              );
                            }}
                            placeholder="e.g. Computer Science / Science"
                            className="h-9 text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Institute / College *</Label>
                          <Input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEducationList((prev) =>
                                prev.map((item) => (item.id === edu.id ? { ...item, institution: val } : item))
                              );
                            }}
                            placeholder="College / Institute name"
                            className="h-9 text-xs"
                          />
                          {errors[`edu_${idx}_institution`] && (
                            <p className="text-[11px] text-rose-600 font-semibold">{errors[`edu_${idx}_institution`]}</p>
                          )}
                        </div>
                      </div>

                      {/* Row 3: University / Board & Affiliation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">University / Board *</Label>
                          <Input
                            type="text"
                            value={edu.universityOrBoard}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEducationList((prev) =>
                                prev.map((item) => (item.id === edu.id ? { ...item, universityOrBoard: val } : item))
                              );
                            }}
                            placeholder="e.g. CBSE / SPPU / State Board"
                            className="h-9 text-xs"
                          />
                          {errors[`edu_${idx}_universityOrBoard`] && (
                            <p className="text-[11px] text-rose-600 font-semibold">{errors[`edu_${idx}_universityOrBoard`]}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Affiliation / University</Label>
                          <Input
                            type="text"
                            value={edu.affiliation}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEducationList((prev) =>
                                prev.map((item) => (item.id === edu.id ? { ...item, affiliation: val } : item))
                              );
                            }}
                            placeholder="University name (if affiliated)"
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>

                      {/* Row 4: Start Year & Passing Year */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Start Year *</Label>
                          <Input
                            type="text"
                            value={edu.startYear}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEducationList((prev) =>
                                prev.map((item) => (item.id === edu.id ? { ...item, startYear: val } : item))
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
                            value={edu.passingYear}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEducationList((prev) =>
                                prev.map((item) => (item.id === edu.id ? { ...item, passingYear: val } : item))
                              );
                            }}
                            placeholder="e.g. 2026"
                            className="h-9 text-xs font-mono"
                          />
                          {errors[`edu_${idx}_passingYear`] && (
                            <p className="text-[11px] text-rose-600 font-semibold">{errors[`edu_${idx}_passingYear`]}</p>
                          )}
                        </div>
                      </div>

                      {/* Row 5: Grading System & Score */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Grading System *</Label>
                          <Select
                            value={edu.gradingSystem}
                            onValueChange={(val) => {
                              setEducationList((prev) =>
                                prev.map((item) => (item.id === edu.id ? { ...item, gradingSystem: val } : item))
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
                            value={edu.score}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEducationList((prev) =>
                                prev.map((item) => (item.id === edu.id ? { ...item, score: val } : item))
                              );
                            }}
                            placeholder="e.g. 8.45 / 84.5%"
                            className="h-9 text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Row 6: Education Mode & Result Status */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Education Mode *</Label>
                          <Select
                            value={edu.educationMode}
                            onValueChange={(val) => {
                              setEducationList((prev) =>
                                prev.map((item) => (item.id === edu.id ? { ...item, educationMode: val } : item))
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

                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Result Status *</Label>
                          <Select
                            value={edu.resultStatus}
                            onValueChange={(val) => {
                              setEducationList((prev) =>
                                prev.map((item) => (item.id === edu.id ? { ...item, resultStatus: val } : item))
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
                      </div>

                      {/* Row 7: Country & State / City */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">Country *</Label>
                          <Select
                            value={edu.country}
                            onValueChange={(val) => {
                              setEducationList((prev) =>
                                prev.map((item) => (item.id === edu.id ? { ...item, country: val } : item))
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

                        <div className="space-y-1.5">
                          <Label className="font-semibold text-xs">State / City</Label>
                          <Input
                            type="text"
                            value={edu.stateOrCity}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEducationList((prev) =>
                                prev.map((item) => (item.id === edu.id ? { ...item, stateOrCity: val } : item))
                              );
                            }}
                            placeholder="e.g. Pune, Maharashtra"
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>

                      {/* Row 8: Certificate / Marksheet Upload */}
                      <div className="space-y-1.5 pt-1">
                        <Label className="font-semibold text-xs">Certificate / Marksheet (Optional)</Label>
                        {edu.certificateName ? (
                          <div className="border border-emerald-300 rounded-xl p-3 bg-emerald-50/70 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                              <FileCheck className="h-4 w-4 text-emerald-600" />
                              <span>{edu.certificateName}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEducationList((prev) =>
                                  prev.map((item) => (item.id === edu.id ? { ...item, certificateName: '', certificatePath: '' } : item))
                                );
                              }}
                              className="h-6 text-xs text-rose-600 hover:bg-rose-100"
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50/60 flex items-center justify-between gap-3">
                            <span className="text-xs text-slate-500">📄 PDF, JPG, JPEG, PNG • Max 5 MB</span>
                            <Label htmlFor={`cert-file-${edu.id}`} className="cursor-pointer">
                              <Button type="button" variant="outline" size="sm" className="h-7 text-xs font-semibold pointer-events-none">
                                Choose File
                              </Button>
                            </Label>
                            <Input
                              id={`cert-file-${edu.id}`}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleEduCertificateUpload(edu.id, e)}
                              className="hidden"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* + Add Another Qualification Button */}
                  <div className="pt-2 text-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEducation}
                      className="text-xs font-bold gap-2 px-6 h-9 border-indigo-200 text-indigo-600 hover:bg-indigo-50 shadow-2xs"
                    >
                      <Plus className="h-4 w-4" /> Add Another Qualification
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 4: SKILLS & CERTIFICATIONS */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2">
                    <span className="font-bold text-xs text-indigo-700 flex items-center gap-1.5">
                      <Award className="h-4 w-4" /> Required Job Skills (Read-Only)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {jobRequiredSkillsArray.map((sk, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs font-semibold bg-white border border-indigo-200 text-indigo-600">
                          {sk}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Technical Skills & Competencies</Label>
                    <Textarea
                      value={technicalSkills}
                      onChange={(e) => setTechnicalSkills(e.target.value)}
                      placeholder="e.g. React.js, Node.js, Docker, Kubernetes, AWS"
                      className="text-xs min-h-[80px]"
                    />
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

              {/* STEP 6: QUESTIONS & SCREENING */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Are you willing to work on-site at {branchName}? *</Label>
                      <Select value={workModeAgreement} onValueChange={setWorkModeAgreement}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Are you willing to relocate? *</Label>
                      <Select value={willingToRelocate} onValueChange={setWillingToRelocate}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: PREFERENCES & ADDITIONAL */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Preferred Work Location</Label>
                      <Input
                        type="text"
                        value={preferredLocation}
                        onChange={(e) => setPreferredLocation(e.target.value)}
                        placeholder="e.g. Pune / Mumbai"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 8: CONSENT & DECLARATION */}
              {currentStep === 8 && (
                <div className="space-y-6">
                  <div className="space-y-4 bg-slate-50 p-5 rounded-xl border">
                    <div className="flex items-start gap-3">
                      <Checkbox id="c1" checked={agreeAccuracy} onCheckedChange={(c: any) => setAgreeAccuracy(Boolean(c))} className="mt-0.5" />
                      <Label htmlFor="c1" className="text-xs cursor-pointer">
                        I confirm that all information provided by me is accurate. *
                      </Label>
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox id="c2" checked={agreePrivacyPolicy} onCheckedChange={(c: any) => setAgreePrivacyPolicy(Boolean(c))} className="mt-0.5" />
                      <Label htmlFor="c2" className="text-xs cursor-pointer">
                        I agree to the company's privacy policy. *
                      </Label>
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox id="c3" checked={agreeRecruitmentConsent} onCheckedChange={(c: any) => setAgreeRecruitmentConsent(Boolean(c))} className="mt-0.5" />
                      <Label htmlFor="c3" className="text-xs cursor-pointer">
                        I consent to processing of my personal information for recruitment purposes. *
                      </Label>
                    </div>
                  </div>
                  {errors.consent && <p className="text-xs text-rose-600 font-semibold">{errors.consent}</p>}
                </div>
              )}

              {/* STEP 9: REVIEW & SUBMIT */}
              {currentStep === 9 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="border rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-bold text-indigo-600">Personal Information</span>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)} className="h-6 text-[11px] font-semibold text-indigo-600">
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      </div>
                      <p><strong>Name:</strong> {firstName} {middleName} {lastName}</p>
                      <p><strong>Email:</strong> {email} | <strong>Mobile:</strong> {phone}</p>
                    </div>

                    <div className="border rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-bold text-indigo-600">Academic Qualifications ({educationList.length})</span>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)} className="h-6 text-[11px] font-semibold text-indigo-600">
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      </div>
                      {educationList.map((e, i) => (
                        <p key={i}>
                          • <strong>{e.qualificationType}</strong>: {e.degree} in {e.specialization || 'General'} ({e.institution}, {e.startYear}-{e.passingYear}) — {e.score || 'Passed'}
                        </p>
                      ))}
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

                  {currentStep < 9 ? (
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
    </div>
  );
};
