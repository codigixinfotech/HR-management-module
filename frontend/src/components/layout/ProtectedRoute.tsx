import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { isHrOrAdminUser } from '@/lib/modules';

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

export function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const currentPath = location.pathname;

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

  const isHrOrAdmin = isHrOrAdminUser(user);
  const isEmployee = !isHrOrAdmin;

  // Check if route is restricted for standard employees
  const isAdminOnly =
    ADMIN_ONLY_ROUTES.some((route) => currentPath === route || currentPath.startsWith(`${route}/`)) ||
    (currentPath.startsWith('/employees') && !currentPath.startsWith('/employees/detail/me'));

  if (isEmployee && isAdminOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
