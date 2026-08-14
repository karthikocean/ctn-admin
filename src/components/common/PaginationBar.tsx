import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  totalCount?: number;
  totalRecords?: number;
  total?: number;
  className?: string;
}

const PaginationBar = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  totalCount,
  totalRecords,
  total,
  className
}: PaginationBarProps) => {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const count = totalItems ?? totalCount ?? totalRecords ?? total;

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (safeTotalPages <= maxVisible) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = safeCurrentPage - 2;
      let end = safeCurrentPage + 2;

      if (start < 1) {
        start = 1;
        end = maxVisible;
      } else if (end > safeTotalPages) {
        end = safeTotalPages;
        start = safeTotalPages - maxVisible + 1;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2 w-full font-sans pt-4 pb-1", className)}>
      {/* Left text: Total Count & Page X of Y */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        {count !== undefined && count !== null && (
          <>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 font-semibold shadow-2xs">
              Total Records: <strong className="text-[#003B73] dark:text-sky-400 font-bold text-xs">{count.toLocaleString()}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-600 font-bold">•</span>
          </>
        )}
        <span>
          Page <strong className="text-slate-700 dark:text-slate-300">{safeCurrentPage}</strong> of <strong className="text-slate-700 dark:text-slate-300">{safeTotalPages}</strong>
        </span>
      </div>

      {/* Right pagination controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="icon"
          className="w-9 h-9 rounded-xl border-slate-200/90 bg-slate-50/50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all disabled:opacity-40"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
        >
          <ChevronLeft size={16} />
        </Button>

        {/* Page Numbers */}
        {getPageNumbers().map((p) => (
          <Button
            key={p}
            variant="outline"
            size="icon"
            className={cn(
              "w-9 h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all",
              p === safeCurrentPage
                ? "bg-[#003B73] text-white border-[#003B73] font-bold shadow-xs hover:bg-[#002d59] hover:text-white"
                : "border-slate-200/90 bg-slate-50/50 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            )}
            onClick={() => onPageChange(p)}
          >
            <span className="leading-none flex items-center justify-center">{p}</span>
          </Button>
        ))}

        {/* Next Button */}
        <Button
          variant="outline"
          size="icon"
          className="w-9 h-9 rounded-xl border-slate-200/90 bg-slate-50/50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-all disabled:opacity-40"
          disabled={safeCurrentPage >= safeTotalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};

export default PaginationBar;
