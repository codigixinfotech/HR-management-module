import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Sliders,
  Settings,
  Factory,
  Laptop,
  HeartPulse,
  Landmark,
  ShoppingBag,
  Building2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Radio,
  FileCheck,
  Eye,
  MapPin,
  DoorOpen,
  Video,
  PhoneCall,
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { jobOpeningsApi } from '@/api/recruitment';

export interface IndustryConfigPreset {
  id: string;
  name: string;
  defaultAssessmentEnabled: boolean;
  defaultAssessmentMode: 'OFFLINE' | 'ONLINE' | 'BOTH';
  defaultTemplateId: string;
  defaultTemplateName: string;
  defaultAssessmentRequired: boolean;
  // Interview configuration defaults
  defaultInterviewMode: 'OFFLINE' | 'ONLINE' | 'BOTH';
  defaultInterviewLocation: string;
  defaultInterviewBuilding: string;
  defaultInterviewRoom: string;
  icon: any;
  description: string;
  examples: string[];
}

export const INDUSTRY_CONFIG_PRESETS: IndustryConfigPreset[] = [
  {
    id: 'Manufacturing & Industrial',
    name: 'Manufacturing & Industrial',
    defaultAssessmentEnabled: true,
    defaultAssessmentMode: 'OFFLINE',
    defaultTemplateId: 'TST-MFG-01',
    defaultTemplateName: 'Manufacturing Technical & Machine Practical Assessment',
    defaultAssessmentRequired: true,
    defaultInterviewMode: 'OFFLINE',
    defaultInterviewLocation: 'Pune Manufacturing Plant',
    defaultInterviewBuilding: 'Administration Block',
    defaultInterviewRoom: 'HR Interview Room 1',
    icon: Factory,
    description: 'Practical floor tests, machine operation, blueprint reading & safety compliance for plant roles.',
    examples: ['CNC machine practical test', 'Machine operation test', 'Blueprint reading', 'Measuring instrument test', 'Safety & quality audit'],
  },
  {
    id: 'Healthcare & Pharmaceuticals',
    name: 'Healthcare & Pharmaceuticals',
    defaultAssessmentEnabled: true,
    defaultAssessmentMode: 'OFFLINE',
    defaultTemplateId: 'TST-HC-01',
    defaultTemplateName: 'Clinical Scenario & Medical Protocol Practical',
    defaultAssessmentRequired: true,
    defaultInterviewMode: 'OFFLINE',
    defaultInterviewLocation: 'Hospital Main Campus',
    defaultInterviewBuilding: 'Clinical Block B',
    defaultInterviewRoom: 'Medical Board Room',
    icon: HeartPulse,
    description: 'Patient care simulation, hygiene protocol practicals, and equipment operation evaluation.',
    examples: ['Clinical practical', 'Medical records test', 'Sterilization protocol', 'Emergency response test'],
  },
  {
    id: 'IT & Software Engineering',
    name: 'IT & Software Engineering',
    defaultAssessmentEnabled: true,
    defaultAssessmentMode: 'ONLINE',
    defaultTemplateId: 'TST-201',
    defaultTemplateName: 'React Architecture & State Challenge',
    defaultAssessmentRequired: true,
    defaultInterviewMode: 'ONLINE',
    defaultInterviewLocation: 'Global Tech Park, Tower 3',
    defaultInterviewBuilding: 'Software Engineering Wing',
    defaultInterviewRoom: 'Conference Room 402',
    icon: Laptop,
    description: 'Online coding challenges, algorithm assessments, system design reviews & DevOps MCQ tests.',
    examples: ['Full stack coding test', 'System design interview', 'DevOps Kubernetes quiz', 'SQL database challenge'],
  },
  {
    id: 'Banking & Financial Services',
    name: 'Banking & Financial Services',
    defaultAssessmentEnabled: true,
    defaultAssessmentMode: 'ONLINE',
    defaultTemplateId: 'TST-FIN-01',
    defaultTemplateName: 'Financial Analytics & Audit Compliance Test',
    defaultAssessmentRequired: true,
    defaultInterviewMode: 'ONLINE',
    defaultInterviewLocation: 'Financial Towers HQ',
    defaultInterviewBuilding: 'Corporate Floor 12',
    defaultInterviewRoom: 'Executive Boardroom',
    icon: Landmark,
    description: 'Quantitative aptitude, financial modeling, accounting standards & fraud detection quizzes.',
    examples: ['Financial spreadsheet test', 'Risk analysis MCQ', 'AML/KYC compliance assessment'],
  },
  {
    id: 'Retail & Hospitality',
    name: 'Retail & Hospitality',
    defaultAssessmentEnabled: true,
    defaultAssessmentMode: 'BOTH',
    defaultTemplateId: 'TST-RET-01',
    defaultTemplateName: 'Customer Service & Inventory Floor Practical',
    defaultAssessmentRequired: false,
    defaultInterviewMode: 'BOTH',
    defaultInterviewLocation: 'Central Flagship Store',
    defaultInterviewBuilding: 'Store Operations Office',
    defaultInterviewRoom: 'Interview Office 2',
    icon: ShoppingBag,
    description: 'Blended store floor simulation, point-of-sale practicals and customer communication aptitude.',
    examples: ['Customer handling simulation', 'POS terminal test', 'Store merchandising practical'],
  },
  {
    id: 'Corporate & Professional Services',
    name: 'Corporate & Professional Services',
    defaultAssessmentEnabled: true,
    defaultAssessmentMode: 'ONLINE',
    defaultTemplateId: 'TST-204',
    defaultTemplateName: 'HR Compliance Scenario Analysis',
    defaultAssessmentRequired: false,
    defaultInterviewMode: 'BOTH',
    defaultInterviewLocation: 'Corporate HQ',
    defaultInterviewBuilding: 'Main Complex',
    defaultInterviewRoom: 'HR Interview Suite A',
    icon: Building2,
    description: 'Verbal reasoning, behavioral situational judgment, and management scenario tests.',
    examples: ['Management scenario analysis', 'Verbal reasoning quiz', 'Office software proficiency'],
  },
];

