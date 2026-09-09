import { useState, useEffect } from 'react';
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
import { apiClient } from '@/lib/api-client';
import type { CertificateTemplate } from './types';

interface CreateCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: CertificateTemplate) => void;
}

export function CreateCertificateModal({ isOpen, onClose, onSave }: CreateCertificateModalProps) {
  const [name, setName] = useState('Industrial Safety & EHS Specialist Credential');
  const [code, setCode] = useState(`TPL-CERT-${Math.floor(100 + Math.random() * 900)}`);
  const [relatedCourse, setRelatedCourse] = useState('');
  const [relatedProgram, setRelatedProgram] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('Codigix HR & Global Safety Council');
  const [validityYears, setValidityYears] = useState<number>(2);
  const [expiryPeriodMonths, setExpiryPeriodMonths] = useState<number>(24);
  const [signatureName, setSignatureName] = useState('Dr. Vikram Malhotra (VP EHS)');

  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoadingCourses(true);

    Promise.all([
      apiClient.get<any[]>('/learning/catalog-courses').catch(() => []),
      apiClient.get<any[]>('/learning/training-programs').catch(() => []),
    ])
      .then(([catalogRes, programsRes]) => {
        if (!isMounted) return;
        const cList = Array.isArray(catalogRes) ? catalogRes : (catalogRes as any)?.data || [];
        const pList = Array.isArray(programsRes) ? programsRes : (programsRes as any)?.data || [];
        setCourses(cList);
        setPrograms(pList);

        if (cList.length > 0 && !relatedCourse) {
          setRelatedCourse(cList[0].title);
        }
        if (pList.length > 0 && !relatedProgram) {
          setRelatedProgram(pList[0].name || pList[0].title);
        } else if (cList.length > 0 && !relatedProgram) {
          setRelatedProgram(cList[0].title);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingCourses(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

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
      relatedCourse: relatedCourse || 'General Certification',
      relatedProgram: relatedProgram || relatedCourse || 'Enterprise Training',
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
              <Select value={relatedCourse} onValueChange={setRelatedCourse} disabled={loadingCourses}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder={loadingCourses ? "Loading courses..." : courses.length === 0 ? "No courses available" : "Select course"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id || c.code} value={c.title}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Related Training Program</Label>
              <Select value={relatedProgram} onValueChange={setRelatedProgram} disabled={loadingCourses}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.length > 0 ? (
                    programs.map((p) => (
                      <SelectItem key={p.id || p.code} value={p.name || p.title}>
                        {p.name || p.title}
                      </SelectItem>
                    ))
                  ) : courses.length > 0 ? (
                    courses.map((c) => (
                      <SelectItem key={`prg-${c.id || c.code}`} value={c.title}>
                        {c.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="Default Program">Enterprise Training Program</SelectItem>
                  )}
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
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Expiry Period (Months) *</Label>
              <Input type="number" value={expiryPeriodMonths} onChange={(e) => setExpiryPeriodMonths(Number(e.target.value))} className="text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Authorized Signatory *</Label>
              <Input value={signatureName} onChange={(e) => setSignatureName(e.target.value)} className="text-xs" />
            </div>
          </div>

          {/* Trigger Requirements */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Automated Issuance Triggers</h3>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={reqCourseCompleted} onCheckedChange={(c) => setReqCourseCompleted(!!c)} />
                <span>Employee reaches 100% syllabus module completion</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={reqAssessmentPassed} onCheckedChange={(c) => setReqAssessmentPassed(!!c)} />
                <span>Employee scores above required passing threshold in course assessment</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={reqAttendance} onCheckedChange={(c) => setReqAttendance(!!c)} />
                <span>Manager/Instructor marks attendance confirmation</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-3 bg-muted/30">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Check className="h-4 w-4" /> Save Template
          </Button>
        </div>
      </div>
    </div>
  );
}
