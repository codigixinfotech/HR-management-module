import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface PaginationProps {
  /** Total count of records in the dataset */
  totalRecords: number;
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Number of items rendered per page */
  pageSize: number;
  /** Callback fired when page number changes */
  onPageChange: (page: number) => void;
  /** Callback fired when rows per page changes */
  onPageSizeChange: (pageSize: number) => void;
  /** Options for rows per page dropdown. Default: [10, 25, 50, 100] */
  pageSizeOptions?: number[];
  /** Label for item counter. Default: "records" */
  itemLabel?: string;
  /** Custom wrapper CSS class names */
  className?: string;
}

/**
 * Standard Global EHCM ERP Reusable Pagination Component
 * 
 * Renders standard pagination bar:
 * Showing 1–25 of 49 records     Rows per page: [ 25 ▾ ]     [‹] [1] [2] [›]
 */
export function Pagination({
  totalRecords,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = 'records',
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const clampedPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalRecords === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const endIndex = Math.min(clampedPage * pageSize, totalRecords);

  const handlePageSizeChange = (newSizeStr: string) => {
    const newSize = Number(newSizeStr);
    onPageSizeChange(newSize);
    onPageChange(1);
  };

  // Generate page numbers array with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (clampedPage > 3) pages.push('...');

      const start = Math.max(2, clampedPage - 1);
      const end = Math.min(totalPages - 1, clampedPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (clampedPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 text-xs border-t border-border/60 ${className}`}>
      {/* Record Counter Info */}
      <div className="text-muted-foreground font-medium text-xs">
        Showing <strong className="text-foreground font-semibold">{startIndex}–{endIndex}</strong> of{' '}
        <strong className="text-foreground font-semibold">{totalRecords}</strong> {itemLabel}
      </div>

      {/* Controls: Rows per page & Navigation Buttons */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Rows per page dropdown */}
        <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs">
          <span>Rows per page:</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-7 text-xs w-[70px] bg-background border-border/80 font-semibold focus:ring-1 focus:ring-primary cursor-pointer">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)} className="text-xs">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page Navigation Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 text-xs disabled:opacity-40 cursor-pointer"
            onClick={() => onPageChange(Math.max(1, clampedPage - 1))}
            disabled={clampedPage <= 1}
            title="Previous Page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          {getPageNumbers().map((page, idx) => {
            if (typeof page === 'string') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground font-bold text-xs select-none">
                  ...
                </span>
              );
            }
            const isActive = page === clampedPage;
            return (
              <button
                key={page}
                type="button"
                className={`h-7 w-7 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-2xs font-bold'
                    : 'border border-border/80 text-muted-foreground hover:bg-muted/50 hover:text-foreground bg-background'
                }`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            );
          })}

          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 text-xs disabled:opacity-40 cursor-pointer"
            onClick={() => onPageChange(Math.min(totalPages, clampedPage + 1))}
            disabled={clampedPage >= totalPages}
            title="Next Page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
