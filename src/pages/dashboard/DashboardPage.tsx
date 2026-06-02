import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LayoutDashboard, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/common/StatCard";
import ChartCard from "@/components/common/ChartCard";
import StatusBadge from "@/components/common/StatusBadge";
import { dashboardStats, monthlyData, regionData, categoryData, mockActivities } from "@/data/mockData";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";

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
        <p className="font-medium text-foreground">{data.trainings}</p>
        <p className="text-xs text-muted-foreground">Views</p>
        <p className="font-medium text-foreground">{data.views}</p>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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

        {/* Global Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search analytics..."
              className="h-10 pl-9 pr-4 w-full rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-all"
            />
          </div>

          <Button variant="outline" size="icon" className="h-10 w-10 md:w-auto md:px-4 rounded-xl border-border bg-card">
            <Filter size={16} className="md:mr-2" />
            <span className="hidden md:inline">Filters</span>
          </Button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Members" value={dashboardStats.totalMembers} change="+12% from last month" changeType="positive" icon="Users" delay={0} />
        <StatCard title="Active Members" value={dashboardStats.activeMembers} change="+8% from last month" changeType="positive" icon="UserCheck" delay={0.05} />
        <StatCard title="Expiring Soon" value={dashboardStats.expiringSoon} change="5 more than last week" changeType="negative" icon="Clock" iconColor="bg-amber-500 text-card" delay={0.1} />
        <StatCard title="Expired Members" value={dashboardStats.expiredMembers} change="-3% from last month" changeType="positive" icon="UserX" iconColor="bg-accent text-card" delay={0.15} />
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Posts" value={dashboardStats.todayPost} icon="FileText" delay={0.2} />
        <StatCard title="Today's Asks" value={dashboardStats.todayAsk} icon="MessageSquare" delay={0.25} />
        <StatCard title="Today's Gives" value={dashboardStats.todayGive} icon="Gift" delay={0.3} />
        <StatCard title="Today's Requirements" value={dashboardStats.todayRequirement} icon="ClipboardList" delay={0.35} />
      </div>

      {/* Gap Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Not Posted" value={dashboardStats.notPosted} icon="FileText" iconColor="bg-muted text-muted-foreground" delay={0.4} />
        <StatCard title="Not Asked" value={dashboardStats.notAsked} icon="MessageSquare" iconColor="bg-muted text-muted-foreground" delay={0.45} />
        <StatCard title="Not Given" value={dashboardStats.notGiven} icon="Gift" iconColor="bg-muted text-muted-foreground" delay={0.5} />
        <StatCard title="No Requirements" value={dashboardStats.notRequirements} icon="ClipboardList" iconColor="bg-muted text-muted-foreground" delay={0.55} />
      </div>


      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Training Trend" subtitle="Monthly trainings and views" delay={0.3}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={TRAINING_GRID_STROKE} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={TRAINING_AXIS_STROKE} />
              <YAxis tick={{ fontSize: 12 }} stroke={TRAINING_AXIS_STROKE} />
              <Tooltip content={<TrainingTooltip />} />
              <Bar dataKey="trainings" name="Trainings" fill={TRAINING_BAR_COLOR} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Members Trend" subtitle="Monthly joined vs expired members" delay={0.35}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215,16%,47%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215,16%,47%)" />
              <Tooltip />
              <Legend />
              <Bar dataKey="joined" name="Joined" fill="hsl(210,97%,23%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expired" name="Expired" fill="hsl(0,72%,50%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Region Overview" subtitle="Members by region" delay={0.4}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={regionData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={4}>
                {regionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {regionData.slice(0, 4).map((r, i) => (
              <div key={r.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-muted-foreground truncate">{r.name}</span>
                <span className="font-medium text-foreground ml-auto">{r.members}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Category Overview" subtitle="Members by business category" delay={0.5}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(215,16%,47%)" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="hsl(215,16%,47%)" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(210,97%,23%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default DashboardPage;
