import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  UserX,
  Search,
  Filter,
  Eye,
  Trash2,
  Phone,
  Mail,
  Smartphone,
  ClipboardList,
  Calendar,
  Info,
} from "lucide-react";
import ActionMenu from "@/components/common/ActionMenu";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PaginationBar from "@/components/common/PaginationBar";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  getIncompleteRegistrations,
  getIncompleteRegistrationById,
  deleteIncompleteRegistration,
  IncompleteRegistrationItem,
} from "@/api/IncompleteRegistrationsApi";

const STEP_OPTIONS = [
  { value: "all", label: "All Steps" },
  { value: "basic_info", label: "Basic Info" },
  { value: "business_info", label: "Business Info" },
  { value: "verify_otp", label: "Verify OTP" },
];

const getStepBadge = (step?: string) => {
  if (!step) return <Badge variant="secondary" className="text-xs font-semibold bg-slate-100 text-slate-500 border-none">Unknown</Badge>;

  const map: Record<string, { label: string; className: string }> = {
    basic_info: {
      label: "Basic Info",
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    business_info: {
      label: "Business Info",
      className: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    },
    verify_otp: {
      label: "Verify OTP",
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
  };

  const match = map[step.toLowerCase()] ?? {
    label: step,
    className: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <Badge className={`text-xs font-semibold ${match.className}`}>
      {match.label}
    </Badge>
  );
};

const IncompleteRegistrationsPage: React.FC = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const canDelete = hasPermission("incomplete_registrations", "delete");

  const [records, setRecords] = useState<IncompleteRegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [stepFilter, setStepFilter] = useState("all");

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IncompleteRegistrationItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<IncompleteRegistrationItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isMounted = useRef(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (stepFilter !== "all") params.step = stepFilter;

      const response = await getIncompleteRegistrations(params);
      const items =
        response.data ||
        response.items ||
        (Array.isArray(response) ? response : []);
      setRecords(items);

      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
        setTotalCount(response.pagination.total || 0);
      } else {
        const total = response.total || items.length;
        setTotalPages(Math.ceil(total / 10) || 1);
        setTotalCount(total);
      }
    } catch (error: any) {
      console.error("Error fetching incomplete registrations:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to load incomplete registrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const timer = setTimeout(() => {
      if (page !== 0) setPage(0);
      else fetchRecords();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, stepFilter]);

  const handleView = async (record: IncompleteRegistrationItem) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
    if (!record.deviceInfo) {
      try {
        setLoadingDetail(true);
        const res = await getIncompleteRegistrationById(record._id);
        setSelectedRecord(res.data || res);
      } catch {
        /* use list data */
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const handleDeleteSubmit = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteIncompleteRegistration(itemToDelete._id);
      toast({
        title: "Deleted",
        description: "Incomplete registration record deleted successfully",
        variant: "success" as any,
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchRecords();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete record",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && records.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Loading Incomplete Registrations..."
          subtitle="Fetching users who didn't complete sign-up"
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <UserX size={16} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              Incomplete Registrations
            </h1>
            {!loading && (
              <p className="text-xs text-muted-foreground">
                {totalCount} record{totalCount !== 1 ? "s" : ""} found
              </p>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70"
            />
            <input
              id="search-incomplete"
              type="text"
              placeholder="Search name, phone, email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="h-9 pl-8 pr-3 w-48 sm:w-64 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Step Filter */}
          <Select
            value={stepFilter}
            onValueChange={(val) => {
              setStepFilter(val);
              setPage(0);
            }}
          >
            <SelectTrigger
              id="step-filter"
              className="h-9 w-40 rounded-lg text-xs bg-background border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <Filter size={13} className="mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Steps" />
            </SelectTrigger>
            <SelectContent>
              {STEP_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-14">
                  S.No
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contact
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Dropped at Step
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Registered On
                </th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                        <ClipboardList size={22} className="text-amber-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600">
                        No incomplete registrations found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr
                    key={record._id}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      {page * 10 + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-foreground">
                        {record.fullName || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <Phone size={12} className="text-muted-foreground" />
                          {record.mobileNumber}
                        </div>
                        {record.email && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail size={12} className="text-muted-foreground" />
                            {record.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStepBadge(record.step)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {new Date(record.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onView={() => handleView(record)}
                        onDelete={
                          canDelete
                            ? () => {
                                setItemToDelete(record);
                                setDeleteDialogOpen(true);
                              }
                            : undefined
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 pb-4 border-t">
          <PaginationBar
            currentPage={page + 1}
            totalPages={totalPages}
            totalItems={totalCount}
            onPageChange={(p) => setPage(p - 1)}
          />
        </div>
      </motion.div>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <UserX className="w-5 h-5 text-amber-500" />
              Incomplete Registration Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              User who dropped off during registration
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 py-2 text-xs">
              {/* Identity */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/50 rounded-xl border border-border">
                <div>
                  <p className="text-muted-foreground font-medium">Full Name</p>
                  <p className="font-semibold text-foreground text-sm mt-0.5">
                    {selectedRecord.fullName || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Dropped at Step</p>
                  <div className="mt-0.5">{getStepBadge(selectedRecord.step)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Mobile Number</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedRecord.mobileNumber}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Email Address</p>
                  <p className="text-foreground mt-0.5 break-all">
                    {selectedRecord.email || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Device Info */}
              {(loadingDetail || selectedRecord.deviceInfo) && (
                <div className="p-3 bg-secondary/50 rounded-xl border border-border space-y-2">
                  <p className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Smartphone size={12} /> Device Info
                  </p>
                  {loadingDetail ? (
                    <p className="text-muted-foreground italic">Loading...</p>
                  ) : (
                    <p className="font-medium text-foreground break-words">
                      {selectedRecord.deviceInfo}
                    </p>
                  )}
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/50 rounded-xl border border-border">
                <div>
                  <p className="text-muted-foreground font-medium flex items-center gap-1">
                    <Calendar size={11} /> Created At
                  </p>
                  <p className="text-foreground mt-0.5">
                    {new Date(selectedRecord.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium flex items-center gap-1">
                    <Calendar size={11} /> Last Updated
                  </p>
                  <p className="text-foreground mt-0.5">
                    {new Date(selectedRecord.updatedAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                <Info size={14} className="mt-0.5 shrink-0" />
                <p className="leading-relaxed">
                  This user started registration but did not complete it. They
                  can be contacted via the phone number or email above.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
            {canDelete && selectedRecord && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setViewDialogOpen(false);
                  setItemToDelete(selectedRecord);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 size={14} className="mr-1.5" />
                Delete Record
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Incomplete Registration"
        description={`Are you sure you want to delete the incomplete registration for ${itemToDelete?.fullName || itemToDelete?.mobileNumber}? This action cannot be undone.`}
        onConfirm={handleDeleteSubmit}
        isLoading={deleting}
      />
    </div>
  );
};

export default IncompleteRegistrationsPage;
