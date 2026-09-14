import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeesApi } from '@/api/employees';
import { companiesApi, branchesApi, departmentsApi } from '@/api/organization';
import type { Company, Branch, Department, Employee } from '@/api/types';
import {
  Building2,
  GitFork,
  Network,
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  MapPin,
  Grid,
  ListTree,
  Maximize2,
  Minimize2,
  Filter,
  RotateCcw,
  Briefcase,
  Crown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompany } from '@/context/CompanyContext';
import { useAuthStore } from '@/stores/auth-store';
import { isSuperAdminUser, isBranchAdminUser } from '@/lib/modules';

export interface UnifiedOrgNode {
  id: string;
  type: 'enterprise' | 'company' | 'founder' | 'branch' | 'employee';
  name: string;
  subtitle: string;
  metaBadge?: string;
  code?: string;
  dept?: string;
  avatar?: string;
  location?: string;
  headcount?: number;
  reportsCount?: number;
  children?: UnifiedOrgNode[];
}

interface OrgTreeNodeProps {
  node: UnifiedOrgNode;
  toggleNode: (id: string) => void;
  collapsedNodes: Record<string, boolean>;
}

function OrgTreeNode({ node, toggleNode, collapsedNodes }: OrgTreeNodeProps) {
  const isExpanded = !collapsedNodes[node.id];
  const hasChildren = Boolean(node.children && node.children.length > 0);

  // Render card based on node type
  const renderCardContent = () => {
    // 1. Company Node (Top Level: Company – Legal Entity)
    if (node.type === 'company') {
      return (
        <div
          onClick={() => toggleNode(node.id)}
          className={`
            w-76 sm:w-80 rounded-xl p-3.5 sm:p-4 transition-all duration-200 cursor-pointer shadow-md relative hover:-translate-y-0.5 hover:shadow-lg text-center
            bg-[#4F46E5] text-white border border-[#4338CA]
            ${isExpanded ? 'ring-2 ring-primary/40 shadow-lg' : ''}
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-200" />
            <p className="text-xs sm:text-sm font-bold tracking-wider uppercase text-white truncate">
              {node.name}
            </p>
          </div>
          <p className="text-[11px] text-indigo-100 font-medium mt-0.5">Company</p>
          <p className="text-[10px] text-indigo-200 font-normal">Legal Entity</p>
        </div>
      );
    }

    // 2. Founder / Managing Director Node (Founder – Prashant Patil)
    if (node.type === 'founder') {
      return (
        <div
          onClick={() => toggleNode(node.id)}
          className={`
            w-68 sm:w-72 rounded-xl border-2 p-3.5 sm:p-4 transition-all duration-200 cursor-pointer shadow-xs relative hover:-translate-y-0.5 hover:shadow-md text-center
            bg-[#EEF2FF] dark:bg-indigo-950/30 border-[#6366F1]
            ${isExpanded ? 'shadow-md ring-2 ring-indigo-500/30' : ''}
          `}
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Crown className="h-3.5 w-3.5 text-[#4338CA] dark:text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4338CA] dark:text-indigo-400">
              Corporate Head
            </span>
          </div>
          <p className="text-sm sm:text-base font-bold text-[#111827] dark:text-foreground truncate">
            {node.name}
          </p>
          <p className="text-xs font-semibold text-[#4338CA] dark:text-indigo-300 mt-0.5 truncate">
            {node.subtitle}
          </p>
          <div className="mt-2 pt-1.5 border-t border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between text-[10px] text-muted-foreground px-1">
            <span>Corporate HQ</span>
            {hasChildren && (
              <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                {node.children?.length} {node.children?.length === 1 ? 'Branch' : 'Branches'} {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </span>
            )}
          </div>
        </div>
      );
    }

    // 3. Branch Node (Branch A / Branch B – Branch Admin → Employees & Departments)
    if (node.type === 'branch') {
      return (
        <div
          onClick={() => toggleNode(node.id)}
          className={`
            w-60 sm:w-64 rounded-xl border-2 p-3.5 transition-all duration-200 cursor-pointer shadow-xs relative hover:-translate-y-0.5 hover:shadow-md text-left
            bg-white dark:bg-card border-[#6366F1]
            ${isExpanded ? 'ring-2 ring-indigo-500/20 shadow-sm' : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-bold text-[#111827] dark:text-foreground truncate">
              {node.name}
            </p>
            <Badge variant="outline" className="text-[9px] font-mono border-indigo-400/40 text-indigo-600 dark:text-indigo-400">
              {node.code || 'Branch'}
            </Badge>
          </div>
          <p className="text-[10px] text-[#6B7280] dark:text-muted-foreground mt-0.5">{node.subtitle || 'Branch'}</p>

          <div className="mt-2.5 pt-2 border-t border-indigo-100 dark:border-border/60">
            <p className="text-[11px] font-semibold text-[#4338CA] dark:text-indigo-400">
              Branch Admin
            </p>
            <div className="flex items-center justify-between mt-0.5 text-[10px] text-[#6B7280] dark:text-muted-foreground">
              <span>Employees &amp; Departments</span>
              <span className="font-semibold text-foreground">{node.headcount ?? node.children?.length ?? 0} Staff</span>
            </div>
          </div>
        </div>
      );
    }

    // 4. Employee Node (Direct Reports under Branch)
    return (
      <div
        onClick={() => toggleNode(node.id)}
        className={`
          w-60 sm:w-64 rounded-xl border p-3.5 transition-all duration-200 cursor-pointer shadow-xs relative hover:-translate-y-0.5 hover:shadow-md text-left
          bg-card border-border/80
          ${isExpanded ? 'border-primary/60 ring-2 ring-primary/20 shadow-xs' : ''}
        `}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary font-semibold text-xs shrink-0 border border-primary/20">
            {node.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{node.name}</p>
            <p className="text-[10px] font-medium text-primary truncate leading-tight mt-0.5">{node.subtitle}</p>
            <p className="text-[9px] text-muted-foreground truncate mt-0.5">{node.dept}</p>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-[10px]">
          <span className="text-muted-foreground flex items-center gap-1 truncate max-w-[120px]">
            <MapPin className="h-3 w-3 shrink-0" /> {node.location}
          </span>
          {hasChildren && (
            <span className="flex items-center gap-0.5 text-primary font-semibold shrink-0">
              {node.reportsCount} Reports {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      {renderCardContent()}

      {/* Children connector lines and children cards */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical stem leaving parent */}
          <div className="h-6 w-0.5 bg-[#6366F1]/50" />

          {/* Children container with horizontal crossbar */}
          <div className="flex flex-row gap-6 sm:gap-8 items-start relative">
            {node.children?.map((child, index) => {
              const isFirst = index === 0;
              const isLast = index === (node.children?.length ?? 0) - 1;

              return (
                <div key={child.id} className="relative flex flex-col items-center">
                  {/* Horizontal line segment */}
                  {node.children && node.children.length > 1 && (
                    <div
                      className="absolute top-0 h-0.5 bg-[#6366F1]/50"
                      style={{
                        left: isFirst ? '50%' : '0',
                        right: isLast ? '50%' : '0',
                      }}
                    />
                  )}
                  {/* Top connector stem for child */}
                  <div className="h-6 w-0.5 bg-[#6366F1]/50" />

                  <OrgTreeNode
                    node={child}
                    toggleNode={toggleNode}
                    collapsedNodes={collapsedNodes}
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

export function OrgStructureTab({ companyId: propCompanyId }: OrgStructureTabProps) {
  const { activeCompanyId: ctxCompanyId } = useCompany();
  const effectivePropCompanyId = propCompanyId || ctxCompanyId;

  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = isSuperAdminUser(user);
  const isBranchAdmin = isBranchAdminUser(user);
  const assignedBranchId = user?.branchId || user?.employee?.branchId;
  const userCompanyId = user?.companyId;

  // ── Cascaded Scope Filter States ──
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(() => {
    if (isSuperAdmin) return 'ALL';
    return userCompanyId || 'ALL';
  });

  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    if (isBranchAdmin && assignedBranchId) return assignedBranchId;
    return 'ALL';
  });

  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'chart' | 'tree'>('chart');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Lock branch for Branch Admin
  useEffect(() => {
    if (isBranchAdmin && assignedBranchId && assignedBranchId !== selectedBranchId) {
      setSelectedBranchId(assignedBranchId);
    }
  }, [isBranchAdmin, assignedBranchId, selectedBranchId]);

  // ── Queries ──
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => companiesApi.list(),
  });

  // Validated scopes: never empty or broken
  const validCompanyId = useMemo(() => {
    if (isSuperAdmin) {
      if (!selectedCompanyId || selectedCompanyId === 'ALL') return 'ALL';
      return companies.some((c) => c.id === selectedCompanyId) ? selectedCompanyId : 'ALL';
    }
    if (userCompanyId) return userCompanyId;
    if (selectedCompanyId && selectedCompanyId !== 'ALL' && companies.some((c) => c.id === selectedCompanyId)) {
      return selectedCompanyId;
    }
    return companies[0]?.id || 'ALL';
  }, [isSuperAdmin, selectedCompanyId, companies, userCompanyId]);

  const validBranchId = useMemo(() => {
    if (isBranchAdmin && assignedBranchId) return assignedBranchId;
    if (!selectedBranchId || selectedBranchId === 'ALL') return 'ALL';
    return selectedBranchId;
  }, [isBranchAdmin, assignedBranchId, selectedBranchId]);

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['branches', validCompanyId],
    queryFn: () => branchesApi.list(validCompanyId !== 'ALL' ? validCompanyId : undefined),
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments', validCompanyId, validBranchId],
    queryFn: () =>
      departmentsApi.list(
        validCompanyId !== 'ALL' ? validCompanyId : undefined,
        validBranchId !== 'ALL' && validBranchId !== 'HEAD_OFFICE' ? validBranchId : undefined,
      ),
  });

  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees', 'org-structure-complete', validCompanyId, validBranchId, selectedDeptId],
    queryFn: () =>
      employeesApi.list({
        page: 1,
        pageSize: 1000,
        companyId: validCompanyId !== 'ALL' ? validCompanyId : undefined,
        branchId:
          validBranchId !== 'ALL' && validBranchId !== 'HEAD_OFFICE'
            ? validBranchId
            : undefined,
      }),
  });

  // Filter branches for dropdown
  const availableBranches = useMemo(() => {
    if (validCompanyId === 'ALL') return branches;
    return branches.filter((b) => !b.companyId || b.companyId === validCompanyId);
  }, [branches, validCompanyId]);

  // Filter departments for dropdown
  const availableDepartments = useMemo(() => {
    let list = departments;
    if (validCompanyId !== 'ALL') {
      list = list.filter((d) => d.companyId === validCompanyId);
    }
    if (validBranchId !== 'ALL' && validBranchId !== 'HEAD_OFFICE') {
      list = list.filter((d) => !d.branchId || d.branchId === validBranchId);
    }
    return list;
  }, [departments, validCompanyId, validBranchId]);

  // Filter employees based on active dropdowns & search
  const filteredEmployees = useMemo(() => {
    if (!employeesData?.items) return [];
    let items: Employee[] = [...employeesData.items];

    if (validCompanyId !== 'ALL') {
      items = items.filter((emp) => emp.companyId === validCompanyId);
    }

    if (isBranchAdmin && assignedBranchId) {
      items = items.filter((emp) => emp.branchId === assignedBranchId);
    } else {
      if (validBranchId === 'HEAD_OFFICE') {
        items = items.filter((emp) => !emp.branchId);
      } else if (validBranchId !== 'ALL') {
        items = items.filter((emp) => emp.branchId === validBranchId);
      }
    }

    if (selectedDeptId !== 'ALL') {
      items = items.filter((emp) => emp.departmentId === selectedDeptId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (emp) =>
          emp.firstName?.toLowerCase().includes(q) ||
          emp.lastName?.toLowerCase().includes(q) ||
          emp.employeeCode?.toLowerCase().includes(q) ||
          emp.designation?.title?.toLowerCase().includes(q) ||
          emp.department?.name?.toLowerCase().includes(q) ||
          emp.branch?.name?.toLowerCase().includes(q) ||
          emp.company?.name?.toLowerCase().includes(q),
      );
    }

    return items;
  }, [employeesData, validCompanyId, isBranchAdmin, assignedBranchId, validBranchId, selectedDeptId, searchQuery]);

  // ── Build Employee Tree Nodes (Manager → Direct Reports) ──
  const buildEmployeeTreeNodes = (employees: Employee[]): UnifiedOrgNode[] => {
    if (!employees || employees.length === 0) return [];
    const empIds = new Set(employees.map((e) => e.id));

    const managerToReports = new Map<string, Employee[]>();
    employees.forEach((emp) => {
      if (emp.reportingManagerId && empIds.has(emp.reportingManagerId)) {
        const list = managerToReports.get(emp.reportingManagerId) || [];
        list.push(emp);
        managerToReports.set(emp.reportingManagerId, list);
      }
    });

    const rootEmployees = employees.filter(
      (emp) => !emp.reportingManagerId || !empIds.has(emp.reportingManagerId),
    );

    const toNode = (emp: Employee): UnifiedOrgNode => {
      const directReports = managerToReports.get(emp.id) || [];
      const childNodes = directReports.map(toNode);

      const cleanFirst = (emp.firstName || '').replace(/^(mr\.|mrs\.|ms\.|dr\.)\s*/i, '');
      const firstInitial = cleanFirst[0] || emp.firstName?.[0] || 'E';
      const lastInitial = emp.lastName?.[0] || '';

      const actualTitle =
        emp.designation?.title ||
        (emp as any).designationTitle ||
        'Staff Member';

      const actualDept = emp.department?.name || 'General Operations';
      const actualLocation = emp.branch?.name || (emp.branchId ? 'Branch Facility' : 'Corporate / Head Office');

      return {
        id: `emp-${emp.id}`,
        type: 'employee',
        name: `${emp.firstName || ''} ${emp.lastName || ''}`.replace(/\s+/g, ' ').trim(),
        subtitle: actualTitle,
        dept: actualDept,
        code: emp.employeeCode,
        avatar: `${firstInitial}${lastInitial}`.toUpperCase(),
        reportsCount: childNodes.length,
        location: actualLocation,
        children: childNodes.length > 0 ? childNodes : undefined,
      };
    };

    return rootEmployees.map(toNode);
  };

  // ── Build Unified Hierarchy: Company → Founder → Branch A & Branch B ──
  // Workflow:
  // 1. Company – Cravita Technology Pvt Ltd
  // 2. Founder – Prashant Patil (Managing Director)
  // 3. Branch A – Branch Admin → Departments → Employees
  // 4. Branch B – Branch Admin → Departments → Employees
  const unifiedHierarchyTrees = useMemo<UnifiedOrgNode[]>(() => {
    if (filteredEmployees.length === 0) return [];

    // Group employees by companyId
    const companyMap = new Map<string, { companyName: string; companyCode: string; emps: Employee[] }>();

    filteredEmployees.forEach((emp) => {
      const cId = emp.companyId || 'DEFAULT_COMPANY';
      const cName = emp.company?.name || 'Cravita Technology Pvt Ltd';
      const cCode = (emp.company as any)?.code || '';
      if (!companyMap.has(cId)) {
        companyMap.set(cId, { companyName: cName, companyCode: cCode, emps: [] });
      }
      companyMap.get(cId)!.emps.push(emp);
    });

    const companyNodes: UnifiedOrgNode[] = [];

    companyMap.forEach((cData, cId) => {
      // 1. Separate Corporate Head / Founder vs Branch Employees
      const corporateEmps = cData.emps.filter((e) => !e.branchId);
      const branchEmps = cData.emps.filter((e) => Boolean(e.branchId));

      // Find Founder / Managing Director (e.g. prashant patil or first corporate emp)
      let founderEmp = corporateEmps.find((e) => {
        const name = `${e.firstName} ${e.lastName}`.toLowerCase();
        const title = (e.designation?.title || '').toLowerCase();
        return (
          name.includes('patil') ||
          name.includes('prashant') ||
          title.includes('director') ||
          title.includes('founder') ||
          title.includes('md') ||
          title.includes('ceo')
        );
      }) || corporateEmps[0];

      // 2. Group branch employees by branch
      const branchMap = new Map<string, { name: string; code: string; emps: Employee[] }>();
      branchEmps.forEach((emp) => {
        const bKey = emp.branchId!;
        const bName = emp.branch?.name || 'Branch Facility';
        const bCode = (emp.branch as any)?.code || 'BR';
        if (!branchMap.has(bKey)) {
          branchMap.set(bKey, { name: bName, code: bCode, emps: [] });
        }
        branchMap.get(bKey)!.emps.push(emp);
      });

      // When viewing ALL branches, also ensure registered branches of this company are visible
      if (validBranchId === 'ALL') {
        availableBranches.forEach((b) => {
          if ((!b.companyId || b.companyId === cId) && !branchMap.has(b.id)) {
            branchMap.set(b.id, { name: b.name, code: b.code || 'BR', emps: [] });
          }
        });
      }

      // Build branch nodes
      const branchNodes: UnifiedOrgNode[] = [];
      branchMap.forEach((bData, bKey) => {
        const empTrees = buildEmployeeTreeNodes(bData.emps);
        branchNodes.push({
          id: `branch-${cId}-${bKey}`,
          type: 'branch',
          name: bData.name,
          subtitle: `Branch ${bData.code}`,
          code: bData.code,
          metaBadge: 'Branch Admin',
          headcount: bData.emps.length,
          children: empTrees.length > 0 ? empTrees : undefined,
        });
      });

      // Sort branches alphabetically
      branchNodes.sort((a, b) => a.name.localeCompare(b.name));

      // 3. Connect Founder & Managing Director
      let companyChildren: UnifiedOrgNode[] = [];

      if (founderEmp) {
        const cleanFirst = (founderEmp.firstName || '').replace(/^(mr\.|mrs\.|ms\.|dr\.)\s*/i, '');
        const firstInitial = cleanFirst[0] || founderEmp.firstName?.[0] || 'P';
        const lastInitial = founderEmp.lastName?.[0] || '';
        const formattedName = `${founderEmp.firstName} ${founderEmp.lastName}`
          .trim()
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');

        const founderNode: UnifiedOrgNode = {
          id: `founder-${founderEmp.id}`,
          type: 'founder',
          name: formattedName,
          subtitle: 'Founder & Managing Director',
          dept: 'Corporate Head',
          code: founderEmp.employeeCode,
          avatar: `${firstInitial}${lastInitial}`.toUpperCase(),
          location: 'Corporate Head Office',
          children: branchNodes.length > 0 ? branchNodes : undefined,
        };

        companyChildren = [founderNode];
      } else {
        // Fallback: If no founder employee created yet, branches sit directly under company
        companyChildren = branchNodes;
      }

      // 4. Company Top-Level Node
      companyNodes.push({
        id: `comp-${cId}`,
        type: 'company',
        name: cData.companyName.replace(/Craviita/gi, 'Cravita'),
        subtitle: 'Company',
        code: cData.companyCode,
        headcount: cData.emps.length,
        children: companyChildren,
      });
    });

    return companyNodes;
  }, [filteredEmployees, availableBranches, validBranchId]);

  const expandAll = () => {
    setCollapsedNodes({});
  };

  const collapseAll = () => {
    const collapsed: Record<string, boolean> = {};
    const traverse = (node: UnifiedOrgNode) => {
      collapsed[node.id] = true;
      node.children?.forEach(traverse);
    };
    unifiedHierarchyTrees.forEach((root) => traverse(root));
    setCollapsedNodes(collapsed);
  };

  const toggleNode = (id: string) => {
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Stats Overview ──
  const totalHeadcount = filteredEmployees.length;
  const managersCount = useMemo(() => {
    return new Set(filteredEmployees.map((e) => e.reportingManagerId).filter(Boolean)).size;
  }, [filteredEmployees]);

  const totalBranchesCount = useMemo(() => {
    return new Set(filteredEmployees.map((e) => e.branchId || 'HEAD_OFFICE')).size;
  }, [filteredEmployees]);

  const resetFilters = () => {
    if (isSuperAdmin) {
      setSelectedCompanyId('ALL');
    }
    if (!isBranchAdmin) {
      setSelectedBranchId('ALL');
    }
    setSelectedDeptId('ALL');
    setSearchQuery('');
  };

  const hasActiveFilters =
    (isSuperAdmin && selectedCompanyId !== 'ALL') ||
    (!isBranchAdmin && selectedBranchId !== 'ALL') ||
    selectedDeptId !== 'ALL' ||
    Boolean(searchQuery.trim());

  // ── Render Indented Tree List (Company → Founder → Branch → Employees) ──
  const renderTreeListItem = (node: UnifiedOrgNode, depth = 0) => {
    const isExpanded = !collapsedNodes[node.id];
    const hasChildren = Boolean(node.children && node.children.length > 0);

    const getNodeIcon = () => {
      if (node.type === 'company') return <Building2 className="h-4 w-4 text-primary" />;
      if (node.type === 'founder') return <Crown className="h-4 w-4 text-amber-500" />;
      if (node.type === 'branch') return <GitFork className="h-3.5 w-3.5 text-primary" />;
      return <Briefcase className="h-3 w-3 text-muted-foreground" />;
    };

    return (
      <div key={node.id} className="space-y-1">
        <div
          style={{ paddingLeft: `${depth * 22 + 8}px` }}
          className={`flex items-center justify-between py-2 px-2.5 rounded-lg transition-colors border ${
            node.type === 'company'
              ? 'bg-primary/10 font-bold border-primary/30 text-foreground'
              : node.type === 'founder'
              ? 'bg-amber-500/10 font-semibold border-amber-500/30 text-foreground'
              : node.type === 'branch'
              ? 'bg-muted/30 border-border/60 font-semibold'
              : 'border-transparent hover:border-border/40 hover:bg-muted/20'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
              >
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="w-3.5 shrink-0" />
            )}

            <div className="shrink-0">{getNodeIcon()}</div>

            <div className="min-w-0">
              <p className="text-xs text-foreground flex items-center gap-1.5 truncate">
                <span className={node.type === 'company' || node.type === 'founder' ? 'font-bold' : node.type === 'branch' ? 'font-semibold' : 'font-medium'}>
                  {node.name}
                </span>
                {node.code && (
                  <span className="font-mono text-[9.5px] text-muted-foreground">({node.code})</span>
                )}
              </p>
              {node.subtitle && (
                <p className="text-[10px] text-muted-foreground truncate">
                  <span className={node.type === 'founder' ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-primary font-medium'}>
                    {node.subtitle}
                  </span>
                  {node.dept ? ` · ${node.dept}` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-[10px] text-muted-foreground">
            {node.type === 'company' && (
              <Badge variant="secondary" className="text-[10px]">
                {node.headcount} Total Staff
              </Badge>
            )}
            {node.type === 'founder' && (
              <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                Corporate Head
              </Badge>
            )}
            {node.type === 'branch' && (
              <Badge variant="outline" className="text-[9.5px]">
                {node.headcount} Staff
              </Badge>
            )}
            {node.type === 'employee' && node.reportsCount ? (
              <Badge variant="outline" className="text-[9px] bg-primary/5 text-primary border-primary/20">
                {node.reportsCount} Reports
              </Badge>
            ) : null}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children?.map((child) => renderTreeListItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Top Header Toolbar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold font-mono uppercase">
              Corporate Hierarchy
            </Badge>
            <span className="text-xs text-muted-foreground">Company &rarr; Founder &rarr; Branch Architecture</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mt-1">
            Organization Structure & Reporting
          </h2>
          <p className="text-xs text-muted-foreground">
            Complete executive hierarchy: Company &rarr; Founder &amp; Managing Director &rarr; Regional Branches &rarr; Branch Staff.
          </p>
        </div>

        {/* View Mode Switcher & Expand/Collapse */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'chart'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid className="h-3.5 w-3.5" /> Visual Chart
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'tree'
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

      {/* ── 2. Cascaded Scope Filters (Company → Branch → Department) ── */}
      <Card className="shadow-xs border-border/80 bg-card/60">
        <CardContent className="p-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground shrink-0">
              <Filter className="h-4 w-4 text-primary" /> Hierarchy Filters:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 max-w-4xl">
              {/* 1. Company Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Company</label>
                <Select
                  value={selectedCompanyId}
                  onValueChange={(val) => {
                    setSelectedCompanyId(val);
                    if (!isBranchAdmin) {
                      setSelectedBranchId('ALL');
                    }
                    setSelectedDeptId('ALL');
                  }}
                  disabled={!isSuperAdmin && companies.length <= 1}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && (
                      <SelectItem value="ALL" className="text-xs font-semibold">
                        🏢 All Companies
                      </SelectItem>
                    )}
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name} {c.code ? `(${c.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Branch Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Branch / Facility</label>
                <Select
                  value={selectedBranchId}
                  onValueChange={(val) => {
                    setSelectedBranchId(val);
                    setSelectedDeptId('ALL');
                  }}
                  disabled={isBranchAdmin}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {!isBranchAdmin && (
                      <>
                        <SelectItem value="ALL" className="text-xs font-semibold">
                          📍 All Branches &amp; Offices
                        </SelectItem>
                        <SelectItem value="HEAD_OFFICE" className="text-xs font-semibold">
                          🏛️ Corporate / Head Office
                        </SelectItem>
                      </>
                    )}
                    {availableBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {b.name} {b.city ? `(${b.city})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Department Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Department</label>
                <Select
                  value={selectedDeptId}
                  onValueChange={(val) => setSelectedDeptId(val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs font-semibold">
                      🏷️ All Departments
                    </SelectItem>
                    {availableDepartments.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-xs">
                        {d.name} {d.code ? `(${d.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 text-xs text-muted-foreground hover:text-foreground shrink-0 self-end lg:self-center"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Dynamic Overview Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">ORGANIZATIONAL ROOT</p>
              <p className="text-sm font-semibold text-foreground mt-0.5 truncate max-w-[170px]">
                {selectedCompanyId !== 'ALL'
                  ? companies.find((c) => c.id === selectedCompanyId)?.name ?? 'Selected Company'
                  : 'All Corporate Entities'}
              </p>
              <p className="text-[10px] text-primary font-semibold">
                Company &rarr; Founder Flow
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">TOTAL WORKFORCE</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{totalHeadcount} Headcount</p>
              <p className="text-[10px] text-emerald-600 font-semibold">Active in selected scope</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">REGIONAL BRANCHES</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{totalBranchesCount} Units</p>
              <p className="text-[10px] text-violet-600 font-semibold">Branch Admin &amp; Staff</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 shrink-0">
              <GitFork className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">REPORTING MANAGERS</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{managersCount} Active Leads</p>
              <p className="text-[10px] text-amber-600 font-semibold">Verified reporting lines</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <Network className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 4. Main Hierarchy Chart / Tree View ── */}
      <Card className="shadow-xs overflow-hidden border-border/80">
        <CardHeader className="bg-muted/20 border-b border-border/60 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              {viewMode === 'chart' ? 'Company → Founder → Branch Hierarchy' : 'Hierarchical Explorer'}
            </CardTitle>
            <div className="w-full sm:w-72">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter by employee, title, code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-3 text-xs bg-background"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-x-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-muted-foreground space-y-2">
              <Network className="h-8 w-8 text-primary animate-spin" />
              <p>Building organizational hierarchy...</p>
            </div>
          ) : unifiedHierarchyTrees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-muted-foreground space-y-3">
              <Network className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="font-semibold text-foreground text-sm">No Employees in Selected Scope</p>
                <p className="mt-1 text-muted-foreground">
                  No employee records matched the selected company, branch, or department filters.
                </p>
              </div>
              {hasActiveFilters && (
                <Button size="sm" variant="outline" onClick={resetFilters} className="text-xs mt-2">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Clear Filters
                </Button>
              )}
            </div>
          ) : viewMode === 'tree' ? (
            /* ── VIEW MODE: Collapsible Tree List ── */
            <div className="space-y-4 max-w-3xl mx-auto border border-border/80 rounded-xl p-4 bg-muted/5">
              {unifiedHierarchyTrees.map((companyRoot) => renderTreeListItem(companyRoot, 0))}
            </div>
          ) : (
            /* ── VIEW MODE: Interactive Visual Chart ── */
            <div className="flex flex-col items-center min-w-max p-4 space-y-12">
              {unifiedHierarchyTrees.map((companyRoot) => (
                <OrgTreeNode
                  key={companyRoot.id}
                  node={companyRoot}
                  toggleNode={toggleNode}
                  collapsedNodes={collapsedNodes}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
