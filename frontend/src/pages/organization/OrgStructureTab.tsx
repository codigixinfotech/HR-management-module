import { useState } from 'react';
import {
  Building2,
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  Layers,
  Network,
  Download,
  CheckCircle2,
  MapPin,
  Grid,
  ListTree,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface OrgNode {
  id: string;
  name: string;
  title: string;
  dept: string;
  code: string;
  avatar: string;
  reportsCount: number;
  location: string;
  email: string;
  children?: OrgNode[];
}

const ORG_TREE: OrgNode = {
  id: 'ceo-1',
  name: 'Eleanor Vance',
  title: 'Chief Executive Officer (CEO)',
  dept: 'Executive Office',
  code: 'EMP-001',
  avatar: 'EV',
  reportsCount: 5,
  location: 'New York HQ',
  email: 'eleanor.vance@company.com',
  children: [
    {
      id: 'cto-1',
      name: 'Rajesh Sharma',
      title: 'Chief Technology Officer (CTO)',
      dept: 'Engineering & Technology',
      code: 'EMP-002',
      avatar: 'RS',
      reportsCount: 4,
      location: 'New York HQ',
      email: 'rajesh.sharma@company.com',
      children: [
        {
          id: 'eng-lead-1',
          name: 'Alex Vance',
          title: 'VP of Software Engineering',
          dept: 'Frontend & Backend Product',
          code: 'EMP-012',
          avatar: 'AV',
          reportsCount: 38,
          location: 'New York HQ',
          email: 'alex.vance@company.com',
        },
        {
          id: 'eng-lead-2',
          name: 'Priya Sundaram',
          title: 'Director of Cloud Infrastructure & SRE',
          dept: 'DevOps & Infrastructure',
          code: 'EMP-015',
          avatar: 'PS',
          reportsCount: 22,
          location: 'Pune Tech Hub',
          email: 'priya.sundaram@company.com',
        },
        {
          id: 'eng-lead-3',
          name: 'Marcus Brody',
          title: 'Head of Data Science & AI',
          dept: 'AI Intelligence Lab',
          code: 'EMP-019',
          avatar: 'MB',
          reportsCount: 16,
          location: 'Boston Hub',
          email: 'marcus.brody@company.com',
        },
      ],
    },
    {
      id: 'cpo-1',
      name: 'Admin User',
      title: 'Chief People Officer (CPO)',
      dept: 'Human Capital & HR Ops',
      code: 'EMP-003',
      avatar: 'AU',
      reportsCount: 3,
      location: 'New York HQ',
      email: 'admin@stockpulse.app',
      children: [
        {
          id: 'hr-lead-1',
          name: 'Sarah Jenkins',
          title: 'Head of Global Talent Acquisition',
          dept: 'Recruitment & Sourcing',
          code: 'EMP-022',
          avatar: 'SJ',
          reportsCount: 12,
          location: 'New York HQ',
          email: 'sarah.jenkins@company.com',
        },
        {
          id: 'hr-lead-2',
          name: 'David Miller',
          title: 'Lead Payroll & Statutory Compliance',
          dept: 'Payroll & Compliance',
          code: 'EMP-025',
          avatar: 'DM',
          reportsCount: 8,
          location: 'New York HQ',
          email: 'david.miller@company.com',
        },
      ],
    },
    {
      id: 'cco-1',
      name: 'Priya Verma',
      title: 'Chief Commercial Officer (CCO)',
      dept: 'Global Sales & Marketing',
      code: 'EMP-004',
      avatar: 'PV',
      reportsCount: 2,
      location: 'New York HQ',
      email: 'priya.verma@company.com',
      children: [
        {
          id: 'sales-lead-1',
          name: 'Michael Chang',
          title: 'VP of Global Enterprise Sales',
          dept: 'Enterprise Sales',
          code: 'EMP-031',
          avatar: 'MC',
          reportsCount: 28,
          location: 'Chicago Hub',
          email: 'michael.chang@company.com',
        },
        {
          id: 'mkt-lead-1',
          name: 'Elena Rostova',
          title: 'Director of Growth Marketing',
          dept: 'Marketing & PR',
          code: 'EMP-035',
          avatar: 'ER',
          reportsCount: 14,
          location: 'New York HQ',
          email: 'elena.rostova@company.com',
        },
      ],
    },
    {
      id: 'cfo-1',
      name: 'Amit Patel',
      title: 'Chief Financial Officer (CFO)',
      dept: 'Finance & Treasury',
      code: 'EMP-005',
      avatar: 'AP',
      reportsCount: 2,
      location: 'New York HQ',
      email: 'amit.patel@company.com',
      children: [
        {
          id: 'fin-lead-1',
          name: 'Samantha Reed',
          title: 'Director of FP&A Financial Planning',
          dept: 'FP&A',
          code: 'EMP-040',
          avatar: 'SR',
          reportsCount: 12,
          location: 'New York HQ',
          email: 'samantha.reed@company.com',
        },
      ],
    },
    {
      id: 'coo-1',
      name: 'Vikram Malhotra',
      title: 'VP of Operations & Logistics',
      dept: 'Operations & Facilities',
      code: 'EMP-006',
      avatar: 'VM',
      reportsCount: 1,
      location: 'Pune Plant',
      email: 'vikram.malhotra@company.com',
      children: [
        {
          id: 'ops-lead-1',
          name: 'Karan Joshi',
          title: 'Plant Operations Manager',
          dept: 'Pune Manufacturing Facility',
          code: 'EMP-045',
          avatar: 'KJ',
          reportsCount: 54,
          location: 'Pune Plant',
          email: 'karan.joshi@company.com',
        },
      ],
    },
  ],
};

export function OrgStructureTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'chart' | 'tree'>('chart');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'ceo-1': true,
    'cto-1': true,
    'cpo-1': true,
    'cco-1': true,
    'cfo-1': true,
    'coo-1': true,
  });

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    setExpandedNodes({
      'ceo-1': true,
      'cto-1': true,
      'cpo-1': true,
      'cco-1': true,
      'cfo-1': true,
      'coo-1': true,
    });
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Header Toolbar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold font-mono uppercase">
              Hierarchy Architecture
            </Badge>
            <span className="text-xs text-muted-foreground">4 Leadership Tiers • 248 Headcount</span>
          </div>
          <h2 className=" text-xl font-semibold text-foreground  mt-1">
            Enterprise Organization Structure & Reporting Tree
          </h2>
          <p className="text-xs text-muted-foreground">
            Visual hierarchy of executive leadership, department leads, reporting lines & span of control.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === 'chart'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Grid className="h-3.5 w-3.5" /> Visual Chart
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === 'tree'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <ListTree className="h-3.5 w-3.5" /> Tree List
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={expandAll} className="text-xs h-8">
            <Maximize2 className="h-3.5 w-3.5 mr-1" /> Expand All
          </Button>

          <Button variant="outline" size="sm" onClick={collapseAll} className="text-xs h-8">
            <Minimize2 className="h-3.5 w-3.5 mr-1" /> Collapse All
          </Button>

          <Button size="sm" onClick={() => alert('Exporting Org Structure Chart PDF...')} className="text-xs h-8 gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export PDF
          </Button>
        </div>
      </div>

      {/* ── 2. Top Stats Overview ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Managing Director / CEO</p>
              <p className=" text-lg font-semibold text-foreground mt-0.5">Eleanor Vance</p>
              <p className="text-[10px] text-primary font-semibold">Executive Level L1</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Executive Officers</p>
              <p className=" text-lg font-semibold text-foreground mt-0.5">5 CXO Direct Reports</p>
              <p className="text-[10px] text-emerald-600 font-semibold">100% Filled</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Average Span of Control</p>
              <p className=" text-lg font-semibold text-foreground mt-0.5">1 : 6.8 Ratio</p>
              <p className="text-[10px] text-violet-600 font-semibold">Balanced Hierarchy</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
              <Network className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Managed Staff</p>
              <p className=" text-lg font-semibold text-foreground mt-0.5">248 Headcount</p>
              <p className="text-[10px] text-amber-600 font-semibold">6 Departments</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Visual Org Chart / Tree View Component ── */}
      <Card className="shadow-xs overflow-hidden border-border/80">
        <CardHeader className="bg-muted/20 border-b border-border/60 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" /> Interactive Organizational Diagram
            </CardTitle>
            <div className="w-full sm:w-72">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter manager or title..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-3 text-xs bg-background"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-x-auto custom-scrollbar">
          {/* LEVEL 1: CEO NODE */}
          <div className="flex flex-col items-center">
            <div className="relative flex flex-col items-center rounded-2xl bg-gradient-to-b from-primary/15 to-card border-2 border-primary p-4 shadow-md w-72 transition-all hover:scale-105">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/30 shrink-0">
                  {ORG_TREE.avatar}
                </div>
                <div className="truncate min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm text-foreground truncate">{ORG_TREE.name}</span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  </div>
                  <p className="text-xs font-medium text-primary truncate">{ORG_TREE.title}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {ORG_TREE.location}
                  </p>
                </div>
              </div>
              <div className="mt-3 w-full flex items-center justify-between border-t border-border/60 pt-2 text-[10px]">
                <span className="font-mono font-semibold text-muted-foreground">{ORG_TREE.code}</span>
                <Badge className="bg-primary/20 text-primary border-none text-[9.5px] font-semibold">
                  {ORG_TREE.reportsCount} Direct Reports
                </Badge>
              </div>
            </div>

            {/* Vertical Connecting Line from CEO to Level 2 */}
            <div className="h-8 w-0.5 bg-primary/40" />

            {/* Horizontal Line connecting Level 2 CXO Nodes */}
            <div className="w-[85%] h-0.5 bg-primary/40 relative mb-8">
              {/* Vertical drops for each CXO */}
            </div>

            {/* LEVEL 2: EXECUTIVE CXO GRID */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 w-full">
              {ORG_TREE.children?.map((cxo) => {
                const isExpanded = Boolean(expandedNodes[cxo.id]);
                const hasChildren = cxo.children && cxo.children.length > 0;

                return (
                  <div key={cxo.id} className="flex flex-col items-center space-y-3 relative">
                    {/* Top Connecting Stem */}
                    <div className="absolute -top-8 h-8 w-0.5 bg-primary/40" />

                    {/* CXO Node Card */}
                    <div
                      onClick={() => toggleNode(cxo.id)}
                      className={`
                        w-full rounded-xl border p-3.5 transition-all duration-200 cursor-pointer shadow-xs relative hover:-translate-y-0.5 hover:shadow-md
                        ${isExpanded ? 'border-primary/60 bg-card ring-2 ring-primary/20' : 'border-border bg-card'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-semibold text-xs shrink-0 border border-primary/20">
                          {cxo.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{cxo.name}</p>
                          <p className="text-[10.5px] font-medium text-primary truncate leading-tight">{cxo.title}</p>
                          <p className="text-[9.5px] text-muted-foreground truncate mt-0.5">{cxo.dept}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[10px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {cxo.location.split(' ')[0]}
                        </span>
                        {hasChildren && (
                          <span className="flex items-center gap-0.5 text-primary font-semibold">
                            {cxo.children?.length} Leads {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* LEVEL 3: SUB-LEADS BRANCHES */}
                    {hasChildren && isExpanded && (
                      <div className="w-full space-y-2 pt-2 animate-in fade-in duration-200">
                        {cxo.children?.map((subLead) => (
                          <div
                            key={subLead.id}
                            className="rounded-lg border border-border/80 bg-muted/30 p-2.5 text-left transition-all hover:bg-muted/60"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11.5px] font-semibold text-foreground truncate">{subLead.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{subLead.title}</p>
                              </div>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-[9.5px] text-muted-foreground pt-1 border-t border-border/40">
                              <span>{subLead.dept}</span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">
                                {subLead.reportsCount} Staff
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
