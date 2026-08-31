import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, ChevronRight, Bell, ShieldCheck, Video, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout as logoutApi } from '@/api/auth';
import { HCM_MODULES } from '@/lib/modules';

interface TopbarProps {
  onToggleMobileMenu?: () => void;
}

export function Topbar({ onToggleMobileMenu }: TopbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshToken, clear } = useAuthStore();

  const handleLogout = async () => {
    if (refreshToken) {
      await logoutApi(refreshToken).catch(() => undefined);
    }
    clear();
    navigate('/login');
  };

  const displayName =
    user?.employee?.fullName ||
    (user?.employee?.firstName
      ? `${user.employee.firstName} ${user.employee.lastName}`.trim()
      : user?.email?.split('@')[0] ?? 'User');

  const departmentName = user?.employee?.departmentName || null;
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
  const roleDisplay = user?.primaryRole || (isSuperAdmin ? 'Super Admin' : 'Employee');
  const employeeCode = user?.employee?.employeeCode;

  const initials =
    user?.employee?.firstName && user?.employee?.lastName
      ? `${user.employee.firstName[0]}${user.employee.lastName[0]}`.toUpperCase()
      : user?.email?.slice(0, 2).toUpperCase() ?? 'SM';

  // Compute current breadcrumbs based on current pathname & search query
  const breadcrumb = useMemo(() => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    const matchedModule = HCM_MODULES.find(
      (m) =>
        m.path === currentPath ||
        m.subItems?.some(
          (sub) => sub.path === `${currentPath}${currentSearch}` || sub.path.split('?')[0] === currentPath,
        ),
    );

    if (!matchedModule) {
      return { moduleLabel: 'EHCM Platform', subLabel: 'Overview' };
    }

    const matchedSub = matchedModule.subItems?.find(
      (sub) => sub.path === `${currentPath}${currentSearch}`,
    ) || matchedModule.subItems?.find((sub) => sub.path.split('?')[0] === currentPath);

    return {
      moduleLabel: matchedModule.label,
      subLabel: matchedSub ? matchedSub.label : 'Dashboard',
    };
  }, [location.pathname, location.search]);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/80 px-4 md:px-6 backdrop-blur-md sticky top-0 z-30">
      {/* Mobile Menu Toggle & Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMobileMenu?.();
          }}
          className="p-2 rounded-xl bg-accent/60 text-foreground hover:bg-accent active:scale-95 transition-transform md:hidden cursor-pointer shrink-0 z-40"
          title="Open Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5 stroke-[2.2]" />
        </button>

        {location.pathname.startsWith('/landing') ? (
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        ) : (
          <>
            <span className="text-muted-foreground truncate max-w-[110px] sm:max-w-none">{breadcrumb.moduleLabel}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
            <span className="font-semibold text-foreground truncate max-w-[120px] sm:max-w-none">{breadcrumb.subLabel}</span>
          </>
        )}
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-4">
        <Badge
          variant="outline"
          className="hidden items-center gap-1.5 border-success/20 bg-success/10 px-2.5 py-1 text-xs font-normal text-success sm:flex"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          Live System Connected
        </Badge>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary animate-ping" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2">
            <DropdownMenuLabel className="text-xs font-bold flex items-center justify-between pb-1">
              <span>Interview & Activity Reminders</span>
              <Badge className="bg-primary/20 text-primary text-[10px]">Live Sync</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-2 py-1">
              <div
                onClick={() => navigate('/recruitment/interviews')}
                className="p-2.5 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5 text-primary" /> Interview Panel Scheduled
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                    Reminders Active
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  You are assigned to candidate interview panels. Click to view roster & join meeting rooms.
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate('/recruitment/interviews')}
              className="text-xs font-semibold text-primary justify-center cursor-pointer py-1.5"
            >
              Go to Recruitment Interviews Roster →
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border p-1 pl-3 hover:bg-accent transition-all focus-visible:outline-hidden cursor-pointer">
            <div className="flex flex-col items-end text-right">
              <span className="text-xs font-semibold leading-tight text-foreground">
                {displayName}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                {isSuperAdmin && (
                  <ShieldCheck className="h-3 w-3 text-primary inline" />
                )}
                {roleDisplay}{departmentName ? ` • ${departmentName}` : ''}
              </span>
            </div>
            <Avatar className="h-8 w-8 border">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1.5 p-1">
                <p className="text-sm font-semibold leading-none text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {employeeCode && (
                    <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-mono border-primary/20 bg-primary/5 text-primary">
                      {employeeCode}
                    </Badge>
                  )}
                  {departmentName && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                      {departmentName}
                    </Badge>
                  )}
                  <Badge
                    variant={isSuperAdmin ? 'default' : 'outline'}
                    className="px-1.5 py-0 text-[10px] font-normal"
                  >
                    {roleDisplay}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="cursor-not-allowed">
              <User className="mr-2 h-4 w-4" /> Profile & Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
