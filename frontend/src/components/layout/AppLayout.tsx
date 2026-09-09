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

  const isLandingPage = location.pathname.startsWith('/landing');

  const handleCloseMobile = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleToggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  // Mobile Bottom Navigation: only show Attendance option per user request
  const bottomNavItems = [
    { label: 'Attendance', path: '/attendance-leave', icon: Clock },
  ];

  return (
    <div className="flex h-screen w-full bg-background relative overflow-hidden">
      {/* Hide ERP Sidebar on mobile */}
      {!isLandingPage && (
        <div className="hidden md:block h-full shrink-0">
          <Sidebar
            isOpenOnMobile={false}
            onCloseMobile={handleCloseMobile}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        {!isLandingPage && (
          <div className="hidden md:block">
            <Topbar onToggleMobileMenu={handleToggleMobileMenu} />
          </div>
        )}

        <main className={cn(
          "flex-1 min-h-0 overflow-y-auto bg-background pb-20 md:pb-8",
          isLandingPage ? "p-2 sm:p-3 lg:p-4" : "p-0 md:p-6 lg:p-8"
        )}>
          <div className={cn("mx-auto w-full", isLandingPage ? "max-w-full" : "max-w-[1600px]")}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar: Only Attendance per user request */}
      {!isLandingPage && (
        <nav className="fixed bottom-0 inset-x-0 h-16 bg-white/95 border-t border-slate-200 backdrop-blur-lg z-40 flex items-center justify-center md:hidden px-4 shadow-lg">
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
                  'flex flex-col items-center justify-center py-1 text-xs font-bold transition-colors cursor-pointer',
                  isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900',
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full transition-all mb-0.5',
                  isActive ? 'bg-indigo-50 border border-indigo-200 text-indigo-600 shadow-2xs' : 'text-slate-500'
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}
