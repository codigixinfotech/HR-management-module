import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUserEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  departmentId: string | null;
  departmentName: string | null;
  designationId: string | null;
  designationTitle: string | null;
}

export interface AuthUser {
  userId: string;
  email: string;
  companyId: string | null;
  mustResetPassword?: boolean;
  permissions: string[];
  roles?: string[];
  primaryRole?: string;
  employee?: AuthUserEmployee | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  clear: () => void;
  hasPermission: (code: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
      hasPermission: (code) => {
        const user = get().user;
        if (!user) return false;
        const permissions = user.permissions ?? [];
        if (permissions.includes('*')) return true;
        if (permissions.includes(code)) return true;

        const parts = code.split('.');
        const mod = parts[0];
        const act = parts[1] || 'view';

        const normMod = mod.toLowerCase().replace(/[-_]/g, '');

        return permissions.some((p) => {
          if (p === '*') return true;
          const pParts = p.toLowerCase().split('.');
          const normPMod = pParts[0]?.replace(/[-_]/g, '');
          const pAct = pParts[1] || '';

          const isSameModule =
            normPMod === normMod ||
            (normMod === 'performance' && normPMod === 'performancemanagement') ||
            (normMod === 'employees' && normPMod === 'employeemanagement') ||
            (normMod === 'tasks' && normPMod === 'employeemanagement') ||
            (normMod === 'compliance' && (normPMod === 'statutorytaxes' || normPMod === 'labourcompliance')) ||
            (normMod === 'learning' && normPMod === 'lms');

          if (!isSameModule) return false;

          if (!pAct || pAct === '*' || pAct === 'manage' || pAct === act) return true;
          if (act === 'view' && (pAct === 'read' || pAct === 'view')) return true;
          if ((act === 'create' || act === 'edit' || act === 'delete') && (pAct === 'write' || pAct === act)) return true;

          return false;
        });
      },
    }),
    { name: 'ehcm-auth' },
  ),
);
