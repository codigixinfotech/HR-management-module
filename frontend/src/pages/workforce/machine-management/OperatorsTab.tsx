import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  MoreVertical,
  Eye,
  Plus,
  UserCheck,
  Award,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import type { MachineOperator } from '@/api/machine-management';
import type { Branch } from '@/api/types';

interface OperatorsTabProps {
  operators: MachineOperator[];
  branches: Branch[];
  loading: boolean;
  onViewOperator: (operator: MachineOperator) => void;
  onAddOperator: () => void;
  onAssignToMachine: (operator: MachineOperator) => void;
}

export function OperatorsTab({
  operators,
  branches,
  loading,
  onViewOperator,
  onAddOperator,
  onAssignToMachine,
}: OperatorsTabProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleReset = () => {
    setSearch('');
    setTypeFilter('ALL');
    setBranchFilter('ALL');
    setStatusFilter('ALL');
  };

  const filteredOperators = operators.filter((op) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      op.operatorName.toLowerCase().includes(q) ||
      op.operatorCode.toLowerCase().includes(q) ||
      op.skill.toLowerCase().includes(q) ||
      (op.certification && op.certification.toLowerCase().includes(q));

    const matchesType = typeFilter === 'ALL' || op.operatorType === typeFilter;
    const matchesBranch =
      branchFilter === 'ALL' ||
      (branchFilter === 'HEAD_OFFICE' && (!op.branchId || op.branchId === 'HEAD_OFFICE')) ||
      op.branchId === branchFilter;
    const matchesStatus = statusFilter === 'ALL' || op.status === statusFilter;

    return matchesSearch && matchesType && matchesBranch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <Card className="shadow-2xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search operator name, code, skill, certification..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Workforce Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="Contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>

              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Branches</SelectItem>
                  <SelectItem value="HEAD_OFFICE">Head Office</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Allocated">Allocated</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5 text-xs text-muted-foreground"
                onClick={handleReset}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>

              <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={onAddOperator}>
                <Plus className="h-3.5 w-3.5" />
                Add Operator
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operators Table */}
      <Card className="shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="text-xs">
                <TableHead className="font-semibold text-foreground">Operator</TableHead>
                <TableHead className="font-semibold text-foreground">Code</TableHead>
                <TableHead className="font-semibold text-foreground">Type</TableHead>
                <TableHead className="font-semibold text-foreground">Department</TableHead>
                <TableHead className="font-semibold text-foreground">Skill & Specialization</TableHead>
                <TableHead className="font-semibold text-foreground">Certification</TableHead>
                <TableHead className="font-semibold text-foreground">Current Machine</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9} className="py-4 text-center">
                      <div className="h-5 bg-muted animate-pulse rounded w-3/4 mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredOperators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    <p className="font-medium text-sm">No machine operators found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mark employees or contract workers as eligible machine operators.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-1.5"
                      onClick={onAddOperator}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Operator
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOperators.map((op) => (
                  <TableRow
                    key={op.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => onViewOperator(op)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {op.operatorName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{op.operatorName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {op.contractorAgency || 'In-house Employee'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-medium text-primary">
                      {op.operatorCode}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={op.operatorType === 'Employee' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {op.operatorType}
                      </Badge>
                    </TableCell>
                    <TableCell>{op.department || 'Production'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{op.skill}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Level: {op.skillLevel || 'Expert'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="font-medium truncate max-w-[140px]" title={op.certification || ''}>
                          {op.certification || 'Valid License'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {op.currentMachineCode ? (
                        <div>
                          <span className="font-mono font-semibold text-primary">
                            {op.currentMachineCode}
                          </span>
                          <span className="block text-[10px] text-muted-foreground truncate max-w-[130px]">
                            {op.currentMachineName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">None Assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          op.status === 'Available'
                            ? 'success'
                            : op.status === 'Allocated'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-[11px]"
                      >
                        {op.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 text-xs">
                          <DropdownMenuItem onClick={() => onViewOperator(op)}>
                            <Eye className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            View Details
                          </DropdownMenuItem>
                          {op.status === 'Available' && (
                            <DropdownMenuItem onClick={() => onAssignToMachine(op)}>
                              <UserCheck className="h-3.5 w-3.5 mr-2 text-primary" />
                              Assign Machine
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
