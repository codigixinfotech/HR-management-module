import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sparkles,
  Camera,
  Users,
  UserSearch,
  Wallet,
  Clock,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Building2,
  Award,
  Calendar,
  FileText,
  Play,
  ArrowRight,
  Zap,
  Check,
  Star,
  Globe,
  Lock,
  Headphones,
  Sliders,
  Send,
  HelpCircle,
  BarChart3,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Briefcase,
  XCircle,
  AlertCircle,
  Cpu,
  Download,
  Server,
  Key,
  GraduationCap,
  Smartphone,
  PieChart,
  Workflow,
  CheckSquare,
  ShieldAlert,
  Share2,
  Laptop,
  Video,
  FileCode,
  HelpCircle as QuestionIcon,
  MapPin,
  FileSpreadsheet,
  Network,
  UserCheck,
  FileCheck,
  MailCheck,
  Sparkle,
  Layers3,
  Bot,
  Percent,
  CheckCheck,
  ExternalLink,
  Code,
  Factory,
  UserPlus,
  BarChart,
  Shield,
  Activity,
  CheckSquare2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FaceAttendanceModal } from '@/pages/attendance/FaceAttendanceModal';

// Imported Banner Artifact Images generated for HR ERP
import heroWorkflowBackgroundBanner from '@/assets/banners/hollow_erp_workflow_background_banner.jpg';
import heroFullBackgroundBanner from '@/assets/banners/hollow_erp_full_background_banner.jpg';
import heroBannerSeamlessDark from '@/assets/banners/hollow_erp_dark_hero_seamless.jpg';
import heroBannerHollowLayout from '@/assets/banners/hollow_erp_layout_banner.jpg';
import heroBannerWhite from '@/assets/banners/hr_erp_white_landing_banner.jpg';
import heroBannerFlagship from '@/assets/banners/flagship_hr_erp_hero_banner.jpg';

type LucideIcon = React.ComponentType<{ className?: string }>;

