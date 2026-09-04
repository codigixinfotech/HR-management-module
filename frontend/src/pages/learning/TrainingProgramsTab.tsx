import { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Users,
  Calendar,
  Eye,
  Edit,
  Trash2,
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Building2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Bell,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { isHrOrAdminUser } from '@/lib/modules';
import type { TrainingProgram } from './types';
import { CreateProgramForm } from './CreateProgramModal';
import { ProgramDetailView } from './ProgramDetailView';
import { SendNotificationModal, SendEmailModal } from './SendNotificationModal';

import { apiClient } from '@/lib/api-client';
import { lmsApi } from '@/services/lmsApi';

interface TrainingProgramsTabProps {
  onSelectProgram?: (program: TrainingProgram) => void;
}

export function TrainingProgramsTab({ onSelectProgram }: TrainingProgramsTabProps) {
  const user = useAuthStore((s) => s.user);
  const isHrOrAdmin = isHrOrAdminUser(user);

  // Real Backend State
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const data = await lmsApi.getPrograms();
      const mapped: TrainingProgram[] = (data || []).map((p: any) => ({
        ...p,
        title: p.title,
        name: p.title,
        programCode: p.programCode,
        code: p.programCode,
        category: p.category || 'General',
        department: p.department || 'All Departments',
        deliveryMode: p.deliveryMode || 'Online Self-Paced',
        durationHours: p.durationHours || 10,
        description: p.description || '',
        status: p.status || 'PUBLISHED',
        trainerName: p.trainerName || 'Lead Instructor',
        vendorName: p.trainerName || 'Enterprise Academy',
        employeeCount: Array.isArray(p.attendeeIds) ? p.attendeeIds.length : (p.attendeeIds?.length || 0),
        totalBudget: p.budget || 0,
      }));
      setPrograms(mapped);
    } catch (err) {
      console.warn('Failed to load training programs from DB:', err);
      toast.error('Failed to load training programs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Modals for Notifications & Emails
  const [activeNotifProgram, setActiveNotifProgram] = useState<TrainingProgram | null>(null);
  const [activeEmailProgram, setActiveEmailProgram] = useState<TrainingProgram | null>(null);

  // View Mode: Card Grid vs Table View
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showAnalytics, setShowAnalytics] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Stats calculations
  const totalPrograms = programs.length;
  const draftCount = programs.filter((p) => p.status === 'Draft').length;
  const upcomingCount = programs.filter((p) => p.status === 'Upcoming').length;
  const inProgressCount = programs.filter((p) => p.status === 'Active').length;
  const completedCount = programs.filter((p) => p.status === 'Complete').length;

  // Analytics Metrics
  const totalEnrolledEmployees = useMemo(() => {
    return programs.reduce((sum, p) => sum + (p.employeeCount || 0), 0);
  }, [programs]);

  const avgCompletionRate = useMemo(() => {
    if (programs.length === 0) return 0;
    const sum = programs.reduce((acc, p) => acc + (p.progress || 0), 0);
    return Math.round(sum / programs.length);
  }, [programs]);

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    programs.forEach((p) => {
      const cat = p.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [programs]);

  const mandatoryCount = useMemo(() => {
    return programs.filter((p) => p.type === 'Mandatory').length;
  }, [programs]);

  // Filtered Programs list
  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCode = p.code.toLowerCase().includes(q);
        if (!matchesName && !matchesCode) return false;
      }
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (typeFilter !== 'All' && p.type !== typeFilter) return false;
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      return true;
    });
  }, [programs, searchQuery, categoryFilter, typeFilter, statusFilter]);

  // Category Color Accent Helper
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Safety':
        return {
          badge: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400',
          border: 'border-amber-500/30 hover:border-amber-500/60',
          gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
          dot: 'bg-amber-500',
        };
      case 'Leadership':
        return {
          badge: 'bg-purple-500/10 text-purple-600 border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-400',
          border: 'border-purple-500/30 hover:border-purple-500/60',
          gradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
          dot: 'bg-purple-500',
        };
      case 'Technical':
        return {
          badge: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400',
          border: 'border-blue-500/30 hover:border-blue-500/60',
          gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
          dot: 'bg-blue-500',
        };
      case 'Compliance':
        return {
          badge: 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400',
          border: 'border-rose-500/30 hover:border-rose-500/60',
          gradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
          dot: 'bg-rose-500',
        };
      default:
        return {
          badge: 'bg-primary/10 text-primary border-primary/30',
          border: 'border-primary/30 hover:border-primary/60',
          gradient: 'from-primary/10 via-primary/5 to-transparent',
          dot: 'bg-primary',
        };
    }
  };

  // Handler to Save (Create or Update)
  const handleSaveProgram = async (progToSave: TrainingProgram) => {
    const exists = programs.some((p) => p.id === progToSave.id);
    try {
      if (exists) {
        await lmsApi.updateProgram(progToSave.id, {
          title: progToSave.title || progToSave.name,
          category: progToSave.category,
          department: progToSave.department,
          deliveryMode: progToSave.deliveryMode,
          durationHours: progToSave.durationHours,
          trainerName: progToSave.trainerName,
          status: progToSave.status,
          budget: progToSave.totalBudget,
          description: progToSave.description,
        });
        toast.success(`Training Program "${progToSave.title || progToSave.name}" updated successfully.`);
      } else {
        await lmsApi.createProgram({
          title: progToSave.title || progToSave.name,
          programCode: progToSave.programCode,
          category: progToSave.category,
          department: progToSave.department,
          deliveryMode: progToSave.deliveryMode,
          durationHours: progToSave.durationHours,
          trainerName: progToSave.trainerName,
          status: progToSave.status,
          budget: progToSave.totalBudget,
          description: progToSave.description,
        });
        toast.success(`Training Program "${progToSave.title || progToSave.name}" created successfully.`);
      }
      await fetchPrograms();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save training program');
    }

    if (selectedProgram && selectedProgram.id === progToSave.id) {
      setSelectedProgram(progToSave);
    }
    setEditingProgram(null);
  };

  // Handler to Edit
  const handleOpenEdit = (prog: TrainingProgram, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProgram(prog);
    setIsCreateOpen(true);
  };

  // Handler to Delete
  const handleDeleteProgram = async (progId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = programs.find((p) => p.id === progId);
    const confirmName = target ? (target.title || target.name) : 'this program';

    if (window.confirm(`Are you sure you want to delete "${confirmName}"? This action cannot be undone.`)) {
      try {
        await lmsApi.deleteProgram(progId);
        toast.success(`Training Program "${confirmName}" deleted successfully.`);
        if (selectedProgram && selectedProgram.id === progId) {
          setSelectedProgram(null);
        }
        await fetchPrograms();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to delete training program');
      }
    }
  };

  // If creating or editing a program, render CreateProgramForm directly IN-PAGE
  if (isCreateOpen || editingProgram) {
    return (
      <CreateProgramForm
        initialData={editingProgram}
        onBack={() => {
          setIsCreateOpen(false);
          setEditingProgram(null);
        }}
        onSave={handleSaveProgram}
      />
    );
  }

  // If a program is selected, render ProgramDetailView directly IN-PAGE
  if (selectedProgram) {
    return (
      <ProgramDetailView
        program={selectedProgram}
        onBack={() => setSelectedProgram(null)}
        onUpdateProgram={handleSaveProgram}
        onEditProgram={(prog) => {
          setSelectedProgram(null);
          handleOpenEdit(prog);
        }}
        onDeleteProgram={(progId) => {
          handleDeleteProgram(progId);
        }}
        onSendNotification={(prog) => setActiveNotifProgram(prog)}
        onSendEmail={(prog) => setActiveEmailProgram(prog)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Modals for Notifications & Emails */}
      {activeNotifProgram && (
        <SendNotificationModal
          isOpen={!!activeNotifProgram}
          onClose={() => setActiveNotifProgram(null)}
          program={activeNotifProgram}
        />
      )}

      {activeEmailProgram && (
        <SendEmailModal
          isOpen={!!activeEmailProgram}
          onClose={() => setActiveEmailProgram(null)}
          program={activeEmailProgram}
        />
      )}

      {/* Header & Main Page Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Training Programs & LMS Hub
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
              {totalPrograms} Active Programs
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Plan, assign, conduct and measure employee training programs & workforce development
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="gap-1.5 text-xs h-9"
          >
            <BarChart3 className="h-4 w-4 text-primary" />
            <span>{showAnalytics ? 'Hide Analytics' : 'Show Analytics'}</span>
            {showAnalytics ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>

          {isHrOrAdmin && (
            <Button
              onClick={() => {
                setEditingProgram(null);
                setIsCreateOpen(true);
              }}
              className="gap-1.5 text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold"
            >
              <Plus className="h-4 w-4" /> Create Program
            </Button>
          )}
        </div>
      </div>

      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="shadow-2xs border-l-4 border-l-primary bg-card hover:shadow-sm transition-all">
          <CardContent className="p-3.5 text-center space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">Total Programs</span>
            <span className="text-2xl font-extrabold text-foreground">{totalPrograms}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-amber-500 bg-amber-500/5 hover:shadow-sm transition-all">
          <CardContent className="p-3.5 text-center space-y-1">
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wider block">Draft</span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-300">{draftCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-blue-500 bg-blue-500/5 hover:shadow-sm transition-all">
          <CardContent className="p-3.5 text-center space-y-1">
            <span className="text-[11px] text-blue-700 dark:text-blue-400 font-medium uppercase tracking-wider block">Upcoming</span>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-300">{upcomingCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-emerald-500 bg-emerald-500/5 hover:shadow-sm transition-all">
          <CardContent className="p-3.5 text-center space-y-1">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium uppercase tracking-wider block">In Progress</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-300">{inProgressCount}</span>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-l-4 border-l-indigo-500 bg-indigo-500/5 hover:shadow-sm transition-all">
          <CardContent className="p-3.5 text-center space-y-1">
            <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium uppercase tracking-wider block">Completed</span>
            <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-300">{completedCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Analytics & Performance Overview Section */}
      {showAnalytics && (
        <Card className="border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card shadow-sm animate-in fade-in duration-300 overflow-hidden">
          <CardHeader className="py-3 px-5 border-b bg-muted/20 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                Training Analytics & Workforce Performance Insights
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] bg-background font-mono">
              Live Real-Time Data
            </Badge>
          </CardHeader>

          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Avg Completion Progress */}
              <div className="space-y-2 border-r pr-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Workforce Average Completion</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{avgCompletionRate}%</span>
                </div>
                <Progress value={avgCompletionRate} className="h-2.5 bg-muted" />
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" /> Overall completion metric across active programs
                </p>
              </div>

              {/* Enrolled Employees Counter */}
              <div className="space-y-1 border-r pr-4">
                <span className="text-xs font-medium text-muted-foreground block">Workforce Coverage</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-foreground">{totalEnrolledEmployees}</span>
                  <span className="text-xs text-muted-foreground font-medium">Employees Enrolled</span>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3 text-primary" /> Assigned across all active program rosters
                </p>
              </div>

              {/* Mandatory Compliance Alert */}
              <div className="space-y-1 border-r pr-4">
                <span className="text-xs font-medium text-muted-foreground block">Compliance Programs</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-destructive">{mandatoryCount}</span>
                  <span className="text-xs text-muted-foreground font-medium">Mandatory Activities</span>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-destructive" /> Required for annual OSHA & safety audit
                </p>
              </div>

              {/* Category Pill Breakdown */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground block">Category Mix</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {Object.entries(categoryBreakdown).map(([cat, count]) => {
                    const theme = getCategoryTheme(cat);
                    return (
                      <Badge key={cat} variant="outline" className={`text-[10px] px-2 py-0.5 gap-1 ${theme.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                        <span>{cat}: <strong>{count}</strong></span>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Bar & View Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-card rounded-xl border shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search program name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8 bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* Category Dropdown */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="text-xs h-8 w-[130px] bg-background">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              <SelectItem value="Safety">Safety</SelectItem>
              <SelectItem value="Leadership">Leadership</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Compliance">Compliance</SelectItem>
              <SelectItem value="Quality">Quality & Ops</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Dropdown */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="text-xs h-8 w-[130px] bg-background">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Mandatory">Mandatory</SelectItem>
              <SelectItem value="Development">Development</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Compliance">Compliance</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Dropdown */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="text-xs h-8 w-[130px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Complete">Complete</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle: Card Grid vs Table View */}
          <div className="flex items-center rounded-lg border bg-muted/30 p-0.5 ml-1">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-all ${viewMode === 'card'
                  ? 'bg-background text-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
              title="Grid Card View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-all ${viewMode === 'table'
                  ? 'bg-background text-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
              title="Table View"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Card Grid View OR Table View */}
      {viewMode === 'card' ? (
        // ① MODERN CARD GRID VIEW
        <div>
          {filteredPrograms.length === 0 ? (
            <Card className="shadow-2xs">
              <CardContent className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="font-semibold text-foreground">No training programs match search criteria.</p>
                <p>Try adjusting your search query, category, or type filters.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPrograms.map((p) => {
                const theme = getCategoryTheme(p.category);
                return (
                  <Card
                    key={p.id}
                    onClick={() => setSelectedProgram(p)}
                    className={`cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md border overflow-hidden group flex flex-col justify-between ${theme.border}`}
                  >
                    {/* Card Top Header Accent Banner */}
                    <div className={`p-4 bg-gradient-to-r ${theme.gradient} border-b space-y-2.5`}>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-[10px] font-semibold ${theme.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${theme.dot}`} />
                          {p.category}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] font-mono bg-background">
                            {p.code}
                          </Badge>
                          <StatusBadge status={p.status === 'Active' ? 'ACTIVE' : p.status} className="text-[9px] px-2 py-0.5" />
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                          {p.description}
                        </p>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <CardContent className="p-4 space-y-3.5 text-xs flex-grow">
                      {/* Trainer & Delivery Info */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-muted/30 rounded-lg border text-[11px]">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Trainer / Provider:</span>
                          <span className="font-semibold text-foreground line-clamp-1">{p.trainer}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">Delivery Mode:</span>
                          <span className="font-semibold text-foreground">{p.deliveryMode} ({p.location})</span>
                        </div>
                      </div>

                      {/* Schedule & Sessions */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-primary" /> {p.startDate} to {p.endDate}
                        </span>
                        <Badge variant="secondary" className="text-[9px] font-mono">
                          {p.batches?.length || 0} Sessions
                        </Badge>
                      </div>

                      {/* Enrolled Employee Counter */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" /> Enrolled Roster:
                        </span>
                        <span className="font-bold text-foreground font-mono">
                          {p.employeeCount} Employees
                        </span>
                      </div>

                      {/* Completion Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-muted-foreground">Completion Progress</span>
                          <span className="font-bold text-primary">{p.progress}%</span>
                        </div>
                        <Progress value={p.progress} className="h-2 bg-muted" />
                      </div>
                    </CardContent>

                    {/* Card Footer Actions: Details, Edit, Notify, Email, Delete */}
                    <div className="px-3 py-2.5 bg-muted/20 border-t flex flex-wrap items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                      <Badge variant={p.type === 'Mandatory' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {p.type}
                      </Badge>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedProgram(p)}
                          className="h-7 px-2 text-[11px] gap-1 text-primary hover:bg-primary/10 font-semibold"
                        >
                          <Eye className="h-3.5 w-3.5" /> Details
                        </Button>

                        {isHrOrAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleOpenEdit(p, e)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Edit Program"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveNotifProgram(p)}
                              className="h-7 px-2 text-[11px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                              title="Send Portal Notification"
                            >
                              <Bell className="h-3.5 w-3.5" /> Notify
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveEmailProgram(p)}
                              className="h-7 px-2 text-[11px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                              title="Send Email Dispatch"
                            >
                              <Mail className="h-3.5 w-3.5" /> Email
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDeleteProgram(p.id, e)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              title="Delete Program"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // ② CLASSIC TABLE VIEW
        <Card className="shadow-2xs overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-xs font-bold">Program Name</TableHead>
                  <TableHead className="text-xs font-bold">Type</TableHead>
                  <TableHead className="text-xs font-bold">Employees</TableHead>
                  <TableHead className="text-xs font-bold">Schedule</TableHead>
                  <TableHead className="text-xs font-bold">Progress</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrograms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                      No training programs found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrograms.map((p) => (
                    <TableRow
                      key={p.id}
                      onClick={() => setSelectedProgram(p)}
                      className="cursor-pointer hover:bg-muted/40 transition-colors group"
                    >
                      <TableCell className="text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {p.name}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {p.code}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <span>Category: {p.category}</span>
                            <span>•</span>
                            <span>{p.batches?.length || 0} Sessions</span>
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <Badge variant={p.type === 'Mandatory' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {p.type}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs font-mono font-semibold">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" /> {p.employeeCount}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {p.startDate} to {p.endDate}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs w-36">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span>Completion</span>
                            <span className="font-bold">{p.progress}%</span>
                          </div>
                          <Progress value={p.progress} className="h-1.5 bg-muted" />
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <StatusBadge status={p.status === 'Active' ? 'ACTIVE' : p.status} className="text-[10px]" />
                      </TableCell>

                      <TableCell className="text-xs text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProgram(p)}
                            className="h-7 text-xs gap-1 text-primary hover:bg-primary/10"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5" /> Details
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleOpenEdit(p, e)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Edit Program"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveNotifProgram(p)}
                            className="h-7 px-2 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                            title="Send Portal Notification"
                          >
                            <Bell className="h-3 w-3" /> Notify
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveEmailProgram(p)}
                            className="h-7 px-2 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                            title="Send Email Dispatch"
                          >
                            <Mail className="h-3 w-3" /> Email
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDeleteProgram(p.id, e)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete Program"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
