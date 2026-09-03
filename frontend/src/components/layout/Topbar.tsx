import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, ChevronRight, Bell, ShieldCheck, Video, Menu, GraduationCap, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { notificationStore, type PortalNotification } from '@/utils/notificationStore';

interface TopbarProps {
  onToggleMobileMenu?: () => void;
}

export function Topbar({ onToggleMobileMenu }: TopbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshToken, clear } = useAuthStore();

  // Dynamic Notifications State
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);

  const reloadNotifications = () => {
    const list = notificationStore.getNotificationsForUser(user?.id);
    setNotifications(list);
  };

  useEffect(() => {
    reloadNotifications();
    const interval = setInterval(reloadNotifications, 3000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notif: PortalNotification) => {
    notificationStore.markAsRead(notif.id);
    reloadNotifications();
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const handleMarkAllRead = () => {
    notificationStore.markAllAsRead();
    reloadNotifications();
  };

  const handleLogout = async () => {
    if (refreshToken) {
      await logoutApi(refreshToken).catch(() => undefined);
    }
    clear();
    navigate('/login');
  };

  const isSuperAdmin = user?.isSuperAdmin || user?.role === 'Super Admin';
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  const userInitials = useMemo(() => {
    if (user?.name) {
      const parts = user.name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    return 'AU';
  }, [user?.name]);

  const roleDisplay = useMemo(() => {
    if (isSuperAdmin) return 'Super Admin';
    if (user?.role) return user.role;
    return 'Employee';
  }, [isSuperAdmin, user?.role]);

  const departmentName = useMemo(() => {
    if (user?.departmentName) return user.departmentName;
    if (user?.department?.name) return user.department.name;
    return '';
  }, [user]);

  // Breadcrumbs Generator
  const breadcrumbs = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) return [{ title: 'Dashboard', path: '/dashboard' }];

    const items: { title: string; path: string }[] = [];
    let currentPath = '';

    const firstSeg = pathSegments[0];
    const foundModule = HCM_MODULES.find((m) => m.id === firstSeg || m.path === `/${firstSeg}`);

    if (foundModule) {
      currentPath = foundModule.path;
      items.push({ title: foundModule.name, path: currentPath });

      if (pathSegments.length > 1) {
        const subId = pathSegments[1];
        const foundSub = foundModule.submodules?.find(
          (s) => s.id === subId || s.path.endsWith(`/${subId}`)
        );

        if (foundSub) {
          currentPath = foundSub.path;
          items.push({ title: foundSub.name, path: currentPath });
        } else {
          const formattedSub = subId.charAt(0).toUpperCase() + subId.slice(1).replace(/-/g, ' ');
          items.push({ title: formattedSub, path: `${currentPath}/${subId}` });
        }
      }
    } else {
      pathSegments.forEach((seg) => {
        currentPath += `/${seg}`;
        const title = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
        items.push({ title, path: currentPath });
      });
    }

    return items;
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur-xs">
      {/* Breadcrumb / Left Side Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground md:hidden hover:bg-accent"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center text-xs">
          <ol className="flex items-center gap-1 text-muted-foreground">
            {breadcrumbs.map((crumb, idx) => (
              <li key={crumb.path} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="font-semibold text-foreground">{crumb.title}</span>
                ) : (
                  <span
                    onClick={() => navigate(crumb.path)}
                    className="hover:text-foreground cursor-pointer transition-colors"
                  >
                    {crumb.title}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Right Side Control Panel & User Menu */}
      <div className="flex items-center gap-3">
        {/* Status Indicator */}
        <Badge variant="outline" className="hidden lg:flex items-center gap-1.5 text-[11px] font-normal py-0.5 px-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live System Connected
        </Badge>

        {/* Dynamic Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-pulse">
                    {unreadCount}
                  </span>
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2">
            <DropdownMenuLabel className="text-xs font-bold flex items-center justify-between pb-1">
              <span>Portal Notifications & Activity</span>
              {unreadCount > 0 ? (
                <Badge className="bg-primary text-primary-foreground text-[10px]">
                  {unreadCount} New
                </Badge>
              ) : (
                <Badge className="bg-muted text-muted-foreground text-[10px]">All Read</Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <div className="space-y-1.5 py-1 max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No notifications.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-colors space-y-1 ${
                      notif.read
                        ? 'bg-background hover:bg-muted/50 border-border'
                        : 'bg-primary/5 hover:bg-primary/10 border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        {notif.type === 'TRAINING' ? (
                          <GraduationCap className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Video className="h-3.5 w-3.5 text-primary" />
                        )}
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="text-[9px] bg-primary text-primary-foreground font-bold px-1.5 py-0.5 rounded">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                      {notif.message}
                    </p>
                    <span className="text-[9px] text-muted-foreground block font-mono">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            <DropdownMenuSeparator />
            <div className="flex items-center justify-between pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
              >
                <Check className="h-3 w-3 mr-1" /> Mark All as Read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/learning/training-programs')}
                className="h-6 text-[10px] text-primary"
              >
                Go to Training →
              </Button>
            </div>
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

            <Avatar className="h-8 w-8 border border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground font-mono">
                  {user?.email || 'user@codigix.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate('/employees/directory')}
              className="cursor-pointer text-xs"
            >
              <User className="mr-2 h-3.5 w-3.5" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
