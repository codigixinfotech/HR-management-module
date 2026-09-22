import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getModulesForRole,
  isSuperAdminUser,
  isBranchAdminUser,
  isCompanyAdminUser,
  isManagerOrHrOrAdmin,
  type HcmModule,
  type SubModuleItem,
} from '@/lib/modules';
import { useAuthStore } from '@/stores/auth-store';
import { useCompany } from '@/context/CompanyContext';
import { subscriptionsApi } from '@/api/plansApi';
import { useRecruitmentConfig } from '@/hooks/useRecruitmentConfig';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Zap,
  Building2,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

function normalizePath(p: string) {
  const [base] = p.split('?');
  if (base === '/profile') return '/employees/detail/me';
  if (base === '/organization') return '/organization/structure';
  if (base === '/recruitment') return '/recruitment/requisitions';
  if (base === '/employees') return '/employees/directory';
  if (base === '/attendance-leave') return '/attendance-leave';
  if (base === '/dashboard') return '/dashboard/overview';
  return base;
}

export function Sidebar({ isOpenOnMobile, onCloseMobile }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { activeCompanyId } = useCompany();
  const { isAssessmentEnabled } = useRecruitmentConfig();
  const [menuSearch, setMenuSearch] = useState('');

  const modulesForRole = useMemo(() => getModulesForRole(user), [user]);
  const isSuperAdmin = useMemo(() => isSuperAdminUser(user), [user]);
  const isBranchAdmin = useMemo(() => isBranchAdminUser(user), [user]);
  const isCompanyAdmin = useMemo(() => isCompanyAdminUser(user), [user]);

  // Fetch active company's subscription modules
  const { data: subData } = useQuery({
    queryKey: ['company-subscription', activeCompanyId],
    queryFn: () => (activeCompanyId ? subscriptionsApi.getCompanySubscription(activeCompanyId) : null),
    enabled: Boolean(activeCompanyId),
  });

  const enabledModuleKeysSet = useMemo(() => {
    if (!subData?.moduleEntitlementMatrix) return null;
    const enabledKeys = subData.moduleEntitlementMatrix
      .filter((m: any) => m.isEnabled)
      .map((m: any) => m.key);
    return new Set(enabledKeys);
  }, [subData]);

  const companyModules = useMemo(() => {
    let base = modulesForRole;

    if (!isSuperAdmin && !isBranchAdmin && !isCompanyAdmin && enabledModuleKeysSet) {
      base = modulesForRole.filter((mod) => {
        // Always allow Dashboard, Settings/Administration, and Landing Page Demo
        if (mod.key === 'dashboard' || mod.key === 'administration' || mod.key === 'landing-page') {
          return true;
        }
        let catalogKey = mod.key;
        if (mod.key === 'employees' || mod.key === 'tasks') catalogKey = 'employee-management';
        if (mod.key === 'ehs') catalogKey = 'safety-ehs';
        if (mod.key === 'iot-devices') catalogKey = 'integrations-iot';

        return enabledModuleKeysSet.has(catalogKey);
      });
    }

    // Global Recruitment Assessment Feature Toggle:
    // If Assessment is OFF -> Hide "Assessments & Question Bank" from Recruitment navigation
    if (!isAssessmentEnabled) {
      base = base.map((mod) => {
        if (mod.key === 'recruitment' && mod.subItems) {
          return {
            ...mod,
            subItems: mod.subItems.filter(
              (sub) => sub.key !== 'assessments' && !sub.path.includes('/assessments')
            ),
          };
        }
        return mod;
      });
    }

    // Role-based visibility for Attendance & Leave
    const isManagerOrAdmin = isManagerOrHrOrAdmin(user);
    base = base.map((mod) => {
      if (mod.key === 'attendance-leave' && mod.subItems) {
        return {
          ...mod,
          subItems: mod.subItems.map((sub) =>
            sub.key === 'register'
              ? { ...sub, label: isManagerOrAdmin ? 'Attendance Register' : 'My Attendance Register' }
              : sub
          ),
        };
      }
      return mod;
    });

    return base;
  }, [modulesForRole, enabledModuleKeysSet, isSuperAdmin, isAssessmentEnabled, user]);

  // Track expanded parent sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Close mobile sidebar on actual route changes only
  useEffect(() => {
    onCloseMobile?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  // Check if a sub-item / route is currently active
  const isSubItemActive = useCallback(
    (subPath: string) => {
      const currentPath = location.pathname;
      const currentSearch = location.search;

      const normCurrent = normalizePath(currentPath);
      const [subBasePath, subQuery] = subPath.split('?');
      const normSubBase = normalizePath(subBasePath);

      // Base path must match
      const isPathMatch =
        normCurrent === normSubBase ||
        currentPath === subBasePath ||
        (normCurrent === '/attendance-leave/live' && normSubBase === '/attendance-leave') ||
        (normCurrent === '/attendance-leave' && normSubBase === '/attendance-leave/live');

      if (!isPathMatch) return false;

      // If subPath specifies a query string
      if (subQuery) {
        const subParams = new URLSearchParams(subQuery);
        const currentParams = new URLSearchParams(currentSearch);

        for (const [key, val] of subParams.entries()) {
          if (currentParams.get(key) !== val) return false;
        }
        return true;
      }

      // If subPath has NO query string
      if (currentSearch) {
        const currentParams = new URLSearchParams(currentSearch);
        const hasSpecificParam = currentParams.get('tab') || currentParams.get('details');
        if (hasSpecificParam) {
          return false;
        }
      }

      return true;
    },
    [location.pathname, location.search],
  );

  // Track manually collapsed sections by the user so auto-expand doesn't fight them
  const [userCollapsed, setUserCollapsed] = useState<Record<string, boolean>>({});

  // Auto-expand section containing the active route/tab
  useEffect(() => {
    const matchedModule = companyModules.find(
      (m) =>
        m.subItems?.some((sub) => isSubItemActive(sub.path)) ||
        (!m.subItems?.length && isSubItemActive(m.path)),
    );

    if (matchedModule) {
      if (!userCollapsed[matchedModule.key]) {
        setOpenSections((prev) => {
          if (prev[matchedModule.key]) return prev;
          return { ...prev, [matchedModule.key]: true };
        });
      }
    }
  }, [companyModules, isSubItemActive, userCollapsed]);

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => {
      const willBeOpen = !prev[key];
      setUserCollapsed((uc) => ({ ...uc, [key]: !willBeOpen }));
      return { ...prev, [key]: willBeOpen };
    });
  }, []);

  // Safe navigation coordinator to eliminate rapid-click freezes and duplicate history entries
  const lastNavTimeRef = useRef<number>(0);
  const lastNavTargetRef = useRef<string>('');

  const handleSafeNavigate = useCallback(
    (targetPath: string, parentKey?: string) => {
      const currentFull = location.pathname + location.search;

      // 1. If already on this exact path or equivalent normalized path, prevent duplicate navigation
      if (
        currentFull === targetPath ||
        (normalizePath(location.pathname) === normalizePath(targetPath) && !targetPath.includes('?'))
      ) {
        return;
      }

      // 2. Prevent rapid duplicate clicks on the EXACT same route (< 250ms)
      const now = Date.now();
      if (lastNavTargetRef.current === targetPath && now - lastNavTimeRef.current < 250) {
        return;
      }

      lastNavTimeRef.current = now;
      lastNavTargetRef.current = targetPath;

      if (parentKey) {
        setOpenSections((prev) => (prev[parentKey] ? prev : { ...prev, [parentKey]: true }));
        setUserCollapsed((prev) => (prev[parentKey] ? { ...prev, [parentKey]: false } : prev));
      }

      navigate(targetPath);
      onCloseMobile?.();
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' });
    },
    [location.pathname, location.search, navigate, onCloseMobile],
  );

  const handleParentClick = useCallback(
    (mod: HcmModule) => {
      const hasSubItems = Boolean(mod.subItems && mod.subItems.length > 0);
      const hasActiveChild = Boolean(mod.subItems?.some((sub) => isSubItemActive(sub.path)));
      const isDirectActive = !hasSubItems && isSubItemActive(mod.path);
      const isCurrentlyInModule = hasActiveChild || isDirectActive;

      if (hasSubItems) {
        if (!isCurrentlyInModule) {
          // Navigating into a new module from another page:
          // Open section and navigate to primary sub-item (never collapse!)
          setOpenSections((prev) => (prev[mod.key] ? prev : { ...prev, [mod.key]: true }));
          setUserCollapsed((prev) => (prev[mod.key] ? { ...prev, [mod.key]: false } : prev));
          const primaryTarget = mod.subItems?.[0]?.path || mod.path;
          handleSafeNavigate(primaryTarget, mod.key);
        } else {
          // Already inside this module: toggle section open/closed
          toggleSection(mod.key);
        }
      } else {
        handleSafeNavigate(mod.path);
      }
    },
    [isSubItemActive, handleSafeNavigate, toggleSection],
  );

  // Filter modules and subItems by search query
  const filteredModules = useMemo(() => {
    if (!menuSearch.trim()) return companyModules;

    const query = menuSearch.toLowerCase();

    return companyModules
      .map((mod) => {
        const parentMatches = mod.label.toLowerCase().includes(query);
        const matchedSubs = mod.subItems?.filter((sub) => sub.label.toLowerCase().includes(query)) || [];

        if (parentMatches || matchedSubs.length > 0) {
          return {
            ...mod,
            subItems: matchedSubs.length > 0 ? matchedSubs : mod.subItems,
          };
        }
        return null;
      })
      .filter(Boolean) as HcmModule[];
  }, [menuSearch, companyModules]);

  const effectiveModulesCount =
    isSuperAdmin || isBranchAdmin || isCompanyAdmin
      ? (subData?.totalModulesCount || 25)
      : (subData?.enabledModulesCount ?? filteredModules.length);

  return (
    <>
      {/* ── 1. DESKTOP SIDEBAR (Full Viewport Height Pinned) ── */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-border bg-card text-card-foreground shadow-2xs select-none h-full shrink-0 z-20 overflow-hidden">
        <SidebarTreeContent
          menuSearch={menuSearch}
          setMenuSearch={setMenuSearch}
          filteredModules={filteredModules}
          openSections={openSections}
          toggleSection={toggleSection}
          isSubItemActive={isSubItemActive}
          onParentClick={handleParentClick}
          handleSafeNavigate={handleSafeNavigate}
          enabledModulesCount={effectiveModulesCount}
        />
      </aside>

      {/* ── 2. MOBILE NAVIGATION DRAWER (Strictly md:hidden, high z-index fixed drawer) ── */}
      {isOpenOnMobile && (
        <div
          className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-[9999] w-[min(280px,85vw)] h-[100dvh] bg-card text-card-foreground border-r border-border shadow-2xl flex flex-col transition-transform duration-250 ease-in-out overflow-hidden md:hidden select-none',
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full pointer-events-none',
        )}
      >
        <SidebarTreeContent
          menuSearch={menuSearch}
          setMenuSearch={setMenuSearch}
          filteredModules={filteredModules}
          openSections={openSections}
          toggleSection={toggleSection}
          isSubItemActive={isSubItemActive}
          onParentClick={handleParentClick}
          handleSafeNavigate={handleSafeNavigate}
          onCloseMobile={onCloseMobile}
          isMobileDrawer
          enabledModulesCount={effectiveModulesCount}
        />
      </aside>
    </>
  );
}

