import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { companiesApi } from '@/api/organization';
import type { Company } from '@/api/types';
import { useAuthStore } from '@/stores/auth-store';

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

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesApi.list,
  });

  const [activeCompanyId, setActiveCompanyIdState] = useState<string | undefined>(() => {
    return localStorage.getItem(STORAGE_KEY) || undefined;
  });

  const user = useAuthStore((s) => s.user);

  const isSuperAdmin = Boolean(
    user?.permissions?.includes('*') ||
    user?.roles?.some(
      (r) => r.toUpperCase().includes('SUPER_ADMIN') || r.toUpperCase() === 'SUPERADMIN'
    ) ||
    user?.primaryRole?.toUpperCase().includes('SUPER_ADMIN')
  );

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
        const defaultId = companies[0].id;
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

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
