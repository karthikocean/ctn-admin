import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from "recharts";
import { LayoutDashboard, Search, Filter, RefreshCw, X, Calendar, MapPin, Layers, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/common/StatCard";
import ChartCard from "@/components/common/ChartCard";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { getDashboardStats, DashboardQueryParams } from "@/api/DashboardApi";
import { getRegions } from "@/api/RegionApi";
import { getCategories } from "@/api/CategoryApi";
import { formatCompactNumber } from "@/lib/utils";

const COLORS = ["hsl(210,97%,23%)", "hsl(0,72%,50%)", "hsl(142,71%,45%)", "hsl(38,92%,50%)", "hsl(262,83%,58%)", "hsl(210,60%,50%)"];
const TRAINING_BAR_COLOR = "#1d4ed8";
const TRAINING_GRID_STROKE = "#e5e7eb";
const TRAINING_AXIS_STROKE = "#6b7280";

const TrainingTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-background p-3 text-sm shadow-lg">
      <p className="font-semibold text-foreground">{label}</p>
      <div className="mt-2 space-y-1">
        <p className="text-xs text-muted-foreground">Trainings</p>
        <p className="font-medium text-foreground">{data.trainings || 0}</p>
        <p className="text-xs text-muted-foreground">Views</p>
        <p className="font-medium text-foreground">{data.views || 0}</p>
      </div>
    </div>
  );
};

