"use client";
import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1 && totalItems === 0) return null;

  // 生成页码数组 (处理带省略号的复杂分页逻辑)
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white border-t border-slate-200 gap-4">
      {/* 左侧：显示当前数据范围 */}
      <div className="text-sm text-slate-500 font-medium">
        Showing <span className="font-bold text-slate-900">{totalItems === 0 ? 0 : startIndex}</span> to{" "}
        <span className="font-bold text-slate-900">{endIndex}</span> of{" "}
        <span className="font-bold text-slate-900">{totalItems}</span> results
      </div>

      {/* 右侧：分页按钮 */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <div key={`ellipsis-${index}`} className="px-3 py-2 text-slate-400">
              <MoreHorizontal className="w-4 h-4" />
            </div>
          ) : (
            <button
              key={index}
              onClick={() => onPageChange(page as number)}
              className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                currentPage === page
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200"
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}