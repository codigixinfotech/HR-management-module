import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '@/api/employees';
import {
  Building2,
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  Layers,
  Network,
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

interface OrgTreeNodeProps {
  node: OrgNode;
  toggleNode: (id: string) => void;
  expandedNodes: Record<string, boolean>;
}

function OrgTreeNode({ node, toggleNode, expandedNodes }: OrgTreeNodeProps) {
  const isExpanded = Boolean(expandedNodes[node.id]);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        onClick={() => toggleNode(node.id)}
        className={`
          w-64 rounded-xl border p-3.5 transition-all duration-200 cursor-pointer shadow-xs relative hover:-translate-y-0.5 hover:shadow-md text-left
          ${isExpanded ? 'border-primary/60 bg-card ring-2 ring-primary/20' : 'border-border bg-card'}
        `}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-semibold text-xs shrink-0 border border-primary/20">
            {node.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{node.name}</p>
            <p className="text-[10.5px] font-medium text-primary truncate leading-tight">{node.title}</p>
            <p className="text-[9.5px] text-muted-foreground truncate mt-0.5">{node.dept}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[10px]">
          <span className="text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {node.location.split(' ')[0]}
          </span>
          {hasChildren && (
            <span className="flex items-center gap-0.5 text-primary font-semibold">
              {node.reportsCount} Reports {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </span>
          )}
        </div>
      </div>

      {/* Children connector lines and children cards */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical connection stem leaving parent */}
          <div className="h-6 w-0.5 bg-primary/40" />

          {/* Children container with horizontal connectors */}
          <div className="flex flex-row gap-6 items-start relative">
            {node.children?.map((child, index) => {
              const isFirst = index === 0;
              const isLast = index === (node.children?.length ?? 0) - 1;

              return (
                <div key={child.id} className="relative flex flex-col items-center">
                  {/* Horizontal line segment */}
                  {node.children && node.children.length > 1 && (
                    <div 
                      className="absolute top-0 h-0.5 bg-primary/40" 
                      style={{
                        left: isFirst ? '50%' : '0',
                        right: isLast ? '50%' : '0',
                      }}
                    />
                  )}
                  {/* Top connector stem for child */}
                  <div className="h-6 w-0.5 bg-primary/40" />
                  
                  <OrgTreeNode
                    node={child}
                    toggleNode={toggleNode}
                    expandedNodes={expandedNodes}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface OrgStructureTabProps {
  companyId?: string;
}

import { useCompany } from '@/context/CompanyContext';

export function OrgStructureTab({ companyId: propCompanyId }: OrgStructureTabProps) {
  const { activeCompanyId: ctxCompanyId } = useCompany();
  const companyId = propCompanyId || ctxCompanyId;
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'chart' | 'tree'>('chart');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, companyId || ''],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 1000, companyId: companyId || undefined }),
  });

  // Calculate dynamic stats
  const totalEmployeesCount = employeesData?.items?.length ?? 0;
  const managersCount = useMemo(() => {
    if (!employeesData?.items) return 0;
    return new Set(employeesData.items.map((e: any) => e.reportingManagerId).filter(Boolean)).size;
  }, [employeesData]);

  const spanRatio = useMemo(() => {
    if (totalEmployeesCount === 0 || managersCount === 0) return '1:1';
    return `1:${(totalEmployeesCount / managersCount).toFixed(1)}`;
  }, [totalEmployeesCount, managersCount]);

  const activeTree = useMemo<OrgNode | null>(() => {
    if (!employeesData?.items || employeesData.items.length === 0) return null;

    let items = employeesData.items;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (emp: any) =>
          emp.firstName?.toLowerCase().includes(q) ||
          emp.lastName?.toLowerCase().includes(q) ||
          emp.designation?.title?.toLowerCase().includes(q) ||
          emp.department?.name?.toLowerCase().includes(q) ||
          emp.employeeCode?.toLowerCase().includes(q)
      );
    }

    if (items.length === 0) return null;

    const employeeIds = new Set(items.map((emp: any) => emp.id));

    // Map managerId -> list of direct reports
    const managerToChildren: Record<string, any[]> = {};
    items.forEach((emp: any) => {
      const mgrId = emp.reportingManagerId && employeeIds.has(emp.reportingManagerId)
        ? emp.reportingManagerId
        : '__ROOT_LEVEL__';
      if (!managerToChildren[mgrId]) {
        managerToChildren[mgrId] = [];
      }
      managerToChildren[mgrId].push(emp);
    });

    // Find root candidates (no reportingManagerId or manager not in list)
    const rootCandidates = items.filter(
      (emp: any) => !emp.reportingManagerId || !employeeIds.has(emp.reportingManagerId)
    );

    // Identify primary executive leader (CEO / MD / Founder / Chief Officer / Top Manager)
    let primaryRoot = rootCandidates.find((emp: any) => {
      const title = (emp.designation?.title || '').toLowerCase();
      return (
        title.includes('ceo') ||
        title.includes('chief executive') ||
        title.includes('managing director') ||
        title.includes('founder') ||
        title.includes('president')
      );
    });

    if (!primaryRoot) {
      let maxReports = -1;
      rootCandidates.forEach((emp: any) => {
        const cnt = managerToChildren[emp.id]?.length || 0;
        if (cnt > maxReports) {
          maxReports = cnt;
          primaryRoot = emp;
        }
      });
    }

    if (!primaryRoot) {
      primaryRoot = items[0];
    }

    const secondaryRoots = rootCandidates.filter((emp: any) => emp.id !== primaryRoot!.id);

    // Recursive node builder
    const buildNode = (emp: any): OrgNode => {
      let directReports = managerToChildren[emp.id] || [];
      if (emp.id === primaryRoot!.id) {
        directReports = [...directReports, ...secondaryRoots];
      }

      const childNodes = directReports.map(buildNode);

      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        title: emp.designation?.title ?? 'Associate',
        dept: emp.department?.name ?? 'General Corporate',
        code: emp.employeeCode,
        avatar: `${emp.firstName[0] || 'E'}${emp.lastName[0] || 'E'}`.toUpperCase(),
        reportsCount: childNodes.length,
        location: emp.location ?? 'Head Office',
        email: emp.workEmail ?? '',
        children: childNodes.length > 0 ? childNodes : undefined,
      };
    };

    return buildNode(primaryRoot);
  }, [employeesData, searchQuery]);

  // Auto-expand top levels on initial load
  useEffect(() => {
    if (activeTree) {
      const expanded: Record<string, boolean> = {};
      const traverse = (node: OrgNode, depth = 0) => {
        if (depth < 3) {
          expanded[node.id] = true;
        }
        node.children?.forEach((child) => traverse(child, depth + 1));
      };
      traverse(activeTree);
      setExpandedNodes(expanded);
    }
  }, [activeTree]);

  // Expand all children recursively
  const expandAll = () => {
    if (!activeTree) return;
    const expanded: Record<string, boolean> = {};
    const traverse = (node: OrgNode) => {
      expanded[node.id] = true;
      node.children?.forEach(traverse);
    };
    traverse(activeTree);
    setExpandedNodes(expanded);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Build a simple flat list for tree list view
  const renderTreeList = (node: OrgNode, depth = 0) => {
    const isExpanded = Boolean(expandedNodes[node.id]);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="space-y-1">
        <div
          style={{ paddingLeft: `${depth * 24}px` }}
          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button onClick={() => toggleNode(node.id)} className="text-muted-foreground hover:text-foreground">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span className="w-4" />
            )}
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-xs shrink-0">
              {node.avatar}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                {node.name} <span className="font-mono text-[9px] text-muted-foreground">({node.code})</span>
              </p>
              <p className="text-[10px] text-muted-foreground">{node.title} &middot; {node.dept}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {node.location}</span>
            <Badge variant="outline" className="text-[9px] py-0 px-1.5">
              {node.reportsCount} Direct Reports
            </Badge>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children?.map(child => renderTreeList(child, depth + 1))}
          </div>
        )}
      </div>
    );
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
            <span className="text-xs text-muted-foreground">Dynamic Database Flow</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mt-1">
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
        </div>
      </div>

      {/* ── 2. Top Stats Overview ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Managing Director / CEO</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{activeTree?.name ?? 'Not Assigned'}</p>
              <p className="text-[10px] text-primary font-semibold truncate max-w-[150px]">{activeTree?.title ?? '-'}</p>
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
              <p className="text-sm font-semibold text-foreground mt-0.5">{(activeTree?.children?.length ?? 0)} Direct Reports</p>
              <p className="text-[10px] text-emerald-600 font-semibold">100% Dynamic</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Span of Control</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{spanRatio} Ratio</p>
              <p className="text-[10px] text-violet-600 font-semibold">Managers: {managersCount}</p>
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
              <p className="text-sm font-semibold text-foreground mt-0.5">{totalEmployeesCount} Headcount</p>
              <p className="text-[10px] text-amber-600 font-semibold">Real-time DB sync</p>
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
          {!activeTree ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground space-y-3">
              <Network className="h-10 w-10 text-muted-foreground/50 animate-pulse" />
              <div>
                <p className="font-semibold text-foreground">No Organization Hierarchy Found</p>
                <p className="mt-1">Add employees with reporting managers to generate this chart dynamically.</p>
              </div>
            </div>
          ) : viewMode === 'tree' ? (
            <div className="space-y-2 border rounded-xl p-4 bg-muted/10 max-w-4xl mx-auto">
              {renderTreeList(activeTree)}
            </div>
          ) : (
            <div className="flex flex-col items-center p-4 min-w-max">
              <OrgTreeNode
                node={activeTree}
                toggleNode={toggleNode}
                expandedNodes={expandedNodes}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
