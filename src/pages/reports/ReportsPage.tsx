import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart as FileBarChart, Download } from "lucide-react";
import ChartCard from "@/components/common/ChartCard";
import StatCard from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { regionData, categoryData, monthlyData } from "@/data/mockData";

const COLORS = ["hsl(210,97%,23%)", "hsl(0,72%,50%)", "hsl(142,71%,45%)", "hsl(38,92%,50%)", "hsl(262,83%,58%)", "hsl(210,60%,50%)"];

const ReportsPage = () => {
  return (
    <div className="page-container">
      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileBarChart size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Reports</h1>
          </div>
        </div>

        {/* Export - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Download size={14} className="mr-1.5" />
            Export
          </Button>
        </div>
      </div>


      <Tabs defaultValue="points">
        <TabsList className="bg-secondary rounded-xl">
          <TabsTrigger value="points" className="rounded-lg">Points Report</TabsTrigger>
          <TabsTrigger value="region" className="rounded-lg">Region Report</TabsTrigger>
        </TabsList>

        <TabsContent value="points" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total Points Issued" value="42,500" icon="Activity" change="+18% this month" changeType="positive" />
            <StatCard title="Points Redeemed" value="12,300" icon="Gift" change="+5% this month" changeType="positive" />
            <StatCard title="Active Earners" value="845" icon="Users" />
          </div>
          <ChartCard title="Points Trend" subtitle="Monthly points activity">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215,16%,47%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(215,16%,47%)" />
                <Tooltip />
                <Bar dataKey="points" fill="hsl(210,97%,23%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </TabsContent>

        <TabsContent value="region" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Members by Region">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={regionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={4}>
                    {regionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Region Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(215,16%,47%)" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="hsl(215,16%,47%)" width={100} />
                  <Tooltip />
                  <Bar dataKey="members" fill="hsl(0,72%,50%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
