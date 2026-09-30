import React from 'react';
import { GitFork } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Branch } from '@/api/types';

export interface AssetBranchFilterProps {
  isSuperOrCompanyAdmin: boolean;
  isBranchAdmin: boolean;
  selectedBranch: string;
  onBranchChange: (branchId: string) => void;
  branches: Branch[];
  assignedBranchName?: string;
  className?: string;
}

export function AssetBranchFilter({
  isSuperOrCompanyAdmin,
  isBranchAdmin,
  selectedBranch,
  onBranchChange,
  branches,
  assignedBranchName,
  className = '',
}: AssetBranchFilterProps) {
  if (isSuperOrCompanyAdmin) {
    return (
      <div className={`relative shrink-0 ${className}`}>
        <Select value={selectedBranch} onValueChange={onBranchChange}>
          <SelectTrigger className="h-8 px-2.5 text-xs rounded-lg bg-background border-border/80 font-medium shadow-2xs hover:bg-muted/40 gap-1.5 w-auto shrink-0">
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
              .filter((b) => !b.name.toLowerCase().includes('head office'))
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

  if (isBranchAdmin) {
    return (
      <div
        className={`flex items-center gap-1.5 h-8 px-2.5 text-xs rounded-lg bg-muted/50 border border-border/80 font-medium text-foreground shrink-0 ${className}`}
      >
        <GitFork className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground text-xs">Branch:</span>
        <span className="font-semibold">{assignedBranchName || 'Assigned Branch'}</span>
      </div>
    );
  }

  return null;
}

export function matchAssetBranch(
  asset: { branchId?: string | null; branch?: { id?: string; name?: string } | null },
  selectedBranch: string,
  isBranchAdmin: boolean,
  userAssignedBranchId?: string,
  branches: { id: string; name: string }[] = []
): boolean {
  if (isBranchAdmin && userAssignedBranchId) {
    return asset.branchId === userAssignedBranchId || asset.branch?.id === userAssignedBranchId;
  }

  if (selectedBranch === 'HEAD_OFFICE') {
    if (asset.branchId && asset.branchId !== 'NONE' && asset.branchId !== 'HEAD_OFFICE') {
      const bObj = branches.find((b) => b.id === asset.branchId) || asset.branch;
      const bName = (bObj?.name || '').toLowerCase();
      const isHO = bName.includes('head') || bName.includes('corporate') || bName.includes('main');
      if (!isHO) return false;
    }
    return true;
  }

  if (selectedBranch === 'ALL') {
    return true;
  }

  return asset.branchId === selectedBranch || asset.branch?.id === selectedBranch;
}
