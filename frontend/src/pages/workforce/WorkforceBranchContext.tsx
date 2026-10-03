import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { branchesApi } from '@/api/organization';
import { useCompany } from '@/context/CompanyContext';
import { useAuthStore } from '@/stores/auth-store';
import { isBranchAdminUser, isSuperAdminUser, isCompanyAdminUser } from '@/lib/modules';
import type { Branch } from '@/api/types';

export interface WorkforceBranchContextType {
  selectedBranch: string;
  setSelectedBranch: (branchId: string) => void;
  branches: Branch[];
  isSuperAdmin: boolean;
  isHeadOfficeUser: boolean;
  isBranchUser: boolean;
  isBranchAdmin: boolean;
  isSuperOrCompanyAdmin: boolean;
  userAssignedBranchId?: string;
  assignedBranchName?: string;
  matchBranch: (item: {
    branchId?: string | null;
    branch?: { id?: string; name?: string } | null;
    branchName?: string | null;
    location?: string | null;
    line?: string | null;
  }) => boolean;
}

const WorkforceBranchContext = createContext<WorkforceBranchContextType | undefined>(undefined);

const STORAGE_KEY_BRANCH = 'ehcm_workforce_selected_branch';

export function WorkforceBranchProvider({
  companyId,
  children,
}: {
  companyId?: string;
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = isSuperAdminUser(user);
  const isCompanyAdmin = isCompanyAdminUser(user);
  const isBranchAdmin = isBranchAdminUser(user);
  const userAssignedBranchId = user?.branchId || user?.employee?.branchId;

  // Head Office user is any non-SuperAdmin who is either at Head Office or has no assigned branch
  const isHeadOfficeUser =
    !isSuperAdmin &&
    (!userAssignedBranchId ||
      userAssignedBranchId === 'NONE' ||
      userAssignedBranchId === 'HEAD_OFFICE');

  // Branch user is any non-SuperAdmin assigned to a specific branch (e.g. Cravita B, Cravita C)
  const isBranchUser =
    !isSuperAdmin &&
    Boolean(
      userAssignedBranchId &&
        userAssignedBranchId !== 'NONE' &&
        userAssignedBranchId !== 'HEAD_OFFICE'
    );

  const { activeCompanyId } = useCompany();
  const effectiveCompanyId = companyId || activeCompanyId || user?.companyId;

  const { data: branches = [] } = useQuery({
    queryKey: ['branches', effectiveCompanyId],
    queryFn: () => branchesApi.list(effectiveCompanyId),
    enabled: Boolean(effectiveCompanyId),
  });

  const [selectedBranch, setSelectedBranchState] = useState<string>(() => {
    if (isBranchUser && userAssignedBranchId) return userAssignedBranchId;
    if (isHeadOfficeUser) return 'HEAD_OFFICE';
    const stored = localStorage.getItem(STORAGE_KEY_BRANCH);
    return stored || 'HEAD_OFFICE';
  });

  useEffect(() => {
    if (isBranchUser && userAssignedBranchId) {
      setSelectedBranchState(userAssignedBranchId);
    } else if (isHeadOfficeUser) {
      setSelectedBranchState('HEAD_OFFICE');
    }
  }, [isBranchUser, isHeadOfficeUser, userAssignedBranchId]);

  const setSelectedBranch = (branchId: string) => {
    if (!isSuperAdmin) {
      // Non-SuperAdmin cannot change their branch scope
      return;
    }
    setSelectedBranchState(branchId);
    localStorage.setItem(STORAGE_KEY_BRANCH, branchId);
  };

  const assignedBranch = branches.find((b) => b.id === userAssignedBranchId);

  const matchBranch = useMemo(() => {
    return (item: {
      branchId?: string | null;
      branch?: { id?: string; name?: string } | null;
      branchName?: string | null;
      location?: string | null;
      line?: string | null;
    }): boolean => {
      // Helper function to safely match two branch names without false partial matches
      const isNameMatch = (nameA?: string | null, nameB?: string | null): boolean => {
        if (!nameA || !nameB) return false;
        const a = nameA.trim().toLowerCase();
        const b = nameB.trim().toLowerCase();
        if (a === b) return true;
        if (a.length > 5 && b.length > 5) {
          if (a.includes(b) || b.includes(a)) {
            const lastA = a.match(/[a-z0-9]$/)?.[0];
            const lastB = b.match(/[a-z0-9]$/)?.[0];
            if (lastA && lastB && lastA !== lastB) return false;
            return true;
          }
        }
        return false;
      };

      // 1. Branch User (e.g. Cravita B or Cravita C) is strictly scoped to their assigned branch
      if (isBranchUser && userAssignedBranchId) {
        if (item.branchId) return item.branchId === userAssignedBranchId;
        if (item.branch?.id) return item.branch.id === userAssignedBranchId;
        if (assignedBranch && item.branchName) {
          return isNameMatch(item.branchName, assignedBranch.name);
        }
        return false;
      }

      // 2. Head Office User: strictly scoped to Head Office / No Branch
      if (isHeadOfficeUser) {
        // If an item explicitly has a foreign branchId, hide it
        if (item.branchId && item.branchId !== 'NONE' && item.branchId !== 'HEAD_OFFICE') {
          const branchObj = branches.find((b) => b.id === item.branchId) || item.branch;
          const bName = (branchObj?.name || item.branchName || '').toLowerCase();
          return (
            bName.includes('head') ||
            bName.includes('corporate') ||
            bName.includes('main') ||
            bName.includes('hq')
          );
        }
        const rawLocation = (item.location || item.branchName || item.line || '').toLowerCase();
        if (
          rawLocation &&
          !rawLocation.includes('head') &&
          !rawLocation.includes('corporate') &&
          !rawLocation.includes('main') &&
          !rawLocation.includes('hq')
        ) {
          const isOtherBranch = branches.some((b) => {
            const bName = b.name.toLowerCase().trim();
            if (bName.includes('head') || bName.includes('corporate') || bName.includes('main') || bName.includes('hq')) return false;
            return isNameMatch(rawLocation, bName);
          });
          if (isOtherBranch) return false;
        }
        return true;
      }

      // 3. Super Admin: evaluate based on current dropdown selection
      if (selectedBranch === 'ALL') {
        return true;
      }

      if (selectedBranch === 'HEAD_OFFICE') {
        if (item.branchId && item.branchId !== 'NONE' && item.branchId !== 'HEAD_OFFICE') {
          const branchObj = branches.find((b) => b.id === item.branchId) || item.branch;
          const bName = (branchObj?.name || item.branchName || '').toLowerCase();
          return (
            bName.includes('head') ||
            bName.includes('corporate') ||
            bName.includes('main') ||
            bName.includes('hq')
          );
        }
        const rawLocation = (item.location || item.branchName || item.line || '').toLowerCase();
        if (
          rawLocation &&
          !rawLocation.includes('head') &&
          !rawLocation.includes('corporate') &&
          !rawLocation.includes('main') &&
          !rawLocation.includes('hq')
        ) {
          const isOtherBranch = branches.some((b) => {
            const bName = b.name.toLowerCase().trim();
            if (bName.includes('head') || bName.includes('corporate') || bName.includes('main') || bName.includes('hq')) return false;
            return isNameMatch(rawLocation, bName);
          });
          if (isOtherBranch) return false;
        }
        return true;
      }

      // Specific branch selected by Super Admin
      const selectedBranchObj = branches.find((b) => b.id === selectedBranch);
      const targetName = selectedBranchObj?.name || '';

      if (item.branchId && item.branchId === selectedBranch) return true;
      if (item.branch?.id && item.branch.id === selectedBranch) return true;

      if (targetName) {
        const itemName = item.branchName || item.branch?.name || item.location || item.line || '';
        if (itemName && isNameMatch(itemName, targetName)) return true;
      }

      return false;
    };
  }, [selectedBranch, isSuperAdmin, isHeadOfficeUser, isBranchUser, userAssignedBranchId, assignedBranch, branches]);

  return (
    <WorkforceBranchContext.Provider
      value={{
        selectedBranch,
        setSelectedBranch,
        branches,
        isSuperAdmin,
        isHeadOfficeUser,
        isBranchUser,
        isBranchAdmin,
        isSuperOrCompanyAdmin: isSuperAdmin,
        userAssignedBranchId,
        assignedBranchName: assignedBranch?.name,
        matchBranch,
      }}
    >
      {children}
    </WorkforceBranchContext.Provider>
  );
}


export function useWorkforceBranch() {
  const context = useContext(WorkforceBranchContext);
  if (!context) {
    // Return safe fallback if used outside provider
    return {
      selectedBranch: 'HEAD_OFFICE',
      setSelectedBranch: () => {},
      branches: [],
      isSuperAdmin: false,
      isHeadOfficeUser: true,
      isBranchUser: false,
      isBranchAdmin: false,
      isSuperOrCompanyAdmin: true,
      userAssignedBranchId: undefined,
      assignedBranchName: undefined,
      matchBranch: () => true,
    };
  }
  return context;
}
