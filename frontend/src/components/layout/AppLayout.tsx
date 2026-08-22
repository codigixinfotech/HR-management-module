import { useState, useCallback } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { LayoutDashboard, Clock, CalendarClock, CheckSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { isHrOrAdminUser } from '@/lib/modules';

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isHrOrAdmin = isHrOrAdminUser(user);

  const handleCloseMobile = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleToggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const bottomNavItems = isHrOrAdmin
    ? [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Employees', path: '/employees/directory', icon: User },
        { label: 'Attendance', path: '/attendance-leave/live', icon: Clock },
        { label: 'Tasks', path: '/tasks', icon: CheckSquare },
        { label: 'Payroll', path: '/payroll', icon: CalendarClock },
      ]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Attendance', path: '/attendance-leave/live', icon: Clock },
        { label: 'Leave', path: '/attendance-leave/leave', icon: CalendarClock },
        { label: 'Tasks', path: '/tasks/my-tasks', icon: CheckSquare },
        { label: 'Profile', path: '/employees/detail/me', icon: User },
      ];

  return (
    <div className="flex h-screen w-full bg-background relative overflow-hidden">
      <Sidebar
        isOpenOnMobile={isMobileMenuOpen}
        onCloseMobile={handleCloseMobile}
      />

      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        <Topbar onToggleMobileMenu={handleToggleMobileMenu} />

        <main className="flex-1 min-h-0 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <div className="mx-auto max-w-[1600px] w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (PWA Mobile Experience) */}
      <nav className="fixed bottom-0 inset-x-0 h-16 bg-card/95 border-t border-border/80 backdrop-blur-lg z-40 flex items-center justify-around md:hidden px-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path.split('?')[0]));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                setIsMobileMenuOpen(false);
                document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors cursor-pointer',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5 mb-0.5 transition-transform', isActive && 'scale-110')} />
              <span className="truncate max-w-[64px] text-center">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