interface SidebarTreeContentProps {
  menuSearch: string;
  setMenuSearch: (v: string) => void;
  filteredModules: HcmModule[];
  openSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
  isSubItemActive: (path: string) => boolean;
  onParentClick: (mod: HcmModule) => void;
  handleSafeNavigate: (targetPath: string, parentKey?: string) => void;
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
  enabledModulesCount?: number;
}

function SidebarTreeContent({
  menuSearch,
  setMenuSearch,
  filteredModules,
  openSections,
  toggleSection,
  isSubItemActive,
  onParentClick,
  handleSafeNavigate,
  onCloseMobile,
  isMobileDrawer,
  enabledModulesCount,
}: SidebarTreeContentProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── 1. Brand Header ── */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-border bg-muted/20 shrink-0">
        <div className="flex items-center gap-3">
          <div
            onClick={() => handleSafeNavigate('/dashboard')}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/25 transition-transform hover:scale-105 active:scale-95 shrink-0"
          >
            <Building2 className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-semibold text-foreground truncate leading-tight">
              EHCM Platform
            </span>
            <span className="text-[9.5px] uppercase tracking-widest text-primary font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Enterprise Suite
            </span>
          </div>
        </div>

        {/* Close X button inside mobile drawer */}
        {isMobileDrawer && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer md:hidden"
            title="Close Menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ── 2. Search Filter ── */}
      <div className="p-3 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search menu & submenus..."
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            className="h-8 pl-8 pr-7 text-xs bg-muted/40 border-input text-foreground placeholder:text-muted-foreground focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring rounded-lg transition-all"
          />
          {menuSearch && (
            <button
              onClick={() => setMenuSearch('')}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── 3. Scrollable Navigation Tree ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
        <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 flex items-center justify-between">
          <span>Main Navigation</span>
          <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[9px] font-semibold">
            {enabledModulesCount ?? filteredModules.length} Modules
          </span>
        </div>

        {filteredModules.map((mod) => {
          const Icon = mod.icon;
          const hasSubItems = Boolean(mod.subItems && mod.subItems.length > 0);
          const isExpanded = Boolean(openSections[mod.key]) || Boolean(menuSearch);

          const hasActiveChild = Boolean(mod.subItems?.some((sub) => isSubItemActive(sub.path)));
          const isDirectActive = !hasSubItems && isSubItemActive(mod.path);

          return (
            <div key={mod.key} className="space-y-0.5">
              {/* Parent Menu Item: Single onClick calling onParentClick */}
              <button
                type="button"
                onClick={() => onParentClick(mod)}
                className={cn(
                  'w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 group active:scale-98 relative cursor-pointer',
                  isDirectActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                    : hasActiveChild
                    ? 'bg-muted/40 text-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg transition-colors shrink-0',
                      isDirectActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : hasActiveChild
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-foreground',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate text-xs font-semibold">{mod.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {hasSubItems && (
                    <span
                      className={cn(
                        'text-[9.5px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums',
                        hasActiveChild ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {mod.subItems?.length}
                    </span>
                  )}
                  {hasSubItems && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection(mod.key);
                      }}
                      className="p-0.5 rounded hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                      title={isExpanded ? 'Collapse section' : 'Expand section'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                      )}
                    </span>
                  )}
                </div>
              </button>

              {/* Nested Sub-Menu List */}
              {hasSubItems && isExpanded && (
                <div className="mt-0.5 ml-4 pl-3 border-l-2 border-border/70 space-y-1 py-1 animate-in fade-in duration-150">
                  {mod.subItems?.map((sub: SubModuleItem) => {
                    const isSubActive = isSubItemActive(sub.path);

                    return (
                      <NavLink
                        key={sub.key}
                        to={sub.path}
                        onClick={(e) => {
                          e.preventDefault();
                          handleSafeNavigate(sub.path, mod.key);
                        }}
                        className={cn(
                          'group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95 relative cursor-pointer',
                          isSubActive
                            ? 'bg-primary text-primary-foreground font-semibold shadow-2xs scale-[1.01]'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full shrink-0 transition-all duration-150',
                              isSubActive
                                ? 'bg-primary-foreground ring-2 ring-primary-foreground/30 scale-125'
                                : 'bg-muted-foreground/40 group-hover:bg-primary/70',
                            )}
                          />
                          <span className="truncate text-xs">{sub.label}</span>
                        </div>

                        {sub.badge ? (
                          <Badge
                            className={cn(
                              'px-1.5 py-0 text-[9px] font-semibold',
                              isSubActive
                                ? 'bg-primary-foreground/20 text-primary-foreground border-none'
                                : 'bg-primary/10 text-primary border border-primary/20',
                            )}
                          >
                            {sub.badge}
                          </Badge>
                        ) : (
                          <ChevronRight
                            className={cn(
                              'h-3 w-3 transition-all duration-150 transform',
                              isSubActive
                                ? 'opacity-100 text-primary-foreground translate-x-0'
                                : 'text-muted-foreground/40 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5',
                            )}
                          />
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 4. System Status Footer ── */}
      <div className="p-3 border-t border-border bg-muted/20 mt-auto shrink-0">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-500 fill-amber-400" /> EHCM System
          </span>
          <span className="flex items-center gap-1 font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            100% Operational
          </span>
        </div>
      </div>
    </div>
  );
}
