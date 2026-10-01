import * as React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  emptyText?: string;
  id?: string;
  customTrigger?: (props: { isOpen: boolean; selectedOption?: SearchableSelectOption }) => React.ReactNode;
}

function renderSafeText(val: any): React.ReactNode {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string' || typeof val === 'number') return val;
  if (typeof val === 'object') {
    return val.name || val.title || val.code || val.label || JSON.stringify(val);
  }
  return String(val);
}

export function SearchableSelect({
  value,
  onValueChange,
  options = [],
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  emptyText = 'No matching options found',
  id,
  customTrigger,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter((opt) => {
      const labelStr = typeof opt.label === 'string' ? opt.label : (typeof opt.label === 'object' ? (opt.label as any)?.name || '' : String(opt.label || ''));
      const valStr = typeof opt.value === 'string' ? opt.value : String(opt.value || '');
      const sublabelStr = typeof opt.sublabel === 'string' ? opt.sublabel : (typeof opt.sublabel === 'object' ? (opt.sublabel as any)?.name || '' : '');
      const badgeStr = typeof opt.badge === 'string' ? opt.badge : (typeof opt.badge === 'object' ? (opt.badge as any)?.name || '' : '');

      return (
        labelStr.toLowerCase().includes(q) ||
        valStr.toLowerCase().includes(q) ||
        (sublabelStr && sublabelStr.toLowerCase().includes(q)) ||
        (badgeStr && badgeStr.toLowerCase().includes(q))
      );
    });
  }, [options, search]);

  const handleSelect = (optValue: string, isDisabled?: boolean) => {
    if (isDisabled) return;
    onValueChange(optValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      {customTrigger ? (
        <div
          id={id}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={cn('inline-block cursor-pointer', disabled && 'cursor-not-allowed opacity-50')}
        >
          {customTrigger({ isOpen, selectedOption })}
        </div>
      ) : (
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={cn(
            'flex h-8 w-full items-center justify-between rounded-md border border-input bg-card px-2.5 py-1 text-xs text-foreground ring-offset-background transition-colors',
            'hover:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring',
            'disabled:cursor-not-allowed disabled:opacity-50 text-left',
            isOpen && 'ring-1 ring-ring border-ring',
            triggerClassName
          )}
        >
          <div className="flex items-center gap-1.5 truncate flex-1 mr-1">
            {selectedOption ? (
              <>
                {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
                <span className="truncate font-medium">{renderSafeText(selectedOption.label)}</span>
                {selectedOption.badge && (
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                    {renderSafeText(selectedOption.badge)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            )}
          </div>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200',
              isOpen && 'rotate-180 text-foreground'
            )}
          />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 top-full z-50 mt-1 flex flex-col w-full min-w-[240px] max-h-72 rounded-lg border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95',
            contentClassName
          )}
        >
          {/* Search Bar */}
          <div className="flex items-center border-b border-border/80 px-2.5 py-1.5 shrink-0 bg-popover">
            <Search className="mr-1.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-6 w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-muted-foreground hover:text-foreground p-0.5 shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto p-1 space-y-0.5 overscroll-contain">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt.value, opt.disabled)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs text-left transition-colors',
                      isSelected
                        ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                        : 'hover:bg-accent hover:text-accent-foreground text-foreground',
                      opt.disabled && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="truncate">
                        <div className="truncate">{renderSafeText(opt.label)}</div>
                        {opt.sublabel && (
                          <div className="text-[10px] text-muted-foreground truncate">{renderSafeText(opt.sublabel)}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {opt.badge && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono font-medium text-muted-foreground">
                          {renderSafeText(opt.badge)}
                        </span>
                      )}
                      {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
