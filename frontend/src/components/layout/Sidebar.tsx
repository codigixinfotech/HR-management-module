import { useState, useMemo, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { HCM_MODULES, type HcmModule, type SubModuleItem } from '@/lib/modules';
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

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuSearch, setMenuSearch] = useState('');

  // Track expanded parent sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    dashboard: true,
    organization: true,
  });

  // Auto-expand section containing the active route/tab
  useEffect(() => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    const matchedModule = HCM_MODULES.find(
      (m) =>
        m.path === currentPath ||
        m.subItems?.some((sub) => {
          const subBase = sub.path.split('?')[0];
          return subBase === currentPath || sub.path === `${currentPath}${currentSearch}`;
        }),
    );

    if (matchedModule) {
      setOpenSections((prev) => ({ ...prev, [matchedModule.key]: true }));
    }
  }, [location.pathname, location.search]);

  // Check if a sub-item is currently active based on path and query parameters
  const isSubItemActive = (subPath: string, parentPath: string) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;
    const currentFull = `${currentPath}${currentSearch}`;

    // 1. Direct full match
    if (currentFull === subPath) return true;

    // 2. Tab parameter matching
    const currentParams = new URLSearchParams(currentSearch);
    const currentTab = currentParams.get('tab');

    if (subPath.includes('?tab=')) {
      const subTab = subPath.split('?tab=')[1]?.split('&')[0];
      const subBasePath = subPath.split('?')[0];

      if (currentPath === subBasePath) {
        if (currentTab) {
          return currentTab === subTab;
        } else {
          // Default to matching the first subItem of the parent module if no tab is explicitly in URL
          const parentMod = HCM_MODULES.find((m) => m.path === parentPath);
          return parentMod?.subItems?.[0]?.path === subPath;
        }
      }
    }

    // 3. Exact path match without search
    if (!currentSearch && (subPath === currentPath || subPath === parentPath)) {
      return true;
    }

    return false;
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter modules and subItems by search query
  const filteredModules = useMemo(() => {
    if (!menuSearch.trim()) return HCM_MODULES;

    const query = menuSearch.toLowerCase();

    return HCM_MODULES.map((mod) => {
      const parentMatches = mod.label.toLowerCase().includes(query);
      const matchedSubs = mod.subItems?.filter((sub) => sub.label.toLowerCase().includes(query)) || [];

      if (parentMatches || matchedSubs.length > 0) {
        return {
          ...mod,
          subItems: matchedSubs.length > 0 ? matchedSubs : mod.subItems,
        };
      }
      return null;
    }).filter(Boolean) as HcmModule[];
  }, [menuSearch]);

  return (
    <aside className="hidden shrink-0 transition-all duration-300 md:flex md:flex-col w-64 border-r border-border bg-card text-card-foreground shadow-2xs z-20 select-none h-screen sticky top-0">
      {/* ── 1. Brand Header ── */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-border bg-muted/20 shrink-0">
        <div
          onClick={() => navigate('/dashboard')}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/25 transition-transform hover:scale-105 active:scale-95 shrink-0"
        >
          <Building2 className="h-5 w-5 stroke-[2.2]" />
        </div>
        <div className="flex flex-col truncate">
          <span className=" text-sm font-semibold text-foreground  truncate leading-tight">
            EHCM Platform
          </span>
          <span className="text-[9.5px] uppercase tracking-widest text-primary font-semibold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Enterprise Suite
          </span>
        </div>
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

      {/* ── 3. Scrollable Nested Navigation Tree ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
        <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 flex items-center justify-between">
          <span>Main Navigation</span>
          <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[9px] font-semibold">
            {filteredModules.length} Modules
          </span>
        </div>

        {filteredModules.map((mod) => {
          const Icon = mod.icon;
          const hasSubItems = mod.subItems && mod.subItems.length > 0;
          const isExpanded = Boolean(openSections[mod.key]) || Boolean(menuSearch);

          // Check if any child is active or parent route is active
          const isParentActive =
            location.pathname === mod.path ||
            mod.subItems?.some((sub) => isSubItemActive(sub.path, mod.path));

          return (
            <div key={mod.key} className="space-y-0.5">
              {/* Parent Menu Item */}
              <button
                type="button"
                onClick={() => {
                  if (hasSubItems) {
                    toggleSection(mod.key);
                  }
                  navigate(mod.path);
                }}
                className={cn(
                  'w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 group active:scale-98 relative',
                  isParentActive
                    ? 'bg-primary/10 text-primary font-semibold shadow-2xs border-l-3 border-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg transition-colors shrink-0',
                      isParentActive
                        ? 'bg-primary text-primary-foreground shadow-2xs'
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
                        isParentActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {mod.subItems?.length}
                    </span>
                  )}
                  {hasSubItems && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection(mod.key);
                      }}
                      className="p-0.5 rounded hover:bg-muted text-muted-foreground"
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
                    const isSubActive = isSubItemActive(sub.path, mod.path);

                    return (
                      <NavLink
                        key={sub.key}
                        to={sub.path}
                        className={cn(
                          'group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 active:scale-95 relative',
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
      <div className="p-3 border-t border-border bg-muted/20 shrink-0">
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
    </aside>
  );
}
