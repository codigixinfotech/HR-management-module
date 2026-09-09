import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { useCompany } from '@/context/CompanyContext';
import { subscriptionsApi } from '@/api/plansApi';
import { isHrOrAdminUser, isSuperAdminUser } from '@/lib/modules';

const ADMIN_ONLY_ROUTES = [
  '/organization',
  '/recruitment',
  '/payroll',
  '/compliance',
  '/performance',
  '/workforce',
  '/asset-management',
  '/ehs',
  '/ai-intelligence',
  '/iot-devices',
  '/reports-analytics',
  '/administration',
  '/integrations',
];

const ROUTE_TO_MODULE_KEY: Record<string, string> = {
  '/organization': 'organization',
  '/recruitment': 'recruitment',
  '/employees': 'employee-management',
  '/attendance-leave': 'attendance-leave',
  '/payroll': 'payroll',
  '/compliance': 'pf-esic',
  '/performance': 'performance',
  '/learning': 'learning',
  '/workforce': 'workforce-planning',
  '/asset-management': 'asset-management',
  '/travel-expense': 'travel-expense',
  '/ehs': 'safety-ehs',
  '/employee-experience': 'employee-experience',
  '/ai-intelligence': 'ai-intelligence',
  '/iot-devices': 'integrations-iot',
};

export function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const { activeCompanyId } = useCompany();
  const location = useLocation();
  const currentPath = location.pathname;

  // Fetch active company's subscription modules
  const { data: subData } = useQuery({
    queryKey: ['company-subscription', activeCompanyId],
    queryFn: () => (activeCompanyId ? subscriptionsApi.getCompanySubscription(activeCompanyId) : null),
    enabled: Boolean(activeCompanyId && accessToken),
  });

  if (
    currentPath.startsWith('/careers') ||
    currentPath.startsWith('/auth') ||
    currentPath === '/login'
  ) {
    return <Outlet />;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const isSuperAdmin = isSuperAdminUser(user);
  const isHrOrAdmin = isHrOrAdminUser(user);
  const isEmployee = !isHrOrAdmin && !isSuperAdmin;

  // 1. Role Access Check
  const isAdminOnly =
    ADMIN_ONLY_ROUTES.some((route) => currentPath === route || currentPath.startsWith(`${route}/`)) ||
    (currentPath.startsWith('/employees') && !currentPath.startsWith('/employees/detail/me'));

  if (isEmployee && isAdminOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  // 2. Subscription Module Access Check (Skipped for Super Admin)
  if (!isSuperAdmin && subData?.moduleEntitlementMatrix && isHrOrAdmin) {
    const matchedRoutePrefix = Object.keys(ROUTE_TO_MODULE_KEY).find(
      (prefix) => currentPath === prefix || currentPath.startsWith(`${prefix}/`),
    );

    if (matchedRoutePrefix) {
      const requiredModuleKey = ROUTE_TO_MODULE_KEY[matchedRoutePrefix];
      const isEnabled = subData.moduleEntitlementMatrix.some(
        (m: any) => m.key === requiredModuleKey && m.isEnabled,
      );

      // If module is not enabled in company subscription, redirect to dashboard
      if (!isEnabled) {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return <Outlet />;
}
