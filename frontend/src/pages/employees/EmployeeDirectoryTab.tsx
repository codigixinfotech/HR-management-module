import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Search,
  Download,
  Grid,
  List,
  Mail,
  Phone,
  ExternalLink,
  Trash2,
  Key,
  ChevronDown,
  Check,
  X,
  Users,
  Building2,
  Briefcase,
  GitBranch,
  FolderTree,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { employeesApi } from '@/api/employees';
import { departmentsApi, designationsApi } from '@/api/organization';
import { useCompany } from '@/context/CompanyContext';
import type { Employee } from '@/api/types';
import { Pagination } from '@/components/common/Pagination';

const COLOR_PALETTES = [
  { bg: 'bg-amber-500', text: 'text-white', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { bg: 'bg-purple-600', text: 'text-white', badge: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  { bg: 'bg-blue-600', text: 'text-white', badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { bg: 'bg-emerald-600', text: 'text-white', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { bg: 'bg-rose-500', text: 'text-white', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  { bg: 'bg-indigo-600', text: 'text-white', badge: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  { bg: 'bg-cyan-600', text: 'text-white', badge: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  { bg: 'bg-fuchsia-600', text: 'text-white', badge: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20' },
  { bg: 'bg-teal-600', text: 'text-white', badge: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  { bg: 'bg-orange-600', text: 'text-white', badge: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
];

function getPalette(name: string, index = 0) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash + index) % COLOR_PALETTES.length;
  return COLOR_PALETTES[idx];
}

function getInitials(name: string): string {
  if (!name) return 'NA';
  const clean = name.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getEmployeeDisplayMeta(e: Employee) {
  const code = (e.employeeCode || '').toUpperCase();
  const firstName = (e.firstName || '').toLowerCase();
  const lastName = (e.lastName || '').toLowerCase();
  const fullName = `${firstName} ${lastName}`;

  // Check roles
  const roleNames = e.user?.roles?.map(r => r.role?.name?.toUpperCase()) || [];
  const isSuperAdminRole = roleNames.includes('SUPER_ADMIN');
  const isBranchAdminRole = roleNames.includes('BRANCH_ADMIN');

  // Check company admin conditions
  const isCompanyAdmin =
    isSuperAdminRole ||
    code.startsWith('C-') ||
    code.startsWith('COMP-') ||
    (fullName.includes('company') && fullName.includes('admin'));

  // Check branch admin conditions
  const isBranchAdmin =
    isBranchAdminRole ||
    code.startsWith('BR-') ||
    fullName.includes('branch admin') ||
    (firstName === 'branch' && lastName === 'admin');

  const rawDept = e.department?.name?.trim();
  const rawDesig = e.designation?.title?.trim();

  if (isCompanyAdmin) {
    return {
      department: rawDept || 'Management',
      designation: rawDesig || 'Company Administrator',
      scope: 'COMPANY' as const,
      isOrgAdmin: true,
    };
  }

  if (isBranchAdmin) {
    return {
      department: rawDept || 'Administration',
      designation: rawDesig || 'Branch Administrator',
      scope: 'BRANCH' as const,
      isOrgAdmin: true,
    };
  }

  const isDeptManager =
    roleNames.includes('DEPARTMENT_MANAGER') ||
    rawDesig?.toLowerCase().includes('manager') ||
    rawDesig?.toLowerCase().includes('head');

  const roleScope = e.user?.roles?.[0]?.role?.dataScope;

  return {
    department: rawDept || 'General Operations',
    designation: rawDesig || 'Team Member',
    scope: isDeptManager ? ('DEPARTMENT' as const) : ((roleScope as 'COMPANY' | 'BRANCH' | 'DEPARTMENT' | 'INDIVIDUAL') || 'INDIVIDUAL'),
    isOrgAdmin: false,
  };
}

interface EmployeeDirectoryTabProps {
  employees: Employee[] | undefined;
  isLoading: boolean;
}

export function EmployeeDirectoryTab({ employees, isLoading }: EmployeeDirectoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('table');
  
  // Grouping mode state: 'all' | 'department' | 'designation'
  const [groupMode, setGroupMode] = useState<'all' | 'department' | 'designation'>('all');
  
  // Pagination State for Employee Directory
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Filter selections
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedDesig, setSelectedDesig] = useState<string>('all');

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearchQuery, setDropdownSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const queryClient = useQueryClient();
  const { activeCompanyId } = useCompany();

  // Fetch registered departments & designations from DB for complete lists
  const { data: apiDepartments = [] } = useQuery({
    queryKey: ['departments', activeCompanyId],
    queryFn: () => departmentsApi.list(activeCompanyId),
  });

  const { data: apiDesignations = [] } = useQuery({
    queryKey: ['designations', activeCompanyId],
    queryFn: () => designationsApi.list(activeCompanyId),
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to delete employee');
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete employee ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  // Compile rich Department metadata (avatars, counts, active counts, probation counts)
  const departmentsMeta = useMemo(() => {
    const map = new Map<string, { count: number; activeCount: number; probationCount: number; id?: string }>();

    if (employees) {
      employees.forEach(e => {
        const meta = getEmployeeDisplayMeta(e);
        const deptName = meta.department;
        if (deptName) {
          const existing = map.get(deptName) || { count: 0, activeCount: 0, probationCount: 0, id: e.department?.id };
          existing.count += 1;
          if (e.status === 'ACTIVE') {
            existing.activeCount += 1;
          } else if (e.status === 'PROBATION') {
            existing.probationCount += 1;
          }
          map.set(deptName, existing);
        }
      });
    }

    apiDepartments.forEach(d => {
      if (d.name && !map.has(d.name)) {
        map.set(d.name, { count: 0, activeCount: 0, probationCount: 0, id: d.id });
      }
    });

    const list = [];
    let idx = 0;
    for (const [name, stats] of map.entries()) {
      list.push({
        id: stats.id,
        name,
        count: stats.count,
        activeCount: stats.activeCount,
        probationCount: stats.probationCount,
        initials: getInitials(name),
        palette: getPalette(name, idx++),
      });
    }

    list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return list;
  }, [employees, apiDepartments]);

  // Compile rich Designation metadata (avatars, counts, active counts, probation counts)
  const designationsMeta = useMemo(() => {
    const map = new Map<string, { count: number; activeCount: number; probationCount: number; id?: string }>();

    if (employees) {
      employees.forEach(e => {
        const meta = getEmployeeDisplayMeta(e);
        const desigName = meta.designation;
        if (desigName) {
          const existing = map.get(desigName) || { count: 0, activeCount: 0, probationCount: 0, id: e.designation?.id };
          existing.count += 1;
          if (e.status === 'ACTIVE') {
            existing.activeCount += 1;
          } else if (e.status === 'PROBATION') {
            existing.probationCount += 1;
          }
          map.set(desigName, existing);
        }
      });
    }

    apiDesignations.forEach(d => {
      if (d.title && !map.has(d.title)) {
        map.set(d.title, { count: 0, activeCount: 0, probationCount: 0, id: d.id });
      }
    });

    const list = [];
    let idx = 0;
    for (const [name, stats] of map.entries()) {
      list.push({
        id: stats.id,
        name,
        count: stats.count,
        activeCount: stats.activeCount,
        probationCount: stats.probationCount,
        initials: getInitials(name),
        palette: getPalette(name, idx++),
      });
    }

    list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return list;
  }, [employees, apiDesignations]);

  const totalEmployeesCount = employees?.length ?? 0;

  // Selected Department details
  const activeDeptMeta = useMemo(() => {
    if (selectedDept === 'all') return null;
    return departmentsMeta.find(d => d.name.toLowerCase() === selectedDept.toLowerCase()) || {
      name: selectedDept,
      count: 0,
      activeCount: 0,
      probationCount: 0,
      initials: getInitials(selectedDept),
      palette: getPalette(selectedDept),
    };
  }, [selectedDept, departmentsMeta]);

  // Selected Designation details
  const activeDesigMeta = useMemo(() => {
    if (selectedDesig === 'all') return null;
    return designationsMeta.find(d => d.name.toLowerCase() === selectedDesig.toLowerCase()) || {
      name: selectedDesig,
      count: 0,
      activeCount: 0,
      probationCount: 0,
      initials: getInitials(selectedDesig),
      palette: getPalette(selectedDesig),
    };
  }, [selectedDesig, designationsMeta]);

  // Active Dropdown items and active metadata based on groupMode
  const activeDropdownList = useMemo(() => {
    const source = groupMode === 'designation' ? designationsMeta : departmentsMeta;
    if (!dropdownSearchQuery.trim()) return source;
    return source.filter(item =>
      item.name.toLowerCase().includes(dropdownSearchQuery.toLowerCase())
    );
  }, [groupMode, departmentsMeta, designationsMeta, dropdownSearchQuery]);

  // Filtered employees based on search & active group filter
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(e => {
      const meta = getEmployeeDisplayMeta(e);
      const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        e.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.workEmail && e.workEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        meta.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meta.designation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGroupFilter =
        (selectedDept === 'all' || meta.department.toLowerCase() === selectedDept.toLowerCase()) &&
        (selectedDesig === 'all' || meta.designation.toLowerCase() === selectedDesig.toLowerCase());

      return matchesSearch && matchesGroupFilter;
    });
  }, [employees, searchQuery, selectedDept, selectedDesig]);

  // Paginated employees for unified list
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Clear filters & return to See All view
  const handleClearFilters = () => {
    setSelectedDept('all');
    setSelectedDesig('all');
    setSearchQuery('');
    setDropdownOpen(false);
    setDropdownSearchQuery('');
    setCurrentPage(1);
  };

  // Grouped roster representation (when grouped by department or designation)
  const groupedEmployeeList = useMemo(() => {
    const groupsMap = new Map<string, {
      key: string;
      title: string;
      initials: string;
      palette: { bg: string; text: string; badge: string };
      totalCount: number;
      activeCount: number;
      probationCount: number;
      items: Employee[];
    }>();

    filteredEmployees.forEach(e => {
      const meta = getEmployeeDisplayMeta(e);
      const groupKey = groupMode === 'designation' ? meta.designation : meta.department;
      const palette = getPalette(groupKey);
      const initials = getInitials(groupKey);

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          key: groupKey,
          title: groupKey,
          initials,
          palette,
          totalCount: 0,
          activeCount: 0,
          probationCount: 0,
          items: [],
        });
      }

      const grp = groupsMap.get(groupKey)!;
      grp.totalCount += 1;
      if (e.status === 'ACTIVE') grp.activeCount += 1;
      if (e.status === 'PROBATION') grp.probationCount += 1;
      grp.items.push(e);
    });

    return Array.from(groupsMap.values());
  }, [filteredEmployees, groupMode]);

  // CSV export handler
  const handleExportCsv = () => {
    if (!filteredEmployees || filteredEmployees.length === 0) {
      toast.error('No employee records available to export');
      return;
    }

    const headers = ['Employee Code', 'First Name', 'Last Name', 'Work Email', 'Phone', 'Department', 'Designation', 'Scope', 'Status'];
    const rows = filteredEmployees.map(e => {
      const meta = getEmployeeDisplayMeta(e);
      return [
        `"${e.employeeCode ?? ''}"`,
        `"${e.firstName ?? ''}"`,
        `"${e.lastName ?? ''}"`,
        `"${e.workEmail ?? ''}"`,
        `"${e.phone ?? ''}"`,
        `"${meta.department}"`,
        `"${meta.designation}"`,
        `"${meta.scope}"`,
        `"${e.status ?? ''}"`,
      ];
    });

    const activeFilterName = selectedDept !== 'all' ? selectedDept : selectedDesig !== 'all' ? selectedDesig : 'all';
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employee_directory_${groupMode}_${activeFilterName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredEmployees.length} employee records to CSV`);
  };

  const isFilterApplied = selectedDept !== 'all' || selectedDesig !== 'all';
  const currentActiveMeta = selectedDept !== 'all' ? activeDeptMeta : activeDesigMeta;

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Grouping Buttons: See All | Group by Department | Group by Designation */}
          <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => {
                setGroupMode('all');
                handleClearFilters();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                groupMode === 'all'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-3.5 w-3.5" /> See All
            </button>
            <button
              type="button"
              onClick={() => {
                setGroupMode('department');
                setDropdownOpen(false);
                setDropdownSearchQuery('');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                groupMode === 'department'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" /> Group by Department
            </button>
            <button
              type="button"
              onClick={() => {
                setGroupMode('designation');
                setDropdownOpen(false);
                setDropdownSearchQuery('');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                groupMode === 'designation'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" /> Group by Designation
            </button>
          </div>

          {/* Adaptive Avatar-Group Dropdown Selector */}
          <div className="relative" ref={dropdownRef}>
            {!isFilterApplied ? (
              <button
                type="button"
                onClick={() => setDropdownOpen(prev => !prev)}
                className="group flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-border/80 bg-background hover:bg-muted/40 transition-all text-xs font-medium shadow-2xs hover:shadow-xs"
              >
                {/* Overlapping Colorful Avatar Stack */}
                <div className="flex items-center -space-x-1.5 overflow-hidden">
                  {(groupMode === 'designation' ? designationsMeta : departmentsMeta).slice(0, 5).map((item) => (
                    <span
                      key={item.name}
                      title={`${item.name} (${item.count} personnel)`}
                      className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[9.5px] font-bold text-white ring-2 ring-background shrink-0 transition-transform group-hover:scale-105 ${item.palette.bg}`}
                    >
                      {item.initials}
                    </span>
                  ))}
                  {(groupMode === 'designation' ? designationsMeta : departmentsMeta).length > 5 && (
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full text-[9px] font-bold bg-muted text-muted-foreground ring-2 ring-background shrink-0">
                      +{(groupMode === 'designation' ? designationsMeta : departmentsMeta).length - 5}
                    </span>
                  )}
                  {(groupMode === 'designation' ? designationsMeta : departmentsMeta).length === 0 && (
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold bg-primary/10 text-primary ring-2 ring-background shrink-0">
                      <Users className="h-3 w-3" />
                    </span>
                  )}
                </div>

                <span className="font-semibold text-foreground">
                  {groupMode === 'designation' ? 'All Designations' : groupMode === 'department' ? 'All Departments' : 'Filter by Group'}
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[10.5px] font-bold bg-primary/10 text-primary">
                  {totalEmployeesCount}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all text-xs font-semibold text-foreground shadow-2xs"
                >
                  {/* Single Selected Avatar */}
                  <span
                    className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold text-white shrink-0 ${currentActiveMeta?.palette.bg}`}
                  >
                    {currentActiveMeta?.initials}
                  </span>
                  <span className="text-foreground">{currentActiveMeta?.name}</span>
                  <span className="text-muted-foreground font-normal text-[11px]">
                    • {currentActiveMeta?.count} {currentActiveMeta?.count === 1 ? 'Employee' : 'Employees'}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-primary transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  title="Clear filter & see all"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/80 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shadow-2xs"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>See All</span>
                </button>
              </div>
            )}

            {/* Dropdown Menu Popover */}
            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-80 sm:w-96 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95">
                {/* Search inside dropdown */}
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={groupMode === 'designation' ? 'Search designation...' : 'Search department...'}
                    value={dropdownSearchQuery}
                    onChange={e => setDropdownSearchQuery(e.target.value)}
                    className="h-8 pl-8 pr-7 text-xs bg-muted/40 focus-visible:ring-1"
                    autoFocus
                  />
                  {dropdownSearchQuery && (
                    <button
                      onClick={() => setDropdownSearchQuery('')}
                      className="absolute right-2 top-2 text-muted-foreground hover:text-foreground p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="max-h-68 overflow-y-auto space-y-1 pr-1">
                  {/* Option: See All */}
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                      !isFilterApplied
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-muted/60 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center -space-x-1 overflow-hidden shrink-0">
                        {(groupMode === 'designation' ? designationsMeta : departmentsMeta).slice(0, 3).map(d => (
                          <span
                            key={d.name}
                            className={`h-5 w-5 rounded-full text-[8.5px] font-bold text-white ring-1 ring-background inline-flex items-center justify-center ${d.palette.bg}`}
                          >
                            {d.initials}
                          </span>
                        ))}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold leading-tight flex items-center gap-1.5">
                          <span>See All Personnel</span>
                          <span className="text-[10px] font-normal text-muted-foreground">({totalEmployeesCount})</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Show entire company roster without filters
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isFilterApplied && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </button>

                  <div className="my-1 h-px bg-border/60" />

                  {/* Individual Items */}
                  {activeDropdownList.map(item => {
                    const isSelected =
                      groupMode === 'designation'
                        ? selectedDesig.toLowerCase() === item.name.toLowerCase()
                        : selectedDept.toLowerCase() === item.name.toLowerCase();

                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          if (groupMode === 'designation') {
                            setSelectedDesig(item.name);
                            setSelectedDept('all');
                          } else {
                            setSelectedDept(item.name);
                            setSelectedDesig('all');
                          }
                          setDropdownOpen(false);
                          setDropdownSearchQuery('');
                          setCurrentPage(1);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                          isSelected
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'hover:bg-muted/60 text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`h-6 w-6 rounded-full text-[10px] font-bold text-white shrink-0 inline-flex items-center justify-center ${item.palette.bg}`}>
                            {item.initials}
                          </span>
                          <div className="text-left truncate">
                            <p className="font-semibold leading-tight truncate">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {item.count} {item.count === 1 ? 'employee' : 'employees'} • {item.activeCount} active
                              {item.probationCount > 0 && ` • ${item.probationCount} probation`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {item.count}
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      </button>
                    );
                  })}

                  {activeDropdownList.length === 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      No matching records for "{dropdownSearchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* View Toggler (Grid / Table) */}
          <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
            <button
              onClick={() => setDisplayMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all ${displayMode === 'grid'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
                }`}
              title="Grid View"
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDisplayMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all ${displayMode === 'table'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
                }`}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Search Input & CSV Export Button */}
        <div className="flex items-center gap-2">
          <div className="relative w-52 sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="h-8.5 pl-8 pr-7 text-xs bg-background"
              placeholder={groupMode === 'all' ? "Search all personnel..." : `Search in ${groupMode}s...`}
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8.5 text-xs gap-1.5 font-semibold shadow-2xs"
            onClick={handleExportCsv}
          >
            <Download className="h-3.5 w-3.5" /> Export (.CSV)
          </Button>
        </div>
      </div>

      {/* Overview Context Header Banner */}
      {isFilterApplied ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 gap-2 transition-all">
          <div className="flex items-center gap-2.5">
            <span className={`h-8 w-8 rounded-full text-xs font-bold text-white inline-flex items-center justify-center shrink-0 ${currentActiveMeta?.palette.bg}`}>
              {currentActiveMeta?.initials}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-foreground">{currentActiveMeta?.name}</h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                  Filtered by {selectedDesig !== 'all' ? 'Designation' : 'Department'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Displaying all personnel assigned to {currentActiveMeta?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-foreground">
                {filteredEmployees.length} {filteredEmployees.length === 1 ? 'Employee' : 'Employees'}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {filteredEmployees.filter(e => e.status === 'ACTIVE' || e.status === 'PROBATION').length} Active on roster
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 border-border/80"
              onClick={handleClearFilters}
            >
              <X className="h-3 w-3" /> Clear & See All
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-1 py-0.5 text-xs text-muted-foreground font-medium border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {groupMode === 'all'
                ? 'All Personnel Directory'
                : groupMode === 'department'
                ? 'All Personnel Directory by Department'
                : 'All Personnel Directory by Designation'}
            </span>
            <span>•</span>
            <span>
              {groupMode === 'department'
                ? `${departmentsMeta.length} Departments Available`
                : groupMode === 'designation'
                ? `${designationsMeta.length} Designations Available`
                : `${filteredEmployees.length} Total Personnel`}
            </span>
          </div>
          <span className="font-semibold text-foreground">
            {filteredEmployees.length} Total Personnel
          </span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="py-12 text-center text-xs text-muted-foreground">
          Loading employee directory records...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredEmployees.length === 0 && (
        <div className="py-16 text-center text-xs text-muted-foreground border rounded-2xl border-dashed">
          No personnel found matching the selected filter.
        </div>
      )}

      {/* 1. Unified Personnel Roster (when groupMode === 'all') */}
      {!isLoading && groupMode === 'all' && filteredEmployees.length > 0 && (
        displayMode === 'table' ? (
          <Card className="shadow-2xs border-border/80 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Employee Code</TableHead>
                  <TableHead className="text-xs">Full Name</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Designation</TableHead>
                  <TableHead className="text-xs">Scope</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.map((employee) => {
                  const meta = getEmployeeDisplayMeta(employee);
                  return (
                    <TableRow key={employee.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-primary">{employee.employeeCode}</TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {employee.firstName} {employee.lastName}
                        <span className="block text-[10px] text-muted-foreground mt-0.5">{employee.workEmail}</span>
                      </TableCell>
                      <TableCell className="text-xs text-foreground font-semibold">
                        {meta.department}
                      </TableCell>
                      <TableCell className="text-xs text-foreground font-semibold">
                        {meta.designation}
                      </TableCell>
                      <TableCell className="text-xs">
                        {meta.scope === 'COMPANY' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            <Building2 className="h-3 w-3 shrink-0" /> COMPANY
                          </span>
                        )}
                        {meta.scope === 'BRANCH' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <GitBranch className="h-3 w-3 shrink-0" /> BRANCH
                          </span>
                        )}
                        {meta.scope === 'DEPARTMENT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <FolderTree className="h-3 w-3 shrink-0" /> DEPT
                          </span>
                        )}
                        {meta.scope !== 'COMPANY' && meta.scope !== 'BRANCH' && meta.scope !== 'DEPARTMENT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                            <Users className="h-3 w-3 shrink-0" /> STAFF
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={employee.status} className="text-[10px]" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="outline" size="sm" className="h-7 text-xs font-semibold" asChild>
                            <Link to={`/employees/detail/${employee.id}`}>View Profile</Link>
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs font-semibold" asChild>
                            <Link to={`/employees/master?action=edit&id=${employee.id}`}>Edit</Link>
                          </Button>
                          {!(employee as any).userId && (
                            <Button variant="outline" size="sm" className="h-7 text-xs font-semibold text-primary border-primary/20 hover:bg-primary/5 gap-1" asChild>
                              <Link to="/employees/master">
                                <Key className="h-3 w-3" /> Create Login
                              </Link>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(employee.id, `${employee.firstName} ${employee.lastName}`)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ) : (
          /* Grid View for All Personnel */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedEmployees.map((employee) => {
              const meta = getEmployeeDisplayMeta(employee);
              return (
                <Card key={employee.id} className="relative overflow-hidden hover:shadow-md transition-all duration-200 border-border/80 group">
                  <CardContent className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-primary font-semibold">{employee.employeeCode}</span>
                        <div className="flex items-center gap-1.5">
                          {meta.scope === 'COMPANY' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              <Building2 className="h-2.5 w-2.5" /> COMPANY
                            </span>
                          )}
                          {meta.scope === 'BRANCH' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <GitBranch className="h-2.5 w-2.5" /> BRANCH
                            </span>
                          )}
                          {meta.scope === 'DEPARTMENT' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              <FolderTree className="h-2.5 w-2.5" /> DEPT
                            </span>
                          )}
                          <StatusBadge status={employee.status} className="text-[9.5px]" />
                        </div>
                      </div>
                      <h3 className="text-base font-semibold text-foreground mt-3 group-hover:text-primary transition-colors">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                        {meta.designation} • {meta.department}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50 space-y-2 text-[11px] text-muted-foreground">
                      {employee.workEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="line-clamp-1">{employee.workEmail}</span>
                        </div>
                      )}
                      {employee.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{employee.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7.5 w-7.5 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(employee.id, `${employee.firstName} ${employee.lastName}`)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" className="h-7.5 text-xs font-semibold" asChild>
                          <Link to={`/employees/master?action=edit&id=${employee.id}`}>Edit</Link>
                        </Button>
                        <Button variant="outline" size="sm" className="h-7.5 text-xs gap-1 font-semibold text-primary border-primary/20 hover:bg-primary/5" asChild>
                          <Link to={`/employees/detail/${employee.id}`}>
                            View Profile <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* 2. Grouped Personnel Roster (when groupMode === 'department' or 'designation') */}
      {!isLoading && groupMode !== 'all' && groupedEmployeeList.map((group) => (
        <div key={group.key} className="space-y-2.5 pt-2">
          {/* Group Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-2.5 rounded-xl border border-border/70 bg-muted/20 shadow-2xs gap-2">
            <div className="flex items-center gap-2.5">
              <span className={`h-7 w-7 rounded-full text-xs font-bold text-white inline-flex items-center justify-center shrink-0 ${group.palette.bg}`}>
                {group.initials}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">{group.title}</h4>
                  <span className="text-[9.5px] font-semibold px-2 py-0.2 rounded-full bg-primary/10 text-primary">
                    {groupMode === 'department' ? 'Department' : 'Designation'}
                  </span>
                </div>
                <p className="text-[10.5px] text-muted-foreground">
                  {group.totalCount} {group.totalCount === 1 ? 'Employee' : 'Employees'} • {group.activeCount} Active
                  {group.probationCount > 0 && ` • ${group.probationCount} Probation`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground px-2 py-0.5 rounded-lg bg-background border border-border/70 shadow-2xs">
                {group.totalCount} {group.totalCount === 1 ? 'Personnel' : 'Personnel'}
              </span>
            </div>
          </div>

          {/* Table View for this group */}
          {displayMode === 'table' ? (
            <Card className="shadow-2xs border-border/80 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Employee Code</TableHead>
                    <TableHead className="text-xs">Full Name</TableHead>
                    <TableHead className="text-xs">{groupMode === 'department' ? 'Designation' : 'Department'}</TableHead>
                    <TableHead className="text-xs">Scope</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.items.map((employee) => {
                    const meta = getEmployeeDisplayMeta(employee);
                    return (
                      <TableRow key={employee.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold text-primary">{employee.employeeCode}</TableCell>
                        <TableCell className="font-semibold text-xs text-foreground">
                          {employee.firstName} {employee.lastName}
                          <span className="block text-[10px] text-muted-foreground mt-0.5">{employee.workEmail}</span>
                        </TableCell>
                        <TableCell className="text-xs text-foreground font-semibold">
                          {groupMode === 'department' ? meta.designation : meta.department}
                        </TableCell>
                        <TableCell className="text-xs">
                          {meta.scope === 'COMPANY' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              <Building2 className="h-3 w-3 shrink-0" /> COMPANY
                            </span>
                          )}
                          {meta.scope === 'BRANCH' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <GitBranch className="h-3 w-3 shrink-0" /> BRANCH
                            </span>
                          )}
                          {meta.scope === 'DEPARTMENT' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              <FolderTree className="h-3 w-3 shrink-0" /> DEPT
                            </span>
                          )}
                          {meta.scope !== 'COMPANY' && meta.scope !== 'BRANCH' && meta.scope !== 'DEPARTMENT' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                              <Users className="h-3 w-3 shrink-0" /> STAFF
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <StatusBadge status={employee.status} className="text-[10px]" />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="outline" size="sm" className="h-7 text-xs font-semibold" asChild>
                              <Link to={`/employees/detail/${employee.id}`}>View Profile</Link>
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs font-semibold" asChild>
                              <Link to={`/employees/master?action=edit&id=${employee.id}`}>Edit</Link>
                            </Button>
                            {!(employee as any).userId && (
                              <Button variant="outline" size="sm" className="h-7 text-xs font-semibold text-primary border-primary/20 hover:bg-primary/5 gap-1" asChild>
                                <Link to="/employees/master">
                                  <Key className="h-3 w-3" /> Create Login
                                </Link>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(employee.id, `${employee.firstName} ${employee.lastName}`)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : (
            /* Grid View for this group */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((employee) => {
                const meta = getEmployeeDisplayMeta(employee);
                return (
                  <Card key={employee.id} className="relative overflow-hidden hover:shadow-md transition-all duration-200 border-border/80 group">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-primary font-semibold">{employee.employeeCode}</span>
                          <div className="flex items-center gap-1.5">
                            {meta.scope === 'COMPANY' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                <Building2 className="h-2.5 w-2.5" /> COMPANY
                              </span>
                            )}
                            {meta.scope === 'BRANCH' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <GitBranch className="h-2.5 w-2.5" /> BRANCH
                              </span>
                            )}
                            {meta.scope === 'DEPARTMENT' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                <FolderTree className="h-2.5 w-2.5" /> DEPT
                              </span>
                            )}
                            <StatusBadge status={employee.status} className="text-[9.5px]" />
                          </div>
                        </div>
                        <h3 className=" text-base font-semibold text-foreground mt-3 group-hover:text-primary transition-colors">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                          {meta.designation} • {meta.department}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/50 space-y-2 text-[11px] text-muted-foreground">
                        {employee.workEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="line-clamp-1">{employee.workEmail}</span>
                          </div>
                        )}
                        {employee.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{employee.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7.5 w-7.5 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(employee.id, `${employee.firstName} ${employee.lastName}`)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex items-center gap-1.5">
                          <Button variant="outline" size="sm" className="h-7.5 text-xs font-semibold" asChild>
                            <Link to={`/employees/master?action=edit&id=${employee.id}`}>Edit</Link>
                          </Button>
                          <Button variant="outline" size="sm" className="h-7.5 text-xs gap-1 font-semibold text-primary border-primary/20 hover:bg-primary/5" asChild>
                            <Link to={`/employees/detail/${employee.id}`}>
                              View Profile <ExternalLink className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Global Reusable EHCM ERP Pagination Component */}
      {!isLoading && filteredEmployees.length > 0 && (
        <Pagination
          totalRecords={filteredEmployees.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="employees"
          className="mt-6"
        />
      )}
    </div>
  );
}
