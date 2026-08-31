import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
  Trash2,
  ChevronsUpDown,
  Check,
  Activity

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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  registerMember,
  verifyGST,
  getMembers,
  updateMember,
  getMemberDetails,
  deleteMember,
  updateMemberStatus,
  getBusinessRegion,
  getStates,
  getCities
} from "@/api/MembersApi";
import { getRegions } from "@/api/RegionApi";
import { uploadFiles } from "@/api/MediaApi";
import { getCategories } from "@/api/CategoryApi";
import { useAuth } from "@/context/AuthContext";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { PrivateAvatar } from "@/components/common/PrivateAvatar";
import { PrivateImage } from "@/components/common/PrivateImage";

const getMemberLeftBorder = (name: string = "") => {
  const charCode = name.charCodeAt(0) || 0;
  const index = charCode % 5;
  const borders = [
    "border-l-purple-500 hover:border-l-purple-600",
    "border-l-amber-500 hover:border-l-amber-600",
    "border-l-emerald-500 hover:border-l-emerald-600",
    "border-l-blue-500 hover:border-l-blue-600",
    "border-l-rose-500 hover:border-l-rose-600"
  ];
  return borders[index];
};

const getAvatarGradient = (name: string = "") => {
  const charCode = name.charCodeAt(0) || 0;
  const index = charCode % 5;
  const gradients = [
    "bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 border-purple-200",
    "bg-gradient-to-br from-pink-100 to-rose-100 text-rose-700 border-rose-200",
    "bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-700 border-amber-200",
    "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200",
    "bg-gradient-to-br from-blue-100 to-sky-100 text-blue-700 border-blue-200"
  ];
  return gradients[index];
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
        <PrivateImage
          src={url}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const regionIdFilter = searchParams.get("regionId") || "";
  const statusFilter = searchParams.get("status") || "";
  const activityFilter = searchParams.get("activityFilter") || "";
  const categoryFilter = searchParams.get("category") || "";
  const joinedStart = searchParams.get("joinedStart") || "";
  const joinedEnd = searchParams.get("joinedEnd") || "";
  const expiredStart = searchParams.get("expiredStart") || "";
  const expiredEnd = searchParams.get("expiredEnd") || "";
  const canCreate = hasPermission("members", "create");
  const canEdit = hasPermission("members", "edit");
  const canDelete = hasPermission("members", "delete");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [memberToToggle, setMemberToToggle] = useState<any>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
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
    profileBanner: null as File | null,
    workImages: [] as File[],
    certifications: [] as File[],
    businessDocuments: [] as File[]
  });

  const [showGstStep, setShowGstStep] = useState(true);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstInput, setGstInput] = useState("");
  const [selectedStateCode, setSelectedStateCode] = useState("");

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subCategoryOpen, setSubCategoryOpen] = useState(false);
  const [companySizeOpen, setCompanySizeOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState("");
  const [visibleMemberRegionCount, setVisibleMemberRegionCount] = useState(10);
  const [citySearch, setCitySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");

  const [serviceStateOpen, setServiceStateOpen] = useState(false);
  const [serviceCityOpen, setServiceCityOpen] = useState(false);
  const [serviceStateSearch, setServiceStateSearch] = useState("");
  const [serviceCitySearch, setServiceCitySearch] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
    dob: "",
    about: "",
    gstNumber: "",
    businessName: "",
    businessType: "",
    legalName: "",
    businessCategory: "",
    subCategory: "",
    yearsOfExperience: null as number | null,
    companySize: "",
    state: "",
    city: "",
    businessRegion: "",
    businessAddress: "",
    serviceLocations: {
      country: "India",
      states: [] as string[],
      cities: [] as string[]
    },
    productsServicesDescription: "",
    targetAudience: "",
    websiteUrl: "",
    linkedinProfile: "",
    instagram: "",
    facebook: "",
    youtubeLink: "",
    profilePhoto: "",
    profileBanner: "",
    workImages: [] as string[],
    certifications: [] as string[],
    businessDocuments: [] as string[]
  });

  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [isSubCategoriesLoading, setIsSubCategoriesLoading] = useState(false);

  const [apiStates, setApiStates] = useState<any[]>([]);
  const [apiCities, setApiCities] = useState<any[]>([]);
  const [isStatesLoading, setIsStatesLoading] = useState(false);
  const [isCitiesLoading, setIsCitiesLoading] = useState(false);
  const [businessRegions, setBusinessRegions] = useState<any[]>([]);
  const [isBusinessRegionsLoading, setIsBusinessRegionsLoading] = useState(false);

  const fetchStatesApi = async () => {
    setIsStatesLoading(true);
    try {
      const res = await getStates();
      const stateList = res?.data || res || [];
      if (Array.isArray(stateList)) {
        setApiStates(stateList);
      }
    } catch (err) {
      console.error("Error fetching states from API:", err);
    } finally {
      setIsStatesLoading(false);
    }
  };

  const fetchBusinessRegions = async () => {
    setIsBusinessRegionsLoading(true);
    try {
      const res = await getRegions({ limit: 1000, status: "active" });
      const regionList = res?.data || [];
      setBusinessRegions(regionList);
    } catch (err) {
      console.error("Error fetching business regions:", err);
    } finally {
      setIsBusinessRegionsLoading(false);
    }
  };

  const fetchCitiesApi = async (stateId?: string, search?: string) => {
    setIsCitiesLoading(true);
    try {
      const res = await getCities({ stateIds: stateId, search });
      const cityList = res?.data || res || [];
      if (Array.isArray(cityList)) {
        setApiCities(cityList);
      }
    } catch (err) {
      console.error("Error fetching cities from API:", err);
    } finally {
      setIsCitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchStatesApi();
    fetchBusinessRegions();
  }, []);

  const allStates = useMemo(() => State.getStatesOfCountry("IN"), []);

  const allStateItems = useMemo(() => {
    const statesMap = new Map<string, { _id?: string; name: string; isoCode?: string }>();
    
    allStates.forEach(s => {
      statesMap.set(s.name.toLowerCase(), { name: s.name, isoCode: s.isoCode });
    });

    apiStates.forEach((s: any) => {
      if (s && s.name) {
        const key = s.name.toLowerCase();
        const existing = statesMap.get(key);
        statesMap.set(key, { ...existing, _id: s._id, name: s.name });
      }
    });

    return Array.from(statesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [apiStates, allStates]);

  const allCityItems = useMemo(() => {
    if (!formData.state) return [];

    const selectedStateName = formData.state.trim().toLowerCase();

    // Filter business regions matching the selected state that have configured areas
    const matchingRegions = businessRegions.filter((r: any) => {
      if (!r.city || r.isDeleted) return false;
      const stateName = (r.state?.name || r.state || "").toString().trim().toLowerCase();
      const hasAreas = Array.isArray(r.areas) && r.areas.length > 0;
      return stateName === selectedStateName && hasAreas;
    });

    const citiesMap = new Map<string, { _id?: string; name: string; stateId?: string }>();

    matchingRegions.forEach((r: any) => {
      const cityName = (r.city?.name || r.city || "").toString().trim();
      if (cityName) {
        citiesMap.set(cityName.toLowerCase(), {
          _id: r._id,
          name: cityName,
        });
      }
    });

    // If the member already has a saved city, ensure it is included so it remains visible
    if (formData.city && !citiesMap.has(formData.city.toLowerCase())) {
      citiesMap.set(formData.city.toLowerCase(), {
        name: formData.city,
      });
    }

    return Array.from(citiesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [formData.state, formData.city, businessRegions]);

  const availableServiceCities = useMemo(() => {
    if (!formData.serviceLocations.states || formData.serviceLocations.states.length === 0) {
      return [];
    }

    const citiesMap = new Map<string, { _id?: string; name: string }>();

    formData.serviceLocations.states.forEach(stateName => {
      const stateObj = allStates.find(
        s => s.name.toLowerCase() === stateName.toLowerCase() || s.isoCode.toLowerCase() === stateName.toLowerCase()
      );
      if (stateObj) {
        const cscCities = City.getCitiesOfState("IN", stateObj.isoCode) || [];
        cscCities.forEach(c => {
          citiesMap.set(c.name.toLowerCase(), { name: c.name });
        });
      }
    });

    return Array.from(citiesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [formData.serviceLocations.states, allStates]);

  const citiesInState = selectedStateCode ? City.getCitiesOfState("IN", selectedStateCode) : [];

  const [areasOptions, setAreasOptions] = useState<any[]>([]);
  const [selectedAreaName, setSelectedAreaName] = useState<string>("");
  const [areasLoading, setAreasLoading] = useState(false);

  const filteredAreas = areasOptions.filter((a: any) => a.name.toLowerCase().includes(regionSearch.toLowerCase()));
  const visibleMemberAreas = filteredAreas.slice(0, visibleMemberRegionCount);

  const handleMemberRegionScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 20) {
      if (visibleMemberRegionCount < filteredAreas.length) {
        setVisibleMemberRegionCount(prev => prev + 10);
      }
    }
  };

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
      if (regionIdFilter) params.regionId = regionIdFilter;
      if (statusFilter) params.status = statusFilter;
      if (activityFilter) params.activityFilter = activityFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (joinedStart) params.joinedStart = joinedStart;
      if (joinedEnd) params.joinedEnd = joinedEnd;
      if (expiredStart) params.expiredStart = expiredStart;
      if (expiredEnd) params.expiredEnd = expiredEnd;

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

  const isMounted = useRef(false);

  useEffect(() => {
    fetchMembers();
  }, [page]);

  useEffect(() => {
    if (!isMounted.current) return;
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchMembers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isMounted.current) return;
    if (page !== 1) setPage(1);
    else fetchMembers();
  }, [regionIdFilter, statusFilter, activityFilter]);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  useEffect(() => {
    if (formData.state && formData.city) {
      const matchedRegion = businessRegions.find((r: any) => {
        const stateName = (r.state?.name || r.state || "").toString().trim().toLowerCase();
        const cityName = (r.city?.name || r.city || "").toString().trim().toLowerCase();
        return stateName === formData.state.trim().toLowerCase() && cityName === formData.city.trim().toLowerCase();
      });
      if (matchedRegion && Array.isArray(matchedRegion.areas) && matchedRegion.areas.length > 0) {
        setAreasOptions(matchedRegion.areas);
      }
      fetchAreas(formData.state, formData.city);
    } else {
      setAreasOptions([]);
    }
  }, [formData.state, formData.city, businessRegions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;

    // Restrict mobile number to digits only
    if (id === "mobileNumber") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData(prev => ({ ...prev, [id]: digitsOnly }));
    } else if (id === "fullName") {
      const alphabetsOnly = value.replace(/[^a-zA-Z\s]/g, "");
      setFormData(prev => ({ ...prev, [id]: alphabetsOnly }));
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

  const handleAddServiceState = (stateName: string) => {
    setFormData(prev => {
      const states = prev.serviceLocations.states.includes(stateName)
        ? prev.serviceLocations.states
        : [...prev.serviceLocations.states, stateName];
      return {
        ...prev,
        serviceLocations: {
          ...prev.serviceLocations,
          states
        }
      };
    });
  };

  const handleRemoveServiceState = (stateName: string) => {
    setFormData(prev => {
      const states = prev.serviceLocations.states.filter(s => s !== stateName);
      // Also filter out any cities that belong to this state
      const stateObj = allStates.find(s => s.name.toLowerCase() === stateName.toLowerCase());
      let cities = prev.serviceLocations.cities;
      if (stateObj) {
        const citiesInRemovedState = City.getCitiesOfState("IN", stateObj.isoCode).map(c => c.name);
        cities = cities.filter(c => !citiesInRemovedState.includes(c));
      }
      return {
        ...prev,
        serviceLocations: {
          ...prev.serviceLocations,
          states,
          cities
        }
      };
    });
  };

  const handleAddServiceCity = (cityName: string) => {
    setFormData(prev => {
      const cities = prev.serviceLocations.cities.includes(cityName)
        ? prev.serviceLocations.cities
        : [...prev.serviceLocations.cities, cityName];
      return {
        ...prev,
        serviceLocations: {
          ...prev.serviceLocations,
          cities
        }
      };
    });
  };

  const handleRemoveServiceCity = (cityName: string) => {
    setFormData(prev => {
      const cities = prev.serviceLocations.cities.filter(c => c !== cityName);
      return {
        ...prev,
        serviceLocations: {
          ...prev.serviceLocations,
          cities
        }
      };
    });
  };

  const resetForm = () => {
    setSelectedAreaName("");
    setFormData({
      fullName: "",
      mobileNumber: "",
      email: "",
      dob: "",
      about: "",
      gstNumber: "",
      businessName: "",
      businessType: "",
      legalName: "",
      businessCategory: "",
      subCategory: "",
      yearsOfExperience: null,
      companySize: "",
      state: "",
      city: "",
      businessRegion: "",
      businessAddress: "",
      serviceLocations: {
        country: "India",
        states: [],
        cities: []
      },
      productsServicesDescription: "",
      targetAudience: "",
      websiteUrl: "",
      linkedinProfile: "",
      instagram: "",
      facebook: "",
      youtubeLink: "",
      profilePhoto: "",
      profileBanner: "",
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
      profileBanner: null,
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

        let parsedServiceLocations = {
          country: "India",
          states: [] as string[],
          cities: [] as string[]
        };
        if (fullData.serviceLocations) {
          if (Array.isArray(fullData.serviceLocations)) {
            parsedServiceLocations.cities = fullData.serviceLocations;
          } else if (typeof fullData.serviceLocations === "object") {
            parsedServiceLocations = {
              country: fullData.serviceLocations.country || "India",
              states: fullData.serviceLocations.states || [],
              cities: fullData.serviceLocations.cities || []
            };
          }
        }

        let formattedDob = "";
        if (fullData.dob) {
          const dobDate = new Date(fullData.dob);
          if (!isNaN(dobDate.getTime())) {
            formattedDob = dobDate.toISOString().split("T")[0];
          }
        }

        setFormData({
          ...fullData,
          dob: formattedDob,
          businessCategory: fullData.businessCategory?._id || fullData.businessCategory || "",
          subCategory: fullData.subCategory?._id || fullData.subCategory || "",
          about: fullData.about || "",
          businessType: fullData.businessType || "",
          legalName: fullData.legalName || "",
          companySize: fullData.companySize || "",
          yearsOfExperience: fullData.yearsOfExperience || null,
          serviceLocations: parsedServiceLocations,
          state: fullData.state || "",
          city: fullData.city || "",
          businessRegion: fullData.businessRegion?._id?.toString() ||
            (typeof fullData.businessRegion === 'string' ? fullData.businessRegion : "") || "",
          websiteUrl: fullData.websiteUrl || "",
          linkedinProfile: fullData.linkedinProfile || "",
          instagram: fullData.instagram || fullData.instagramFacebook || "",
          facebook: fullData.facebook || "",
          youtubeLink: fullData.youtubeLink || "",
          profileBanner: fullData.profileBanner || "",
          workImages: fullData.workImages || [],
          certifications: fullData.certifications || [],
          businessDocuments: fullData.businessDocuments || []
        });

        if (fullData.state) {
          const matchedState = allStateItems.find(s => s.name.toLowerCase() === fullData.state.toLowerCase());
          if (matchedState?._id) {
            fetchCitiesApi(matchedState._id);
          } else {
            const apiSt = apiStates.find((st: any) => st.name?.toLowerCase() === fullData.state.toLowerCase());
            if (apiSt?._id) fetchCitiesApi(apiSt._id);
          }
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

  const handleToggleStatus = (member: any) => {
    setMemberToToggle(member);
    setStatusConfirmOpen(true);
  };

  const handleConfirmStatusToggle = async () => {
    if (!memberToToggle) return;
    const newStatus = memberToToggle.status === "active" ? "inactive" : "active";
    setIsTogglingStatus(true);
    try {
      const result = await updateMemberStatus(memberToToggle._id, newStatus);
      if (result.success) {
        toast({
          title: "Status Updated",
          description: result.message || `Member status updated to ${newStatus}`,
          variant: "success"
        });
        fetchMembers();
        setStatusConfirmOpen(false);
        setMemberToToggle(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update member status",
        variant: "destructive"
      });
    } finally {
      setIsTogglingStatus(false);
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
          businessName: gstData.businessName || gstData.tradeName || prev.businessName,
          legalName: gstData.legalName || prev.legalName,
          businessType: gstData.businessType || gstData.constitutionOfBusiness || prev.businessType,
          businessAddress: gstData.address || gstData.businessAddress || prev.businessAddress,
          state: gstData.state || prev.state,
          city: gstData.district || gstData.city || prev.city,
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
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName)) {
      newErrors.fullName = "Full Name should accept only alphabets and spaces";
    }

    // Mobile validation
    if (!formData.mobileNumber) {
      newErrors.mobileNumber = "Mobile Number is required";
    } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = "Enter a valid 10-digit mobile number";
    }

    // Email validation (mandatory)
    if (!formData.email) {
      newErrors.email = "Email Address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    // Experience validation
    if (formData.yearsOfExperience !== null && formData.yearsOfExperience < 0) {
      newErrors.yearsOfExperience = "Experience must be a positive value";
    }

    // GST validation
    if (!formData.gstNumber) {
      newErrors.gstNumber = "GST Number is required";
    }

    // DOB validation
    if (formData.dob) {
      const selectedDob = new Date(formData.dob);
      const today = new Date();
      if (selectedDob > today) {
        newErrors.dob = "Date of Birth cannot be in the future";
      }
    }

    // Photo validation
    // Profile Photo is now optional, no validation needed

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

      if (payload.dob && typeof payload.dob === "string" && payload.dob.trim()) {
        payload.dob = payload.dob.trim();
      } else {
        delete payload.dob;
      }

      if (!payload.businessRegion || !payload.businessRegion.trim()) {
        payload.businessRegion = null;
      }

      const [profileUrls, bannerUrls, workUrls, certUrls, docUrls] = await Promise.all([
        filesToUpload.profilePhoto
          ? uploadBatch([filesToUpload.profilePhoto], "profiles")
          : Promise.resolve([]),
        filesToUpload.profileBanner
          ? uploadBatch([filesToUpload.profileBanner], "profiles")
          : Promise.resolve([]),
        uploadBatch(filesToUpload.workImages, "portfolio"),
        uploadBatch(filesToUpload.certifications, "certifications"),
        uploadBatch(filesToUpload.businessDocuments, "documents")
      ]);

      if (profileUrls.length > 0) {
        payload.profilePhoto = profileUrls[0];
      }
      if (bannerUrls.length > 0) {
        payload.profileBanner = bannerUrls[0];
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
            <h1 className="text-xl font-bold">Member List</h1>
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

      {regionIdFilter && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20 text-sm">
          <MapPin size={15} className="text-primary flex-shrink-0" />
          <span className="text-foreground font-medium flex-1">
            Showing members filtered by <span className="font-bold text-primary">Business Region</span>
          </span>
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.delete("regionId");
              setSearchParams(params);
            }}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/70 transition-colors"
          >
            <X size={13} />
            Clear filter
          </button>
        </div>
      )}

      {activityFilter && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20 text-sm mt-2">
          <Activity size={15} className="text-primary flex-shrink-0" />
          <span className="text-foreground font-medium flex-1">
            Showing members filtered by Activity: <span className="font-bold text-primary">
              {activityFilter === "notPosted" ? "Not Posted Today" :
               activityFilter === "notAsked" ? "Not Asked Today" :
               activityFilter === "notGiven" ? "Not Given Today" :
               activityFilter === "notRequirements" ? "No Requirements Today" : activityFilter}
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.delete("activityFilter");
              setSearchParams(params);
            }}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/70 transition-colors"
          >
            <X size={13} />
            Clear filter
          </button>
        </div>
      )}

      {statusFilter && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20 text-sm mt-2">
          <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
          <span className="text-foreground font-medium flex-1">
            Showing members filtered by Status: <span className="font-bold text-primary uppercase">{statusFilter}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.delete("status");
              setSearchParams(params);
            }}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/70 transition-colors"
          >
            <X size={13} />
            Clear filter
          </button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-card rounded-xl border border-border shadow-sm overflow-hidden relative"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow>
                <TableHead className="px-6 py-4 w-16 text-center">S.No</TableHead>
                <TableHead className="px-6 py-4">Member Details</TableHead>
                <TableHead className="px-6 py-4">Business Name</TableHead>
                <TableHead className="px-6 py-4 min-w-[220px]">Category</TableHead>
                <TableHead className="px-6 py-4">Location</TableHead>
                <TableHead className="px-6 py-4">Status</TableHead>
                <TableHead className="px-6 py-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell colSpan={7} className="px-6 py-6">
                      <div className="w-full h-12 bg-muted/60 animate-pulse rounded-lg"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member, index) => (
                  <TableRow key={member._id} className="hover:bg-secondary/10 transition-colors">
                    <TableCell className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                      {((page - 1) * 10) + index + 1}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <PrivateAvatar
                          src={member.profilePhoto}
                          fallbackName={member.fullName}
                          className="w-10 h-10 border border-border/80 flex-shrink-0 shadow-sm"
                          avatarImageClassName="object-cover"
                          avatarFallbackClassName={cn("text-xs font-bold shadow-inner flex items-center justify-center border", getAvatarGradient(member.fullName || "?"))}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground leading-snug tracking-tight">{member.fullName}</span>
                          <span className="text-xs text-muted-foreground font-medium">{member.mobileNumber}</span>
                          {member.dob && (
                            <span className="text-[11px] text-slate-500 font-normal">
                              DOB: {new Date(member.dob).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <p className="text-sm text-foreground font-semibold">{member.businessName}</p>
                      {member.gstNumber && (
                        <span className="text-xs text-muted-foreground font-medium block mt-0.5">
                          GST: {member.gstNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 min-w-[220px]">
                      <p className="text-sm text-foreground font-semibold">
                        {member.businessCategory?.name || "N/A"}
                      </p>
                      {member.subCategory?.name && (
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          {member.subCategory.name}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-start gap-1.5 text-sm text-foreground font-semibold">
                        <MapPin size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                        <span>{member.city}{member.state ? `, ${member.state}` : ""}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        variant="outline"
                        onClick={canEdit ? () => handleToggleStatus(member) : undefined}
                        className={
                          `cursor-pointer select-none transition-all hover:opacity-80 active:scale-95 ${
                            member.status === 'active'
                              ? 'bg-green-500/10 text-green-600 border-green-200'
                              : 'bg-amber-500/10 text-amber-600 border-amber-200'
                          }`
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
        {!isLoading && members.length > 0 && (
          <div className="px-6 pb-4 border-t border-border">
            <PaginationBar
              currentPage={page}
              totalPages={totalPages || 1}
              totalItems={totalMembers}
              onPageChange={setPage}
            />
          </div>
        )}
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
            : (showGstStep ? "Registration" : "Add Member")
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
                      <Label htmlFor="about" className="text-xs font-bold text-slate-700 mb-2 block">
                        About / Bio
                      </Label>
                      <Textarea
                        id="about"
                        placeholder="Brief description about the member or their business..."
                        className="min-h-[80px] bg-white border-slate-300 font-medium"
                        value={formData.about}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <Label htmlFor="profilePhoto" className="text-xs font-bold text-slate-700 mb-2 block">
                          Profile Photo
                        </Label>
                        <Input
                          id="profilePhoto"
                          type="file"
                          accept="image/*"
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
                      <div>
                        <Label htmlFor="profileBanner" className="text-xs font-bold text-slate-700 mb-2 block">
                          Profile Banner
                        </Label>
                        <Input
                          id="profileBanner"
                          type="file"
                          accept="image/*"
                          className="bg-white border-slate-300 font-medium"
                          onChange={(e) => onFileChange(e, "profileBanner")}
                        />
                        {filesToUpload.profileBanner ? (
                          <div className="mt-3">
                            <FilePreview
                              file={filesToUpload.profileBanner}
                              onRemove={() => setFilesToUpload(prev => ({
                                ...prev,
                                profileBanner: null
                              }))}
                            />
                          </div>
                        ) : formData.profileBanner && (
                          <div className="mt-3">
                            <UrlPreview
                              url={formData.profileBanner}
                              onRemove={() => setFormData(prev => ({
                                ...prev,
                                profileBanner: ""
                              }))}
                            />
                          </div>
                        )}
                      </div>
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
                          Email Address <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@domain.com"
                          className={`h-11 bg-white border-slate-300 font-medium ${errors.email ? "border-red-500 focus:border-red-500" : ""}`}
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                        <ErrorMsg message={errors.email} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <Label htmlFor="dob" className="text-xs font-bold text-slate-700 mb-2 block">
                          Date of Birth
                        </Label>
                        <Input
                          id="dob"
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          className={`h-11 bg-white border-slate-300 font-medium ${errors.dob ? "border-red-500 focus:border-red-500" : ""}`}
                          value={formData.dob}
                          onChange={handleInputChange}
                        />
                        <ErrorMsg message={errors.dob} />
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
                        <Label htmlFor="legalName" className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                          Legal Name
                          {!editingMemberId && formData.legalName && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M4 0a4 4 0 100 8A4 4 0 004 0zm1.7 3.1L3.6 5.2a.4.4 0 01-.6 0L2.3 4.4a.4.4 0 01.6-.6l.4.4 1.8-1.8a.4.4 0 01.6.7z"/></svg>
                              GST · Editable
                            </span>
                          )}
                        </Label>
                        <Input
                          id="legalName"
                          placeholder="Registered legal entity name"
                          className="h-11 bg-white border-slate-300 font-medium"
                          value={formData.legalName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessType" className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                          Business Type
                          {!editingMemberId && formData.businessType && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M4 0a4 4 0 100 8A4 4 0 004 0zm1.7 3.1L3.6 5.2a.4.4 0 01-.6 0L2.3 4.4a.4.4 0 01.6-.6l.4.4 1.8-1.8a.4.4 0 01.6.7z"/></svg>
                              GST · Editable
                            </span>
                          )}
                        </Label>
                        <Input
                          id="businessType"
                          placeholder="e.g. Sole Proprietor, Pvt Ltd"
                          className="h-11 bg-white border-slate-300 font-medium"
                          value={formData.businessType}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <Label className="text-xs font-bold text-slate-700 mb-2 block">Category</Label>
                        <Popover modal={true} open={categoryOpen} onOpenChange={setCategoryOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={categoryOpen}
                              className="w-full h-11 bg-white border border-slate-300 rounded-lg justify-between px-3 text-sm font-medium text-slate-900 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary hover:bg-slate-50 transition-all"
                            >
                              <span className="truncate">
                                {formData.businessCategory
                                  ? mainCategories.find(cat => cat._id === formData.businessCategory)?.name
                                  : "Select Category"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border border-border rounded-xl shadow-xl z-50 animate-none">
                            <Command className="w-full">
                              <CommandInput placeholder="Search category..." className="h-10 text-xs" />
                              <CommandEmpty>No category found.</CommandEmpty>
                              <CommandList className="max-h-60 overflow-y-auto no-scrollbar">
                                <CommandGroup>
                                  {mainCategories.map(cat => (
                                    <CommandItem
                                      key={cat._id}
                                      value={cat.name}
                                      onSelect={() => {
                                        handleSelectChange("businessCategory", cat._id);
                                        setCategoryOpen(false);
                                      }}
                                      className="text-xs cursor-pointer hover:bg-secondary/50 rounded-lg"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-3.5 w-3.5",
                                          formData.businessCategory === cat._id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {cat.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700 mb-2 block">
                          Sub-Category {isSubCategoriesLoading && <Loader2 size={10} className="animate-spin inline ml-1" />}
                        </Label>
                        <Popover modal={true} open={subCategoryOpen} onOpenChange={setSubCategoryOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={subCategoryOpen}
                              className={cn(
                                "w-full h-11 bg-white border border-slate-300 rounded-lg justify-between px-3 text-sm font-medium text-slate-900 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary hover:bg-slate-50 transition-all",
                                (!formData.businessCategory || isSubCategoriesLoading) && "opacity-50 cursor-not-allowed"
                              )}
                              disabled={!formData.businessCategory || isSubCategoriesLoading}
                            >
                              <span className="truncate">
                                {formData.subCategory
                                  ? subCategories.find(cat => cat._id === formData.subCategory)?.name
                                  : (!formData.businessCategory ? "Choose category first" : "Select Sub-Category")}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border border-border rounded-xl shadow-xl z-50 animate-none">
                            <Command className="w-full">
                              <CommandInput placeholder="Search sub-category..." className="h-10 text-xs" />
                              <CommandEmpty>No sub-category found.</CommandEmpty>
                              <CommandList className="max-h-60 overflow-y-auto no-scrollbar">
                                <CommandGroup>
                                  {subCategories.length > 0 ? (
                                    subCategories.map(cat => (
                                      <CommandItem
                                        key={cat._id}
                                        value={cat.name}
                                        onSelect={() => {
                                          handleSelectChange("subCategory", cat._id);
                                          setSubCategoryOpen(false);
                                        }}
                                        className="text-xs cursor-pointer hover:bg-secondary/50 rounded-lg"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-3.5 w-3.5",
                                            formData.subCategory === cat._id ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {cat.name}
                                      </CommandItem>
                                    ))
                                  ) : (
                                    <div className="p-2 text-xs text-muted-foreground text-center">
                                      No sub-categories found
                                    </div>
                                  )}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
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
                          min="0"
                          onKeyDown={(e) => {
                            if (["-", "+", "e", "E"].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onPaste={(e) => {
                            const pasteData = e.clipboardData.getData("text");
                            if (pasteData.includes("-") || pasteData.includes("+") || /[eE]/.test(pasteData)) {
                              e.preventDefault();
                            }
                          }}
                          className={`h-11 bg-white border-slate-300 font-medium ${errors.yearsOfExperience ? "border-red-500 focus:border-red-500" : ""}`}
                          value={formData.yearsOfExperience ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const numVal = val ? Number(val) : null;
                            if (numVal !== null && numVal < 0) return;
                            handleSelectChange("yearsOfExperience", numVal);
                          }}
                        />
                        <ErrorMsg message={errors.yearsOfExperience} />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700 mb-2 block">Company Size</Label>
                        <Popover modal={true} open={companySizeOpen} onOpenChange={setCompanySizeOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={companySizeOpen}
                              className="w-full h-11 bg-white border border-slate-300 rounded-lg justify-between px-3 text-sm font-medium text-slate-900 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary hover:bg-slate-50 transition-all"
                            >
                              <span className="truncate">
                                {formData.companySize
                                  ? `${formData.companySize} Employees`
                                  : "Select Company Size"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border border-border rounded-xl shadow-xl z-50 animate-none">
                            <Command className="w-full">
                              <CommandInput placeholder="Search company size..." className="h-10 text-xs" />
                              <CommandEmpty>No company size found.</CommandEmpty>
                              <CommandList className="max-h-60 overflow-y-auto no-scrollbar">
                                <CommandGroup>
                                  {[
                                    { value: "1 - 5", label: "1 - 5 Employees" },
                                    { value: "6 - 10", label: "6 - 10 Employees" },
                                    { value: "11 - 20", label: "11 - 20 Employees" },
                                    { value: "21 - 50", label: "21 - 50 Employees" },
                                    { value: "51 - 100", label: "51 - 100 Employees" },
                                    { value: "100+", label: "100+ Employees" }
                                  ].map(opt => (
                                    <CommandItem
                                      key={opt.value}
                                      value={opt.label}
                                      onSelect={() => {
                                        handleSelectChange("companySize", opt.value);
                                        setCompanySizeOpen(false);
                                      }}
                                      className="text-xs cursor-pointer hover:bg-secondary/50 rounded-lg"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-3.5 w-3.5",
                                          formData.companySize === opt.value ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {opt.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
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
                      {/* State Combobox */}
                      <div>
                        <Label className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                          State
                          {isStatesLoading && <Loader2 size={10} className="animate-spin text-primary" />}
                        </Label>
                        <Popover modal={true} open={stateOpen} onOpenChange={(o) => { setStateOpen(o); if (!o) setStateSearch(""); }}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={stateOpen}
                              className="w-full h-11 bg-white border border-slate-300 rounded-lg justify-between px-3 text-sm font-medium text-slate-900 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary hover:bg-slate-50 transition-all"
                            >
                              <span className="truncate">
                                {formData.state || "Select State"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border border-border rounded-xl shadow-xl z-50 animate-none">
                            <Command className="w-full">
                              <CommandInput
                                placeholder="Search state..."
                                className="h-10 text-xs"
                                value={stateSearch}
                                onValueChange={setStateSearch}
                              />
                              <CommandEmpty>No state found.</CommandEmpty>
                              <CommandList className="max-h-60 overflow-y-auto no-scrollbar">
                                <CommandGroup>
                                  {allStateItems
                                    .filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()))
                                    .map(s => (
                                      <CommandItem
                                        key={s._id || s.name}
                                        value={s.name}
                                        onSelect={() => {
                                          const stateName = s.name;
                                          setFormData(prev => ({ ...prev, state: stateName, city: "", businessRegion: "" }));
                                          setAreasOptions([]);
                                          setCitySearch("");
                                          setRegionSearch("");
                                          setStateOpen(false);
                                          setStateSearch("");

                                          if (s._id) {
                                            fetchCitiesApi(s._id);
                                          } else {
                                            const matchedState = apiStates.find((st: any) => st.name?.toLowerCase() === stateName.toLowerCase());
                                            if (matchedState?._id) {
                                              fetchCitiesApi(matchedState._id);
                                            } else {
                                              fetchCitiesApi();
                                            }
                                          }
                                        }}
                                        className="text-xs cursor-pointer hover:bg-secondary/50 rounded-lg"
                                      >
                                        <Check className={cn("mr-2 h-3.5 w-3.5", formData.state === s.name ? "opacity-100" : "opacity-0")} />
                                        {s.name}
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* City Combobox */}
                      <div>
                        <Label className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                          City
                          {(isCitiesLoading || isBusinessRegionsLoading) && <Loader2 size={10} className="animate-spin text-primary" />}
                        </Label>
                        <Popover modal={true} open={cityOpen} onOpenChange={(o) => { setCityOpen(o); if (!o) setCitySearch(""); }}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={cityOpen}
                              disabled={!formData.state || isBusinessRegionsLoading}
                              className={cn(
                                "w-full h-11 bg-white border border-slate-300 rounded-lg justify-between px-3 text-sm font-medium text-slate-900 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary hover:bg-slate-50 transition-all",
                                (!formData.state || isBusinessRegionsLoading) && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <span className="truncate">
                                {formData.city || (formData.state ? "Select City" : "Choose state first")}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border border-border rounded-xl shadow-xl z-50 animate-none">
                            <Command className="w-full">
                              <CommandInput
                                placeholder="Search city..."
                                className="h-10 text-xs"
                                value={citySearch}
                                onValueChange={setCitySearch}
                              />
                              <CommandEmpty>No city found.</CommandEmpty>
                              <CommandList className="max-h-60 overflow-y-auto no-scrollbar">
                                <CommandGroup>
                                  {allCityItems
                                    .filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
                                    .map(c => (
                                      <CommandItem
                                        key={c._id || c.name}
                                        value={c.name}
                                        onSelect={() => {
                                          setFormData(prev => ({ ...prev, city: c.name, businessRegion: "" }));
                                          setRegionSearch("");
                                          setCityOpen(false);
                                          setCitySearch("");
                                        }}
                                        className="text-xs cursor-pointer hover:bg-secondary/50 rounded-lg"
                                      >
                                        <Check className={cn("mr-2 h-3.5 w-3.5", formData.city === c.name ? "opacity-100" : "opacity-0")} />
                                        {c.name}
                                      </CommandItem>
                                    ))}
                                  {allCityItems.length === 0 && formData.state && !isCitiesLoading && !isBusinessRegionsLoading && (
                                    <div className="p-2 text-xs text-muted-foreground text-center italic">No cities with business regions found</div>
                                  )}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Business Region Combobox */}
                    <div>
                      <Label className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                        Business Region
                        {areasLoading && <Loader2 size={10} className="animate-spin" />}
                      </Label>
                      <Popover modal={true} open={regionOpen} onOpenChange={(o) => { setRegionOpen(o); if (!o) setRegionSearch(""); }}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={regionOpen}
                            disabled={!formData.state || !formData.city || areasLoading}
                            className={cn(
                              "w-full h-11 bg-white border border-slate-300 rounded-lg justify-between px-3 text-sm font-medium text-slate-900 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary hover:bg-slate-50 transition-all",
                              (!formData.state || !formData.city || areasLoading) && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <span className="truncate">
                              {formData.businessRegion
                                ? (areasOptions.find((a: any) => a._id === formData.businessRegion)?.name || selectedAreaName || "Selected Region")
                                : (!formData.state || !formData.city ? "Choose state and city first" : "Select Business Region")}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border border-border rounded-xl shadow-xl z-50 animate-none">
                          <Command className="w-full">
                            <CommandInput
                              placeholder="Search region..."
                              className="h-10 text-xs"
                              value={regionSearch}
                              onValueChange={setRegionSearch}
                            />
                            <CommandEmpty>No region found.</CommandEmpty>
                            <CommandList className="max-h-60 overflow-y-auto no-scrollbar">
                              <CommandGroup>
                                {areasOptions
                                  .filter((a: any) => a.name.toLowerCase().includes(regionSearch.toLowerCase()))
                                  .map((area: any) => (
                                    <CommandItem
                                      key={area._id}
                                      value={area.name}
                                      onSelect={() => {
                                        setFormData(prev => ({ ...prev, businessRegion: area._id }));
                                        setSelectedAreaName(area.name);
                                        setRegionOpen(false);
                                        setRegionSearch("");
                                      }}
                                      className="text-xs cursor-pointer hover:bg-secondary/50 rounded-lg"
                                    >
                                      <Check className={cn("mr-2 h-3.5 w-3.5", formData.businessRegion === area._id ? "opacity-100" : "opacity-0")} />
                                      {area.name}
                                    </CommandItem>
                                  ))}
                                {areasOptions.length === 0 && !areasLoading && formData.city && (
                                  <div className="p-2 text-xs text-muted-foreground text-center italic">No regions found for this city</div>
                                )}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
                  <div className="space-y-4">
                    <Label className="text-xs font-bold text-slate-700 block mb-1">
                      Service Locations
                    </Label>
                    
                    {/* Country Input (Disabled as it defaults to India) */}
                    <div>
                      <Label className="text-[10px] font-bold text-slate-500 mb-1 block">Country</Label>
                      <Input
                        value={formData.serviceLocations.country}
                        disabled
                        className="h-10 bg-slate-100 border-slate-200 font-medium text-slate-600 cursor-not-allowed"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Service States Selector */}
                      <div>
                        <Label className="text-[10px] font-bold text-slate-500 mb-1 block">Service States</Label>
                        <Popover modal={true} open={serviceStateOpen} onOpenChange={(o) => { setServiceStateOpen(o); if (!o) setServiceStateSearch(""); }}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={serviceStateOpen}
                              className="w-full h-10 bg-white border border-slate-300 rounded-lg justify-between px-3 text-xs font-medium text-slate-900 hover:text-slate-900 hover:bg-slate-50 transition-all"
                            >
                              <span className="truncate">Select States</span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border border-border rounded-xl shadow-xl z-50 animate-none">
                            <Command className="w-full">
                              <CommandInput
                                placeholder="Search state..."
                                className="h-10 text-xs"
                                value={serviceStateSearch}
                                onValueChange={setServiceStateSearch}
                              />
                              <CommandEmpty>No state found.</CommandEmpty>
                              <CommandList className="max-h-60 overflow-y-auto no-scrollbar">
                                <CommandGroup>
                                  <CommandItem
                                    value="select-all-states"
                                    onSelect={() => {
                                      const allStateNames = allStateItems.map(s => s.name);
                                      const allSelected = allStateNames.every(name => formData.serviceLocations.states.includes(name));
                                      setFormData(prev => ({
                                        ...prev,
                                        serviceLocations: {
                                          ...prev.serviceLocations,
                                          states: allSelected ? [] : allStateNames,
                                          cities: allSelected ? [] : prev.serviceLocations.cities
                                        }
                                      }));
                                    }}
                                    className="text-xs font-bold cursor-pointer text-primary hover:bg-secondary/50 rounded-lg border-b border-slate-100 flex items-center"
                                  >
                                    <Check className={cn("mr-2 h-3.5 w-3.5", allStateItems.length > 0 && allStateItems.every(s => formData.serviceLocations.states.includes(s.name)) ? "opacity-100" : "opacity-0")} />
                                    Select All States
                                  </CommandItem>
                                  {allStateItems
                                    .filter(s => s.name.toLowerCase().includes(serviceStateSearch.toLowerCase()))
                                    .map(s => (
                                      <CommandItem
                                        key={s._id || s.name}
                                        value={s.name}
                                        onSelect={() => {
                                          if (formData.serviceLocations.states.includes(s.name)) {
                                            handleRemoveServiceState(s.name);
                                          } else {
                                            handleAddServiceState(s.name);
                                          }
                                        }}
                                        className="text-xs cursor-pointer hover:bg-secondary/50 rounded-lg"
                                      >
                                        <Check className={cn("mr-2 h-3.5 w-3.5", formData.serviceLocations.states.includes(s.name) ? "opacity-100" : "opacity-0")} />
                                        {s.name}
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        
                        {/* Selected States Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {formData.serviceLocations.states.slice(0, 2).map((st) => (
                            <Badge
                              key={st}
                              variant="secondary"
                              className="text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 font-semibold"
                            >
                              {st}
                              <button
                                type="button"
                                onClick={() => handleRemoveServiceState(st)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </Badge>
                          ))}
                          {formData.serviceLocations.states.length > 2 && (
                            <Badge className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 border border-primary/30 text-primary font-bold">
                              +{formData.serviceLocations.states.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Service Cities Selector */}
                      <div>
                        <Label className="text-[10px] font-bold text-slate-500 mb-1 block">Service Cities</Label>
                        <Popover modal={true} open={serviceCityOpen} onOpenChange={(o) => { setServiceCityOpen(o); if (!o) setServiceCitySearch(""); }}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={serviceCityOpen}
                              disabled={formData.serviceLocations.states.length === 0}
                              className={cn(
                                "w-full h-10 bg-white border border-slate-300 rounded-lg justify-between px-3 text-xs font-medium text-slate-900 hover:text-slate-900 hover:bg-slate-50 transition-all",
                                formData.serviceLocations.states.length === 0 && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <span className="truncate">
                                {formData.serviceLocations.states.length === 0 ? "Choose states first" : "Select Cities"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border border-border rounded-xl shadow-xl z-50 animate-none">
                            <Command className="w-full">
                              <CommandInput
                                placeholder="Search city..."
                                className="h-10 text-xs"
                                value={serviceCitySearch}
                                onValueChange={setServiceCitySearch}
                              />
                              <CommandEmpty>No city found.</CommandEmpty>
                              <CommandList className="max-h-60 overflow-y-auto no-scrollbar">
                                <CommandGroup>
                                  {(() => {
                                    const availableCities = availableServiceCities;
                                    const filteredCities = availableCities.filter(c => c.name.toLowerCase().includes(serviceCitySearch.toLowerCase()));
                                    const allCityNames = availableCities.map(c => c.name);
                                    const allCitiesSelected = allCityNames.length > 0 && allCityNames.every(name => formData.serviceLocations.cities.includes(name));
                                    return (
                                      <>
                                        <CommandItem
                                          value="select-all-cities"
                                          onSelect={() => {
                                            setFormData(prev => ({
                                              ...prev,
                                              serviceLocations: {
                                                ...prev.serviceLocations,
                                                cities: allCitiesSelected ? [] : allCityNames
                                              }
                                            }));
                                          }}
                                          className="text-xs font-bold cursor-pointer text-primary hover:bg-secondary/50 rounded-lg border-b border-slate-100 flex items-center"
                                        >
                                          <Check className={cn("mr-2 h-3.5 w-3.5", allCitiesSelected ? "opacity-100" : "opacity-0")} />
                                          Select All Cities
                                        </CommandItem>
                                        {filteredCities.map(c => (
                                          <CommandItem
                                            key={c.name}
                                            value={c.name}
                                            onSelect={() => {
                                              if (formData.serviceLocations.cities.includes(c.name)) {
                                                handleRemoveServiceCity(c.name);
                                              } else {
                                                handleAddServiceCity(c.name);
                                              }
                                            }}
                                            className="text-xs cursor-pointer hover:bg-secondary/50 rounded-lg"
                                          >
                                            <Check className={cn("mr-2 h-3.5 w-3.5", formData.serviceLocations.cities.includes(c.name) ? "opacity-100" : "opacity-0")} />
                                            {c.name}
                                          </CommandItem>
                                        ))}
                                      </>
                                    );
                                  })()}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        
                        {/* Selected Cities Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {formData.serviceLocations.cities.slice(0, 2).map((ct) => (
                            <Badge
                              key={ct}
                              variant="secondary"
                              className="text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 font-semibold"
                            >
                              {ct}
                              <button
                                type="button"
                                onClick={() => handleRemoveServiceCity(ct)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </Badge>
                          ))}
                          {formData.serviceLocations.cities.length > 2 && (
                            <Badge className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 border border-primary/30 text-primary font-bold">
                              +{formData.serviceLocations.cities.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
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
                      <Label htmlFor="instagram" className="text-xs font-bold text-slate-700 mb-2 block">Instagram Profile</Label>
                      <Input
                        id="instagram"
                        className="h-11 bg-white border-slate-300 font-medium"
                        value={formData.instagram}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="facebook" className="text-xs font-bold text-slate-700 mb-2 block">Facebook Profile</Label>
                      <Input
                        id="facebook"
                        className="h-11 bg-white border-slate-300 font-medium"
                        value={formData.facebook}
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

      <ConfirmDialog
        open={statusConfirmOpen}
        onOpenChange={setStatusConfirmOpen}
        title={memberToToggle?.status === "active" ? "Deactivate Member?" : "Activate Member?"}
        description={
          memberToToggle?.status === "active"
            ? `Are you sure you want to deactivate ${memberToToggle?.fullName}? They will lose access until reactivated.`
            : `Are you sure you want to activate ${memberToToggle?.fullName}?`
        }
        confirmLabel={memberToToggle?.status === "active" ? "Yes, Deactivate" : "Yes, Activate"}
        onConfirm={handleConfirmStatusToggle}
        isLoading={isTogglingStatus}
      />
    </div>
  );
};

export default MembersPage;