export const ALL_AVAILABLE_TEMPLATES = [
  { id: 'TST-MFG-01', name: 'Manufacturing Technical & Machine Practical Assessment', mode: 'Offline / Practical', dept: 'Manufacturing' },
  { id: 'TST-MFG-02', name: 'CNC Machine Operation & Tooling Practical Test', mode: 'Offline / Floor', dept: 'Manufacturing' },
  { id: 'TST-MFG-03', name: 'Blueprint Reading & Vernier/Micrometer Measurement Test', mode: 'Offline / Practical', dept: 'Quality Assurance' },
  { id: 'TST-MFG-04', name: 'Industrial Safety & EHS Protocol Evaluation', mode: 'Blended', dept: 'Safety & Plant' },
  { id: 'TST-201', name: 'React Architecture & State Challenge', mode: 'Online', dept: 'Engineering' },
  { id: 'TST-202', name: 'DevOps Helm & Kubernetes Quiz', mode: 'Online', dept: 'Infrastructure' },
  { id: 'TST-203', name: 'Figma Component & Styling Review', mode: 'Online', dept: 'Design' },
  { id: 'TST-204', name: 'HR Compliance Scenario Analysis', mode: 'Online', dept: 'Human Resources' },
  { id: 'TST-HC-01', name: 'Clinical Scenario & Medical Protocol Practical', mode: 'Offline / Clinical', dept: 'Healthcare' },
  { id: 'TST-FIN-01', name: 'Financial Analytics & Audit Compliance Test', mode: 'Online', dept: 'Finance' },
  { id: 'TST-RET-01', name: 'Customer Service & Inventory Floor Practical', mode: 'Blended', dept: 'Retail' },
];

interface RecruitmentConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: any) => void;
}

