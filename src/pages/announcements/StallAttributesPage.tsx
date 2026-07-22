import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Layers, Loader2, AlertCircle, Calendar } from "lucide-react";
import ActionMenu from "@/components/common/ActionMenu";
import FormDrawer from "@/components/common/FormDrawer";
import { Button } from "@/components/ui/button";
import PaginationBar from "@/components/common/PaginationBar";
import { useToast } from "@/hooks/use-toast";
import { TableLoader, TableSkeleton } from "@/components/common/TableLoader";
import {
  getAnnouncements,
  getAnnouncementDetails,
  updateAnnouncement,
} from "@/api/AnnouncementsApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Stall {
  _id?: string;
  name: string;
  size: string;
  points: number | string;
}

interface StallAttribute {
  id: string;         // announcement _id
  title: string;      // announcement title for display
  totalStallCount: number;
  stalls: Stall[];
}

interface StallError {
  name?: string;
  points?: string;
}

interface ValidationErrors {
  eventId?: string;
  totalStallCount?: string;
  stalls?: StallError[];
}

const StallAttributesPage = () => {
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [attributes, setAttributes] = useState<StallAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Published "Event" announcements for the dropdown (those without stall config yet)
  const [eventsList, setEventsList] = useState<any[]>([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attributeToDelete, setAttributeToDelete] = useState<string | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    eventId: "",
    totalStallCount: 0,
    stalls: [] as Stall[],
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // View Details Modal State
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<StallAttribute | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Load stall-enabled announcements (isOfflineStallExist = true) + event dropdown list
  const fetchStallAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await getAnnouncements({ limit: 200 });
      const all: any[] = res.data || [];

      // For the dropdown: published Event announcements
      const eventAnnouncements = all.filter(
        (a: any) => a.announcementType === "Event" && a.status === "published"
      );
      setEventsList(eventAnnouncements);

      // Table rows: announcements that have stall config enabled
      const stallAnnouncements = all.filter((a: any) => a.isOfflineStallExist === true);
      const mapped: StallAttribute[] = stallAnnouncements.map((a: any) => ({
        id: a._id,
        title: a.title || `Announcement (${a._id})`,
        totalStallCount: a.stallConfig?.totalStallCount || 0,
        stalls: a.stallConfig?.stalls || [],
      }));
      setAttributes(mapped);
      setTotalPages(Math.ceil(mapped.length / pageSize));
    } catch (err) {
      console.error("Failed to load stall announcements", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStallAnnouncements();
  }, []);

  const handleCountChange = (count: number) => {
    const safeCount = Math.max(0, count);

    // Clear count validation error if it is now valid (> 0)
    if (safeCount > 0 && validationErrors.totalStallCount) {
      setValidationErrors((prev) => ({ ...prev, totalStallCount: undefined }));
    }

    setFormData((prev) => {
      const stalls = [...prev.stalls];
      if (safeCount > stalls.length) {
        for (let i = stalls.length; i < safeCount; i++) {
          stalls.push({ name: `Stall ${i + 1}`, size: "", points: "" });
        }
      } else {
        stalls.splice(safeCount);
      }
      return { ...prev, totalStallCount: safeCount, stalls };
    });
  };

  const handleStallFieldChange = (index: number, field: keyof Stall, value: any) => {
    // Clear validation error for this specific stall field
    if (validationErrors.stalls?.[index]) {
      setValidationErrors((prev) => {
        if (!prev.stalls) return prev;
        const newStalls = [...prev.stalls];
        newStalls[index] = { ...newStalls[index], [field]: undefined };
        return { ...prev, stalls: newStalls };
      });
    }

    setFormData((prev) => {
      const stalls = [...prev.stalls];
      stalls[index] = {
        ...stalls[index],
        [field]: field === "points" ? (value === "" ? "" : Number(value)) : value,
      };
      return { ...prev, stalls };
    });
  };

  // View: fetch fresh data and display in read-only details modal
  const handleView = async (attr: StallAttribute) => {
    setSelectedAttribute(attr);
    setDetailsDialogOpen(true);
    setDetailsLoading(true);
    try {
      const res = await getAnnouncementDetails(attr.id);
      const announcement = res.data;
      const stallConfig = announcement?.stallConfig;
      const count = stallConfig?.totalStallCount || attr.totalStallCount || 0;
      const stalls: Stall[] = stallConfig?.stalls || attr.stalls || [];

      setSelectedAttribute({
        id: attr.id,
        title: announcement?.title || attr.title,
        totalStallCount: count,
        stalls,
      });
    } catch (err) {
      console.error("Failed to load details from API, showing local data", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Save stallConfig by PUTting to the announcement endpoint
  const handleSave = async () => {
    // Reset validation errors
    setValidationErrors({});

    const errors: ValidationErrors = {};
    let hasErrors = false;

    if (!formData.eventId) {
      errors.eventId = "Please select an event announcement to configure stalls";
      hasErrors = true;
    }

    if (formData.totalStallCount <= 0) {
      errors.totalStallCount = "Total stall count must be greater than 0";
      hasErrors = true;
    }

    const stallErrors: StallError[] = [];
    const namesSeen = new Set<string>();
    let hasStallErrors = false;

    formData.stalls.forEach((stall, idx) => {
      const stallErr: StallError = {};
      const trimmedName = stall.name?.trim();

      if (!trimmedName) {
        stallErr.name = "Stall name is required";
        hasStallErrors = true;
      } else {
        const lowerName = trimmedName.toLowerCase();
        if (namesSeen.has(lowerName)) {
          stallErr.name = "Stall names must be unique within this event";
          hasStallErrors = true;
        } else {
          namesSeen.add(lowerName);
        }
      }

      if (stall.points === undefined || stall.points === null || stall.points === "" || isNaN(Number(stall.points))) {
        stallErr.points = "Points is required";
        hasStallErrors = true;
      } else if (Number(stall.points) < 0) {
        stallErr.points = "Points cannot be negative";
        hasStallErrors = true;
      }

      stallErrors[idx] = stallErr;
    });

    if (hasStallErrors) {
      errors.stalls = stallErrors;
      hasErrors = true;
    }

    if (hasErrors) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please correct the highlighted errors in the form.",
        variant: "destructive",
      });
      return;
    }

    setFormLoading(true);
    try {
      if (editingId && formData.eventId !== editingId) {
        // Clear stall config on the old announcement first
        await updateAnnouncement(editingId, {
          isOfflineStallExist: false,
          stallConfig: {
            totalStallCount: 0,
            stalls: [],
          },
        });
      }

      await updateAnnouncement(formData.eventId, {
        isOfflineStallExist: true,
        stallConfig: {
          totalStallCount: formData.totalStallCount,
          stalls: formData.stalls,
        },
      });

      toast({
        title: "Success",
        description: editingId
          ? "Stall configuration updated successfully"
          : "Stall configuration saved successfully",
        variant: "success",
      });

      setDrawerOpen(false);
      setEditingId(null);
      setFormData({ eventId: "", totalStallCount: 0, stalls: [] });
      await fetchStallAnnouncements();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to save stall configuration",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Edit: fetch fresh data from API and populate stall cards
  const handleEdit = async (attr: StallAttribute) => {
    setEditingId(attr.id);
    setDrawerOpen(true);
    setValidationErrors({});
    try {
      const res = await getAnnouncementDetails(attr.id);
      const announcement = res.data;
      const stallConfig = announcement?.stallConfig;
      const count = stallConfig?.totalStallCount || attr.totalStallCount || 0;
      const stalls: Stall[] =
        stallConfig?.stalls?.length > 0
          ? stallConfig.stalls
          : attr.stalls.length > 0
          ? attr.stalls
          : Array.from({ length: count }, (_, i) => ({
              name: `Stall ${i + 1}`,
              size: "",
              points: 0,
            }));

      setFormData({
        eventId: attr.id,
        totalStallCount: count,
        stalls,
      });
    } catch {
      // Fallback to local data if API fails
      const count = attr.totalStallCount || 0;
      setFormData({
        eventId: attr.id,
        totalStallCount: count,
        stalls:
          attr.stalls.length > 0
            ? attr.stalls
            : Array.from({ length: count }, (_, i) => ({
                name: `Stall ${i + 1}`,
                size: "",
                points: 0,
              })),
      });
    }
  };

  // Delete: clear stallConfig and set isOfflineStallExist = false
  const handleDelete = async () => {
    if (!attributeToDelete) return;
    setLoading(true);
    try {
      await updateAnnouncement(attributeToDelete, {
        isOfflineStallExist: false,
        stallConfig: { totalStallCount: 0, stalls: [] },
      });
      toast({
        title: "Removed",
        description: "Stall configuration removed successfully",
        variant: "success",
      });
      await fetchStallAnnouncements();
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to remove stall configuration",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setAttributeToDelete(null);
      setLoading(false);
    }
  };

  const confirmDelete = (id: string) => {
    setAttributeToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Filter & Paginate
  const filteredAttributes = attributes.filter((attr) =>
    attr.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginatedAttributes = filteredAttributes.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setTotalPages(Math.ceil(filteredAttributes.length / pageSize));
  }, [searchTerm, attributes]);

  // Editing announcement name for the form header
  const editingTitle = editingId
    ? attributes.find((a) => a.id === editingId)?.title || "this event"
    : "";

  return (
    <div className="page-container relative min-h-[600px] p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Stall Attributes</h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search by event..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          <Button
            size="sm"
            className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
            onClick={() => {
              setEditingId(null);
              setFormData({ eventId: "", totalStallCount: 0, stalls: [] });
              setValidationErrors({});
              setDrawerOpen(true);
            }}
          >
            + Configure Stalls
          </Button>
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative glass-card overflow-hidden"
      >
        {loading && <TableLoader text="Loading stall configurations..." />}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Linked Event
                </th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Stalls
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Stalls Preview
                </th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && paginatedAttributes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-0">
                    <TableSkeleton rows={5} columns={4} />
                  </td>
                </tr>
              ) : paginatedAttributes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No stall configurations found.
                  </td>
                </tr>
              ) : (
                paginatedAttributes.map((attr) => (
                  <tr key={attr.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground font-semibold flex items-center gap-2">
                      <Calendar size={14} className="text-muted-foreground" />
                      {attr.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-foreground font-semibold">
                      {attr.totalStallCount || 0} Stalls
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold max-w-xs truncate">
                      {attr.stalls && attr.stalls.length > 0 ? (
                        attr.stalls.map((s) => `${s.name} (${s.size || "N/A"})`).join(", ")
                      ) : (
                        <span className="italic text-muted-foreground">No stalls configured</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onView={() => handleView(attr)}
                        onEdit={() => handleEdit(attr)}
                        onDelete={() => confirmDelete(attr.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredAttributes.length > pageSize && (
          <div className="px-6 pb-4 border-t border-border">
            <PaginationBar
              currentPage={page}
              totalPages={totalPages || 1}
              onPageChange={setPage}
            />
          </div>
        )}
      </motion.div>

      {/* Form Drawer */}
      <FormDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            setEditingId(null);
            setFormData({ eventId: "", totalStallCount: 0, stalls: [] });
            setValidationErrors({});
          }
        }}
        title={editingId ? "Edit Stall Configuration" : "Configure Event Stalls"}
        description={
          editingId
            ? `Updating stall configuration for: ${editingTitle}`
            : "Select a published Event announcement and configure its stalls"
        }
      >
        <div className="space-y-4 pb-12">
          <div>
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Calendar size={14} className="text-muted-foreground" /> Event Announcement{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full mt-1.5 h-11 px-3 rounded-xl border bg-secondary/50 text-sm focus:outline-none focus:ring-2 ${
                validationErrors.eventId
                  ? "border-destructive focus:ring-destructive/30"
                  : "border-border focus:ring-primary/30"
              }`}
              value={formData.eventId}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, eventId: val });
                if (val && validationErrors.eventId) {
                  setValidationErrors((prev) => ({ ...prev, eventId: undefined }));
                }
              }}
            >
              <option value="">Select Event Announcement</option>
              {eventsList.length === 0 && (
                <option disabled value="">
                  No published Event announcements found
                </option>
              )}
              {eventsList
                .filter((ann) => {
                  const annId = ann._id || ann.id;
                  return ann.isOfflineStallExist !== true || annId === formData.eventId;
                })
                .map((ann) => (
                  <option key={ann._id || ann.id} value={ann._id || ann.id}>
                    {ann.title}
                  </option>
                ))}
              {formData.eventId && !eventsList.some(ann => (ann._id || ann.id) === formData.eventId) && (
                <option value={formData.eventId}>
                  {editingTitle || "Selected Event"}
                </option>
              )}
            </select>
            {validationErrors.eventId && (
              <p className="text-xs text-destructive mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} />
                {validationErrors.eventId}
              </p>
            )}
          </div>

          {/* Total Stall Count */}
          <div>
            <label className="text-sm font-medium text-foreground">Total Stall Count</label>
            <input
              type="number"
              min="0"
              className={`w-full mt-1.5 px-3 py-2.5 rounded-xl border bg-secondary/50 text-sm focus:outline-none focus:ring-2 ${
                validationErrors.totalStallCount
                  ? "border-destructive focus:ring-destructive/30"
                  : "border-border focus:ring-primary/30"
              }`}
              placeholder="e.g. 5"
              value={formData.totalStallCount || ""}
              onChange={(e) => handleCountChange(Number(e.target.value))}
            />
            {validationErrors.totalStallCount && (
              <p className="text-xs text-destructive mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={12} />
                {validationErrors.totalStallCount}
              </p>
            )}
          </div>

          {/* Stall cards */}
          {formData.totalStallCount > 0 && (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Stalls Configuration
              </label>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {formData.stalls.map((stall, index) => {
                  const stallErr = validationErrors.stalls?.[index];
                  return (
                    <div
                      key={index}
                      className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3 shadow-xs transition-shadow hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                            Stall #{index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-6 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Stall Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            className={`w-full px-2.5 py-1.5 rounded-md border bg-white text-xs focus:outline-none focus:ring-1 ${
                              stallErr?.name
                                ? "border-destructive focus:ring-destructive/30"
                                : "border-slate-200 focus:ring-primary/30"
                            }`}
                            placeholder="e.g. Stall A1"
                            value={stall.name}
                            onChange={(e) => handleStallFieldChange(index, "name", e.target.value)}
                          />
                          {stallErr?.name && (
                            <p className="text-[9px] text-destructive mt-0.5 flex items-start gap-0.5 font-medium leading-tight">
                              <AlertCircle size={9} className="mt-0.5 flex-shrink-0" />
                              <span>{stallErr.name}</span>
                            </p>
                          )}
                        </div>
                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Size
                          </label>
                          <input
                            type="text"
                            className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                            placeholder="e.g. 10x10 ft"
                            value={stall.size}
                            onChange={(e) => handleStallFieldChange(index, "size", e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Points <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            className={`w-full px-2.5 py-1.5 rounded-md border bg-white text-xs focus:outline-none focus:ring-1 ${
                              stallErr?.points
                                ? "border-destructive focus:ring-destructive/30"
                                : "border-slate-200 focus:ring-primary/30"
                            }`}
                            placeholder="0"
                            value={stall.points === undefined || stall.points === null ? "" : stall.points}
                            onChange={(e) => handleStallFieldChange(index, "points", e.target.value)}
                          />
                          {stallErr?.points && (
                            <p className="text-[9px] text-destructive mt-0.5 flex items-start gap-0.5 font-medium leading-tight">
                              <AlertCircle size={9} className="mt-0.5 flex-shrink-0" />
                              <span>{stallErr.points}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 mt-4 text-sm font-semibold shadow-md"
            onClick={handleSave}
            disabled={formLoading}
          >
            {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Stall Configuration
          </Button>
        </div>
      </FormDrawer>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="rounded-3xl border-border bg-card max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-border pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar size={18} className="text-primary" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-lg font-bold text-foreground">
                  Stall Configurations
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Detailed configuration details for the event
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs">Loading stall details...</p>
            </div>
          ) : selectedAttribute ? (
            <div className="space-y-5">
              {/* Event Summary Section */}
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Event Title
                  </h3>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {selectedAttribute.title}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Stalls
                  </h3>
                  <span className="inline-block mt-1.5 px-3 py-1 text-xs font-extrabold rounded-full bg-primary/15 text-primary">
                    {selectedAttribute.totalStallCount} Stalls
                  </span>
                </div>
              </div>

              {/* Stalls Cards Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Stalls Layout Overview
                </h3>
                {selectedAttribute.stalls && selectedAttribute.stalls.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedAttribute.stalls.map((stall, index) => (
                      <div
                        key={index}
                        className="border border-border p-4 rounded-2xl bg-card shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
                        <div className="flex items-center justify-between pb-2 border-b border-secondary">
                          <span className="text-[11px] font-bold uppercase text-primary tracking-wide">
                            Stall #{index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {stall.name}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2.5 text-xs">
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                              Size
                            </span>
                            <span className="font-bold text-slate-700">{stall.size || "N/A"}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                              Points
                            </span>
                            <span className="font-bold text-primary">{stall.points ?? 0} pts</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-2xl">
                    No individual stalls configured.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-border bg-card">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-2">
              <AlertCircle className="text-destructive w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">Remove Stall Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the stall configuration from this announcement. The announcement itself will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20"
            >
              Remove Configuration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StallAttributesPage;
