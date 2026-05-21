import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  User,
  Briefcase,
  MapPin,
  FileText,
  Image as ImageIcon,
  Globe,
  CheckCircle2,
  Plus,
  Phone,
  Loader2,
  X,
  AlertTriangle,
  ShieldCheck,
  Building2,
  ArrowRight,
  Shield,
  Trash2
} from "lucide-react";
import { State, City } from "country-state-city";
import StatusBadge from "@/components/common/StatusBadge";
import ActionMenu from "@/components/common/ActionMenu";
import PaginationBar from "@/components/common/PaginationBar";
import FormDrawer from "@/components/common/FormDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  registerMember,
  verifyGST,
  getMembers,
  updateMember,
  getMemberDetails,
  deleteMember,
  getBusinessRegion
} from "@/api/MembersApi";
import { uploadFiles } from "@/api/MediaApi";
import { getCategories } from "@/api/CategoryApi";
import { useAuth } from "@/context/AuthContext";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";

const getFullUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_API_URL.replace("/api/admin", "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

const FilePreview = ({ file, onRemove }: { file: File, onRemove: () => void }) => {
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!file.type.startsWith("image/")) {
    return (
      <div className="relative w-16 h-16 rounded-lg bg-secondary flex flex-col items-center justify-center p-1 border border-border">
        <FileText size={16} className="text-muted-foreground" />
        <span className="text-[8px] text-muted-foreground truncate w-full text-center">
          {file.name}
        </span>
        <button
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-16 h-16">
      <div className="w-full h-full rounded-lg overflow-hidden border border-border shadow-sm">
        <img
          src={preview}
          alt="preview"
          className="w-full h-full object-cover"
        />
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
      >
        <X size={12} />
      </button>
    </div>
  );
};

const UrlPreview = ({ url, onRemove }: { url: string, onRemove: () => void }) => {
  return (
    <div className="relative w-16 h-16">
      <div className="w-full h-full rounded-lg overflow-hidden border border-border shadow-sm">
        <img
          src={getFullUrl(url)}
          alt="existing"
          className="w-full h-full object-cover"
        />
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
      >
        <X size={12} />
      </button>
    </div>
  );
};

const ErrorMsg = ({ message }: { message?: string }) => {
  if (!message) return null;
  return <p className="text-[10px] text-red-500 font-bold mt-1 animate-in fade-in slide-in-from-top-1">{message}</p>;
};

const MembersPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("members", "create");
  const canEdit = hasPermission("members", "edit");
  const canDelete = hasPermission("members", "delete");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [filesToUpload, setFilesToUpload] = useState({
    profilePhoto: null as File | null,
    workImages: [] as File[],
    certifications: [] as File[],
    businessDocuments: [] as File[]
  });

  const [showGstStep, setShowGstStep] = useState(true);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstInput, setGstInput] = useState("");
  const [selectedStateCode, setSelectedStateCode] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
    gstNumber: "",
    businessName: "",
    businessCategory: "",
    subCategory: "",
    yearsOfExperience: null as number | null,
    companySize: "",
    state: "",
    city: "",
    businessRegion: "",
    businessAddress: "",
    serviceLocations: [] as string[],
    productsServicesDescription: "",
    targetAudience: "",
    websiteUrl: "",
    linkedinProfile: "",
    instagramFacebook: "",
    youtubeLink: "",
    profilePhoto: "",
    workImages: [] as string[],
    certifications: [] as string[],
    businessDocuments: [] as string[]
  });

  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);

  const [isSubCategoriesLoading, setIsSubCategoriesLoading] = useState(false);

  const allStates = State.getStatesOfCountry("IN");
  const citiesInState = selectedStateCode ? City.getCitiesOfState("IN", selectedStateCode) : [];

  const [areasOptions, setAreasOptions] = useState<any[]>([]);
  const [selectedAreaName, setSelectedAreaName] = useState<string>("");
  const [areasLoading, setAreasLoading] = useState(false);

  useEffect(() => {
    const fetchMainCategories = async () => {
      try {
        const result = await getCategories("MAIN");
        setMainCategories(result.data || []);
      } catch (error) {
        console.error("Error fetching main categories:", error);
      }
    };
    fetchMainCategories();
  }, []);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: page - 1,
        limit: 10,
      };
      if (search) params.search = search;

      const result = await getMembers(params);
      setMembers(result.data || []);
      setTotalMembers(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAreas = async (state: string, city: string) => {
    if (!state || !city) {
      setAreasOptions([]);
      return;
    }
    setAreasLoading(true);
    try {
      const result = await getBusinessRegion(state, city);
      if (result.status) {
        setAreasOptions(result.data?.areas || []);
      } else {
        setAreasOptions([]);
      }
    } catch {
      setAreasOptions([]);
    } finally {
      setAreasLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchMembers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (formData.state && formData.city) {
      fetchAreas(formData.state, formData.city);
    } else {
      setAreasOptions([]);
    }
  }, [formData.state, formData.city]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;

    // Restrict mobile number to digits only
    if (id === "mobileNumber") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData(prev => ({ ...prev, [id]: digitsOnly }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }

    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleSelectChange = async (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // If category changes, fetch sub-categories and reset subCategory field
    if (name === "businessCategory") {
      setFormData(prev => ({ ...prev, subCategory: "" }));
      setSubCategories([]);

      if (value) {
        setIsSubCategoriesLoading(true);
        try {
          const result = await getCategories("SUB", value);
          setSubCategories(result.data || []);
        } catch (error) {
          console.error("Error fetching sub-categories:", error);
        } finally {
          setIsSubCategoriesLoading(false);
        }
      }
    }

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const resetForm = () => {
    setSelectedAreaName("");
    setFormData({
      fullName: "",
      mobileNumber: "",
      email: "",
      gstNumber: "",
      businessName: "",
      businessCategory: "",
      subCategory: "",
      yearsOfExperience: null,
      companySize: "",
      state: "",
      city: "",
      businessRegion: "",
      businessAddress: "",
      serviceLocations: [],
      productsServicesDescription: "",
      targetAudience: "",
      websiteUrl: "",
      linkedinProfile: "",
      instagramFacebook: "",
      youtubeLink: "",
      profilePhoto: "",
      workImages: [],
      certifications: [],
      businessDocuments: []
    });
    setGstInput("");
    setSelectedStateCode("");
    setShowGstStep(true);
    setEditingMemberId(null);
    setErrors({});
    setFilesToUpload({
      profilePhoto: null,
      workImages: [],
      certifications: [],
      businessDocuments: []
    });
  };

  const handleEdit = async (member: any) => {
    setIsLoading(true);
    setErrors({});
    try {
      const result = await getMemberDetails(member._id);
      if (result.success || result.status === 200) {
        const fullData = result.data;
        setEditingMemberId(fullData._id);

        // Fetch sub-categories for this member's category
        if (fullData.businessCategory) {
          const catId = typeof fullData.businessCategory === 'object' ? fullData.businessCategory._id : fullData.businessCategory;
          try {
            const subRes = await getCategories("SUB", catId);
            setSubCategories(subRes.data || []);
          } catch (error) {
            console.error("Error fetching sub-categories for edit:", error);
          }
        }

        if (fullData.businessRegion && typeof fullData.businessRegion === 'object') {
          setSelectedAreaName(fullData.businessRegion.name || "");
        } else {
          setSelectedAreaName("");
        }

        setFormData({
          ...fullData,
          businessCategory: fullData.businessCategory?._id || fullData.businessCategory || "",
          subCategory: fullData.subCategory?._id || fullData.subCategory || "",
          companySize: fullData.companySize || "",
          yearsOfExperience: fullData.yearsOfExperience || null,
          serviceLocations: fullData.serviceLocations || [],
          state: fullData.state || "",
          city: fullData.city || "",
          businessRegion: fullData.businessRegion?._id?.toString() ||
            (typeof fullData.businessRegion === 'string' ? fullData.businessRegion : "") || "",
          workImages: fullData.workImages || [],
          certifications: fullData.certifications || [],
          businessDocuments: fullData.businessDocuments || []
        });

        if (fullData.state) {
          const allStates = State.getStatesOfCountry("IN");
          const stateObj = allStates.find(s => s.name === fullData.state);
          if (stateObj) setSelectedStateCode(stateObj.isoCode);
        }

        setShowGstStep(false);
        setDrawerOpen(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch member details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (member: any) => {
    setMemberToDelete(member);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteMember(memberToDelete._id);
      if (result.success) {
        toast({
          title: "Deleted",
          description: result.message || "Member has been deleted successfully",
          variant: "success"
        });
        fetchMembers();
        setDeleteConfirmOpen(false);
        setMemberToDelete(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete member",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVerifyGST = async () => {
    if (!gstInput) {
      toast({
        title: "Error",
        description: "Please enter a GST number",
        variant: "destructive"
      });
      return;
    }
    setGstLoading(true);
    try {
      const result = await verifyGST(gstInput);
      if (result.status) {
        const gstData = result.data;
        setFormData(prev => ({
          ...prev,
          fullName: gstData.legalName || prev.fullName,
          gstNumber: gstData.gstNumber,
          businessName: gstData.businessName,
          businessAddress: gstData.address,
          state: gstData.state,
          city: gstData.district,
        }));

        if (gstData.state) {
          const allStates = State.getStatesOfCountry("IN");
          const stateObj = allStates.find(s =>
            s.name.toLowerCase() === gstData.state.toLowerCase() ||
            s.isoCode === gstData.state
          );
          if (stateObj) {
            setSelectedStateCode(stateObj.isoCode);
            setFormData(prev => ({ ...prev, state: stateObj.name }));
          }
        }

        setShowGstStep(false);
        toast({
          title: "Success",
          description: result.message || "GST details fetched successfully",
          variant: "success"
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.response?.data?.message || "Could not verify GSTIN",
        variant: "destructive"
      });
    } finally {
      setGstLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, multiple = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (multiple) {
      setFilesToUpload(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof typeof prev] as File[]), ...Array.from(files)]
      }));
    } else {
      setFilesToUpload(prev => ({
        ...prev,
        [field]: files[0]
      }));
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  };

  const uploadBatch = async (files: File[], folder: string): Promise<string[]> => {
    try {
      const result = await uploadFiles(files, folder);
      if (result.success) {
        return result.data.map((f: any) => f.url);
      }
    } catch (error) {
      console.error(`Error uploading to ${folder}:`, error);
    }
    return [];
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.fullName) {
      newErrors.fullName = "Full Name is required";
    }

    // Mobile validation
    if (!formData.mobileNumber) {
      newErrors.mobileNumber = "Mobile Number is required";
    } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = "Enter a valid 10-digit mobile number";
    }

    // Email validation (optional but must be valid if entered)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    // GST validation
    if (!formData.gstNumber) {
      newErrors.gstNumber = "GST Number is required";
    }

    // Photo validation
    if (!formData.profilePhoto && !filesToUpload.profilePhoto) {
      newErrors.profilePhoto = "Profile Photo is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveMember = async () => {
    if (!validateForm()) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        _id,
        createdAt,
        updatedAt,
        pin,
        isDeleted,
        __v,
        ...dataToSave
      } = formData as any;

      const payload = { ...dataToSave };

      if (!payload.businessRegion || !payload.businessRegion.trim()) {
        payload.businessRegion = null;
      }

      const [profileUrls, workUrls, certUrls, docUrls] = await Promise.all([
        filesToUpload.profilePhoto
          ? uploadBatch([filesToUpload.profilePhoto], "profiles")
          : Promise.resolve([]),
        uploadBatch(filesToUpload.workImages, "portfolio"),
        uploadBatch(filesToUpload.certifications, "certifications"),
        uploadBatch(filesToUpload.businessDocuments, "documents")
      ]);

      if (profileUrls.length > 0) {
        payload.profilePhoto = profileUrls[0];
      }
      payload.workImages = [...payload.workImages, ...workUrls];
      payload.certifications = [...payload.certifications, ...certUrls];
      payload.businessDocuments = [...payload.businessDocuments, ...docUrls];

      let result;
      if (editingMemberId) {
        result = await updateMember(editingMemberId, payload);
      } else {
        result = await registerMember(payload);
      }

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || (editingMemberId ? "Member updated successfully" : "Member registered successfully"),
          variant: "success"
        });
        setDrawerOpen(false);
        resetForm();
        fetchMembers();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto relative min-h-[600px]">
      {isLoading && members.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Syncing Member Directory..."
          subtitle="Establishing secure connection to member nodes"
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Member Directory</h1>
            <p className="text-xs text-muted-foreground">
              Manage network members and their business details
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <Input
              placeholder="Search members..."
              className="pl-9 h-10 border-slate-200 bg-white shadow-sm focus:border-primary rounded-xl text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canCreate && (
            <Button
              className="rounded-xl shadow-lg shadow-primary/20 h-10 px-6 font-bold"
              onClick={() => {
                resetForm();
                setDrawerOpen(true);
              }}
            >
              <Plus size={18} className="mr-2" />
              Add Member
            </Button>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow>
                <TableHead className="px-6 py-4 w-16">S.No</TableHead>
                <TableHead className="px-6 py-4">Member Details</TableHead>
                <TableHead className="px-6 py-4">Business Name</TableHead>
                <TableHead className="px-6 py-4">Category</TableHead>
                <TableHead className="px-6 py-4">Location</TableHead>
                <TableHead className="px-6 py-4">Status</TableHead>
                <TableHead className="px-6 py-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member, index) => (
                  <TableRow
                    key={member._id}
                    className="hover:bg-secondary/10 transition-colors"
                  >
                    <TableCell className="px-6 py-4 text-xs font-bold text-muted-foreground/60">
                      {((page - 1) * 10) + index + 1}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-border">
                          {member.profilePhoto ? (
                            <img
                              src={getFullUrl(member.profilePhoto)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-primary font-bold">
                              {member.fullName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{member.fullName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {member.mobileNumber}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <p className="font-medium text-sm">{member.businessName}</p>
                      {member.gstNumber && (
                        <span className="text-[10px] text-primary/60 font-medium">
                          GST: {member.gstNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <p className="text-xs font-medium">
                        {member.businessCategory?.name || "N/A"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {member.subCategory?.name || ""}
                      </p>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin size={14} className="text-primary/60" />
                        <span>{member.city}{member.state ? `, ${member.state}` : ""}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        className={
                          member.status === 'active'
                            ? 'bg-green-500/10 text-green-600 border-green-200'
                            : 'bg-amber-500/10 text-amber-600 border-amber-200'
                        }
                      >
                        {member.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <ActionMenu
                        onEdit={canEdit ? () => handleEdit(member) : undefined}
                        onDelete={canDelete ? () => handleDeleteClick(member) : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="px-6 py-4 flex items-center justify-between border-t border-border bg-secondary/10">
          <p className="text-xs text-muted-foreground font-medium">
            Showing {members.length} of {totalMembers} members
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              Prev
            </Button>
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? "default" : "ghost"}
                  size="sm"
                  className="w-8 h-8 p-0 text-xs"
                  onClick={() => setPage(i + 1)}
                  disabled={isLoading}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      </motion.div>

      <FormDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) resetForm();
        }}
        title={
          editingMemberId
            ? "Edit Member Details"
            : (showGstStep ? "Registration" : "Complete Profile")
        }
      >
        <div className="flex flex-col h-full bg-slate-50/80">
          {showGstStep ? (
            <div className="px-10 py-12 space-y-10">
              <div className="space-y-6 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white text-primary shadow-xl shadow-primary/5 border border-primary/10">
                  <ShieldCheck size={42} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Verify GST Details
                  </h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                    Enter your GST number to automatically fetch your business information.
                  </p>
                </div>
              </div>

              <div className="space-y-6 max-w-md mx-auto">
                <div className="space-y-3">
                  <Label
                    htmlFor="gstInput"
                    className="text-[11px] font-bold text-slate-700 uppercase tracking-widest pl-1"
                  >
                    GST Number
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="gstInput"
                      placeholder="e.g. 33AVBPJ5809N1ZF"
                      value={gstInput}
                      onChange={(e) => setGstInput(e.target.value.toUpperCase())}
                      className="h-12 text-base font-semibold tracking-wider bg-white border-slate-300 focus:border-primary shadow-sm rounded-xl px-5"
                    />
                    <Button
                      onClick={handleVerifyGST}
                      disabled={gstLoading || !gstInput}
                      className="h-12 px-8 font-bold rounded-xl shadow-lg shadow-primary/20"
                    >
                      {gstLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <div className="mt-0.5">
                    <Shield size={16} className="text-primary" />
                  </div>
                  <p className="text-[12px] text-slate-600 font-semibold leading-relaxed">
                    This step ensures business legitimacy. All your data is securely handled and private.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6 space-y-8 pt-6 pb-10">
                {/* Basic Information */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-200">
                    <User size={18} className="text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">
                      Personal Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <Label htmlFor="fullName" className="text-xs font-bold text-slate-700 mb-2 block">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="Full legal name"
                        className={`h-11 bg-white border-slate-300 font-medium ${errors.fullName ? "border-red-500 focus:border-red-500" : ""}`}
                        value={formData.fullName}
                        onChange={handleInputChange}
                      />
                      <ErrorMsg message={errors.fullName} />
                    </div>
                    <div>
                      <Label htmlFor="profilePhoto" className="text-xs font-bold text-slate-700 mb-2 block">
                        Profile Photo <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="profilePhoto"
                        type="file"
                        className={`bg-white border-slate-300 font-medium ${errors.profilePhoto ? "border-red-500 focus:border-red-500" : ""}`}
                        onChange={(e) => onFileChange(e, "profilePhoto")}
                      />
                      <ErrorMsg message={errors.profilePhoto} />
                      {filesToUpload.profilePhoto ? (
                        <div className="mt-3">
                          <FilePreview
                            file={filesToUpload.profilePhoto}
                            onRemove={() => setFilesToUpload(prev => ({
                              ...prev,
                              profilePhoto: null
                            }))}
                          />
                        </div>
                      ) : formData.profilePhoto && (
                        <div className="mt-3">
                          <UrlPreview
                            url={formData.profilePhoto}
                            onRemove={() => setFormData(prev => ({
                              ...prev,
                              profilePhoto: ""
                            }))}
                          />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <Label htmlFor="mobileNumber" className="text-xs font-bold text-slate-700 mb-2 block">
                          Mobile Number <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="mobileNumber"
                          placeholder="+91..."
                          className={`h-11 bg-white border-slate-300 font-medium ${errors.mobileNumber ? "border-red-500 focus:border-red-500" : ""}`}
                          value={formData.mobileNumber}
                          onChange={handleInputChange}
                        />
                        <ErrorMsg message={errors.mobileNumber} />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-xs font-bold text-slate-700 mb-2 block">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@domain.com"
                          className="h-11 bg-white border-slate-300 font-medium"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-200">
                    <Briefcase size={18} className="text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">
                      Business Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <Label htmlFor="gstNumber" className="text-xs font-bold text-slate-700 mb-2 block">
                          GST Number <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="gstNumber"
                          disabled
                          className={`h-11 bg-slate-100 border-slate-200 font-bold text-slate-600 ${errors.gstNumber ? "border-red-500" : ""}`}
                          value={formData.gstNumber}
                        />
                        <ErrorMsg message={errors.gstNumber} />
                      </div>
                      <div>
                        <Label htmlFor="businessName" className="text-xs font-bold text-slate-700 mb-2 block">
                          Business Name
                        </Label>
                        <Input
                          id="businessName"
                          className="h-11 bg-white border-slate-300 font-medium"
                          value={formData.businessName}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <Label className="text-xs font-bold text-slate-700 mb-2 block">Category</Label>
                        <Select
                          value={formData.businessCategory}
                          onValueChange={(val) => handleSelectChange("businessCategory", val)}
                        >
                          <SelectTrigger className="h-11 bg-white border-slate-300 font-medium">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {mainCategories.map(cat => (
                              <SelectItem key={cat._id} value={cat._id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700 mb-2 block">
                          Sub-Category {isSubCategoriesLoading && <Loader2 size={10} className="animate-spin inline ml-1" />}
                        </Label>
                        <Select
                          value={formData.subCategory}
                          onValueChange={(val) => handleSelectChange("subCategory", val)}
                          disabled={!formData.businessCategory || isSubCategoriesLoading}
                        >
                          <SelectTrigger className={`h-11 bg-white border-slate-300 font-medium ${!formData.businessCategory ? "opacity-50 cursor-not-allowed" : ""}`}>
                            <SelectValue placeholder={!formData.businessCategory ? "Choose category first" : "Select"} />
                          </SelectTrigger>
                          <SelectContent>
                            {subCategories.length > 0 ? (
                              subCategories.map(cat => (
                                <SelectItem key={cat._id} value={cat._id}>
                                  {cat.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-xs text-muted-foreground text-center">
                                No sub-categories found
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <Label htmlFor="yearsOfExperience" className="text-xs font-bold text-slate-700 mb-2 block">
                          Experience (Years)
                        </Label>
                        <Input
                          id="yearsOfExperience"
                          type="number"
                          className="h-11 bg-white border-slate-300 font-medium"
                          value={formData.yearsOfExperience ?? ""}
                          onChange={(e) => handleSelectChange(
                            "yearsOfExperience",
                            e.target.value ? Number(e.target.value) : null
                          )}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700 mb-2 block">Company Size</Label>
                        <Select
                          value={formData.companySize}
                          onValueChange={(val) => handleSelectChange("companySize", val)}
                        >
                          <SelectTrigger className="h-11 bg-white border-slate-300 font-medium">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1 - 5">1 - 5 Employees</SelectItem>
                            <SelectItem value="6 - 10">6 - 10 Employees</SelectItem>
                            <SelectItem value="11 - 20">11 - 20 Employees</SelectItem>
                            <SelectItem value="21 - 50">21 - 50 Employees</SelectItem>
                            <SelectItem value="51 - 100">51 - 100 Employees</SelectItem>
                            <SelectItem value="100+">100+ Employees</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Details */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-200">
                    <MapPin size={18} className="text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">
                      Location & Service
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <Label className="text-xs font-bold text-slate-700 mb-2 block">State</Label>
                        <Select
                          value={selectedStateCode}
                          onValueChange={(val) => {
                            setSelectedStateCode(val);
                            const stateName = allStates.find(s => s.isoCode === val)?.name || "";
                            setFormData(prev => ({
                              ...prev,
                              state: stateName,
                              city: "",
                              businessRegion: ""
                            }));
                            setAreasOptions([]);
                          }}
                        >
                          <SelectTrigger className="h-11 bg-white border-slate-300 font-medium">
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {allStates.map((s) => (
                              <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700 mb-2 block">City</Label>
                        <Select
                          value={formData.city}
                          onValueChange={(val) => setFormData(prev => ({ ...prev, city: val, businessRegion: "" }))}
                          disabled={!selectedStateCode}
                        >
                          <SelectTrigger className="h-11 bg-white border-slate-300 font-medium">
                            <SelectValue placeholder={selectedStateCode ? "Select City" : "Choose state first"} />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {citiesInState.map((c) => (
                              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                            ))}
                            {citiesInState.length === 0 && selectedStateCode && (
                              <div className="p-2 text-xs text-muted-foreground text-center italic">No cities found</div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="businessRegion" className="text-xs font-bold text-slate-700 mb-2 block">
                        Business Region {areasLoading && <Loader2 size={10} className="animate-spin inline ml-1" />}
                      </Label>
                      <Select
                        value={formData.businessRegion}
                        onValueChange={(val) => {
                          setFormData((prev) => ({
                            ...prev,
                            businessRegion: val === "none" ? "" : val
                          }));
                          const selectedObj = areasOptions.find((a: any) => a._id === val);
                          if (selectedObj) {
                            setSelectedAreaName(selectedObj.name);
                          }
                        }}
                        disabled={!formData.state || !formData.city || areasLoading}
                      >
                        <SelectTrigger className="h-11 bg-white border-slate-300 font-medium">
                          <SelectValue placeholder={!formData.state || !formData.city ? "Choose state and city first" : "Select Business Region"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">

                          <SelectItem value="none">
                            Select Business Region
                          </SelectItem>

                          {formData.businessRegion && !areasOptions.some((a: any) => a._id === formData.businessRegion) && (
                            <SelectItem key={formData.businessRegion} value={formData.businessRegion}>
                              {selectedAreaName || "Selected Region"}
                            </SelectItem>
                          )}
                          {areasOptions.map((area: any) => (
                            <SelectItem key={area._id} value={area._id}>
                              {area.name}
                            </SelectItem>
                          ))}
                          {areasOptions.length === 0 && !formData.businessRegion && (
                            <div className="p-2 text-xs text-muted-foreground text-center italic">No regions found</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="businessAddress" className="text-xs font-bold text-slate-700 mb-2 block">
                        Business Address
                      </Label>
                      <Textarea
                        id="businessAddress"
                        className="min-h-[80px] bg-white border-slate-300 font-medium"
                        value={formData.businessAddress}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="serviceLocations" className="text-xs font-bold text-slate-700 mb-2 block">
                      Service Locations
                    </Label>
                    <Input
                      id="serviceLocations"
                      placeholder="City-wide, State-wide, etc."
                      className="h-11 bg-white border-slate-300 font-medium"
                      value={formData.serviceLocations.join(", ")}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        serviceLocations: e.target.value.split(",").map(s => s.trim())
                      }))}
                    />
                  </div>
                </div>

                {/* Professional Details */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-200">
                    <FileText size={18} className="text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">
                      Professional Info
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <Label htmlFor="productsServicesDescription" className="text-xs font-bold text-slate-700 mb-2 block">
                        Description of Products/Services
                      </Label>
                      <Textarea
                        id="productsServicesDescription"
                        className="min-h-[80px] bg-white border-slate-300 font-medium"
                        value={formData.productsServicesDescription}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="targetAudience" className="text-xs font-bold text-slate-700 mb-2 block">
                        Target Audience
                      </Label>
                      <Input
                        id="targetAudience"
                        className="h-11 bg-white border-slate-300 font-medium"
                        value={formData.targetAudience}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Portfolio */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-200">
                    <ImageIcon size={18} className="text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">
                      Portfolio & Media
                    </h3>
                  </div>
                  <div className="space-y-7">
                    <div>
                      <Label className="text-xs font-bold text-slate-700 mb-2 block">Work Images</Label>
                      <Input
                        type="file"
                        multiple
                        className="bg-white border-slate-300 font-medium"
                        onChange={(e) => onFileChange(e, "workImages", true)}
                      />
                      <div className="flex gap-3 flex-wrap mt-3">
                        {formData.workImages.map((url, i) => (
                          <UrlPreview
                            key={i}
                            url={url}
                            onRemove={() => setFormData(prev => ({
                              ...prev,
                              workImages: prev.workImages.filter((_, idx) => idx !== i)
                            }))}
                          />
                        ))}
                        {filesToUpload.workImages.map((f, i) => (
                          <FilePreview
                            key={i}
                            file={f}
                            onRemove={() => setFilesToUpload(prev => ({
                              ...prev,
                              workImages: prev.workImages.filter((_, idx) => idx !== i)
                            }))}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700 mb-2 block">Certifications</Label>
                      <Input
                        type="file"
                        multiple
                        className="bg-white border-slate-300 font-medium"
                        onChange={(e) => onFileChange(e, "certifications", true)}
                      />
                      <div className="flex gap-3 flex-wrap mt-3">
                        {formData.certifications.map((url, i) => (
                          <UrlPreview
                            key={i}
                            url={url}
                            onRemove={() => setFormData(prev => ({
                              ...prev,
                              certifications: prev.certifications.filter((_, idx) => idx !== i)
                            }))}
                          />
                        ))}
                        {filesToUpload.certifications.map((f, i) => (
                          <FilePreview
                            key={i}
                            file={f}
                            onRemove={() => setFilesToUpload(prev => ({
                              ...prev,
                              certifications: prev.certifications.filter((_, idx) => idx !== i)
                            }))}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700 mb-2 block">Business Documents</Label>
                      <Input
                        type="file"
                        multiple
                        className="bg-white border-slate-300 font-medium"
                        onChange={(e) => onFileChange(e, "businessDocuments", true)}
                      />
                      <div className="flex gap-3 flex-wrap mt-3">
                        {formData.businessDocuments.map((url, i) => (
                          <UrlPreview
                            key={i}
                            url={url}
                            onRemove={() => setFormData(prev => ({
                              ...prev,
                              businessDocuments: prev.businessDocuments.filter((_, idx) => idx !== i)
                            }))}
                          />
                        ))}
                        {filesToUpload.businessDocuments.map((f, i) => (
                          <FilePreview
                            key={i}
                            file={f}
                            onRemove={() => setFilesToUpload(prev => ({
                              ...prev,
                              businessDocuments: prev.businessDocuments.filter((_, idx) => idx !== i)
                            }))}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-200">
                    <Globe size={18} className="text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800">
                      Online Presence
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <Label htmlFor="websiteUrl" className="text-xs font-bold text-slate-700 mb-2 block">Website URL</Label>
                      <Input
                        id="websiteUrl"
                        placeholder="https://"
                        className="h-11 bg-white border-slate-300 font-medium"
                        value={formData.websiteUrl}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedinProfile" className="text-xs font-bold text-slate-700 mb-2 block">LinkedIn Profile</Label>
                      <Input
                        id="linkedinProfile"
                        className="h-11 bg-white border-slate-300 font-medium"
                        value={formData.linkedinProfile}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="instagramFacebook" className="text-xs font-bold text-slate-700 mb-2 block">
                        Instagram/Facebook
                      </Label>
                      <Input
                        id="instagramFacebook"
                        className="h-11 bg-white border-slate-300 font-medium"
                        value={formData.instagramFacebook}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="youtubeLink" className="text-xs font-bold text-slate-700 mb-2 block">Youtube Link</Label>
                      <Input
                        id="youtubeLink"
                        className="h-11 bg-white border-slate-300 font-medium"
                        value={formData.youtubeLink}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 px-6 pb-8 flex gap-3 border-t-2 border-slate-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-slate-300 font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-all"
                  onClick={() => setDrawerOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20 font-bold tracking-wide"
                  onClick={handleSaveMember}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 size={18} className="mr-2" />
                  )}
                  {editingMemberId ? "Update Profile" : "Register Member"}
                </Button>
              </div>
            </>
          )}
        </div>
      </FormDrawer>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Member?"
        description={`Are you sure you want to delete ${memberToDelete?.fullName}? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MembersPage;
