import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, ChevronRight, Bell, ShieldCheck } from 'lucide-react';
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

export function Topbar() {
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
    <header className="flex h-16 items-center justify-between border-b bg-card/80 px-6 backdrop-blur-md">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-muted-foreground">{breadcrumb.moduleLabel}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
        <span className=" font-semibold text-foreground">{breadcrumb.subLabel}</span>
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* System Health Badge */}
        <Badge
          variant="outline"
          className="hidden items-center gap-1.5 border-success/20 bg-success/10 px-2.5 py-1 text-xs font-normal text-success sm:flex"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          Live System Connected
        </Badge>

        {/* Notifications Mock */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </button>

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
