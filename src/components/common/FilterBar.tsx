import { Search, Filter, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  filters?: { label: string; options: string[] }[];
  onAddNew?: () => void;
  addNewLabel?: string;
}

const FilterBar = ({ searchPlaceholder = "Search...", onSearch, onAddNew, addNewLabel = "Add New" }: FilterBarProps) => {
  const [search, setSearch] = useState("");

  const handleSearch = (value: string) => {
    setSearch(value);
    onSearch?.(value);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2 bg-card rounded-xl border border-border px-3 py-2 w-full sm:w-80">
        <Search size={16} className="text-muted-foreground" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
        />
        {search && (
          <button onClick={() => handleSearch("")}>
            <X size={14} className="text-muted-foreground" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-xl">
          <Filter size={16} className="mr-2" /> Filters
        </Button>
        {onAddNew && (
          <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90" onClick={onAddNew}>
            + {addNewLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
