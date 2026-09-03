import { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  BookOpen,
  Video,
  FileText,
  FileCode,
  Sparkles,
  Check,
  Eye,
} from 'lucide-react';
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
import { type CourseItem, type CourseModule } from './mockTrainingData';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: CourseItem) => void;
}

export function CreateCourseModal({ isOpen, onClose, onSave }: CreateCourseModalProps) {
  const [title, setTitle] = useState('Industrial Safety Protocols 2026');
  const [code, setCode] = useState(`CRS-${Math.floor(200 + Math.random() * 800)}`);
  const [category, setCategory] = useState('Safety');
  const [courseType, setCourseType] = useState<CourseItem['type']>('Mandatory');
  const [difficulty, setDifficulty] = useState<CourseItem['difficulty']>('Intermediate');
  const [description, setDescription] = useState('Comprehensive training module on factory plant machinery safety and hazard reduction.');
  const [hours, setHours] = useState<number>(4);
  const [language, setLanguage] = useState('English');
  const [trainer, setTrainer] = useState('SafetyFirst Specialist');
  const [provider, setProvider] = useState('Global Safety Council');
  const [deliveryMode, setDeliveryMode] = useState<CourseItem['deliveryMode']>('Hybrid');

  // Course Content Modules
  const [modules, setModules] = useState<CourseModule[]>([
    { id: 'M-1', title: 'Module 1: Introduction to Plant Safety', type: 'Video', url: 'https://lms.corp/v1.mp4', durationMinutes: 45 },
    { id: 'M-2', title: 'Module 2: Equipment Operation Manual', type: 'PDF', url: 'https://lms.corp/manual.pdf', durationMinutes: 60 },
  ]);

  // Completion Settings
  const [requiredCompletion, setRequiredCompletion] = useState<number>(100);
  const [assessmentRequired, setAssessmentRequired] = useState<boolean>(true);
  const [assessmentName, setAssessmentName] = useState<string>('Workplace Safety Final Assessment');
  const [attemptsAllowed, setAttemptsAllowed] = useState<number>(2);
  const [passingScore, setPassingScore] = useState<number>(60);
  const [mappedSkill, setMappedSkill] = useState('Workplace Safety & EHS');

  if (!isOpen) return null;

  const handleAddModule = () => {
    const newModule: CourseModule = {
      id: `M-${modules.length + 1}`,
      title: `Module ${modules.length + 1}: Safety Fundamentals`,
      type: 'Video',
      url: 'https://lms.corp/video.mp4',
      durationMinutes: 30,
    };
    setModules([...modules, newModule]);
  };

  const handleRemoveModule = (id: string) => {
    setModules(modules.filter((m) => m.id !== id));
  };

  const handleSaveCourse = (status: 'Published' | 'Draft') => {
    const newCourse: CourseItem = {
      id: code,
      code,
      title,
      category,
      type: courseType,
      difficulty,
      description,
      hours,
      language,
      trainer,
      provider,
      deliveryMode,
      modules,
      requiredCompletion,
      assessmentRequired,
      certificateRequired: true,
      passingScore,
      mappedSkill,
      level: courseType,
      status,
      enrolledCount: 0,
      rating: 5.0,
    };
    onSave(newCourse);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-background rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-bold">CREATE COURSE</h2>
              <p className="text-xs text-muted-foreground">Add a new learning module to the Master Course Library</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b pb-1">
              1. Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Course Name *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Course Code *</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} className="text-xs font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Safety">Safety</SelectItem>
                    <SelectItem value="Leadership">Leadership</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                    <SelectItem value="Quality">Quality & Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Course Type *</Label>
                <Select value={courseType} onValueChange={(v) => setCourseType(v as any)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mandatory">Mandatory</SelectItem>
                    <SelectItem value="Elective">Elective</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Difficulty Level *</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Duration (Hours) *</Label>
                <Input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value))} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Language *</Label>
                <Input value={language} onChange={(e) => setLanguage(e.target.value)} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Trainer / Instructor *</Label>
                <Input value={trainer} onChange={(e) => setTrainer(e.target.value)} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Training Provider *</Label>
                <Input value={provider} onChange={(e) => setProvider(e.target.value)} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Delivery Mode</Label>
                <div className="flex items-center gap-4 pt-1">
                  {['Online', 'Classroom', 'Hybrid'].map((m) => (
                    <label key={m} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="delMode"
                        checked={deliveryMode === m}
                        onChange={() => setDeliveryMode(m as any)}
                        className="text-primary"
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs font-medium">Description *</Label>
                <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="text-xs" />
              </div>
            </div>
          </div>

          {/* Section 2: Course Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-1">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                2. Course Content ({modules.length} Modules)
              </h3>
              <Button type="button" size="sm" variant="outline" onClick={handleAddModule} className="gap-1 text-xs h-7">
                <Plus className="h-3 w-3" /> Add Module
              </Button>
            </div>

            <div className="space-y-2">
              {modules.map((mod, idx) => (
                <div key={mod.id} className="flex items-center justify-between p-3 border rounded-lg bg-card text-xs">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-bold text-muted-foreground w-6">#{idx + 1}</span>
                    <Input
                      value={mod.title}
                      onChange={(e) => {
                        const updated = modules.map((m) => (m.id === mod.id ? { ...m, title: e.target.value } : m));
                        setModules(updated);
                      }}
                      className="text-xs h-7 flex-1"
                    />
                    <Select
                      value={mod.type}
                      onValueChange={(val) => {
                        const updated = modules.map((m) => (m.id === mod.id ? { ...m, type: val as any } : m));
                        setModules(updated);
                      }}
                    >
                      <SelectTrigger className="text-xs h-7 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Video">Video</SelectItem>
                        <SelectItem value="PDF">PDF Document</SelectItem>
                        <SelectItem value="Document">Text Doc</SelectItem>
                        <SelectItem value="Interactive">Interactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveModule(mod.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive ml-2">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Completion Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b pb-1">
              3. Completion Settings & Skill Mapping
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Required Completion %</Label>
                <Input type="number" value={requiredCompletion} onChange={(e) => setRequiredCompletion(Number(e.target.value))} className="text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Passing Score %</Label>
                <Input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} className="text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Mapped Skill</Label>
                <Select value={mappedSkill} onValueChange={setMappedSkill}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Workplace Safety & EHS">Workplace Safety & EHS</SelectItem>
                    <SelectItem value="Strategic Leadership">Strategic Leadership</SelectItem>
                    <SelectItem value="Advanced Excel & Data Analytics">Advanced Excel & Data Analytics</SelectItem>
                    <SelectItem value="POSH Compliance">POSH Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="assessReq"
                  checked={assessmentRequired}
                  onCheckedChange={(c) => setAssessmentRequired(!!c)}
                />
                <Label htmlFor="assessReq" className="text-xs font-semibold cursor-pointer">
                  Assessment Required to Pass Course
                </Label>
              </div>

              {assessmentRequired && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg border text-xs animate-in fade-in duration-150">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px] font-medium">Assessment Name *</Label>
                    <Input
                      value={assessmentName}
                      onChange={(e) => setAssessmentName(e.target.value)}
                      placeholder="e.g. Workplace Safety Final Assessment"
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium">Attempts Allowed</Label>
                    <Input
                      type="number"
                      value={attemptsAllowed}
                      onChange={(e) => setAttemptsAllowed(Number(e.target.value))}
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t px-6 py-3 bg-muted/30">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSaveCourse('Draft')} className="text-xs">
              Save Draft
            </Button>
            <Button size="sm" onClick={() => handleSaveCourse('Published')} className="gap-1.5 text-xs bg-primary text-primary-foreground">
              <Check className="h-4 w-4" /> Publish Course
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
