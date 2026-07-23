import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const PaginationBar = ({
  currentPage,
  totalPages,
  onPageChange,
  className
}: PaginationBarProps) => {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

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
    <div className={cn("flex items-center justify-between w-full font-sans py-1", className)}>
      {/* Left text: Page X of Y */}
      <p className="text-sm font-medium text-slate-500">
        Page {safeCurrentPage} of {safeTotalPages}
      </p>

      {/* Right pagination controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="icon"
          className="w-9 h-9 rounded-xl border-slate-200/90 bg-slate-50/50 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-all disabled:opacity-40"
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
                ? "bg-[#003B73] text-white border-[#003B73] font-bold shadow-xs hover:bg-[#002d59]"
                : "border-slate-200/90 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
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
          className="w-9 h-9 rounded-xl border-slate-200/90 bg-slate-50/50 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-all disabled:opacity-40"
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