export function RecruitmentConfigurationModal({
  isOpen,
  onClose,
  onConfigSaved,
}: RecruitmentConfigurationModalProps) {
  const queryClient = useQueryClient();

  // Helper: apply a config object into local state
  const applyConfig = (cfg: Record<string, any>) => {
    // assessmentEnabled: always use the explicit saved value (false must be respected)
    setAssessmentEnabled(cfg.assessmentEnabled === true);
    if (cfg.assessmentMode) setAssessmentMode(cfg.assessmentMode);
    if (cfg.industry) setIndustry(cfg.industry);
    if (cfg.defaultAssessmentTemplateId) setDefaultTemplateId(cfg.defaultAssessmentTemplateId);
    setAssessmentRequired(cfg.assessmentRequired === true);

    // Interview config
    if (cfg.interviewMode) setInterviewMode(cfg.interviewMode);
    if (cfg.defaultInterviewLocation) setDefaultInterviewLocation(cfg.defaultInterviewLocation);
    if (cfg.defaultInterviewBuilding) setDefaultInterviewBuilding(cfg.defaultInterviewBuilding);
    if (cfg.defaultInterviewRoom) setDefaultInterviewRoom(cfg.defaultInterviewRoom);
  };

  // Configuration States — default false so we never flash ON before config loads
  const [assessmentEnabled, setAssessmentEnabled] = useState<boolean>(false);
  const [assessmentMode, setAssessmentMode] = useState<'ONLINE' | 'OFFLINE' | 'BOTH'>('OFFLINE');
  const [industry, setIndustry] = useState<string>('Manufacturing & Industrial');
  const [defaultTemplateId, setDefaultTemplateId] = useState<string>('TST-MFG-01');
  const [assessmentRequired, setAssessmentRequired] = useState<boolean>(true);

  // Interview Configuration States
  const [interviewMode, setInterviewMode] = useState<'ONLINE' | 'OFFLINE' | 'BOTH'>('OFFLINE');
  const [defaultInterviewLocation, setDefaultInterviewLocation] = useState<string>('Pune Manufacturing Plant');
  const [defaultInterviewBuilding, setDefaultInterviewBuilding] = useState<string>('Administration Block');
  const [defaultInterviewRoom, setDefaultInterviewRoom] = useState<string>('HR Interview Room 1');

  // Fetch current portal / recruitment configuration from backend
  const { data: dbConfig } = useQuery({
    queryKey: ['portal-config'],
    queryFn: () => jobOpeningsApi.getPortalConfig(),
  });

  // Every time the modal opens, load the persisted config.
  // Priority: 1) backend dbConfig (authoritative), 2) localStorage cache (instant fallback).
  useEffect(() => {
    if (!isOpen) return; // only act when modal is opening

    if (dbConfig) {
      // Backend config is available — it is always the source of truth
      applyConfig(dbConfig);
    } else {
      // API hasn't resolved yet — use the localStorage cache written during the last Save
      try {
        const cached = localStorage.getItem('ehcm_recruitment_config');
        if (cached) {
          const parsed = JSON.parse(cached);
          applyConfig(parsed);
        }
      } catch {
        // ignore parse errors; defaults remain in place
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Also sync whenever the backend data arrives/changes while the modal is open
  useEffect(() => {
    if (dbConfig && isOpen) {
      applyConfig(dbConfig);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbConfig]);

  // Handle Industry change: Auto-apply smart industry defaults
  const handleIndustryChange = (newIndustryId: string) => {
    setIndustry(newIndustryId);
    const preset = INDUSTRY_CONFIG_PRESETS.find((p) => p.id === newIndustryId);
    if (preset) {
      setAssessmentEnabled(preset.defaultAssessmentEnabled);
      setAssessmentMode(preset.defaultAssessmentMode);
      setDefaultTemplateId(preset.defaultTemplateId);
      setAssessmentRequired(preset.defaultAssessmentRequired);

      if (preset.defaultInterviewMode) setInterviewMode(preset.defaultInterviewMode);
      if (preset.defaultInterviewLocation) setDefaultInterviewLocation(preset.defaultInterviewLocation);
      if (preset.defaultInterviewBuilding) setDefaultInterviewBuilding(preset.defaultInterviewBuilding);
      if (preset.defaultInterviewRoom) setDefaultInterviewRoom(preset.defaultInterviewRoom);

      toast.info(`Applied default settings for ${preset.name}`);
    }
  };

  // Mutation to persist configuration to backend
  const saveConfigMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => jobOpeningsApi.updatePortalConfig(payload),
    onSuccess: (updated) => {
      const configObj = {
        assessmentEnabled,
        assessmentMode,
        industry,
        defaultAssessmentTemplateId: defaultTemplateId,
        defaultAssessmentName: updated.defaultAssessmentName || 'Manufacturing Technical & Machine Practical Assessment',
        assessmentRequired,
        interviewMode,
        defaultInterviewLocation,
        defaultInterviewBuilding,
        defaultInterviewRoom,
      };
      // Cache in localStorage for instant synchronization across tabs and page reloads
      localStorage.setItem('ehcm_recruitment_config', JSON.stringify(configObj));
      queryClient.setQueryData(['portal-config'], updated);
      queryClient.invalidateQueries({ queryKey: ['portal-config'] });
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      window.dispatchEvent(new CustomEvent('ehcm:recruitment-config-changed', { detail: configObj }));
      toast.success('Recruitment configuration saved successfully!');
      if (onConfigSaved) onConfigSaved(updated);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    },
  });

  const handleSave = () => {
    const selectedTemplate = ALL_AVAILABLE_TEMPLATES.find((t) => t.id === defaultTemplateId);
    saveConfigMutation.mutate({
      assessmentEnabled,
      assessmentMode,
      industry,
      defaultAssessmentTemplateId: defaultTemplateId,
      defaultAssessmentName: selectedTemplate?.name || 'Manufacturing Technical & Machine Practical Assessment',
      assessmentRequired,
      interviewMode,
      defaultInterviewLocation,
      defaultInterviewBuilding,
      defaultInterviewRoom,
    });
  };

  const handleResetToManufacturing = () => {
    setAssessmentEnabled(true);
    setAssessmentMode('OFFLINE');
    setIndustry('Manufacturing & Industrial');
    setDefaultTemplateId('TST-MFG-01');
    setAssessmentRequired(true);
    setInterviewMode('OFFLINE');
    setDefaultInterviewLocation('Pune Manufacturing Plant');
    setDefaultInterviewBuilding('Administration Block');
    setDefaultInterviewRoom('HR Interview Room 1');
    toast.info('Reset to Manufacturing & Industrial standard defaults.');
  };

  const activePreset = INDUSTRY_CONFIG_PRESETS.find((p) => p.id === industry) || INDUSTRY_CONFIG_PRESETS[0];
  const ActiveIcon = activePreset.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col border-border/80 shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-primary/10 via-background to-muted/40 border-b border-border/70 space-y-1 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-primary font-bold text-lg">
              <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Sliders className="h-5 w-5" />
              </div>
              <span>Recruitment Configuration</span>
            </div>
            <Badge variant="outline" className="bg-background text-xs font-semibold px-2.5 py-1 text-primary border-primary/30">
              Enterprise Policy Engine
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Configure candidate assessment gating, default evaluation modes (Online vs. Offline / In-Person), and industry-specific defaults for your recruitment pipeline.
          </DialogDescription>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto min-h-0">
          {/* 1. MASTER ASSESSMENT ON / OFF SWITCH */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="master-assessment-toggle" className="text-sm font-bold text-foreground cursor-pointer">
                  Enable Assessment Stage
                </Label>
                <Badge
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    assessmentEnabled
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-400/30'
                  }`}
                >
                  {assessmentEnabled ? 'ON' : 'OFF'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, candidates can be assigned skill or practical evaluations before interview or offer release. When OFF, screening moves directly to Interview.
              </p>
            </div>
            <Switch
              id="master-assessment-toggle"
              checked={assessmentEnabled}
              onCheckedChange={setAssessmentEnabled}
              className="scale-110"
            />
          </div>

          {/* 2. INDUSTRY SELECTOR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-primary" /> Select Industry
              </Label>
              <span className="text-[11px] text-muted-foreground">Sets default assessment mode & test presets</span>
            </div>

            <Select value={industry} onValueChange={handleIndustryChange}>
              <SelectTrigger className="h-10 text-xs font-medium">
                <SelectValue placeholder="Select Industry Preset" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_CONFIG_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <SelectItem key={preset.id} value={preset.id} className="text-xs py-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-semibold">{preset.name}</span>
                        <span className="text-[10.5px] text-muted-foreground font-mono ml-1">
                          (Default: {preset.defaultAssessmentMode === 'OFFLINE' ? 'Offline/In-Person' : preset.defaultAssessmentMode})
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Industry Highlights Banner */}
            <div className="bg-muted/40 border border-border/70 rounded-xl p-3.5 flex items-start gap-3 text-xs">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <ActiveIcon className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{activePreset.name} Standard</p>
                <p className="text-muted-foreground text-[11.5px] leading-relaxed">{activePreset.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activePreset.examples.map((ex, i) => (
                    <span key={i} className="bg-background border border-border/60 text-[10px] px-2 py-0.5 rounded-md font-medium text-slate-700 dark:text-slate-300">
                      • {ex}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. ASSESSMENT MODE (ONLINE / OFFLINE / BOTH) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Radio className="h-4 w-4 text-primary" /> Assessment Mode
              </Label>
              <Badge variant="outline" className="text-[10px] font-mono bg-primary/5 text-primary border-primary/20">
                Current: {assessmentMode === 'OFFLINE' ? 'Offline / In-Person' : assessmentMode}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Online */}
              <button
                type="button"
                disabled={!assessmentEnabled}
                onClick={() => setAssessmentMode('ONLINE')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                  !assessmentEnabled
                    ? 'opacity-50 cursor-not-allowed border-dashed'
                    : assessmentMode === 'ONLINE'
                    ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary'
                    : 'bg-background hover:bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                    <Laptop className="h-4 w-4 text-blue-500" /> Online
                  </span>
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${assessmentMode === 'ONLINE' ? 'border-primary bg-primary text-white' : 'border-slate-300'}`}>
                    {assessmentMode === 'ONLINE' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Automated coding challenges, online MCQs, quizzes, and email invitations with secure test links.
                </p>
              </button>

              {/* Option 2: Offline / In-Person (Recommended for Manufacturing) */}
              <button
                type="button"
                disabled={!assessmentEnabled}
                onClick={() => setAssessmentMode('OFFLINE')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer relative ${
                  !assessmentEnabled
                    ? 'opacity-50 cursor-not-allowed border-dashed'
                    : assessmentMode === 'OFFLINE'
                    ? 'bg-emerald-500/10 border-emerald-600 shadow-xs ring-1 ring-emerald-600'
                    : 'bg-background hover:bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Factory className="h-4 w-4 text-emerald-600" /> Offline / In-Person
                  </span>
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${assessmentMode === 'OFFLINE' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                    {assessmentMode === 'OFFLINE' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Machine practical, CNC operation, blueprint reading, measuring tools, and in-person workshop scoring.
                </p>
                {industry === 'Manufacturing & Industrial' && (
                  <Badge className="bg-emerald-600 text-white text-[9px] font-semibold py-0 px-1.5 self-start mt-1">
                    Manufacturing Default
                  </Badge>
                )}
              </button>

              {/* Option 3: Both */}
              <button
                type="button"
                disabled={!assessmentEnabled}
                onClick={() => setAssessmentMode('BOTH')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                  !assessmentEnabled
                    ? 'opacity-50 cursor-not-allowed border-dashed'
                    : assessmentMode === 'BOTH'
                    ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary'
                    : 'bg-background hover:bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                    <Radio className="h-4 w-4 text-indigo-500" /> Both
                  </span>
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${assessmentMode === 'BOTH' ? 'border-primary bg-primary text-white' : 'border-slate-300'}`}>
                    {assessmentMode === 'BOTH' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Support both modes. Individual job requisitions or recruiters can choose either mode per candidate.
                </p>
              </button>
            </div>
          </div>

          {/* 4. DEFAULT ASSESSMENT TEMPLATE */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-primary" /> Default Assessment Template
            </Label>
            <Select
              disabled={!assessmentEnabled}
              value={defaultTemplateId}
              onValueChange={setDefaultTemplateId}
            >
              <SelectTrigger className="h-10 text-xs">
                <SelectValue placeholder="Select Default Assessment..." />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {ALL_AVAILABLE_TEMPLATES.map((tmpl) => (
                  <SelectItem key={tmpl.id} value={tmpl.id} className="text-xs py-2">
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="font-semibold">{tmpl.name}</span>
                      <Badge variant="outline" className="text-[10px] ml-2 shrink-0">
                        {tmpl.mode}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[11px] text-muted-foreground block">
              Pre-selected whenever candidate assessment is scheduled or assigned for this company.
            </span>
          </div>

          {/* 5. ASSESSMENT REQUIRED (MANDATORY GATE) */}
          <div className="bg-card border border-border/80 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="req-assessment-toggle" className="text-xs font-bold text-foreground cursor-pointer">
                  Assessment Required (Mandatory Prerequisite)
                </Label>
                <Badge
                  className={`text-[10px] font-bold ${
                    assessmentRequired
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                      : 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {assessmentRequired ? 'MANDATORY' : 'OPTIONAL'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                If mandatory, candidate must have an assessment recorded with a passing score before releasing an employment offer.
              </p>
            </div>
            <Switch
              id="req-assessment-toggle"
              disabled={!assessmentEnabled}
              checked={assessmentRequired}
              onCheckedChange={setAssessmentRequired}
            />
          </div>

          {/* 6. INTERVIEW MODE CONFIGURATION */}
          <div className="space-y-3 pt-2 border-t border-border/70">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-primary" /> Interview Mode Policy
                </Label>
                <span className="text-[11px] text-muted-foreground block">
                  Controls visible interview types and venue scheduling options in Candidate Interview Schedule modal.
                </span>
              </div>
              <Badge variant="outline" className="text-[11px] font-bold">
                Current: {interviewMode === 'OFFLINE' ? 'In-Person / Offline' : interviewMode === 'ONLINE' ? 'Online' : 'Both (Hybrid)'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Mode: OFFLINE */}
              <button
                type="button"
                onClick={() => setInterviewMode('OFFLINE')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer relative ${
                  interviewMode === 'OFFLINE'
                    ? 'bg-emerald-500/10 border-emerald-600 shadow-xs ring-1 ring-emerald-600'
                    : 'bg-background hover:bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Factory className="h-4 w-4 text-emerald-600" /> In-Person / Offline
                  </span>
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${interviewMode === 'OFFLINE' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                    {interviewMode === 'OFFLINE' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Locks interview type to In-Person / Offline. Hides online meeting links. Demands physical plant/office location and room.
                </p>
                {industry === 'Manufacturing & Industrial' && (
                  <Badge className="bg-emerald-600 text-white text-[9px] font-semibold py-0 px-1.5 self-start mt-1">
                    Manufacturing Default
                  </Badge>
                )}
              </button>

              {/* Mode: ONLINE */}
              <button
                type="button"
                onClick={() => setInterviewMode('ONLINE')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                  interviewMode === 'ONLINE'
                    ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary'
                    : 'bg-background hover:bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                    <Video className="h-4 w-4 text-blue-500" /> Online
                  </span>
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${interviewMode === 'ONLINE' ? 'border-primary bg-primary text-white' : 'border-slate-300'}`}>
                    {interviewMode === 'ONLINE' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Online only (Microsoft Teams link pool, Google Meet, Phone Call). Hides offline venue fields.
                </p>
              </button>

              {/* Mode: BOTH */}
              <button
                type="button"
                onClick={() => setInterviewMode('BOTH')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                  interviewMode === 'BOTH'
                    ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary'
                    : 'bg-background hover:bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                    <Radio className="h-4 w-4 text-indigo-500" /> Both (Hybrid)
                  </span>
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${interviewMode === 'BOTH' ? 'border-primary bg-primary text-white' : 'border-slate-300'}`}>
                    {interviewMode === 'BOTH' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Allows selecting between Teams, Google Meet, In-Person / Offline, or Phone Call per candidate.
                </p>
              </button>
            </div>

            {/* Default Offline Venue Fields (Used for OFFLINE or BOTH) */}
            {(interviewMode === 'OFFLINE' || interviewMode === 'BOTH') && (
              <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/15 rounded-xl border border-amber-200/80 dark:border-amber-800/60 space-y-3">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  <Label className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    Default In-Person Interview Venue
                  </Label>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Default Location *</Label>
                  <Input
                    value={defaultInterviewLocation}
                    onChange={(e) => setDefaultInterviewLocation(e.target.value)}
                    placeholder="Pune Manufacturing Plant"
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Default Building / Area</Label>
                    <Input
                      value={defaultInterviewBuilding}
                      onChange={(e) => setDefaultInterviewBuilding(e.target.value)}
                      placeholder="Administration Block"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Default Room *</Label>
                    <Input
                      value={defaultInterviewRoom}
                      onChange={(e) => setDefaultInterviewRoom(e.target.value)}
                      placeholder="HR Interview Room 1"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-muted/30 border-t border-border/70 shrink-0 flex items-center justify-between gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetToManufacturing}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset to Manufacturing
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saveConfigMutation.isPending}
              className="text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              {saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
