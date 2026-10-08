import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { isHrOrAdminUser } from '@/lib/modules';
import WorkforcePlanningPage from './WorkforcePlanningPage';

export default function WorkforcePage() {
  const { tab: routeTab } = useParams<{ tab?: string }>();
  const [searchParams] = useSearchParams();
  const requestedTab = routeTab || searchParams.get('tab');
  const user = useAuthStore((s) => s.user);
  const isHrOrAdmin = isHrOrAdminUser(user);

  if (requestedTab === 'my-shift-roster' || !isHrOrAdmin) {
    return <Navigate to="/workforce/shift-planning" replace />;
  }

  if (requestedTab === 'shift-types' || requestedTab === 'shift-planning') {
    return <Navigate to="/workforce/shift-planning?subtab=master" replace />;
  }
  if (requestedTab === 'shift-roster') {
    return <Navigate to="/workforce/shift-planning?subtab=roster" replace />;
  }
  if (requestedTab === 'machine-allocation') {
    return <Navigate to="/workforce/machine-allocation" replace />;
  }
  if (requestedTab === 'contractors') {
    return <Navigate to="/workforce/contractors" replace />;
  }
  if (requestedTab === 'labour') {
    return <Navigate to="/workforce/contractors" replace />;
  }
  if (requestedTab === 'reports') {
    return <Navigate to="/workforce/reports" replace />;
  }
  if (requestedTab === 'planning') {
    return <Navigate to="/workforce/planning" replace />;
  }

  return <WorkforcePlanningPage />;
}
