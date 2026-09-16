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

  const userCompanyId = user?.companyId || (user?.employee as any)?.companyId;
  const companies = useMemo(() => {
    if (!isSuperAdmin && userCompanyId) {
      return rawCompanies.filter((c) => c.id === userCompanyId);
    }
    return rawCompanies;
  }, [rawCompanies, isSuperAdmin, userCompanyId]);

  const [activeCompanyId, setActiveCompanyIdState] = useState<string | undefined>(() => {
    const userCompany = user?.companyId || user?.employee?.companyId;
    if (userCompany) return userCompany;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== 'ALL') return stored;
    return undefined;
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
    const userCompany = userAssignedMatch?.id || empAssignedMatch?.id;

    if (!isSuperAdmin) {
      const targetId = userCompany || rawCompanies[0]?.id;
      if (targetId) {
        if (activeCompanyId !== targetId) {
          setActiveCompanyIdState(targetId);
        }
        localStorage.setItem(STORAGE_KEY, targetId);
      }
      return;
    }

    // Super Admin:
    // If user has an assigned company, prioritize their company as default unless they explicitly switched
    const hasSwitchedInSession = sessionStorage.getItem('ehcm_session_switched_company') === 'true';
    if (userCompany && (!hasSwitchedInSession || storedId !== activeCompanyId)) {
      if (!hasSwitchedInSession) {
        if (activeCompanyId !== userCompany) {
          setActiveCompanyIdState(userCompany);
        }
        localStorage.setItem(STORAGE_KEY, userCompany);
        return;
      }
    }

    if (storedId && storedId !== 'ALL' && rawCompanies.some((c) => c.id === storedId)) {
      if (activeCompanyId !== storedId) {
        setActiveCompanyIdState(storedId);
      }
    } else {
      // Auto-fetch default organization: user.companyId, Cravita, or first valid company
      const defaultCompany =
        userCompany ||
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
    if (!id || id === 'ALL') return;
    sessionStorage.setItem('ehcm_session_switched_company', 'true');
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

