import { useState } from 'react';
import {
  X,
  Award,
  Check,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATALOG_COURSES, INITIAL_PROGRAMS, type CertificateTemplate } from './mockTrainingData';

interface CreateCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: CertificateTemplate) => void;
}

export function CreateCertificateModal({ isOpen, onClose, onSave }: CreateCertificateModalProps) {
  const [name, setName] = useState('Industrial Safety & EHS Specialist Credential');
  const [code, setCode] = useState(`TPL-CERT-${Math.floor(100 + Math.random() * 900)}`);
  const [relatedCourse, setRelatedCourse] = useState(CATALOG_COURSES[0].title);
  const [relatedProgram, setRelatedProgram] = useState(INITIAL_PROGRAMS[0].name);
  const [issuingAuthority, setIssuingAuthority] = useState('Codigix HR & Global Safety Council');
  const [validityYears, setValidityYears] = useState<number>(2);
  const [expiryPeriodMonths, setExpiryPeriodMonths] = useState<number>(24);
  const [signatureName, setSignatureName] = useState('Dr. Vikram Malhotra (VP EHS)');

  // Completion Requirements
  const [reqCourseCompleted, setReqCourseCompleted] = useState(true);
  const [reqAssessmentPassed, setReqAssessmentPassed] = useState(true);
  const [reqAttendance, setReqAttendance] = useState(true);

  if (!isOpen) return null;

  const handleSave = () => {
    const newTpl: CertificateTemplate = {
      id: code,
      code,
      name,
      relatedCourse,
      relatedProgram,
      issuingAuthority,
      validityYears,
      expiryPeriodMonths,
      reqCourseCompleted,
      reqAssessmentPassed,
      reqAttendance,
      signatureName,
      status: 'Active',
    };
    onSave(newTpl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-background rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="text-lg font-bold">CREATE CERTIFICATE TEMPLATE</h2>
              <p className="text-xs text-muted-foreground">Configure digital credential templates & auto-issuance triggers</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Certificate Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Certificate Code *</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} className="text-xs font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Related Course *</Label>
              <Select value={relatedCourse} onValueChange={setRelatedCourse}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATALOG_COURSES.map((c) => (
                    <SelectItem key={c.id} value={c.title}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Related Training Program *</Label>
              <Select value={relatedProgram} onValueChange={setRelatedProgram}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INITIAL_PROGRAMS.map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Issuing Authority *</Label>
              <Input value={issuingAuthority} onChange={(e) => setIssuingAuthority(e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Validity Period (Years) *</Label>
              <Input type="number" value={validityYears} onChange={(e) => setValidityYears(Number(e.target.value))} className="text-xs" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium">Digital Signature Name *</Label>
              <Input value={signatureName} onChange={(e) => setSignatureName(e.target.value)} className="text-xs" />
            </div>
          </div>

          {/* Completion Requirements */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Completion Requirement Triggers</h3>
            <div className="flex flex-wrap items-center gap-6 text-xs font-medium">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={reqCourseCompleted} onCheckedChange={(c) => setReqCourseCompleted(!!c)} />
                Course Completed (100%)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={reqAssessmentPassed} onCheckedChange={(c) => setReqAssessmentPassed(!!c)} />
                Assessment Passed
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={reqAttendance} onCheckedChange={(c) => setReqAttendance(!!c)} />
                Attendance Threshold Met
              </label>
            </div>
          </div>

          {/* Lifecycle Visual */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Certificate Auto-Generation Flow
            </p>
            <div className="flex flex-wrap items-center justify-between text-[11px] font-medium gap-1 text-muted-foreground pt-1">
              <span>Employee</span> → <span>Course Completed</span> → <span>Assessment Passed</span> → <span>Eligible</span> → <span>Generate</span> → <strong className="text-emerald-600">ISSUE CERTIFICATE</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-3 bg-muted/30">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Check className="h-4 w-4" /> Save Certificate Template
          </Button>
        </div>
      </div>
    </div>
  );
}
