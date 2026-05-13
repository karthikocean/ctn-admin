import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Globe, Loader2 } from "lucide-react";
import { Country, State } from "country-state-city";
import ActionMenu from "@/components/common/ActionMenu";
import FormDrawer from "@/components/common/FormDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PaginationBar from "@/components/common/PaginationBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getRegions, createRegion, updateRegion, deleteRegion } from "@/api/RegionApi";
import { useToast } from "@/hooks/use-toast";
import { Region } from "@/types";

const RegionsPage = () => {
  const { toast } = useToast();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [regionToDelete, setRegionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const countries = Country.getAllCountries();
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const data = await getRegions({
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter === "all" ? undefined : statusFilter
      });
      setRegions(data.data);
      setTotalPages(data.totalPages);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch regions";
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRegions();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, searchTerm, statusFilter]);

  const handleOpenAdd = () => {
    setEditingRegion(null);
    setSelectedCountry("");
    setSelectedState("");
    setSelectedCity("");
    setDrawerOpen(true);
  };

  const handleEdit = (region: Region) => {
    setEditingRegion(region);
    setSelectedCountry("");
    setSelectedState("");
    setSelectedCity(region.city);

    // We need to find the codes to populate the dropdowns
    const countryObj = countries.find(c => c.name === region.country);
    if (countryObj) {
      setSelectedCountry(countryObj.isoCode);
      const regionStates = State.getStatesOfCountry(countryObj.isoCode);
      const stateObj = regionStates.find(s => s.name === region.state);
      if (stateObj) {
        setSelectedState(stateObj.isoCode);
      }
    }

    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!selectedCountry || !selectedState || !selectedCity) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      const countryName = countries.find(c => c.isoCode === selectedCountry)?.name || "";
      const stateName = states.find(s => s.isoCode === selectedState)?.name || "";

      const payload = {
        country: countryName,
        state: stateName,
        city: selectedCity,
        status: "active"
      };

      if (editingRegion) {
        const res = await updateRegion(editingRegion._id, payload);
        toast({
          title: "Success",
          description: res.message || "Region updated successfully",
          variant: "success"
        });
      } else {
        const res = await createRegion(payload);
        toast({
          title: "Success",
          description: res.message || "Region created successfully",
          variant: "success"
        });
      }

      setDrawerOpen(false);
      fetchRegions();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to save region";
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setRegionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!regionToDelete) return;
    try {
      setIsDeleting(true);
      const res = await deleteRegion(regionToDelete);
      toast({
        title: "Deleted",
        description: res.message || "Region deleted successfully",
        variant: "success"
      });
      fetchRegions();
      setDeleteDialogOpen(false);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to delete region";
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setRegionToDelete(null);
    }
  };

  return (
    <div className="page-container">
      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Business Regions</h1>
          </div>
        </div>

        {/* Search, Filters, Add - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search regions..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Filters */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-32 rounded-lg text-xs bg-background border-border">
              <Filter size={14} className="mr-1.5" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Add Region */}
          <Button
            size="sm"
            className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
            onClick={handleOpenAdd}
          >
            + Add Region
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">State</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Members</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                    <span className="text-xs text-muted-foreground">Loading regions...</span>
                  </td>
                </tr>
              ) : regions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-muted-foreground">
                    No regions found
                  </td>
                </tr>
              ) : (
                regions.map((r) => (
                  <tr key={r._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground font-medium">{r.country}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{r.state}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{r.city}</td>
                    <td className="px-6 py-4 text-sm text-primary font-semibold hidden sm:table-cell">{r.memberCount || 0}</td>
                    <td className="px-6 py-4">
                      <Badge variant={r.status === "active" ? "default" : "secondary"} className={r.status === "active" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20" : "bg-muted/50 text-muted-foreground"}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onEdit={() => handleEdit(r)}
                        onDelete={() => handleDeleteClick(r._id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <PaginationBar
            currentPage={page + 1}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p - 1)}
          />
        </div>
      </motion.div>

      <FormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingRegion ? "Edit Region" : "Add Region"}
        description={editingRegion ? "Update existing business region" : "Add a new business region"}
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</label>
            <Select value={selectedCountry} onValueChange={(val) => {
              setSelectedCountry(val);
              setSelectedState("");
              setSelectedCity("");
            }}>
              <SelectTrigger className="w-full h-11 bg-secondary/50 border-border rounded-xl focus:ring-primary/20">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {countries.map((c) => (
                  <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">State</label>
            <Select
              value={selectedState}
              onValueChange={(val) => {
                setSelectedState(val);
                setSelectedCity("");
              }}
              disabled={!selectedCountry}
            >
              <SelectTrigger className="w-full h-11 bg-secondary/50 border-border rounded-xl focus:ring-primary/20">
                <SelectValue placeholder={selectedCountry ? "Select State" : "Choose country first"} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {states.length > 0 ? (
                  states.map((s) => (
                    <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-xs text-muted-foreground text-center">No states found</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</label>
            <Input
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              placeholder="Enter city name"
              className="h-11 bg-secondary/50 border-border rounded-xl focus:ring-primary/20"
            />
          </div>
          <Button
            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 mt-4 shadow-lg shadow-primary/20 font-medium"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Region"
            )}
          </Button>
        </div>
      </FormDrawer>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Region?"
        description="This action cannot be undone. This will permanently delete the region and may affect associated members."
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        confirmLabel="Delete Region"
      />
    </div>
  );
};

export default RegionsPage;
