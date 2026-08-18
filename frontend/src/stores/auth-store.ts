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
        const permissions = get().user?.permissions ?? [];
        return permissions.includes('*') || permissions.includes(code);
      },
    }),
    { name: 'ehcm-auth' },
  ),
);
