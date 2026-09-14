import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { companiesApi } from '@/api/organization';
import type { Company } from '@/api/types';
import { useAuthStore } from '@/stores/auth-store';

import { isSuperAdminUser } from '@/lib/modules';

interface CompanyContextType {
  activeCompanyId: string | undefined;
  activeCompany: Company | undefined;
  companies: Company[];
  isLoading: boolean;
  setActiveCompanyId: (companyId: string) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY = 'ehcm_active_company_id';

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = isSuperAdminUser(user);

  const { data: rawCompanies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesApi.list,
  });

  const companies = useMemo(() => {
    if (!isSuperAdmin && user?.companyId) {
      return rawCompanies.filter((c) => c.id === user.companyId);
    }
    return rawCompanies;
  }, [rawCompanies, isSuperAdmin, user?.companyId]);

  const [activeCompanyId, setActiveCompanyIdState] = useState<string | undefined>(() => {
    if (!isSuperAdmin && user?.companyId) return user.companyId;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== 'ALL') return stored;
    return user?.companyId || undefined;
  });

  useEffect(() => {
    // If companies are still loading or empty, do NOT reset or overwrite localStorage
    if (isLoading || rawCompanies.length === 0) return;

    const storedId = localStorage.getItem(STORAGE_KEY);
    // If legacy 'ALL' is stored, purge it immediately
    if (storedId === 'ALL') {
      localStorage.removeItem(STORAGE_KEY);
    }

    const userAssignedMatch = user?.companyId ? rawCompanies.find((c) => c.id === user.companyId) : null;
    const empAssignedMatch = user?.employee?.companyId ? rawCompanies.find((c) => c.id === user?.employee?.companyId) : null;

    if (!isSuperAdmin) {
      const targetId = userAssignedMatch?.id || empAssignedMatch?.id || rawCompanies[0]?.id;
      if (targetId) {
        if (activeCompanyId !== targetId) {
          setActiveCompanyIdState(targetId);
        }
        localStorage.setItem(STORAGE_KEY, targetId);
      }
      return;
    }

    // Super Admin:
    // If valid specific company is stored in localStorage, use it
    if (storedId && storedId !== 'ALL' && rawCompanies.some((c) => c.id === storedId)) {
      if (activeCompanyId !== storedId) {
        setActiveCompanyIdState(storedId);
      }
    } else {
      // Auto-fetch default organization: user.companyId, Cravita, or first valid company
      const defaultCompany =
        userAssignedMatch?.id ||
        empAssignedMatch?.id ||
        rawCompanies.find((c) => c.name.toLowerCase().includes('cravita'))?.id ||
        rawCompanies[0]?.id;

      if (defaultCompany) {
        if (activeCompanyId !== defaultCompany) {
          setActiveCompanyIdState(defaultCompany);
        }
        localStorage.setItem(STORAGE_KEY, defaultCompany);
      }
    }
  }, [user?.companyId, user?.employee?.companyId, isSuperAdmin, rawCompanies, isLoading, activeCompanyId]);

  const setActiveCompanyId = (id: string) => {
    if (!isSuperAdmin && user?.companyId) {
      return;
    }
    if (!id || id === 'ALL') return;
    setActiveCompanyIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
    queryClient.invalidateQueries();
  };

  const activeCompany = activeCompanyId && activeCompanyId !== 'ALL'
    ? rawCompanies.find((c) => c.id === activeCompanyId) || rawCompanies[0]
    : rawCompanies[0];

  return (
    <CompanyContext.Provider
      value={{
        activeCompanyId,
        activeCompany,
        companies,
        isLoading,
        setActiveCompanyId,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

const defaultCompanyContext: CompanyContextType = {
  activeCompanyId: undefined,
  activeCompany: undefined,
  companies: [],
  isLoading: false,
  setActiveCompanyId: () => {},
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    const user = useAuthStore.getState().user;
    return {
      ...defaultCompanyContext,
      activeCompanyId: user?.companyId || undefined,
    };
  }
  return context;
};

