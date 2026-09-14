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
    return localStorage.getItem(STORAGE_KEY) || user?.companyId || undefined;
  });

  useEffect(() => {
    if (!isSuperAdmin && user?.companyId) {
      setActiveCompanyIdState(user.companyId);
      localStorage.setItem(STORAGE_KEY, user.companyId);
    } else if (user?.companyId) {
      const storedId = localStorage.getItem(STORAGE_KEY);
      if (storedId && companies.some((c) => c.id === storedId)) {
        setActiveCompanyIdState(storedId);
      } else {
        setActiveCompanyIdState(user.companyId);
        localStorage.setItem(STORAGE_KEY, user.companyId);
      }
    } else if (companies.length > 0) {
      const storedId = localStorage.getItem(STORAGE_KEY);
      const validStored = storedId && companies.some((c) => c.id === storedId);

      if (validStored) {
        if (activeCompanyId !== storedId) {
          setActiveCompanyIdState(storedId);
        }
      } else {
        const cravitaComp =
          companies.find((c) => c.name.toLowerCase().includes('cravita') && c.code === 'C-0034') ||
          companies.find((c) => c.name.toLowerCase().includes('cravita')) ||
          companies[0];
        const defaultId = cravitaComp.id;
        setActiveCompanyIdState(defaultId);
        localStorage.setItem(STORAGE_KEY, defaultId);
      }
    }
  }, [user?.companyId, isSuperAdmin, companies]);

  const setActiveCompanyId = (id: string) => {
    if (!isSuperAdmin && user?.companyId) {
      return;
    }
    setActiveCompanyIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
    queryClient.invalidateQueries();
  };

  const activeCompany = companies.find((c) => c.id === activeCompanyId);

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

