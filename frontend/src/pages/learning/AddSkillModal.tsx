import { useState, useEffect } from 'react';
import {
  X,
  LayoutGrid,
  Check,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import type { SkillItem } from './types';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (skill: SkillItem) => void;
}

export function AddSkillModal({ isOpen, onClose, onSave }: AddSkillModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<SkillItem['category']>('Technical');
  const [description, setDescription] = useState('');

  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingCourses(true);
    apiClient
      .get<any[]>('/learning/catalog-courses')
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : (res as any)?.data || [];
        setCourses(list);
      })
      .catch((err) => {
        console.warn('Failed to fetch courses for skill mapping:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingCourses(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const newSkill: SkillItem = {
      id: code,
      name,
      category,
      description,
      relatedCoursesCount: selectedCourses.length,
      levels: [
        { level: 1, title: 'Beginner', description: 'Basic concept awareness.' },
        { level: 2, title: 'Basic', description: 'Guided implementation.' },
        { level: 3, title: 'Intermediate', description: 'Independent execution.' },
        { level: 4, title: 'Advanced', description: 'Lead specialist design.' },
        { level: 5, title: 'Expert', description: 'Enterprise architect authority.' },
      ],
      mappedCourses: selectedCourses,
      thresholds: {
        beginner: '0–59%',
        intermediate: '60–74%',
        advanced: '75–89%',
        expert: '90–100%',
      },
    };
    onSave(newSkill);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-background rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-bold">ADD NEW SKILL</h2>
              <p className="text-xs text-muted-foreground">Map workforce competencies and course score threshold brackets</p>
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
              <Label className="text-xs font-medium">Skill Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Skill Code *</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} className="text-xs font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Skill Category *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Soft Skill">Soft Skill</SelectItem>
                  <SelectItem value="Leadership">Leadership</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium">Skill Description *</Label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="text-xs" />
            </div>
          </div>

          {/* Level Definitions */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Proficiency Level Scale (1–5)</h3>
            <div className="grid grid-cols-5 gap-2 text-[11px] text-center font-medium">
              <div className="p-2 border rounded bg-muted/40">1 - Beginner</div>
              <div className="p-2 border rounded bg-muted/40">2 - Basic</div>
              <div className="p-2 border rounded bg-muted/40">3 - Intermediate</div>
              <div className="p-2 border rounded bg-muted/40">4 - Advanced</div>
              <div className="p-2 border rounded bg-muted/40">5 - Expert</div>
            </div>
          </div>

          {/* Threshold Mapping */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Assessment Score Threshold Mapping</h3>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 border rounded bg-card text-center space-y-1">
                <span className="text-[10px] text-muted-foreground block">0–59%</span>
                <strong className="text-muted-foreground">Beginner</strong>
              </div>
              <div className="p-2.5 border rounded bg-card text-center space-y-1">
                <span className="text-[10px] text-muted-foreground block">60–74%</span>
                <strong className="text-blue-600">Intermediate</strong>
              </div>
              <div className="p-2.5 border rounded bg-card text-center space-y-1">
                <span className="text-[10px] text-muted-foreground block">75–89%</span>
                <strong className="text-amber-600">Advanced</strong>
              </div>
              <div className="p-2.5 border rounded bg-card text-center space-y-1">
                <span className="text-[10px] text-muted-foreground block">90–100%</span>
                <strong className="text-emerald-600">Expert</strong>
              </div>
            </div>
          </div>

          {/* Associated Courses */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Associated Courses
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {selectedCourses.length} course{selectedCourses.length === 1 ? '' : 's'} mapped
              </span>
            </div>

            {loadingCourses ? (
              <div className="flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground bg-muted/20 rounded-md border">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading courses...
              </div>
            ) : courses.length === 0 ? (
              <div className="p-4 text-xs text-muted-foreground bg-muted/20 rounded-md border text-center">
                No courses available.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1.5 border rounded-md bg-muted/10">
                {courses.map((c) => {
                  const isChecked = selectedCourses.includes(c.title);
                  return (
                    <label
                      key={c.id || c.code}
                      className={`flex items-start gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                        isChecked ? 'border-primary bg-primary/5 text-foreground' : 'border-border/60 hover:bg-muted/40'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCourses((prev) => [...prev, c.title]);
                          } else {
                            setSelectedCourses((prev) => prev.filter((t) => t !== c.title));
                          }
                        }}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{c.title}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{c.code} • {c.category}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-3 bg-muted/30">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Check className="h-4 w-4" /> Save Skill
          </Button>
        </div>
      </div>
    </div>
  );
}
