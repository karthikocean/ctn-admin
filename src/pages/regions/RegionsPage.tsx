import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Country, State, City } from "country-state-city";
import { Plus, Trash2, Search, Filter, Globe, Loader2, MapPin, Check, ChevronsUpDown, Users, ExternalLink } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { getRegions, createRegion, updateRegion, deleteRegion } from "@/api/RegionApi";
import { getMembers } from "@/api/MembersApi";
import { useToast } from "@/hooks/use-toast";
import { Region } from "@/types";
import { useAuth } from "@/context/AuthContext";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { cn } from "@/lib/utils";


const RegionsPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("business_regions", "create");
  const canEdit = hasPermission("business_regions", "edit");
  const canDelete = hasPermission("business_regions", "delete");
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

  // Status update states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [regionToUpdateStatus, setRegionToUpdateStatus] = useState<Region | null>(null);
  const [newStatus, setNewStatus] = useState<string>("active");

  // Areas popup states
  const [areasPopupOpen, setAreasPopupOpen] = useState(false);
  const [selectedRegionForAreas, setSelectedRegionForAreas] = useState<Region | null>(null);

  // Members popup states
  const [memberPopupOpen, setMemberPopupOpen] = useState(false);
  const [selectedRegionForMembers, setSelectedRegionForMembers] = useState<Region | null>(null);
  const [regionMembers, setRegionMembers] = useState<any[]>([]);
  const [regionMembersLoading, setRegionMembersLoading] = useState(false);

  const navigate = useNavigate();

  // Form states
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("IN");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [areas, setAreas] = useState<{ _id?: string; name: string }[]>([{ name: "" }]);
  const [saving, setSaving] = useState(false);

  // Combobox open states
  const [countryOpen, setCountryOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const countries = Country.getAllCountries();
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];
  const cities = (selectedCountry && selectedState) ? City.getCitiesOfState(selectedCountry, selectedState) : [];

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
    setSelectedCountry("IN");
    setSelectedState("");
    setSelectedCity("");
    setAreas([{ name: "" }]);
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
        const stateCities = City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode);
        const cityObj = stateCities.find(c => c.name === region.city);
        if (cityObj) {
          setSelectedCity(cityObj.name);
        } else {
          setSelectedCity(region.city);
        }
      }
    }
    // Set areas if available, otherwise default to one empty input
    setAreas(region.areas && region.areas.length > 0 ? region.areas : [{ name: "" }]);
    setDrawerOpen(true);
  };

  const handleAddArea = () => {
    setAreas([...areas, { name: "" }]);
  };

  const handleAreaChange = (index: number, value: string) => {
    const updatedAreas = [...areas];
    updatedAreas[index] = { ...updatedAreas[index], name: value };
    setAreas(updatedAreas);
  };

  const handleRemoveArea = (index: number) => {
    if (areas.length > 1) {
      setAreas(areas.filter((_, i) => i !== index));
    } else {
      setAreas([{ name: "" }]);
    }
  };

  const handleSave = async () => {
    const countryName = countries.find(c => c.isoCode === selectedCountry)?.name || "";
    const stateName = states.find(s => s.isoCode === selectedState)?.name || "";

    // Filter out empty areas
    const filteredAreas = areas.filter(a => a.name.trim() !== "");

    if (!countryName || !stateName || !selectedCity || filteredAreas.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields, including at least one business region name.",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate area names (case-insensitive)
    const areaNameList = filteredAreas.map(a => a.name.trim().toLowerCase());
    if (areaNameList.length !== new Set(areaNameList).size) {
      toast({
        title: "Duplicate Area",
        description: "Duplicate business region names are not allowed. Please enter unique area names.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        country: countryName,
        state: stateName,
        city: selectedCity,
        areas: filteredAreas,
        status: "active" as const
      };

      if (editingRegion) {
        await updateRegion(editingRegion._id, payload);
        toast({ title: "Updated", description: "Region updated successfully", variant: "success" });
      } else {
        await createRegion(payload);
        toast({ title: "Created", description: "Region created successfully", variant: "success" });
      }
      setDrawerOpen(false);
      fetchRegions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save region",
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

  const handleUpdateStatus = async () => {
    if (!regionToUpdateStatus) return;
    try {
      setSaving(true);
      await updateRegion(regionToUpdateStatus._id, { status: newStatus });
      toast({
        title: "Success",
        description: `Region status updated to ${newStatus}`,
        variant: "success"
      });
      fetchRegions();
      setStatusDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && regions.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Mapping Business Regions..."
          subtitle="Synchronizing regional nodes and member clusters"
        />
      )}

      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin size={16} className="text-primary" />
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
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary placeholder:text-muted-foreground/60"
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
            <SelectTrigger className="h-9 w-32 rounded-lg text-xs bg-background border-slate-300 focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary">
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
          {canCreate && (
            <Button
              size="sm"
              className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
              onClick={handleOpenAdd}
            >
              + Add Region
            </Button>
          )}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">State</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Regions</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Members</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {regions.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-muted-foreground">
                    No regions found
                  </td>
                </tr>
              ) : (
                regions.map((r, index) => (
                  <tr key={r._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">{(page * 10) + index + 1}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">{r.country}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">{r.state}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">{r.city}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {r.areas && r.areas.length > 0 ? (
                          r.areas.slice(0, 2).map((area, idx) => (
                            <Badge key={idx} variant="secondary" className="text-sm text-foreground bg-slate-100 border-none font-semibold">
                              {typeof area === "string" ? area : area.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-foreground font-semibold">No regions defined</span>
                        )}
                        {r.areas && r.areas.length > 2 && (
                          <Badge
                            variant="secondary"
                            className="text-sm bg-primary/5 text-primary border-none font-semibold cursor-pointer hover:bg-primary/15 transition-colors"
                            onClick={() => {
                              setSelectedRegionForAreas(r);
                              setAreasPopupOpen(true);
                            }}
                          >
                            +{r.areas.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {r.memberCount && r.memberCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRegionForMembers(r);
                            setRegionMembersLoading(true);
                            setMemberPopupOpen(true);
                            getMembers({ regionId: r._id, limit: 100 })
                              .then((res) => setRegionMembers(res.data || []))
                              .catch(() => setRegionMembers([]))
                              .finally(() => setRegionMembersLoading(false));
                          }}
                          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors"
                        >
                          <Users size={13} />
                          {r.memberCount}
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground font-semibold">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={r.status === "active" ? "default" : "secondary"}
                        className={cn(
                          "cursor-pointer font-semibold transition-all active:scale-95",
                          r.status === "active"
                            ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted/70"
                        )}
                        onClick={() => {
                          if (canEdit) {
                            setRegionToUpdateStatus(r);
                            setNewStatus(r.status);
                            setStatusDialogOpen(true);
                          }
                        }}
                      >
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onEdit={canEdit ? () => handleEdit(r) : undefined}
                        onDelete={canDelete ? () => handleDeleteClick(r._id) : undefined}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-border bg-secondary/10">
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
          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</label>
            <Popover modal={true} open={countryOpen} onOpenChange={setCountryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={countryOpen}
                  className="w-full h-11 bg-white border border-slate-300 rounded-xl justify-between px-3 text-xs font-normal text-slate-900 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary hover:bg-secondary/40 active:scale-[0.99] transition-all"
                >
                  {selectedCountry
                    ? countries.find((c) => c.isoCode === selectedCountry)?.name
                    : "Select Country"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border border-border rounded-xl shadow-xl z-50 animate-none">
                <Command className="w-full">
                  <CommandInput placeholder="Search country..." className="h-10 text-xs" />
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandList className="max-h-60 overflow-y-auto no-scrollbar">
                    <CommandGroup>
                      {countries.map((c) => (
                        <CommandItem
                          key={c.isoCode}
                          value={c.name}
                          onSelect={() => {
                            setSelectedCountry(c.isoCode);
                            setSelectedState("");
                            setSelectedCity("");
                            setCountryOpen(false);
                          }}
                          className="text-xs cursor-pointer hover:bg-secondary/50 rounded-lg"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5",
                              selectedCountry === c.isoCode ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">State</label>
            <Popover modal={true} open={stateOpen} onOpenChange={setStateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={stateOpen}
                  className="w-full h-11 bg-white border border-slate-300 rounded-xl justify-between px-3 text-xs font-normal text-slate-900 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary hover:bg-secondary/40 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedCountry}
                >
                  {selectedState
                    ? states.find((s) => s.isoCode === selectedState)?.name
                    : selectedCountry ? "Select State" : "Choose country first"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border border-border rounded-xl shadow-xl z-50 animate-none">
                <Command className="w-full">
                  <CommandInput placeholder="Search state..." className="h-10 text-xs" />
                  <CommandEmpty>No state found.</CommandEmpty>
                  <CommandList className="max-h-60 overflow-y-auto no-scrollbar">
                    <CommandGroup>
                      {states.length > 0 ? (
                        states.map((s) => (
                          <CommandItem
                            key={s.isoCode}
                            value={s.name}
                            onSelect={() => {
                              setSelectedState(s.isoCode);
                              setSelectedCity("");
                              setStateOpen(false);
                            }}
                            className="text-xs cursor-pointer hover:bg-secondary/50 rounded-lg"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3.5 w-3.5",
                                selectedState === s.isoCode ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {s.name}
                          </CommandItem>
                        ))
                      ) : (
                        <div className="p-2 text-xs text-muted-foreground text-center">No states found</div>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</label>
            <Popover modal={true} open={cityOpen} onOpenChange={setCityOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={cityOpen}
                  className="w-full h-11 bg-white border border-slate-300 rounded-xl justify-between px-3 text-xs font-normal text-slate-900 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary hover:bg-secondary/40 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedState}
                >
                  {selectedCity || (!selectedState ? "Select a state first" : "Select City")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border border-border rounded-xl shadow-xl z-50 animate-none">
                <Command className="w-full">
                  <CommandInput placeholder="Search city..." className="h-10 text-xs" />
                  <CommandEmpty>No city found.</CommandEmpty>
                  <CommandList className="max-h-60 overflow-y-auto no-scrollbar">
                    <CommandGroup>
                      {cities.length > 0 ? (
                        cities.map((city) => (
                          <CommandItem
                            key={city.name}
                            value={city.name}
                            onSelect={() => {
                              setSelectedCity(city.name);
                              setCityOpen(false);
                            }}
                            className="text-xs cursor-pointer hover:bg-secondary/50 rounded-lg"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3.5 w-3.5",
                                selectedCity === city.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {city.name}
                          </CommandItem>
                        ))
                      ) : (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                          {!selectedState ? "Select a state first" : "No cities found"}
                        </div>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Business Regions
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddArea}
                className="h-7 px-2 rounded-lg text-[10px] font-bold border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
              >
                <Plus size={12} className="mr-1" /> Add Region
              </Button>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {areas.map((area, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <div className="relative flex-1">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                    <Input
                      value={area.name}
                      onChange={(e) => handleAreaChange(index, e.target.value)}
                      placeholder={`Region ${index + 1} (e.g. T. Nagar, Adyar)`}
                      className="h-10 pl-9 bg-white border border-slate-200 rounded-xl text-xs font-medium focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveArea(index)}
                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 mt-6 shadow-lg shadow-primary/20 font-bold text-sm tracking-wide transition-all active:scale-[0.98]"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Region...
              </>
            ) : (
              editingRegion ? "Update Region Configuration" : "Create New Business Region"
            )}
          </Button>
        </div>
      </FormDrawer>

      {/* Member List Popup Dialog */}
      <Dialog open={memberPopupOpen} onOpenChange={(o) => { setMemberPopupOpen(o); if (!o) { setRegionMembers([]); setSelectedRegionForMembers(null); } }}>
        <DialogContent className="sm:max-w-[520px] border-border rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="text-primary w-4 h-4" />
              </div>
              Members in {selectedRegionForMembers?.city}{selectedRegionForMembers?.state ? `, ${selectedRegionForMembers.state}` : ""}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1">
              {selectedRegionForMembers?.memberCount || 0} member{(selectedRegionForMembers?.memberCount || 0) !== 1 ? "s" : ""} registered in this region
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 max-h-[400px] overflow-y-auto">
            {regionMembersLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : regionMembers.length > 0 ? (
              <ul className="space-y-2">
                {regionMembers.map((member, idx) => (
                  <li key={member._id || idx} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors">
                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                      {member.fullName?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{member.fullName || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.businessName || member.email || ""}</p>
                    </div>
                    {member.status && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        member.status === "active"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-amber-100 text-amber-600"
                      }`}>
                        {member.status.toUpperCase()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No members found for this region.</p>
            )}
          </div>
          <DialogFooter className="mt-2 flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl border-border flex-1"
              onClick={() => setMemberPopupOpen(false)}
            >
              Close
            </Button>
            <Button
              className="rounded-xl flex-1 gap-1.5"
              onClick={() => {
                navigate(`/members?regionId=${selectedRegionForMembers?._id}`);
                setMemberPopupOpen(false);
              }}
            >
              <ExternalLink size={14} />
              View in Members
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Areas List Popup Dialog */}
      <Dialog open={areasPopupOpen} onOpenChange={setAreasPopupOpen}>
        <DialogContent className="sm:max-w-[420px] border-border rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="text-primary w-4 h-4" />
              </div>
              Business Regions
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1">
              {selectedRegionForAreas?.city}, {selectedRegionForAreas?.state} — All regions listed below
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 max-h-[360px] overflow-y-auto">
            {selectedRegionForAreas?.areas && selectedRegionForAreas.areas.length > 0 ? (
              <ul className="space-y-2">
                {selectedRegionForAreas.areas.map((area, idx) => (
                  <li key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors">

                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {typeof area === "string" ? area : area.name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No regions found.</p>
            )}
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" className="rounded-xl border-border w-full" onClick={() => setAreasPopupOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Region?"
        description="This action cannot be undone. This will permanently delete the region and may affect associated members."
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        confirmLabel="Delete Region"
      />

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[400px] border-border rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="text-primary w-4 h-4" />
              </div>
              Update Region Status
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Change the configuration status for the region in {regionToUpdateStatus?.city}, {regionToUpdateStatus?.state}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="status" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Region Status</label>
              <Select value={newStatus} onValueChange={(val) => setNewStatus(val as any)}>
                <SelectTrigger id="status" className="h-11 rounded-xl bg-white border border-slate-300">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" className="rounded-xl border-border" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl bg-primary hover:bg-primary/90" onClick={handleUpdateStatus} disabled={saving}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegionsPage;
