import React from 'react';
import { GitFork } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Branch } from '@/api/types';

export interface WorkforceBranchFilterProps {
  isSuperOrCompanyAdmin: boolean;
  isBranchAdmin: boolean;
  selectedBranch: string;
  onBranchChange: (branchId: string) => void;
  branches: Branch[];
  assignedBranchName?: string;
  className?: string;
}

export function WorkforceBranchFilter({
  isSuperOrCompanyAdmin,
  isBranchAdmin,
  selectedBranch,
  onBranchChange,
  branches,
  assignedBranchName,
  className = '',
}: WorkforceBranchFilterProps) {
  // 1. Super Admin: full branch switching capabilities
  if (isSuperOrCompanyAdmin) {
    return (
      <div className={`relative shrink-0 ${className}`}>
        <Select value={selectedBranch} onValueChange={onBranchChange}>
          <SelectTrigger className="h-9 px-2.5 text-xs rounded-lg bg-background border-border/80 font-medium shadow-2xs hover:bg-muted/40 gap-1.5 w-auto shrink-0">
            <GitFork className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground text-xs">Branch:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HEAD_OFFICE" className="text-xs font-semibold">
              Head Office
            </SelectItem>
            <SelectItem value="ALL" className="text-xs">
              All Branches
            </SelectItem>
            {branches
              .filter((b) => !b.name?.toLowerCase().includes('head office'))
              .map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-xs">
                  {b.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // 2. Branch Admin / Branch Login: strictly locked to assigned branch
  if (isBranchAdmin && assignedBranchName) {
    return (
      <div
        className={`flex items-center gap-1.5 h-9 px-2.5 text-xs rounded-lg bg-muted/50 border border-border/80 font-medium text-foreground shrink-0 ${className}`}
      >
        <GitFork className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground text-xs">Branch:</span>
        <span className="font-semibold">{assignedBranchName}</span>
      </div>
    );
  }

  // 3. Head Office Login (non-SuperAdmin with No Branch): strictly locked to Head Office / No Branch
  return (
    <div
      className={`flex items-center gap-1.5 h-9 px-2.5 text-xs rounded-lg bg-muted/50 border border-border/80 font-medium text-foreground shrink-0 ${className}`}
    >
      <GitFork className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="text-muted-foreground text-xs">Branch:</span>
      <span className="font-semibold">Head Office / No Branch</span>
    </div>
  );
}


/**
 * Universal Branch Matcher matching the exact Employee Master Page logic:
 * - When Branch Admin: strictly matches user's assigned branch
 * - When HEAD_OFFICE: matches items with no branch, branch named Head Office/Corporate/Main, or branchId === 'HEAD_OFFICE'
 * - When ALL: returns true for all items
 * - When specific branch ID: matches by branch ID or branch name
 */
export function matchWorkforceBranch(
  item: {
    branchId?: string | null;
    branch?: { id?: string; name?: string } | null;
    branchName?: string | null;
    line?: string | null;
    location?: string | null;
  },
  selectedBranch: string,
  isBranchAdmin: boolean,
  userAssignedBranchId?: string,
  branches: { id: string; name: string }[] = []
): boolean {
  if (isBranchAdmin && userAssignedBranchId) {
    if (item.branchId) return item.branchId === userAssignedBranchId;
    if (item.branch?.id) return item.branch.id === userAssignedBranchId;
    const assignedBranch = branches.find((b) => b.id === userAssignedBranchId);
    if (assignedBranch && item.branchName) {
      return item.branchName.toLowerCase().includes(assignedBranch.name.toLowerCase().slice(0, 4));
    }
    return true;
  }

  if (selectedBranch === 'ALL') {
    return true;
  }

  if (selectedBranch === 'HEAD_OFFICE') {
    if (item.branchId && item.branchId !== 'NONE' && item.branchId !== 'HEAD_OFFICE') {
      const branchObj = branches.find((b) => b.id === item.branchId) || item.branch;
      const bName = (branchObj?.name || item.branchName || item.line || '').toLowerCase();
      return bName.includes('head') || bName.includes('corporate') || bName.includes('main') || bName.includes('pune plant line 1') || bName.includes('hq');
    }
    const rawLocation = (item.location || item.branchName || item.line || '').toLowerCase();
    if (rawLocation && !rawLocation.includes('head') && !rawLocation.includes('corporate') && !rawLocation.includes('line 1') && !rawLocation.includes('main')) {
      // If it explicitly belongs to another non-HO branch, filter it out
      const isOtherBranch = branches.some(
        (b) => !b.name.toLowerCase().includes('head') && rawLocation.includes(b.name.toLowerCase().slice(0, 4))
      );
      if (isOtherBranch) return false;
    }
    return true;
  }

  // Specific branch selected by ID
  const selectedBranchObj = branches.find((b) => b.id === selectedBranch);
  const targetName = (selectedBranchObj?.name || '').toLowerCase();

  if (item.branchId && item.branchId === selectedBranch) return true;
  if (item.branch?.id && item.branch.id === selectedBranch) return true;

  if (targetName) {
    const itemName = (item.branchName || item.branch?.name || item.line || '').toLowerCase();
    if (itemName && itemName.includes(targetName.slice(0, 4))) return true;
  }

  return false;
}