const PRESETS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "this_week" },
  { label: "This Month", value: "this_month" },
  { label: "This Year", value: "this_year" },
  { label: "All Time", value: "all_time" }
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fetchingStats, setFetchingStats] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters state
  const [filters, setFilters] = useState<DashboardQueryParams>({
    preset: "today",
    startDate: "",
    endDate: "",
    regionId: "",
    categoryId: ""
  });

  // Draft filters state for modal inputs
  const [draftFilters, setDraftFilters] = useState<DashboardQueryParams>(filters);

  // Dropdowns options
  const [regions, setRegions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Analytics Stats state
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    expiringSoon: 0,
    expiredMembers: 0,
    todayPost: 0,
    todayAsk: 0,
    todayGive: 0,
    todayRequirement: 0,
    notPosted: 0,
    notAsked: 0,
    notGiven: 0,
    notRequirements: 0,
    oneToOneCount: 0,
    referralCount: 0,
    thankYouSlipCount: 0,
    thankYouSlipAmount: 0,
    charts: {
      trainingTrend: [] as any[],
      membersTrend: [] as any[],
      regionOverview: [] as any[],
      categoryOverview: [] as any[]
    }
  });

  // Fetch dropdown data on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [regionsRes, categoriesRes] = await Promise.all([
          getRegions({ limit: 100 }).catch(() => ({ data: [] })),
          getCategories("main").catch(() => ({ data: [] }))
        ]);

        const regList = Array.isArray(regionsRes?.data) ? regionsRes.data : Array.isArray(regionsRes) ? regionsRes : [];
        const catList = Array.isArray(categoriesRes?.data) ? categoriesRes.data : Array.isArray(categoriesRes) ? categoriesRes : [];

        setRegions(regList);
        setCategories(catList);
      } catch (err) {
        console.error("Failed to fetch filter options", err);
      }
    };
    fetchOptions();
  }, []);

  // Fetch Dashboard Stats & Charts
  const loadStats = useCallback(async (currentFilters: DashboardQueryParams) => {
    setFetchingStats(true);
    try {
      const res = await getDashboardStats(currentFilters);
      if (res?.success && res?.data) {
        setStats({
          totalMembers: res.data.totalMembers || 0,
          activeMembers: res.data.activeMembers || 0,
          expiringSoon: res.data.expiringSoon || 0,
          expiredMembers: res.data.expiredMembers || 0,
          todayPost: res.data.todayPost || 0,
          todayAsk: res.data.todayAsk || 0,
          todayGive: res.data.todayGive || 0,
          todayRequirement: res.data.todayRequirement || 0,
          notPosted: res.data.notPosted || 0,
          notAsked: res.data.notAsked || 0,
          notGiven: res.data.notGiven || 0,
          notRequirements: res.data.notRequirements || 0,
          oneToOneCount: res.data.oneToOneCount || 0,
          referralCount: res.data.referralCount || 0,
          thankYouSlipCount: res.data.thankYouSlipCount || 0,
          thankYouSlipAmount: res.data.thankYouSlipAmount || 0,
          charts: {
            trainingTrend: res.data.charts?.trainingTrend || [],
            membersTrend: res.data.charts?.membersTrend || [],
            regionOverview: res.data.charts?.regionOverview || [],
            categoryOverview: res.data.charts?.categoryOverview || []
          }
        });
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setFetchingStats(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats(filters);
  }, [filters, loadStats]);

  const handleApplyFilters = () => {
    setFilters(draftFilters);
    setFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    const defaultFilters: DashboardQueryParams = {
      preset: "today",
      startDate: "",
      endDate: "",
      regionId: "",
      categoryId: ""
    };
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
    setFilterModalOpen(false);
  };

  const activeFilterCount = [
    filters.preset && filters.preset !== "today" ? filters.preset : null,
    filters.startDate || filters.endDate ? "custom_date" : null,
    filters.regionId ? "region" : null,
    filters.categoryId ? "category" : null
  ].filter(Boolean).length;

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Loading Dashboard Analytics..."
          subtitle="Gathering member stats and network metrics"
        />
      )}

      {/* Single Row Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
            <LayoutDashboard size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold md:hidden">Overview</p>
          </div>
        </div>


      </div>

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground font-medium">Applied Filters:</span>
          {filters.preset && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-primary/10 text-primary font-semibold">
              <Calendar size={12} />
              Preset: {PRESETS.find(p => p.value === filters.preset)?.label || filters.preset}
            </span>
          )}
          {(filters.startDate || filters.endDate) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-primary/10 text-primary font-semibold">
              <Calendar size={12} />
              {filters.startDate || "Start"} to {filters.endDate || "End"}
            </span>
          )}
          {filters.regionId && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-primary/10 text-primary font-semibold">
              <MapPin size={12} />
              Region: {regions.find(r => (r._id || r.id) === filters.regionId)?.name || "Selected Region"}
            </span>
          )}
          {filters.categoryId && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-primary/10 text-primary font-semibold">
              <Layers size={12} />
              Category: {categories.find(c => (c._id || c.id) === filters.categoryId)?.name || "Selected Category"}
            </span>
          )}
          <button
            onClick={handleResetFilters}
            className="text-xs text-destructive hover:underline font-semibold ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard title="Total Members" value={stats.totalMembers.toLocaleString('en-IN')} change="+12% from last month" changeType="positive" icon="Users" delay={0} path="/members" />
        <StatCard title="Active Members" value={stats.activeMembers.toLocaleString('en-IN')} change="+8% from last month" changeType="positive" icon="UserCheck" delay={0.05} path="/members?status=active" />
        <StatCard title="Expiring Soon" value={stats.expiringSoon.toLocaleString('en-IN')} change="5 more than last week" changeType="negative" icon="Clock" iconColor="bg-amber-500 text-card" delay={0.1} path="/reports/subscription-renewals?status=DUE_SOON" />
        <StatCard title="Expired Members" value={stats.expiredMembers.toLocaleString('en-IN')} change="-3% from last month" changeType="positive" icon="UserX" iconColor="bg-accent text-card" delay={0.15} path="/reports/subscription-renewals?status=EXPIRED" />
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard title="Today's Posts" value={stats.todayPost.toLocaleString('en-IN')} icon="FileText" delay={0.2} path={`/activities/post?fromDate=${new Date().toISOString().split('T')[0]}&toDate=${new Date().toISOString().split('T')[0]}`} />
        <StatCard title="Today's Asks" value={stats.todayAsk.toLocaleString('en-IN')} icon="MessageSquare" delay={0.25} path={`/activities/ask?fromDate=${new Date().toISOString().split('T')[0]}&toDate=${new Date().toISOString().split('T')[0]}`} />
        <StatCard title="Today's Gives" value={stats.todayGive.toLocaleString('en-IN')} icon="Gift" delay={0.3} path={`/activities/give?fromDate=${new Date().toISOString().split('T')[0]}&toDate=${new Date().toISOString().split('T')[0]}`} />
        <StatCard title="Today's Requirements" value={stats.todayRequirement.toLocaleString('en-IN')} icon="ClipboardList" delay={0.35} path={`/activities/requirement?fromDate=${new Date().toISOString().split('T')[0]}&toDate=${new Date().toISOString().split('T')[0]}`} />
      </div>

      {/* Gap Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard title="Not Posted" value={stats.notPosted.toLocaleString('en-IN')} icon="FileX" iconColor="bg-muted text-muted-foreground" delay={0.4} path="/members?activityFilter=notPosted&status=active" />
        <StatCard title="Not Asked" value={stats.notAsked.toLocaleString('en-IN')} icon="MessageSquareOff" iconColor="bg-muted text-muted-foreground" delay={0.45} path="/members?activityFilter=notAsked&status=active" />
        <StatCard title="Not Given" value={stats.notGiven.toLocaleString('en-IN')} icon="HeartOff" iconColor="bg-muted text-muted-foreground" delay={0.5} path="/members?activityFilter=notGiven&status=active" />
        <StatCard title="No Requirements" value={stats.notRequirements.toLocaleString('en-IN')} icon="ClipboardX" iconColor="bg-muted text-muted-foreground" delay={0.55} path="/members?activityFilter=notRequirements&status=active" />
      </div>

      {/* Network Interactions Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Direct Meet" value={stats.oneToOneCount.toLocaleString('en-IN')} icon="Handshake" delay={0.6} path="/contributions?type=one_to_one" />
        <StatCard title="Recommendations" value={stats.referralCount.toLocaleString('en-IN')} icon="UserPlus" delay={0.65} path="/contributions?type=referral" />
        <StatCard title="Business Done" value={stats.thankYouSlipCount.toLocaleString('en-IN')} icon="Briefcase" delay={0.7} path="/contributions?type=thank_you_slip" />
        <StatCard title="Business Done Amount" value={`₹${formatCompactNumber(stats.thankYouSlipAmount)}`} icon="IndianRupee" delay={0.75} path="/contributions?type=thank_you_slip" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Training Trend" subtitle="Monthly trainings and views" delay={0.3} path="/trainings">
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.charts.trainingTrend} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip content={<TrainingTooltip />} />
                <Bar dataKey="trainings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey="views" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Members Trend" subtitle="Monthly joined vs expired members" delay={0.35} path="/members">
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.charts.membersTrend} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="joined" name="Joined" fill="hsl(210,97%,23%)" radius={[4, 4, 0, 0]} barSize={24}>
                  {stats.charts.membersTrend.map((m: any, i: number) => (
                    <Cell
                      key={i}
                      fill="hsl(210,97%,23%)"
                      className="cursor-pointer hover:opacity-80"
                      onClick={(e: any) => {
                        if (e && e.stopPropagation) e.stopPropagation();
                        if (m.start && m.end) {
                          navigate(`/members?joinedStart=${encodeURIComponent(m.start)}&joinedEnd=${encodeURIComponent(m.end)}`);
                        }
                      }}
                    />
                  ))}
                </Bar>
                <Bar dataKey="expired" name="Expired" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={24}>
                  {stats.charts.membersTrend.map((m: any, i: number) => (
                    <Cell
                      key={i}
                      fill="#dc2626"
                      className="cursor-pointer hover:opacity-80"
                      onClick={(e: any) => {
                        if (e && e.stopPropagation) e.stopPropagation();
                        if (m.start && m.end) {
                          navigate(`/members?expiredStart=${encodeURIComponent(m.start)}&expiredEnd=${encodeURIComponent(m.end)}`);
                        }
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Region Overview" subtitle="Members by region" delay={0.4} path="/regions">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie 
                data={stats.charts.regionOverview} 
                cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={4}
                className="cursor-pointer"
              >
                {stats.charts.regionOverview.map((r, i) => (
                  <Cell 
                    key={i} 
                    fill={COLORS[i % COLORS.length]} 
                    className="cursor-pointer"
                    onClick={(e: any) => {
                      if (e && e.stopPropagation) e.stopPropagation();
                      if (r && r.id) {
                        navigate(`/members?regionId=${r.id}&status=active`);
                      }
                    }}
                  />
                ))}
              </Pie>
              <Tooltip cursor={{fill: 'transparent'}} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {stats.charts.regionOverview.map((r, i) => (
              <div 
                key={r.name || i} 
                className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (r.id) {
                    navigate(`/members?regionId=${r.id}&status=active`);
                  }
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground truncate" title={r.name}>{r.name}</span>
                <span className="font-medium text-foreground ml-auto">{r.members || r.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Category Overview" subtitle="Members by business category" delay={0.5} path="/categories">
          <div className="h-[360px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={stats.charts.categoryOverview} 
                layout="vertical"
                margin={{ top: 10, right: 35, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(214,32%,91%)" opacity={0.6} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 13, fill: "hsl(215,25%,30%)", fontWeight: 500 }} 
                  axisLine={false}
                  tickLine={false}
                  width={180} 
                />
                <Tooltip cursor={{ fill: 'hsl(214,32%,91%, 0.4)' }} />
                <Bar 
                  dataKey="count" 
                  barSize={28}
                  radius={[0, 6, 6, 0]}
                >
                  <LabelList 
                    dataKey="count" 
                    position="right" 
                    fill="hsl(215,25%,35%)" 
                    fontSize={13} 
                    fontWeight={600} 
                    offset={10} 
                  />
                  {stats.charts.categoryOverview.map((c, i) => (
                    <Cell
                      key={i}
                      fill="hsl(210,97%,23%)"
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e: any) => {
                        if (e && e.stopPropagation) e.stopPropagation();
                        if (c && c.id) {
                          navigate(`/members?category=${c.id}&status=active`);
                        }
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Filter Modal / Drawer */}
      <AnimatePresence>
        {filterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-primary" />
                  <h2 className="text-base font-bold text-foreground">Filter Dashboard Analytics</h2>
                </div>
                <button
                  onClick={() => setFilterModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Timeframe Presets */}
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                    Timeframe Presets
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESETS.map((p) => {
                      const selected = draftFilters.preset === p.value && !draftFilters.startDate && !draftFilters.endDate;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => {
                            setDraftFilters(prev => ({
                              ...prev,
                              preset: p.value,
                              startDate: "",
                              endDate: ""
                            }));
                          }}
                          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background text-muted-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {selected && <Check size={12} />}
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Date Range */}
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                    Custom Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-muted-foreground font-medium block mb-1">Start Date</span>
                      <input
                        type="date"
                        value={draftFilters.startDate || ""}
                        onChange={(e) => {
                          setDraftFilters(prev => ({
                            ...prev,
                            startDate: e.target.value,
                            preset: "custom"
                          }));
                        }}
                        className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground font-medium block mb-1">End Date</span>
                      <input
                        type="date"
                        value={draftFilters.endDate || ""}
                        onChange={(e) => {
                          setDraftFilters(prev => ({
                            ...prev,
                            endDate: e.target.value,
                            preset: "custom"
                          }));
                        }}
                        className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Region */}
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                    Business Region
                  </label>
                  <select
                    value={draftFilters.regionId || ""}
                    onChange={(e) => setDraftFilters(prev => ({ ...prev, regionId: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">All Regions</option>
                    {regions.map((r) => (
                      <option key={r._id || r.id} value={r._id || r.id}>
                        {r.name || r.regionName || "Region"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Business Category */}
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                    Business Category
                  </label>
                  <select
                    value={draftFilters.categoryId || ""}
                    onChange={(e) => setDraftFilters(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name || "Category"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/30">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="rounded-xl border-border"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="rounded-xl bg-primary text-primary-foreground font-semibold"
                >
                  Apply Filters
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardPage;
