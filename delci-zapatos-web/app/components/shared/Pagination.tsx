'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  /** Label describing what is being paginated, e.g. "productos", "clientes" */
  itemLabel?: string;
}

/**
 * Generates the page numbers to display with ellipsis.
 * Always shows first, last, and a window around the current page.
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];

  // Always include page 1
  pages.push(1);

  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  // Window around current page
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  // Always include last page
  pages.push(totalPages);

  return pages;
}

export const Pagination = React.memo<PaginationProps>(({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className = '',
  itemLabel = 'elementos',
}) => {
  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  );

  if (totalItems === 0) return null;

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && !isFirstPage) {
      e.preventDefault();
      onPageChange(currentPage - 1);
    } else if (e.key === 'ArrowRight' && !isLastPage) {
      e.preventDefault();
      onPageChange(currentPage + 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onPageChange(1);
    } else if (e.key === 'End') {
      e.preventDefault();
      onPageChange(totalPages);
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 ${className}`}
      role="navigation"
      aria-label="Paginación"
    >
      {/* Info text */}
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        <span className="font-medium text-gray-900">{startIndex + 1}</span>
        {' - '}
        <span className="font-medium text-gray-900">{endIndex}</span>
        {' de '}
        <span className="font-medium text-gray-900">{totalItems}</span>
        {' '}{itemLabel}
      </div>

      {/* Page controls */}
      <div
        className="flex items-center gap-1 order-1 sm:order-2"
        onKeyDown={handleKeyDown}
        role="group"
        aria-label="Controles de página"
      >
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={isFirstPage}
          className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-pink-600 hover:bg-pink-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:ring-offset-1"
          aria-label="Ir a la primera página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-pink-600 hover:bg-pink-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:ring-offset-1"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers - hidden on very small screens, show compact on mobile */}
        <div className="flex items-center gap-0.5" role="list" aria-label="Páginas">
          {pageNumbers.map((page, index) =>
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm select-none"
                aria-hidden="true"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:ring-offset-1 ${
                  page === currentPage
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-200'
                    : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                }`}
                aria-label={`Página ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
                role="listitem"
              >
                {page}
              </button>
            ),
          )}
        </div>

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-pink-600 hover:bg-pink-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:ring-offset-1"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={isLastPage}
          className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-pink-600 hover:bg-pink-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:ring-offset-1"
          aria-label="Ir a la última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Page size selector */}
      {onPageSizeChange && (
        <div className="flex items-center gap-2 order-3">
          <label htmlFor="page-size-select" className="text-xs text-gray-500 whitespace-nowrap">
            Por página
          </label>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 appearance-none shadow-sm pr-6"
            aria-label="Cantidad de elementos por página"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
});

Pagination.displayName = 'Pagination';
