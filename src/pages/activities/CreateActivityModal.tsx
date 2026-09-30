import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Plus,
  X,
  MapPin,
  Calendar,
  Building2,
  User,
  Users,
  Globe,
  Loader2,
  AlertCircle,
  Gift,
  Search,
  Check,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getMembers } from "@/api/MembersApi";
import { getCategories } from "@/api/CategoryApi";
import { uploadFiles } from "@/api/MediaApi";
import {
  createPost,
  getCommonStates,
  getCommonBusinessRegions,
} from "@/api/PostApi";

interface CreateActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "ASK" | "GIVE" | "PROMOTION" | "REQUIREMENT";
  onSuccess: () => void;
}

const PERIOD_OPTIONS = ["Immediate", "15 Days", "30 Days", "Future"];

export const CreateActivityModal: React.FC<CreateActivityModalProps> = ({
  open,
  onOpenChange,
  type,
  onSuccess,
}) => {
  // Members State
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Common Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Requirement & Promotion & Ask Visibility
  // Requirement/Ask: MUTUAL-FRIEND or REGION
  // Promotion: OVERALL or REGION
  const defaultVisibility = type === "PROMOTION" ? "OVERALL" : "MUTUAL-FRIEND";
  const [visibility, setVisibility] = useState<"MUTUAL-FRIEND" | "REGION" | "OVERALL">(defaultVisibility);

  // States & Regions
  const [allStates, setAllStates] = useState<any[]>([]);
  const [selectedStateIds, setSelectedStateIds] = useState<string[]>([]);
  const [allRegions, setAllRegions] = useState<any[]>([]);
  const [selectedRegionIds, setSelectedRegionIds] = useState<string[]>([]);
  const [statesDropdownOpen, setStatesDropdownOpen] = useState(false);
  const [regionsDropdownOpen, setRegionsDropdownOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [regionSearch, setRegionSearch] = useState("");

  // Requirement Specific State
  const [location, setLocation] = useState("");
  const [period, setPeriod] = useState("Immediate");
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  // Give Specific State
  const [lastmet, setLastmet] = useState("");

  // Media (Images) State: local File[] and preview URLs
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dropdown Refs for Click-Outside Detection
  const memberRef = useRef<HTMLDivElement>(null);
  const statesRef = useRef<HTMLDivElement>(null);
  const regionsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (memberRef.current && !memberRef.current.contains(target)) {
        setMemberDropdownOpen(false);
      }
      if (statesRef.current && !statesRef.current.contains(target)) {
        setStatesDropdownOpen(false);
      }
      if (regionsRef.current && !regionsRef.current.contains(target)) {
        setRegionsDropdownOpen(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(target)) {
        setCategoriesDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset form when modal opens/closes or type changes
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setLocation("");
      setPeriod("Immediate");
      setLastmet("");
      setSelectedMember(null);
      setMemberSearch("");
      setVisibility(type === "PROMOTION" ? "OVERALL" : "MUTUAL-FRIEND");
      setSelectedStateIds([]);
      setSelectedRegionIds([]);
      setSelectedCategoryIds([]);
      setImageFiles([]);
      setImagePreviews([]);
      setErrors({});

      fetchInitialData();
    }
  }, [open, type]);

  // Fetch members, states, and categories
  const fetchInitialData = async () => {
    try {
      setLoadingMembers(true);
      const membersRes = await getMembers({ limit: 1000, status: "active" });
      if (membersRes?.data) {
        setMembers(membersRes.data);
      } else if (Array.isArray(membersRes)) {
        setMembers(membersRes);
      }
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoadingMembers(false);
    }

    try {
      const statesRes = await getCommonStates();
      if (statesRes?.data) {
        setAllStates(statesRes.data);
      } else if (Array.isArray(statesRes)) {
        setAllStates(statesRes);
      }
    } catch (err) {
      console.error("Failed to load states:", err);
    }

    if (type === "REQUIREMENT") {
      try {
        const catRes = await getCategories("MAIN");
        if (catRes?.data) {
          setAllCategories(catRes.data);
        } else if (Array.isArray(catRes)) {
          setAllCategories(catRes);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
  };

  // Re-fetch regions when selected states change
  useEffect(() => {
    if (visibility === "REGION") {
      const fetchRegions = async () => {
        try {
          const res = await getCommonBusinessRegions(selectedStateIds);
          const data = res?.data || res?.items || (Array.isArray(res) ? res : []);
          setAllRegions(data);
        } catch (err) {
          console.error("Failed to load business regions:", err);
        }
      };
      fetchRegions();
    }
  }, [visibility, selectedStateIds]);

  // Handle Image File Selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    const availableSlots = 6 - imageFiles.length;

    if (availableSlots <= 0) {
      toast.error("Maximum 6 images allowed");
      return;
    }

    const filesToAdd = selected.slice(0, availableSlots);
    const newFiles = [...imageFiles, ...filesToAdd];
    setImageFiles(newFiles);

    // Create previews
    const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    if (errors.media) {
      setErrors((prev) => ({ ...prev, media: "" }));
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);

    const newPreviews = [...imagePreviews];
    // Revoke old URL
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedMember?._id) {
      newErrors.member = "Please select a member";
    }

    if (!title.trim()) {
      newErrors.title =
        type === "GIVE"
          ? "Please specify who you can connect us with"
          : type === "ASK"
          ? "Please specify who you want to connect with"
          : "Title is required";
    } else if (title.length > 50) {
      newErrors.title = "Maximum 50 characters allowed";
    }

    if (!description.trim()) {
      newErrors.description =
        type === "GIVE"
          ? "Please describe why this connection is valuable"
          : type === "ASK"
          ? "Please describe what you want to connect about"
          : "Description is required";
    } else if (description.length > 300) {
      newErrors.description = "Maximum 300 characters allowed";
    }

    if (type === "GIVE") {
      if (!lastmet) {
        newErrors.lastmet = "Last met date is required";
      }
    }

    if (type === "REQUIREMENT") {
      if (!period) {
        newErrors.period = "Period is required";
      }
      if (selectedCategoryIds.length === 0) {
        newErrors.categories = "Please select at least one category (max 3)";
      }
    }

    if (type === "PROMOTION") {
      if (imageFiles.length === 0) {
        newErrors.media = "At least 1 image is required for promotion";
      }
    }

    if (visibility === "REGION") {
      if (selectedStateIds.length === 0 && selectedRegionIds.length === 0) {
        newErrors.visibility = "Please select at least one State or Region";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload Images if any
      let uploadedMediaUrls: string[] = [];
      if (imageFiles.length > 0) {
        const uploadRes = await uploadFiles(imageFiles, "posts");
        if (uploadRes?.success && Array.isArray(uploadRes.data)) {
          uploadedMediaUrls = uploadRes.data.map((item: any) => item.url);
        } else if (Array.isArray(uploadRes?.data)) {
          uploadedMediaUrls = uploadRes.data.map((item: any) => item.url || item);
        }
      }

      // 2. Prepare payload
      const payload: any = {
        memberId: selectedMember._id,
        type,
        title: title.trim(),
        description: description.trim(),
        media: uploadedMediaUrls,
      };

      if (type === "REQUIREMENT") {
        payload.period = period;
        payload.location = location.trim() || undefined;
        payload.categoryIds = selectedCategoryIds;
        payload.requirementVisibility = visibility;
        if (visibility === "REGION") {
          payload.stateIds = selectedStateIds;
          payload.regionIds = selectedRegionIds;
        }
      } else if (type === "GIVE") {
        payload.lastmet = lastmet;
      } else if (type === "PROMOTION") {
        payload.requirementVisibility = visibility;
        if (visibility === "REGION") {
          payload.stateIds = selectedStateIds;
          payload.regionIds = selectedRegionIds;
        }
      } else if (type === "ASK") {
        payload.requirementVisibility = visibility;
        if (visibility === "REGION") {
          payload.stateIds = selectedStateIds;
          payload.regionIds = selectedRegionIds;
        }
      }

      const res = await createPost(payload);
      if (res?.status || res?.success || res?._id || res?.data) {
        toast.success(
          `${type === "PROMOTION" ? "Post" : type.charAt(0) + type.slice(1).toLowerCase()} created successfully`
        );
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res?.message || "Failed to create activity");
      }
    } catch (err: any) {
      console.error("Error creating post:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to create activity");
    } finally {
      setSubmitting(false);
    }
  };

  // Label configuration based on Type
  const formConfig = {
    REQUIREMENT: {
      modalTitle: "Requirement",
      titleLabel: "Requirement Title",
      titlePlaceholder: "Ex: Need civil engineer",
      descLabel: "Description",
      descPlaceholder: "Looking for an engineer for a 15-day project in Chennai...",
      submitBtn: "Submit Requirement",
    },
    GIVE: {
      modalTitle: "Give",
      titleLabel: "Who can you connect us with?",
      titlePlaceholder: "I can connect you with a person or company...",
      descLabel: "Why is this connection valuable?",
      descPlaceholder: "Tell us why you think this connection could benefit our members.",
      submitBtn: "Submit Give",
    },
    PROMOTION: {
      modalTitle: "Promotion",
      titleLabel: "Post Title",
      titlePlaceholder: "Ex: Special Summer Business Offer",
      descLabel: "Description",
      descPlaceholder: "Share more details about your promotional offer...",
      submitBtn: "Submit Promotion",
    },
    ASK: {
      modalTitle: "Ask",
      titleLabel: "Who would you like to connect with?",
      titlePlaceholder: "I'm looking to connect with a business/person...",
      descLabel: "What are you looking to connect about?",
      descPlaceholder: "Tell us about your project, product, or service and why you'd like to connect with them.",
      submitBtn: "Submit Ask",
    },
  }[type];

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    const name = (m.fullName || m.name || "").toLowerCase();
    const company = (m.companyName || "").toLowerCase();
    const phone = (m.phone || "").toLowerCase();
    return name.includes(q) || company.includes(q) || phone.includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] p-0 overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
              {type === "GIVE" ? (
                <Gift size={18} />
              ) : type === "PROMOTION" ? (
                <Sparkles size={18} />
              ) : (
                <Plus size={18} />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {formConfig.modalTitle}
              </DialogTitle>
              <p className="text-[11px] font-medium text-slate-500">
                Create new {type.toLowerCase()} activity
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          {/* GIVE Specific: Attractive Banner */}
          {type === "GIVE" && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Gift size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-950">
                  Have a valuable business connection to share?
                </h4>
                <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                  Introduce someone who may have projects, business opportunities, or work that
                  could benefit another member.
                </p>
              </div>
            </div>
          )}

          {/* Member Selection Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Select Member <span className="text-rose-500">*</span>
              </label>
              {selectedMember && (
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="text-[11px] font-semibold text-rose-600 hover:underline"
                >
                  Change Member
                </button>
              )}
            </div>

            {selectedMember ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden border border-primary/20">
                    {selectedMember.profileImage ? (
                      <img
                        src={selectedMember.profileImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedMember.fullName?.charAt(0)?.toUpperCase() || "M"
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {selectedMember.fullName || selectedMember.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {selectedMember.companyName || selectedMember.phone || "Member"}
                    </p>
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Selected
                </div>
              </div>
            ) : (
              <div className="relative" ref={memberRef}>
                <div
                  onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
                  className={cn(
                    "w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs cursor-pointer flex items-center justify-between shadow-xs transition-all",
                    errors.member
                      ? "border-rose-400 bg-rose-50/20"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <span className="text-slate-500">Choose member who is posting...</span>
                  <User size={14} className="text-slate-400" />
                </div>

                {memberDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-2">
                    <div className="relative">
                      <Search
                        size={13}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        placeholder="Search member by name, company, phone..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {loadingMembers ? (
                        <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span>Loading members...</span>
                        </div>
                      ) : filteredMembers.length === 0 ? (
                        <p className="p-3 text-center text-xs text-slate-400">
                          No active members found
                        </p>
                      ) : (
                        filteredMembers.slice(0, 50).map((m) => (
                          <div
                            key={m._id}
                            onClick={() => {
                              setSelectedMember(m);
                              setMemberDropdownOpen(false);
                              if (errors.member) {
                                setErrors((prev) => ({ ...prev, member: "" }));
                              }
                            }}
                            className="p-2 hover:bg-slate-50 cursor-pointer rounded-lg flex items-center gap-2.5 transition-colors"
                          >
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                              {m.profileImage ? (
                                <img
                                  src={m.profileImage}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                m.fullName?.charAt(0)?.toUpperCase() || "M"
                              )}
                            </div>
                            <div className="truncate flex-1">
                              <p className="text-xs font-semibold text-slate-900 truncate">
                                {m.fullName || m.name}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {m.companyName ? `${m.companyName} • ` : ""}
                                {m.phone || ""}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {errors.member && <p className="text-[11px] text-rose-500 font-medium">{errors.member}</p>}
          </div>

          {/* Title Field (Max 50) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                {formConfig.titleLabel} <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                {title.length}/50
              </span>
            </div>
            <Input
              value={title}
              maxLength={50}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
              }}
              placeholder={formConfig.titlePlaceholder}
              className={cn(
                "h-10 text-xs rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20",
                errors.title && "border-rose-400 bg-rose-50/20"
              )}
            />
            {errors.title && <p className="text-[11px] text-rose-500 font-medium">{errors.title}</p>}
          </div>

          {/* Description Field (Max 300) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                {formConfig.descLabel} <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                {description.length}/300
              </span>
            </div>
            <Textarea
              value={description}
              maxLength={300}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
              }}
              placeholder={formConfig.descPlaceholder}
              rows={3}
              className={cn(
                "min-h-[85px] text-xs rounded-xl bg-white resize-none border-slate-200 focus-visible:ring-primary/20",
                errors.description && "border-rose-400 bg-rose-50/20"
              )}
            />
            {errors.description && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.description}</p>
            )}
          </div>

          {/* REQUIREMENT SPECIFIC: Location */}
          {type === "REQUIREMENT" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Location</label>
              <div className="relative">
                <MapPin
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Chennai, India"
                  className="h-10 pl-9 text-xs rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20"
                />
              </div>
            </div>
          )}

          {/* REQUIREMENT SPECIFIC: Period Within */}
          {type === "REQUIREMENT" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Period Within <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPeriod(opt)}
                    className={cn(
                      "py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all",
                      period === opt
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {errors.period && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.period}</p>
              )}
            </div>
          )}

          {/* REQUIREMENT SPECIFIC: Category (Max 3) */}
          {type === "REQUIREMENT" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Category (Max 3) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-400">
                  {selectedCategoryIds.length}/3
                </span>
              </div>

              {/* Selected Category Badges */}
              {selectedCategoryIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {selectedCategoryIds.map((id) => {
                    const cat = allCategories.find((c) => c._id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold"
                      >
                        <span>{cat?.name || "Category"}</span>
                        <X
                          size={12}
                          className="cursor-pointer hover:text-rose-600"
                          onClick={() =>
                            setSelectedCategoryIds(selectedCategoryIds.filter((cid) => cid !== id))
                          }
                        />
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="relative" ref={categoriesRef}>
                <div
                  onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs cursor-pointer flex items-center justify-between shadow-xs hover:border-slate-300"
                >
                  <span className="text-slate-500">
                    {selectedCategoryIds.length === 0
                      ? "Select Categories (Max 3)"
                      : `${selectedCategoryIds.length} categories selected`}
                  </span>
                  <Building2 size={14} className="text-slate-400" />
                </div>

                {categoriesDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {allCategories
                        .filter((c) =>
                          (c.name || "").toLowerCase().includes(categorySearch.toLowerCase())
                        )
                        .map((cat) => {
                          const isSelected = selectedCategoryIds.includes(cat._id);
                          return (
                            <div
                              key={cat._id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedCategoryIds(
                                    selectedCategoryIds.filter((id) => id !== cat._id)
                                  );
                                } else {
                                  if (selectedCategoryIds.length >= 3) {
                                    toast.error("You can select up to 3 categories");
                                    return;
                                  }
                                  setSelectedCategoryIds([...selectedCategoryIds, cat._id]);
                                }
                              }}
                              className={cn(
                                "p-2 rounded-lg text-xs font-medium cursor-pointer flex items-center justify-between transition-colors",
                                isSelected
                                  ? "bg-primary/10 text-primary font-bold"
                                  : "hover:bg-slate-50 text-slate-700"
                              )}
                            >
                              <span>{cat.name}</span>
                              {isSelected && <Check size={14} />}
                            </div>
                          );
                        })}
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setCategoriesDropdownOpen(false)}
                        className="px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/5 rounded-md"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {errors.categories && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.categories}</p>
              )}
            </div>
          )}

          {/* GIVE SPECIFIC: Last Met Date */}
          {type === "GIVE" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Last Met Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <Input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={lastmet}
                  onChange={(e) => {
                    setLastmet(e.target.value);
                    if (errors.lastmet) setErrors((prev) => ({ ...prev, lastmet: "" }));
                  }}
                  className={cn(
                    "h-10 pl-9 text-xs rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20",
                    errors.lastmet && "border-rose-400 bg-rose-50/20"
                  )}
                />
              </div>
              {errors.lastmet && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.lastmet}</p>
              )}
            </div>
          )}

          {/* VISIBILITY SECTION (Requirement, Promotion, Ask) */}
          {type !== "GIVE" && (
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700">
                {type === "PROMOTION"
                  ? "Promotion Visibility"
                  : type === "REQUIREMENT"
                  ? "Requirement Visibility"
                  : "Ask Visibility"}{" "}
                <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Option 1: Mutual Friends or Overall Network */}
                {type === "PROMOTION" ? (
                  <div
                    onClick={() => setVisibility("OVERALL")}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5",
                      visibility === "OVERALL"
                        ? "border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-600"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0",
                        visibility === "OVERALL"
                          ? "border-emerald-600 bg-emerald-600"
                          : "border-slate-300"
                      )}
                    >
                      {visibility === "OVERALL" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Overall Network</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Visible to all network members
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setVisibility("MUTUAL-FRIEND")}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5",
                      visibility === "MUTUAL-FRIEND"
                        ? "border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-600"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0",
                        visibility === "MUTUAL-FRIEND"
                          ? "border-emerald-600 bg-emerald-600"
                          : "border-slate-300"
                      )}
                    >
                      {visibility === "MUTUAL-FRIEND" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Mutual Friends</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Visible to your immediate network
                      </p>
                    </div>
                  </div>
                )}

                {/* Option 2: State & Region */}
                <div
                  onClick={() => setVisibility("REGION")}
                  className={cn(
                    "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5",
                    visibility === "REGION"
                      ? "border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-600"
                      : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0",
                      visibility === "REGION"
                        ? "border-emerald-600 bg-emerald-600"
                        : "border-slate-300"
                    )}
                  >
                    {visibility === "REGION" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">State & Region</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Filter visibility by specific regions
                    </p>
                  </div>
                </div>
              </div>

              {/* State & Region Sub-selectors */}
              {visibility === "REGION" && (
                <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 space-y-3 mt-2">
                  {/* Select States (Max 3) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">
                        Select States (Max 3)
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {selectedStateIds.length}/3
                      </span>
                    </div>

                    {selectedStateIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {selectedStateIds.map((id) => {
                          const stateObj = allStates.find((s) => s._id === id);
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-[11px] font-medium"
                            >
                              <span>{stateObj?.name || "State"}</span>
                              <X
                                size={11}
                                className="cursor-pointer hover:text-rose-600"
                                onClick={() =>
                                  setSelectedStateIds(selectedStateIds.filter((sid) => sid !== id))
                                }
                              />
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="relative" ref={statesRef}>
                      <div
                        onClick={() => {
                          setStatesDropdownOpen(!statesDropdownOpen);
                          setRegionsDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-slate-500">
                          {selectedStateIds.length === 0
                            ? "Select States (Max 3)"
                            : `${selectedStateIds.length} states selected`}
                        </span>
                        <Globe size={13} className="text-slate-400" />
                      </div>

                      {statesDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2 space-y-1.5">
                          <input
                            type="text"
                            placeholder="Search states..."
                            value={stateSearch}
                            onChange={(e) => setStateSearch(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs bg-slate-50 rounded-md border border-slate-200 focus:outline-none"
                          />
                          <div className="max-h-36 overflow-y-auto space-y-0.5">
                            {allStates
                              .filter((s) =>
                                (s.name || "").toLowerCase().includes(stateSearch.toLowerCase())
                              )
                              .map((state) => {
                                const isSelected = selectedStateIds.includes(state._id);
                                return (
                                  <div
                                    key={state._id}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedStateIds(
                                          selectedStateIds.filter((id) => id !== state._id)
                                        );
                                      } else {
                                        if (selectedStateIds.length >= 3) {
                                          toast.error("Maximum 3 states allowed");
                                          return;
                                        }
                                        setSelectedStateIds([...selectedStateIds, state._id]);
                                      }
                                    }}
                                    className={cn(
                                      "p-1.5 rounded-md text-xs cursor-pointer flex items-center justify-between",
                                      isSelected
                                        ? "bg-primary/10 text-primary font-bold"
                                        : "hover:bg-slate-50 text-slate-700"
                                    )}
                                  >
                                    <span>{state.name}</span>
                                    {isSelected && <Check size={13} />}
                                  </div>
                                );
                              })}
                          </div>
                          <div className="pt-1.5 border-t border-slate-100 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setStatesDropdownOpen(false)}
                              className="px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/5 rounded-md"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Select Regions (Max 6) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">
                        Select Regions (Max 6)
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {selectedRegionIds.length}/6
                      </span>
                    </div>

                    {selectedRegionIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {selectedRegionIds.map((id) => {
                          const reg = allRegions.find((r) => (r._id || r.id) === id);
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-[11px] font-medium"
                            >
                              <span>{reg?.name || reg?.cityName || "Region"}</span>
                              <X
                                size={11}
                                className="cursor-pointer hover:text-rose-600"
                                onClick={() =>
                                  setSelectedRegionIds(selectedRegionIds.filter((rid) => rid !== id))
                                }
                              />
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="relative" ref={regionsRef}>
                      <div
                        onClick={() => {
                          setRegionsDropdownOpen(!regionsDropdownOpen);
                          setStatesDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-slate-500">
                          {selectedRegionIds.length === 0
                            ? "Select Regions (Max 6)"
                            : `${selectedRegionIds.length} regions selected`}
                        </span>
                        <MapPin size={13} className="text-slate-400" />
                      </div>

                      {regionsDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2 space-y-1.5">
                          <input
                            type="text"
                            placeholder="Search regions..."
                            value={regionSearch}
                            onChange={(e) => setRegionSearch(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs bg-slate-50 rounded-md border border-slate-200 focus:outline-none"
                          />
                          <div className="max-h-36 overflow-y-auto space-y-0.5">
                            {allRegions
                              .filter((r) =>
                                (r.name || r.cityName || "")
                                  .toLowerCase()
                                  .includes(regionSearch.toLowerCase())
                              )
                              .map((reg) => {
                                const regId = reg._id || reg.id;
                                const isSelected = selectedRegionIds.includes(regId);
                                return (
                                  <div
                                    key={regId}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedRegionIds(
                                          selectedRegionIds.filter((id) => id !== regId)
                                        );
                                      } else {
                                        if (selectedRegionIds.length >= 6) {
                                          toast.error("Maximum 6 regions allowed");
                                          return;
                                        }
                                        setSelectedRegionIds([...selectedRegionIds, regId]);
                                      }
                                    }}
                                    className={cn(
                                      "p-1.5 rounded-md text-xs cursor-pointer flex items-center justify-between",
                                      isSelected
                                        ? "bg-primary/10 text-primary font-bold"
                                        : "hover:bg-slate-50 text-slate-700"
                                    )}
                                  >
                                    <span>
                                      {reg.name} {reg.cityName ? `(${reg.cityName})` : ""}
                                    </span>
                                    {isSelected && <Check size={13} />}
                                  </div>
                                );
                              })}
                          </div>
                          <div className="pt-1.5 border-t border-slate-100 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setRegionsDropdownOpen(false)}
                              className="px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/5 rounded-md"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {errors.visibility && (
                    <p className="text-[11px] text-rose-500 font-medium">{errors.visibility}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* UPLOAD IMAGES SECTION (Requirement & Promotion) */}
          {(type === "REQUIREMENT" || type === "PROMOTION") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Upload Images {type === "PROMOTION" && <span className="text-rose-500">*</span>}{" "}
                  <span className="text-slate-400 font-normal">(3:4 Ratio)</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-400">
                  {imageFiles.length}/6
                </span>
              </div>

              {/* Previews and Add Button Grid */}
              <div className="flex flex-wrap gap-2.5 items-center">
                {imagePreviews.map((previewUrl, index) => (
                  <div
                    key={index}
                    className="relative w-20 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs group"
                  >
                    <img
                      src={previewUrl}
                      alt="Upload preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {imageFiles.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-28 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-1.5 transition-all text-slate-400 hover:text-primary"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                      <Plus size={16} />
                    </div>
                    <span className="text-[11px] font-semibold">Add</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {errors.media && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.media}</p>
              )}
            </div>
          )}
        </form>

        {/* Footer with Submit Button */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-slate-950 text-white hover:bg-slate-900 font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Processing & Submitting...</span>
              </>
            ) : (
              <>
                <Send size={14} className="text-amber-400" />
                <span>{formConfig.submitBtn}</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
