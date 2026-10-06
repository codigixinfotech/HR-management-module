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
  Edit,
  Trash2,
  Plus,
  GitFork,
  Cpu,
  RotateCcw,
  Scale,
} from 'lucide-react';
import type { ProductionLine } from '@/api/machine-management';
import type { Branch, Department } from '@/api/types';
import { CapacityUomMasterModal } from './CapacityUomMasterModal';

interface ProductionLinesTabProps {
  productionLines: ProductionLine[];
  branches: Branch[];
  departments: Department[];
  loading: boolean;
  onAddLine: () => void;
  onEditLine: (line: ProductionLine) => void;
  onDeleteLine: (line: ProductionLine) => void;
}

export function ProductionLinesTab({
  productionLines,
  branches,
  departments,
  loading,
  onAddLine,
  onEditLine,
  onDeleteLine,
}: ProductionLinesTabProps) {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [openUomMaster, setOpenUomMaster] = useState(false);

  const handleReset = () => {
    setSearch('');
    setBranchFilter('ALL');
    setDeptFilter('ALL');
    setStatusFilter('ALL');
  };

  const filteredLines = productionLines.filter((l) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      l.lineCode.toLowerCase().includes(q) ||
      l.lineName.toLowerCase().includes(q) ||
      (l.supervisorName && l.supervisorName.toLowerCase().includes(q));

    const matchesBranch =
      branchFilter === 'ALL' ||
      (branchFilter === 'HEAD_OFFICE' && (!l.branchId || l.branchId === 'HEAD_OFFICE')) ||
      l.branchId === branchFilter;

    const matchesDept = deptFilter === 'ALL' || l.departmentId === deptFilter;
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;

    return matchesSearch && matchesBranch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <Card className="shadow-2xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search operational unit name, code, supervisor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
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

              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Depts</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
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

              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10 hover:border-primary font-medium"
                onClick={() => setOpenUomMaster(true)}
              >
                <Scale className="h-3.5 w-3.5" />
                Capacity UOM Master
              </Button>

              <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={onAddLine}>
                <Plus className="h-3.5 w-3.5" />
                Add Operational Unit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Units Table */}
      <Card className="shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="text-xs">
                <TableHead className="font-semibold text-foreground">Unit Code</TableHead>
                <TableHead className="font-semibold text-foreground">Unit Name</TableHead>
                <TableHead className="font-semibold text-foreground">Department</TableHead>
                <TableHead className="text-center font-semibold text-foreground">Machines</TableHead>
                <TableHead className="font-semibold text-foreground">Supervisor</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Capacity</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8} className="py-4 text-center">
                      <div className="h-5 bg-muted animate-pulse rounded w-3/4 mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredLines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    <p className="font-medium text-sm">No operational units found</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-1.5"
                      onClick={onAddLine}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Operational Unit
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLines.map((line) => (
                  <TableRow key={line.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono font-semibold text-primary">
                      {line.lineCode}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{line.lineName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {line.location || line.lineType || 'Production'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {line.departmentName || 'Production Operations'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono text-xs gap-1">
                        <Cpu className="h-3 w-3" />
                        {line.machineCount ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">
                        {line.supervisorName || (
                          <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {line.productionCapacity ? (
                        <span>
                          {Number(line.productionCapacity).toLocaleString()}{' '}
                          <span className="text-[11px] text-muted-foreground">
                            {line.capacityUom || '/day'}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={line.status === 'ACTIVE' ? 'success' : 'secondary'}
                        className="text-[11px] capitalize"
                      >
                        {line.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 text-xs">
                          <DropdownMenuItem onClick={() => onEditLine(line)}>
                            <Edit className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            Edit Unit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteLine(line)}
                            className="text-rose-600 focus:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
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

      <CapacityUomMasterModal
        open={openUomMaster}
        onOpenChange={setOpenUomMaster}
      />
    </div>
  );
}