export function LandingPage() {
  const navigate = useNavigate();

  // Active section tracker for navigation
  const [activeSectionId, setActiveSectionId] = useState<string>('sec-hero');

  // Demo Modals State
  const [isFaceDemoOpen, setIsFaceDemoOpen] = useState(false);
  const [isBookDemoModalOpen, setIsBookDemoModalOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Customer Demo Request Form State
  const [demoClientName, setDemoClientName] = useState('');
  const [demoCompanyName, setDemoCompanyName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPhone, setDemoPhone] = useState('');
  const [demoEmployeeCount, setDemoEmployeeCount] = useState('50-200');
  const [demoPreferredDate, setDemoPreferredDate] = useState('2026-09-05');
  const [demoMessage, setDemoMessage] = useState('');
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);

  // Scroll spy on window (public standalone page — no AppLayout <main>)
  useEffect(() => {
    const allIds = [
      'sec-hero',
      'sec-recruitment',
      'sec-organization',
      'sec-attendance',
      'sec-payroll',
      'sec-performance',
      'sec-training',
      'sec-ess',
      'sec-analytics',
      'sec-superadmin',
      'sec-lifecycle',
      'sec-integrations',
      'sec-why',
      'sec-pricing',
      'sec-faq',
      'sec-cta',
    ];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220;
      for (let i = allIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(allIds[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSectionId(allIds[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBookDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoClientName || !demoEmail || !demoCompanyName) {
      toast.error('Please fill in your name, email, and company name.');
      return;
    }

    setIsSubmittingDemo(true);
    setTimeout(() => {
      setIsSubmittingDemo(false);
      setIsBookDemoModalOpen(false);
      toast.success(`Demo Request Submitted! Our HR Solutions Specialist will contact ${demoEmail} shortly.`, {
        duration: 5000,
      });
      setDemoClientName('');
      setDemoCompanyName('');
      setDemoEmail('');
      setDemoPhone('');
      setDemoMessage('');
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto font-sans text-slate-900 bg-slate-50/70 selection:bg-indigo-500 selection:text-white">
      {/* ── PAGE LAYOUT: 100% FULL-WIDTH STANDALONE PUBLIC LANDING PAGE ── */}
      <div className="w-full space-y-16 pb-24">
        <div className="w-full space-y-16">
          
          {/* ── 1. HERO SECTION (E-HRM ENTERPRISE ERP PRODUCT BRANDING & WORKFLOW BANNER) ── */}
          <section id="sec-hero" className="scroll-mt-24 space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200/90">
              
              {/* FULL-WIDTH E-HRM ERP WORKFLOW BANNER BACKGROUND IMAGE */}
              <div className="relative w-full min-h-[640px] lg:min-h-[700px] flex flex-col justify-between">
                <img
                  src={heroWorkflowBackgroundBanner}
                  alt="E-HRM Enterprise ERP Workflow Background Banner"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />

                {/* Bottom Center Brand Overlay Badge to seamlessly cover image baked text */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 px-10 py-2 rounded-t-2xl bg-slate-950 text-white border-t-2 border-x-2 border-purple-500/50 text-xs font-black tracking-widest uppercase shadow-2xl flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-purple-400 font-black">E-HRM</span> Enterprise ERP
                </div>

                {/* Top-right floating action buttons */}
                <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2">
                  {/* Schedule Customer Demo */}
                  <button
                    type="button"
                    onClick={() => setIsBookDemoModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white text-purple-700 border border-purple-300/60 font-extrabold text-xs shadow-lg transition-all cursor-pointer"
                  >
                    ▶ Schedule Demo
                  </button>

                  {/* Billing Now */}
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('sec-pricing');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-extrabold text-xs shadow-lg hover:shadow-purple-400/40 transition-all cursor-pointer"
                  >
                    💳 Billing Now
                  </button>
                </div>

                {/* OVERLAID CONTENT CONTAINER (Positioned directly over the background banner image) */}
                <div className="relative z-10 p-6 sm:p-10 flex flex-col justify-between min-h-[640px] lg:min-h-[700px] space-y-8">
                  
                  {/* TOP / MAIN OVERLAID CONTENT GRID */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto">
                    
                    {/* Left Side Overlaid Content (E-HRM ERP Real Product Metrics & Specs) */}
                    <div className="lg:col-span-7 space-y-5 text-left max-w-2xl bg-white/70 lg:bg-transparent backdrop-blur-xs lg:backdrop-blur-none p-4 sm:p-0 rounded-2xl">
                      
                      {/* Top Pill Badge */}
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100/90 border border-purple-200 text-xs font-black text-purple-800 uppercase tracking-wide shadow-2xs">
                        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                        <span>E-HRM ERP • AI-POWERED HR INTELLIGENCE</span>
                      </div>

                      {/* Main Headline for E-HRM Enterprise ERP */}
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.12] text-slate-950">
                        Transform Your Workforce{' '}
                        <span className="text-purple-600 block mt-1">with AI-Powered HR Intelligence</span>
                      </h1>

                      {/* Real E-HRM ERP Product Description */}
                      <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed">
                        E-HRM ERP is an all-in-one enterprise platform uniting Complete Recruitment Automation, Employee & Org Management, AI Face + Location Attendance, and Attendance-to-Payslip Automated Payroll.
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <Button
                          size="lg"
                          onClick={() => setIsBookDemoModalOpen(true)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-6 py-5 rounded-xl shadow-lg cursor-pointer transition-all gap-2"
                        >
                          <Play className="h-4 w-4 fill-white" /> Schedule Customer Demo
                        </Button>

                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => setIsFaceDemoOpen(true)}
                          className="bg-white/90 hover:bg-white text-slate-800 border-slate-300 font-bold text-xs px-5 py-5 rounded-xl shadow-2xs cursor-pointer gap-2 backdrop-blur-xs"
                        >
                          <Camera className="h-4 w-4 text-purple-600" /> Test AI Face Scanner
                        </Button>

                        <Button
                          size="lg"
                          variant="ghost"
                          onClick={() => navigate('/attendance-leave/live')}
                          className="text-slate-800 hover:text-slate-950 font-bold text-xs px-3 py-5 rounded-xl gap-1"
                        >
                          Open App Dashboard <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* 6 Real E-HRM Enterprise ERP Metadata Specification Cards */}
                      <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/95 border border-slate-200/90 backdrop-blur-xs shadow-2xs">
                          <Building2 className="h-4.5 w-4.5 text-purple-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">DEPLOYMENT</span>
                            <h5 className="text-xs font-black text-slate-900 leading-tight">Multi-Tenant ERP</h5>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/95 border border-slate-200/90 backdrop-blur-xs shadow-2xs">
                          <Camera className="h-4.5 w-4.5 text-purple-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">BIOMETRIC SCAN</span>
                            <h5 className="text-xs font-black text-slate-900 leading-tight">&lt;0.3s Face Match Rate</h5>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/95 border border-slate-200/90 backdrop-blur-xs shadow-2xs">
                          <MapPin className="h-4.5 w-4.5 text-purple-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">GEOFENCE</span>
                            <h5 className="text-xs font-black text-slate-900 leading-tight">100m GPS Radius Lock</h5>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/95 border border-slate-200/90 backdrop-blur-xs shadow-2xs">
                          <UserSearch className="h-4.5 w-4.5 text-purple-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">RECRUITMENT</span>
                            <h5 className="text-xs font-black text-slate-900 leading-tight">16-Step ATS & Teams</h5>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/95 border border-slate-200/90 backdrop-blur-xs shadow-2xs">
                          <Code className="h-4.5 w-4.5 text-purple-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">TECH STACK</span>
                            <h5 className="text-xs font-black text-slate-900 leading-tight">React, Node.js, AI</h5>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-purple-50/95 border border-purple-200 backdrop-blur-xs shadow-2xs">
                          <Globe className="h-4.5 w-4.5 text-purple-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9.5px] font-extrabold text-purple-600 uppercase tracking-wider block">LIVE DEMO</span>
                            <button
                              type="button"
                              onClick={() => navigate('/attendance-leave/live')}
                              className="text-xs font-black text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              Open Link <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Right Side Space (Leaves background product workflow visual clear) */}
                    <div className="hidden lg:block lg:col-span-5" />

                  </div>

                  {/* OVERLAID BOTTOM DARK STATISTICS BAR */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-md text-white flex flex-wrap items-center justify-between text-xs font-medium px-6 gap-4 border border-white/10 shadow-xl">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>99.99% Enterprise Uptime SLA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-cyan-400" />
                      <span>100% Tax & Statutory Compliance (PF/ESIC/PT/TDS)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Workflow className="h-4 w-4 text-purple-400" />
                      <span>End-to-End Automation from Hiring to Retirement</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </section>

          {/* ── 2. RECRUITMENT & ATS — FLAGSHIP FEATURE #1 (LIGHT MODE) ── */}
          <section id="sec-recruitment" className="scroll-mt-24 space-y-8">
            <Card className="border-2 border-purple-200 p-6 sm:p-10 bg-white shadow-xl rounded-3xl space-y-8 relative overflow-hidden">
              <div className="space-y-3">
                <Badge className="bg-purple-600 text-white text-xs font-black px-3.5 py-1">
                  🌟 FLAGSHIP MODULE #1 — TALENT ACQUISITION & ATS
                </Badge>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  2. Recruitment & ATS — Complete 16-Step End-to-End Hiring Journey
                </h2>
                <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                  Automate hiring from manpower planning and job requisitions to public career page posting, ATS resume parsing, auto-selected question bank assessments, Microsoft Teams video interview sync, and digital offer letter generation.
                </p>
              </div>

              {/* 16-Step Visual Recruitment Flow Journey Bar */}
              <div className="space-y-3 p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-white text-slate-900 shadow-md border border-purple-200">
                <div className="flex items-center justify-between border-b border-purple-200/60 pb-3">
                  <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-purple-600" /> Visual Recruitment Pipeline Journey Flow (16 Steps)
                  </span>
                  <Badge className="bg-emerald-600 text-white font-mono text-[10px]">End-to-End Automation</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-[10.5px]">
                  {[
                    '01. Manpower Plan',
                    '02. Requisition',
                    '03. Approval',
                    '04. Job Opening',
                    '05. Career Portal',
                    '06. Candidate Applies',
                    '07. Profile Created',
                    '08. ATS Resume Score',
                    '09. Question Test',
                    '10. Question Bank',
                    '11. Schedule Slot',
                    '12. Teams Meeting',
                    '13. Panel Feedback',
                    '14. Candidate Select',
                    '15. Offer Letter',
                    '16. Onboarding',
                  ].map((step) => (
                    <div
                      key={step}
                      className="p-2 rounded-xl bg-white text-slate-800 text-center font-bold border border-purple-200 shadow-2xs hover:bg-purple-600 hover:text-white transition-colors"
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* 4 Feature Deep Dive Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-purple-600 text-white font-bold">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Career Page & Job Portal</h4>
                      <p className="text-[11px] text-slate-500">Public branded hiring portal for candidate applications</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Public Job Openings List & Filtering</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Apply Now One-Click Application Form</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Resume / CV File Upload & Parsing</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Candidate Application Tracking Portal</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-emerald-600 text-white font-bold">
                      <QuestionIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Assessment & Auto Question Bank</h4>
                      <p className="text-[11px] text-slate-500">Automated MCQ & coding test evaluation engine</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Question Bank Master (Aptitude, Technical, Logic)</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Automatic Question Selection by Technology</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Passing Threshold % & Timed Online Link</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Auto Scorecards & Candidate Result Reports</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-indigo-600 text-white font-bold">
                      <Video className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Microsoft Teams Interview Management</h4>
                      <p className="text-[11px] text-slate-500">Direct Teams video links & panel scorecards</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Automated Microsoft Teams Meeting Links</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Interview Panel Assignment & Calendar Sync</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Live Interview Scorecards & Evaluation Criteria</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Candidate Selection / Rejection Workflow</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-purple-600 text-white font-bold">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Recruitment Automation & Offers</h4>
                      <p className="text-[11px] text-slate-500">Auto email triggers & digital offer letters</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Automatic Email Notifications & Test Links</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Interview Reminder Invites for Candidates</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> One-Click Digital Offer Letter Generation</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Real-time Recruitment Status Updates</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => navigate('/recruitment')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-5 px-6 rounded-2xl cursor-pointer gap-2"
                >
                  Open Full Recruitment ATS Pipeline <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </section>

          {/* ── 3. ORGANIZATION & EMPLOYEE MANAGEMENT — FLAGSHIP FEATURE #2 (LIGHT MODE) ── */}
          <section id="sec-organization" className="scroll-mt-24 space-y-8">
            <Card className="border-2 border-indigo-200 p-6 sm:p-10 bg-white shadow-xl rounded-3xl space-y-6">
              <div className="space-y-2">
                <Badge className="bg-indigo-600 text-white text-xs font-black px-3.5 py-1">
                  🌟 FLAGSHIP MODULE #2 — ORG & EMPLOYEE LIFECYCLE
                </Badge>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  3. E-HRM ERP — Organization Master & Complete Employee Lifecycle
                </h2>
                <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                  Centralize company hierarchy, department cost centers, designations, document repositories, promotion logs, and department transfers under one master database.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                  <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-600" /> Organization Master Architecture
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <div className="p-2 rounded-xl bg-white border border-indigo-100 shadow-2xs">🏢 Company Entities</div>
                    <div className="p-2 rounded-xl bg-white border border-indigo-100 shadow-2xs">📍 Branch Locations</div>
                    <div className="p-2 rounded-xl bg-white border border-indigo-100 shadow-2xs">👥 Department Master</div>
                    <div className="p-2 rounded-xl bg-white border border-indigo-100 shadow-2xs">🎓 Designations & Grades</div>
                    <div className="p-2 rounded-xl bg-white border border-indigo-100 shadow-2xs">💰 Cost Centers</div>
                    <div className="p-2 rounded-xl bg-white border border-indigo-100 shadow-2xs">🌳 Reporting Org Structure</div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
                  <h4 className="text-sm font-bold text-sky-900 flex items-center gap-2">
                    <Users className="h-4 w-4 text-sky-600" /> Employee Lifecycle Records
                  </h4>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between border-b pb-1"><span>Employee Master Profile:</span><span className="font-bold">Full Personal & Employment Details</span></div>
                    <div className="flex justify-between border-b pb-1"><span>Document Vault:</span><span className="font-bold">Education, Identity & Contracts</span></div>
                    <div className="flex justify-between border-b pb-1"><span>Skills & Certifications:</span><span className="font-bold">Technical Matrix & Expiry Log</span></div>
                    <div className="flex justify-between border-b pb-1"><span>Promotions & Transfers:</span><span className="font-bold">Role & Compensation History</span></div>
                    <div className="flex justify-between"><span>Exit Clearance:</span><span className="font-bold">Asset Return & F&F Settlement</span></div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* ── 4. AI ATTENDANCE — FLAGSHIP FEATURE #3 (LIGHT MODE) ── */}
          <section id="sec-attendance" className="scroll-mt-24 space-y-8">
            <Card className="border-2 border-emerald-200 p-6 sm:p-10 bg-white shadow-xl rounded-3xl space-y-8">
              <div className="space-y-2">
                <Badge className="bg-emerald-600 text-white font-black text-xs px-3.5 py-1">
                  🌟 FLAGSHIP MODULE #3 — AI BIOMETRIC ATTENDANCE
                </Badge>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  4. AI Face Recognition + 100m Location Geofencing
                </h2>
                <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                  Eliminate time theft and buddy punching. High-accuracy 128-dimensional facial landmark feature matching (under 0.3s), moving scan beam liveness detection, anti-photo spoofing, and GPS location geofencing.
                </p>
              </div>

              {/* Mobile + Laptop Attendance Workflow Diagram */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-indigo-50 to-white text-slate-900 space-y-6 shadow-md border border-emerald-200">
                <div className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                  <Camera className="h-4 w-4 text-emerald-600" /> Automated Check-In & Check-Out Execution Workflow
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-center text-xs">
                  {[
                    '1. Open App / Web',
                    '2. Camera Activation',
                    '3. 128-D Face Mesh',
                    '4. Eye Liveness Check',
                    '5. 100m Geofence Lock',
                    '6. Punch Recorded (under 0.3s)',
                  ].map((step, idx) => (
                    <div key={step} className="p-3 rounded-2xl bg-white text-slate-800 border border-emerald-200 font-bold shadow-2xs">
                      <div className="text-emerald-600 font-mono text-[10px] mb-1">STEP 0{idx + 1}</div>
                      <div>{step}</div>
                    </div>
                  ))}
                </div>

                {/* Laptop & Mobile Device Live Scanner Launcher */}
                <div className="pt-3 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-xs text-slate-700">
                    <Laptop className="h-5 w-5 text-emerald-600" />
                    <span>Works seamlessly across iOS, Android, and Desktop Web Browsers.</span>
                  </div>

                  <Button
                    onClick={() => setIsFaceDemoOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-5 px-6 rounded-2xl cursor-pointer shadow-md"
                  >
                    <Camera className="h-4 w-4 mr-2" /> Test Live Camera Scanner Now
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {/* ── 5. AUTOMATED PAYROLL — FLAGSHIP FEATURE #4 (LIGHT MODE) ── */}
          <section id="sec-payroll" className="scroll-mt-24 space-y-8">
            <Card className="border-2 border-indigo-200 p-6 sm:p-10 bg-white shadow-xl rounded-3xl space-y-8">
              <div className="space-y-2">
                <Badge className="bg-indigo-600 text-white text-xs font-black px-3.5 py-1">
                  🌟 FLAGSHIP MODULE #4 — AUTOMATED PAYROLL
                </Badge>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  5. Automated Payroll — Attendance to Payslip Fully Automated
                </h2>
                <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                  Directly connect approved attendance, late marks, overtime, and Leave Without Pay (LWP) deductions to salary processing. Calculate Provident Fund (PF), ESIC, Professional Tax, TDS, and generate bank payout files.
                </p>
              </div>

              {/* Attendance-to-Payslip Automation Chain */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-50 via-purple-50 to-white text-slate-900 space-y-4 shadow-md border border-indigo-200">
                <div className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-indigo-600" /> Attendance to Payslip — Automated Execution Chain
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold font-mono">
                  <span className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">Attendance Log</span> ➔
                  <span className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">Working Hours & LWP</span> ➔
                  <span className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">Base Earnings</span> ➔
                  <span className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">PF / ESIC / PT / TDS</span> ➔
                  <span className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">One-Click Payroll</span> ➔
                  <span className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">PDF Payslip & Bank Transfer</span>
                </div>
              </div>
            </Card>
          </section>

          {/* ── 6. PERFORMANCE APPRAISALS & PROMOTIONS (LIGHT MODE) ── */}
          <section id="sec-performance" className="scroll-mt-24 space-y-6">
            <Card className="border-slate-200 p-6 sm:p-10 bg-white shadow-md rounded-3xl space-y-6">
              <div className="space-y-2">
                <Badge className="bg-purple-50 text-purple-700 border border-purple-200">
                  Performance & Career Growth
                </Badge>
                <h3 className="text-2xl font-black text-slate-900">
                  6. Performance Appraisals & Promotion Management
                </h3>
                <p className="text-xs text-slate-500">
                  Align team goals with company objectives using structured KRAs, KPIs, 360° reviews, and automated promotion history tracking.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                  <Award className="h-6 w-6 text-purple-600" />
                  <h4 className="text-sm font-bold text-slate-900">Goal & KRA / KPI Tracking</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Set quarterly OKRs, key result targets, and weighted scoring benchmarks per department.
                  </p>
                  <div className="pt-2 border-t border-purple-200/60 text-[11px] text-purple-800 font-semibold">
                    ✓ Quantitative KPI Scorecards
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                  <Users className="h-6 w-6 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">360° Feedback & 9-Box Matrix</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Self-evaluations, peer reviews, manager scorecards, and potential vs performance 9-box mapping.
                  </p>
                  <div className="pt-2 border-t border-indigo-200/60 text-[11px] text-indigo-800 font-semibold">
                    ✓ Multi-Rater Peer Review
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-900">Promotion & Revision History</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Connect review ratings directly to designation promotions, salary revisions, and band upgrades.
                  </p>
                  <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800 font-semibold">
                    ✓ Salary Revision Log
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* ── 7. TRAINING & DEVELOPMENT (LMS - LIGHT MODE) ── */}
          <section id="sec-training" className="scroll-mt-24 space-y-6">
            <Card className="border-slate-200 p-6 sm:p-8 bg-white shadow-sm rounded-3xl space-y-4">
              <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200">
                Learning LMS & Skill Development
              </Badge>
              <h3 className="text-2xl font-black text-slate-900">
                7. Employee Training & Skill Development Portal
              </h3>
              <p className="text-xs text-slate-500">
                Identify skill gaps, publish internal training courses, track certification completions, and manage course enrollments.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs font-bold pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <GraduationCap className="h-6 w-6 text-indigo-600 mx-auto" />
                  <div>Internal Course Catalog</div>
                  <div className="text-[10px] text-slate-500 font-normal">Video & Document Materials</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <Award className="h-6 w-6 text-emerald-600 mx-auto" />
                  <div>Certification Tracker</div>
                  <div className="text-[10px] text-slate-500 font-normal">Expiry Alerts & Renewals</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <Cpu className="h-6 w-6 text-purple-600 mx-auto" />
                  <div>Skill Matrix & Competencies</div>
                  <div className="text-[10px] text-slate-500 font-normal">Department Skill Heatmap</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <FileCheck className="h-6 w-6 text-sky-600 mx-auto" />
                  <div>Training Progress Reports</div>
                  <div className="text-[10px] text-slate-500 font-normal">Automated Assessment Quizzes</div>
                </div>
              </div>
            </Card>
          </section>

          {/* ── 8. EMPLOYEE SELF SERVICE (ESS - LIGHT MODE) ── */}
          <section id="sec-ess" className="scroll-mt-24 space-y-6">
            <Card className="border-slate-200 p-6 sm:p-10 bg-white shadow-sm rounded-3xl space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <Badge className="bg-sky-50 text-sky-700 border border-sky-200">
                    Employee Experience
                  </Badge>
                  <h3 className="text-2xl font-black text-slate-900">
                    8. Employee Self-Service (ESS) Web & Mobile PWA
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Empower staff with self-service mobile tools to check-in via camera face scan, download PDF payslips, submit leave requests, view performance scorecards, and update document vault records.
                  </p>

                  <div className="grid grid-cols-3 gap-3 text-xs font-semibold pt-1">
                    <div className="p-3 rounded-xl bg-sky-50 text-sky-800 border border-sky-100 text-center font-bold">📱 Mobile Face Punch</div>
                    <div className="p-3 rounded-xl bg-sky-50 text-sky-800 border border-sky-100 text-center font-bold">📄 PDF Payslip Download</div>
                    <div className="p-3 rounded-xl bg-sky-50 text-sky-800 border border-sky-100 text-center font-bold">🏖️ Leave Requests</div>
                  </div>
                </div>

                <div className="lg:col-span-5 flex justify-center">
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-3 border border-indigo-200 text-center shadow-xl w-full max-w-xs">
                    <Smartphone className="h-10 w-10 text-cyan-400 mx-auto" />
                    <h5 className="text-sm font-bold">PWA Mobile Portal Ready</h5>
                    <p className="text-[11px] text-slate-300">Accessible on iOS & Android devices</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* ── 9. EXECUTIVE ANALYTICS & BI DASHBOARDS (LIGHT MODE) ── */}
          <section id="sec-analytics" className="scroll-mt-24 space-y-6">
            <Card className="border-slate-200 p-6 sm:p-8 bg-white shadow-sm rounded-3xl space-y-6">
              <div className="space-y-2">
                <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Business Intelligence Metrics
                </Badge>
                <h3 className="text-2xl font-black text-slate-900">
                  9. Executive Analytics & BI Dashboard Visualizations
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time visual dashboards summarizing workforce headcount, attendance punctuality, ATS hiring speed, and monthly payroll budget.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100"><div className="text-2xl font-black font-mono text-indigo-600">1,420</div><div className="text-xs text-slate-600 font-semibold">Headcount</div></div>
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100"><div className="text-2xl font-black font-mono text-emerald-600">98.4%</div><div className="text-xs text-slate-600 font-semibold">Avg Attendance</div></div>
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100"><div className="text-2xl font-black font-mono text-purple-600">14 Days</div><div className="text-xs text-slate-600 font-semibold">Time-to-Hire</div></div>
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100"><div className="text-2xl font-black font-mono text-amber-600">₹45.8L</div><div className="text-xs text-slate-600 font-semibold">Monthly Payroll</div></div>
              </div>
            </Card>
          </section>

          {/* ── 10. SUPER ADMIN & MULTI-TENANT GOVERNANCE (LIGHT MODE) ── */}
          <section id="sec-superadmin" className="scroll-mt-24 space-y-6">
            <Card className="border-slate-200 p-6 sm:p-8 bg-white shadow-sm rounded-3xl space-y-6">
              <div className="space-y-2">
                <Badge className="bg-slate-900 text-white">
                  Super Admin Governance
                </Badge>
                <h3 className="text-2xl font-black text-slate-900">
                  10. Super Admin Multi-Tenant Governance & Security Logs
                </h3>
                <p className="text-xs text-slate-500">
                  Control multi-company subsidiaries, cost centers, granular RBAC permissions, and comprehensive timestamped audit trails.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <Building2 className="h-6 w-6 text-slate-800" />
                  <h4 className="text-sm font-bold text-slate-900">Multi-Company Architecture</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Manage parent companies, sub-tenants, and cost centers from a single portal.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <ShieldCheck className="h-6 w-6 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">Role-Based Access Control</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Granular permissions for Super Admin, HR Manager, Department Head, and Staff.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <FileText className="h-6 w-6 text-purple-600" />
                  <h4 className="text-sm font-bold text-slate-900">Timestamped Audit Logs</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Complete security trail tracking every data modification, login, and export.</p>
                </div>
              </div>
            </Card>
          </section>

          {/* ── 11. COMPLETE EMPLOYEE LIFECYCLE TIMELINE (LIGHT MODE) ── */}
          <section id="sec-lifecycle" className="scroll-mt-24 space-y-6">
            <Card className="border-slate-200 p-6 sm:p-8 bg-white shadow-sm rounded-3xl space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <Badge className="bg-purple-50 text-purple-700 border border-purple-200">
                  End-to-End Workflow Timeline
                </Badge>
                <h3 className="text-2xl font-black text-slate-900">
                  11. Complete Employee Lifecycle Journey (Hiring to Retirement)
                </h3>
              </div>

              <div className="relative border-l-2 border-indigo-500 ml-4 space-y-6 pl-6 pt-2">
                {[
                  { stage: '1. Sourcing & ATS Requisition', desc: 'Manpower planning request approved, job opening published to portal.' },
                  { stage: '2. Question Bank Test & Teams Interview', desc: 'Auto-selected question bank MCQ test evaluated, Teams video interview link generated.' },
                  { stage: '3. Offer & Digital Onboarding', desc: 'Digital offer letter issued, candidate accepts and completes document uploads.' },
                  { stage: '4. Active Employee & Biometrics', desc: 'Employee code generated, Face ID template registered for camera punches.' },
                  { stage: '5. Payroll, Performance & Training', desc: 'Monthly attendance pay processed, 360° reviews completed, LMS certifications.' },
                  { stage: '6. Offboarding & Exit Clearance', desc: 'Resignation workflow, asset return, and F&F settlement generated.' },
                ].map((step) => (
                  <div key={step.stage} className="relative">
                    <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full bg-indigo-600 border-2 border-white shadow-md" />
                    <h4 className="text-sm font-bold text-slate-900">{step.stage}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* ── 12. ENTERPRISE SOFTWARE INTEGRATIONS (LIGHT MODE) ── */}
          <section id="sec-integrations" className="scroll-mt-24 space-y-6">
            <Card className="border-slate-200 p-6 bg-white shadow-sm rounded-3xl space-y-4">
              <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200">
                Ecosystem Connectors
              </Badge>
              <h3 className="text-xl font-bold text-slate-900">
                12. Enterprise Software Integrations
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center text-xs font-bold pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">Microsoft Teams</div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">Email & SMTP</div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">Biometric Hardware</div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">Bank Payout APIs</div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">Push Notifications</div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">Document Storage</div>
              </div>
            </Card>
          </section>

          {/* ── 13. WHY E-HRM ERP (LIGHT MODE) ── */}
          <section id="sec-why" className="scroll-mt-24 space-y-6">
            <Card className="border-slate-200 p-6 sm:p-8 bg-gradient-to-br from-purple-700 via-indigo-700 to-purple-900 text-white shadow-xl rounded-3xl space-y-6">
              <div className="text-center space-y-2 max-w-xl mx-auto">
                <Badge className="bg-white text-purple-900 font-extrabold shadow-sm">
                  Why Choose E-HRM ERP
                </Badge>
                <h3 className="text-2xl font-black">
                  13. Why Enterprise Leaders Trust E-HRM ERP
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 space-y-1.5">
                  <Zap className="h-5 w-5 text-amber-300" />
                  <h4 className="font-bold text-sm">AI Biometric Automation</h4>
                  <p className="text-purple-100">Eliminate manual time theft and card punch delays with Face ID.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 space-y-1.5">
                  <Wallet className="h-5 w-5 text-emerald-300" />
                  <h4 className="font-bold text-sm">Zero Payroll Errors</h4>
                  <p className="text-purple-100">Automated attendance-linked payroll calculations and tax filing.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 space-y-1.5">
                  <Server className="h-5 w-5 text-purple-300" />
                  <h4 className="font-bold text-sm">Multi-Tenant Scalability</h4>
                  <p className="text-purple-100">Seamless support for parent companies and branch subsidiaries.</p>
                </div>
              </div>
            </Card>
          </section>

          {/* ── 14. PRICING & LICENSING PLANS — PREMIUM REDESIGN ── */}
          <section id="sec-pricing" className="scroll-mt-24 space-y-6">
            <PricingSection onBookDemo={() => setIsBookDemoModalOpen(true)} />
          </section>

          {/* ── 15. CUSTOMER FAQ ACCORDION (LIGHT MODE) ── */}
          <section id="sec-faq" className="scroll-mt-24 space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-slate-900">15. Frequently Asked Questions</h3>
              <p className="text-xs text-slate-500">Everything you need to know about setting up and deploying our E-HRM Management ERP system.</p>
            </div>

            <div className="space-y-3">
              {FAQ_LIST.map((faq, index) => {
                const isOpen = expandedFaq === index;
                return (
                  <Card
                    key={faq.question}
                    className="border-slate-200 bg-white shadow-2xs overflow-hidden rounded-2xl"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : index)}
                      className="w-full p-4 text-left font-bold text-xs flex items-center justify-between text-slate-900 cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-purple-600" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-0 text-xs text-slate-600 border-t border-slate-100 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>

          {/* ── 16. FINAL CALL TO ACTION (LIGHT MODE BANNER) ── */}
          <section id="sec-cta" className="scroll-mt-24 text-center space-y-6 pt-4">
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white shadow-2xl space-y-6">
              <h2 className="text-3xl sm:text-4xl font-black">
                16. Transform Your HR Operations with E-HRM ERP
              </h2>
              <p className="text-sm sm:text-base text-slate-100 max-w-xl mx-auto font-medium">
                Schedule a live demonstration with our senior HR solutions architects or launch the live interactive app.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Button
                  size="lg"
                  onClick={() => setIsBookDemoModalOpen(true)}
                  className="bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-sm px-8 py-6 rounded-2xl shadow-xl cursor-pointer"
                >
                  <Play className="h-4 w-4 mr-2 fill-slate-900" /> Schedule Live Customer Demo
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="bg-white/10 text-white border-white/40 hover:bg-white/20 font-bold text-sm px-8 py-6 rounded-2xl cursor-pointer"
                >
                  Open Live App Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* ── CUSTOMER DEMO REQUEST MODAL ── */}
      <Dialog open={isBookDemoModalOpen} onOpenChange={setIsBookDemoModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <Sparkles className="h-5 w-5 text-purple-600" /> Schedule Customer ERP Demo
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Request a personalized live walkthrough for your organization with our senior HR ERP consultant.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBookDemoSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
              <Input
                required
                value={demoClientName}
                onChange={(e) => setDemoClientName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Work Email *</Label>
                <Input
                  type="email"
                  required
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  placeholder="rajesh@company.com"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Phone Number</Label>
                <Input
                  value={demoPhone}
                  onChange={(e) => setDemoPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Company Name *</Label>
                <Input
                  required
                  value={demoCompanyName}
                  onChange={(e) => setDemoCompanyName(e.target.value)}
                  placeholder="Enterprise Tech"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Preferred Demo Date</Label>
                <Input
                  type="date"
                  value={demoPreferredDate}
                  onChange={(e) => setDemoPreferredDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Special Requirements / Notes</Label>
              <Textarea
                rows={2}
                value={demoMessage}
                onChange={(e) => setDemoMessage(e.target.value)}
                placeholder="Interested in Biometric Attendance & Payroll integration..."
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsBookDemoModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingDemo}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
              >
                {isSubmittingDemo ? 'Submitting...' : 'Submit Demo Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── LIVE FACE RECOGNITION CAMERA DEMO MODAL ── */}
      <FaceAttendanceModal isOpen={isFaceDemoOpen} onClose={() => setIsFaceDemoOpen(false)} />
    </div>
  );
}

// ── PREMIUM PRICING SECTION COMPONENT ──
function PricingSection({ onBookDemo }: { onBookDemo: () => void }) {
  const [isYearly, setIsYearly] = React.useState(false);
  const [empCount, setEmpCount] = React.useState('50');
  const [showComparison, setShowComparison] = React.useState(false);

  const EMP_COUNTS = ['10', '50', '100', '250', '500+'];

  // Resolve numeric employee count for cost calculation
  const empCountNum = empCount === '500+' ? 500 : parseInt(empCount, 10);

  const monthlyPrices = { starter: 49, pro: 89 };
  const yearlyPrices = {
    starter: Math.round(49 * 0.85),
    pro: Math.round(89 * 0.85),
  };
  const prices = isYearly ? yearlyPrices : monthlyPrices;

  // Estimated total cost per month
  const starterTotal = prices.starter * empCountNum;
  const proTotal = prices.pro * empCountNum;
  const periodLabel = isYearly ? '/year' : '/month';
  const starterDisplay = isYearly
    ? `₹${(starterTotal * 12).toLocaleString('en-IN')}`
    : `₹${starterTotal.toLocaleString('en-IN')}`;
  const proDisplay = isYearly
    ? `₹${(proTotal * 12).toLocaleString('en-IN')}`
    : `₹${proTotal.toLocaleString('en-IN')}`;

  const STARTER_FEATURES = [
    'Employee Master & Profiles',
    'Organization & Department',
    'Basic Attendance Tracking',
    'Leave Management & Approvals',
    'Employee Self Service (ESS)',
    'Basic HR Reports',
    'Document Vault',
  ];

  const PRO_FEATURES = [
    'Everything in Starter',
    'Recruitment & ATS (16-Step)',
    'Public Career Portal',
    'Candidate Management',
    'Assessments & Question Bank',
    'Interview + Microsoft Teams Sync',
    'AI Face Recognition Attendance',
    'GPS Geofencing (100m Radius)',
    'Automated Payroll (PF/ESIC/TDS)',
    'Payslip PDF Generation',
    'Performance & 360° Reviews',
    'Training & LMS Portal',
    'Advanced Analytics Dashboard',
  ];

  const ENT_FEATURES = [
    'Everything in Professional',
    'Multi-Company / Multi-Tenant',
    'Advanced Org Management',
    'Advanced Payroll & Tax Filing',
    'Custom Approval Workflows',
    'Role-Based Access Control',
    'Full Audit Logs & Security',
    'API Integrations & IoT Sync',
    'Custom Reports & Exports',
    'Dedicated Account Manager',
    'Enterprise SLA (99.99% Uptime)',
  ];

  // Feature comparison rows
  const COMPARISON_ROWS: { label: string; starter: boolean | string; pro: boolean | string; ent: boolean | string }[] = [
    { label: 'Employee Master', starter: true, pro: true, ent: true },
    { label: 'Organization & Departments', starter: true, pro: true, ent: true },
    { label: 'Basic Attendance', starter: true, pro: true, ent: true },
    { label: 'Leave Management', starter: true, pro: true, ent: true },
    { label: 'Employee Self Service', starter: true, pro: true, ent: true },
    { label: 'Document Vault', starter: true, pro: true, ent: true },
    { label: 'Basic Reports', starter: true, pro: true, ent: true },
    { label: 'AI Face Recognition Attendance', starter: false, pro: true, ent: true },
    { label: 'GPS Geofencing (100m)', starter: false, pro: true, ent: true },
    { label: 'Recruitment & ATS (16-Step)', starter: false, pro: true, ent: true },
    { label: 'Career Portal', starter: false, pro: true, ent: true },
    { label: 'Assessment & Question Bank', starter: false, pro: true, ent: true },
    { label: 'Interview + Teams Sync', starter: false, pro: true, ent: true },
    { label: 'Automated Payroll', starter: false, pro: true, ent: true },
    { label: 'Payslip PDF Generation', starter: false, pro: true, ent: true },
    { label: 'Performance & 360° Reviews', starter: false, pro: true, ent: true },
    { label: 'Training & LMS', starter: false, pro: true, ent: true },
    { label: 'Advanced Analytics', starter: false, pro: true, ent: true },
    { label: 'Multi-Company / Multi-Tenant', starter: false, pro: false, ent: true },
    { label: 'Custom Approval Workflows', starter: false, pro: false, ent: true },
    { label: 'Role-Based Access Control', starter: false, pro: false, ent: true },
    { label: 'Audit Logs & Security Trail', starter: false, pro: false, ent: true },
    { label: 'API & IoT Integrations', starter: false, pro: false, ent: true },
    { label: 'Custom Reports', starter: false, pro: false, ent: true },
    { label: 'Dedicated Account Manager', starter: false, pro: false, ent: true },
    { label: 'Enterprise SLA (99.99%)', starter: false, pro: false, ent: true },
  ];

  const Cell = ({ value }: { value: boolean | string }) =>
    value === true ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
    ) : value === false ? (
      <span className="text-slate-300 text-lg font-light mx-auto block text-center">—</span>
    ) : (
      <span className="text-[10px] font-bold text-purple-600 mx-auto block text-center">{value}</span>
    );

  return (
    <Card className="border-slate-200 p-6 sm:p-10 bg-white shadow-xl rounded-3xl space-y-8 overflow-hidden relative">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge className="bg-purple-50 text-purple-700 border border-purple-200 font-bold">Transparent Pricing</Badge>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">
          14. Plans That Grow With Your Organization
        </h3>
        <p className="text-sm text-slate-500 max-w-2xl mx-auto">
          Start lean. Scale big. No hidden costs.
        </p>
      </div>

      {/* Billing Toggle & Employee Count Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Billing Toggle */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setIsYearly(false)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isYearly ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setIsYearly(true)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isYearly ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Yearly
            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">Save 15%</span>
          </button>
        </div>

        {/* Employee Count Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Employees:</span>
          <div className="flex items-center gap-1">
            {EMP_COUNTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setEmpCount(c)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                  empCount === c
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Estimated Cost Row */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Estimated Cost for {empCount} employees:</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500">Starter</span>
            <span className="text-sm font-black text-slate-800 font-mono">
              {empCount === '500+' ? 'Contact Sales' : `${starterDisplay}${periodLabel}`}
            </span>
          </div>
          <div className="w-px h-4 bg-slate-300" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-purple-600">Professional ⭐</span>
            <span className="text-sm font-black text-purple-700 font-mono">
              {empCount === '500+' ? 'Contact Sales' : `${proDisplay}${periodLabel}`}
            </span>
          </div>
          <div className="w-px h-4 bg-slate-300" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500">Enterprise</span>
            <span className="text-sm font-black text-slate-700">Custom Quote</span>
          </div>
        </div>
        {isYearly && empCount !== '500+' && (
          <div className="ml-auto">
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-2 py-1 rounded-full">
              You save ₹{Math.round((prices.pro * 0.15) * empCountNum * 12).toLocaleString('en-IN')}/yr on Professional
            </span>
          </div>
        )}
      </div>

      {/* 3-Column Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

        {/* STARTER */}
        <div className="flex flex-col border-2 border-slate-200 rounded-2xl p-6 bg-white space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-slate-900">Starter</h4>
              <Badge variant="secondary" className="text-[10px]">Small Teams</Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900 font-mono">₹{prices.starter}</span>
              <span className="text-xs text-slate-500">/employee/month</span>
            </div>
            {isYearly && (
              <p className="text-[10px] text-emerald-600 font-bold">Billed annually — save 15% vs monthly</p>
            )}
            <p className="text-xs text-slate-500">Core HR to get you running from day one.</p>
          </div>

          <div className="flex-1 space-y-1.5">
            {STARTER_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>

          <Button
            onClick={onBookDemo}
            className="w-full py-5 text-xs font-extrabold rounded-xl cursor-pointer bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          >
            Start Free Trial
          </Button>
        </div>

        {/* PROFESSIONAL — DOMINANT */}
        <div className="flex flex-col relative border-2 border-purple-600 rounded-2xl p-6 bg-gradient-to-b from-purple-50/60 to-white space-y-5 shadow-2xl scale-[1.02]">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-extrabold px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
            ⭐ MOST POPULAR — RECOMMENDED
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-purple-900">Professional</h4>
              <Badge className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px]">Growing Orgs</Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-purple-700 font-mono">₹{prices.pro}</span>
              <span className="text-xs text-slate-500">/employee/month</span>
            </div>
            {isYearly && (
              <p className="text-[10px] text-emerald-600 font-bold">Billed annually — save 15% vs monthly</p>
            )}
            <p className="text-xs text-slate-600">Full ERP with AI Attendance, ATS, Payroll & Analytics.</p>
          </div>

          {/* Key differentiator highlights */}
          <div className="grid grid-cols-2 gap-1.5">
            {['AI Face Scan', 'GPS Geofence', 'Recruitment ATS', 'Career Portal', 'Auto Payroll', 'Assessment Tests', 'Teams Interviews', 'Performance 360°'].map((tag) => (
              <div key={tag} className="px-2 py-1 rounded-lg bg-purple-100/80 text-purple-800 text-[10px] font-bold text-center border border-purple-200">
                {tag}
              </div>
            ))}
          </div>

          <div className="flex-1 space-y-1.5">
            {PRO_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-slate-700">
                <Check className={`h-3.5 w-3.5 shrink-0 ${f === 'Everything in Starter' ? 'text-purple-500' : 'text-emerald-500'}`} />
                <span className={f === 'Everything in Starter' ? 'font-bold text-purple-700' : ''}>{f}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={onBookDemo}
            className="w-full py-5 text-xs font-extrabold rounded-xl cursor-pointer bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          >
            Start Free Trial
          </Button>
        </div>

        {/* ENTERPRISE — LIGHT MODE */}
        <div className="flex flex-col border-2 border-indigo-200 rounded-2xl p-6 bg-white space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-slate-900">Enterprise</h4>
              <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px]">500+ Employees</Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900 font-mono">Custom</span>
              <span className="text-xs text-slate-400">pricing</span>
            </div>
            <p className="text-xs text-slate-500">Tailored for large enterprises with complex requirements.</p>
          </div>

          <div className="flex-1 space-y-1.5">
            {ENT_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-slate-700">
                <Check className={`h-3.5 w-3.5 shrink-0 ${f === 'Everything in Professional' ? 'text-indigo-500' : 'text-emerald-500'}`} />
                <span className={f === 'Everything in Professional' ? 'font-bold text-indigo-700' : ''}>{f}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={onBookDemo}
            className="w-full py-5 text-xs font-extrabold rounded-xl cursor-pointer bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
          >
            Contact Sales
          </Button>
        </div>

      </div>

      {/* Expandable Comparison Table */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowComparison((v) => !v)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Layers className="h-4 w-4 text-purple-600" />
          {showComparison ? 'Hide' : 'Show'} Full Feature Comparison Table
          {showComparison ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showComparison && (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left p-3 font-black text-slate-700 w-1/2">Feature</th>
                  <th className="p-3 font-black text-slate-700 text-center">Starter</th>
                  <th className="p-3 font-black text-purple-700 text-center bg-purple-50">Professional ⭐</th>
                  <th className="p-3 font-black text-slate-700 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={row.label} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="p-3 font-semibold text-slate-700">{row.label}</td>
                    <td className="p-3 text-center"><Cell value={row.starter} /></td>
                    <td className="p-3 text-center bg-purple-50/40"><Cell value={row.pro} /></td>
                    <td className="p-3 text-center"><Cell value={row.ent} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

const FAQ_LIST = [
  {
    question: 'How does the Biometric Face Recognition attendance system prevent photo/video spoofing?',
    answer: 'Our biometric scanner utilizes 128-dimensional facial landmark feature extraction along with real-time liveness verification. It requires micro-expressions (such as eye blinks) and measures Euclidean facial depth vectors, preventing flat photo or video playback spoofing.',
  },
  {
    question: 'Can we run multi-company sub-tenants under a single Super Admin account?',
    answer: 'Yes! The Super Admin governance module includes complete multi-tenant organization switching with data isolation, allowing you to manage parent companies, subsidiaries, cost centers, and branch locations seamlessly.',
  },
  {
    question: 'How does the system calculate automated payroll with attendance data?',
    answer: 'The payroll engine automatically syncs approved attendance records, late marks, half-days, and unpaid leave (LWP). It applies statutory Provident Fund (PF), ESIC, Professional Tax, and Income Tax rules to generate automated payslips and bank payout files.',
  },
  {
    question: 'Can the HR Management ERP integrate with existing IoT biometric hardware?',
    answer: 'Yes. Our platform provides RESTful API endpoints and WebSocket channels for seamless biometric hardware syncing (e.g. fingerprint scanners, RFID gates, and facial hardware terminals).',
  },
];
