import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { employeesApi } from '@/api/employees';
import type { Employee } from '@/api/types';

interface EmployeeDirectoryTabProps {
  employees: Employee[] | undefined;
  isLoading: boolean;
}

export function EmployeeDirectoryTab({ employees, isLoading }: EmployeeDirectoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('table');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  
  const queryClient = useQueryClient();

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

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(e => {
      const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        e.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.workEmail && e.workEmail.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept =
        selectedDept === 'all'
          ? true
          : e.department?.name?.toLowerCase() === selectedDept.toLowerCase();

      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, selectedDept]);

  const departmentsList = useMemo(() => {
    if (!employees) return [];
    const depts = new Set<string>();
    employees.forEach(e => {
      if (e.department?.name) depts.add(e.department.name);
    });
    return Array.from(depts);
  }, [employees]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Pills */}
          <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
            <button
              onClick={() => setSelectedDept('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedDept === 'all'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              All Depts
            </button>
            {departmentsList.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedDept.toLowerCase() === dept.toLowerCase()
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* View Toggler */}
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

        <div className="flex items-center gap-2">
          <div className="relative w-52">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="h-8.5 pl-8 text-xs bg-background"
              placeholder="Search directory..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="h-8.5 text-xs gap-1">
            <Download className="h-3.5 w-3.5" /> Export (.CSV)
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-12 text-center text-xs text-muted-foreground">
          Loading employee directory records...
        </div>
      )}

      {/* Grid View */}
      {!isLoading && displayMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="relative overflow-hidden hover:shadow-md transition-all duration-200 border-border/80 group">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-primary font-semibold">{employee.employeeCode}</span>
                    <StatusBadge status={employee.status} className="text-[9.5px]" />
                  </div>
                  <h3 className=" text-base font-semibold text-foreground mt-3 group-hover:text-primary transition-colors">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                    {employee.designation?.title ?? 'Associate'} • {employee.department?.name ?? 'Corporate Operations'}
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
          ))}
        </div>
      )}

      {/* Table View */}
      {!isLoading && displayMode === 'table' && (
        <Card className="shadow-2xs border-border/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Employee Code</TableHead>
                <TableHead className="text-xs">Full Name</TableHead>
                <TableHead className="text-xs">Department</TableHead>
                <TableHead className="text-xs">Designation</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-primary">{employee.employeeCode}</TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">
                    {employee.firstName} {employee.lastName}
                    <span className="block text-[10px] text-muted-foreground mt-0.5">{employee.workEmail}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-semibold">
                    {employee.department?.name ?? '-'}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {employee.designation?.title ?? '-'}
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
                      {!employee.userId && (
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
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
