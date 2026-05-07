import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Trophy, Award, Plus, Calendar, FileText, User, X } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import PaginationBar from "@/components/common/PaginationBar";
import ActionMenu from "@/components/common/ActionMenu";
import FormDrawer from "@/components/common/FormDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { mockAwards, mockMembers } from "@/data/mockData";
import type { AwardEntry } from "@/types";
import { useToast } from "@/components/ui/use-toast";

const AwardsPage = () => {
  const { toast } = useToast();
  const [awards, setAwards] = useState<AwardEntry[]>(() => {
    const stored = localStorage.getItem("awards");
    return stored ? JSON.parse(stored) : mockAwards;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [editingAward, setEditingAward] = useState<AwardEntry | null>(null);
  const [selectedAwardForAssign, setSelectedAwardForAssign] = useState<AwardEntry | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Assignment form state
  const [assignData, setAssignData] = useState({
    memberId: "",
    date: new Date().toISOString().split('T')[0]
  });

  // Form state
  const [formData, setFormData] = useState<Partial<AwardEntry>>({
    awardName: "",
    category: "",
    description: "",
    status: "active"
  });

  // Sync to localStorage whenever awards change
  useEffect(() => {
    localStorage.setItem("awards", JSON.stringify(awards));
  }, [awards]);

  const filteredAwards = useMemo(() => {
    if (!searchQuery.trim()) return awards;
    const query = searchQuery.toLowerCase();
    return awards.filter(
      (a) =>
        a.memberName.toLowerCase().includes(query) ||
        a.awardName.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
    );
  }, [awards, searchQuery]);

  const handleOpenDrawer = (award: AwardEntry | null = null) => {
    setFormError(null);
    if (award) {
      setEditingAward(award);
      setFormData(award);
    } else {
      setEditingAward(null);
      setFormData({
        memberId: "",
        awardName: "",
        category: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        status: "active"
      });
    }
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!formData.awardName || !formData.category) {
      setFormError("Please fill in all required fields.");
      return;
    }
    setFormError(null);

    if (editingAward) {
      setAwards(prev => prev.map(a => a.id === editingAward.id ? { ...a, ...formData } as AwardEntry : a));
      toast({ title: "Success", description: "Award template updated successfully." });
    } else {
      const newAward: AwardEntry = {
        id: `aw-${Date.now()}`,
        ...formData,
      } as AwardEntry;
      setAwards(prev => [newAward, ...prev]);
      toast({ title: "Success", description: "New award category created." });
    }
    setDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    setAwards(prev => prev.filter(a => a.id !== id));
    toast({ title: "Deleted", description: "Award template removed successfully." });
  };

  const handleOpenAssign = (award: AwardEntry) => {
    setSelectedAwardForAssign(award);
    setAssignData({
      memberId: "",
      date: new Date().toISOString().split('T')[0]
    });
    setAssignDrawerOpen(true);
  };

  const handleAssignSave = () => {
    if (!assignData.memberId || !assignData.date) {
      toast({
        title: "Validation Error",
        description: "Please select a member and date.",
        variant: "destructive"
      });
      return;
    }

    // In a real app, this would create a link between member and award
    // For now, let's just show a success message
    const memberName = mockMembers.find(m => m.id === assignData.memberId)?.name;
    toast({
      title: "Award Assigned!",
      description: `"${selectedAwardForAssign?.awardName}" assigned to ${memberName} on ${assignData.date}`,
    });
    setAssignDrawerOpen(false);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Trophy size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Awards Management</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search awards..."
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>

          <Button
            size="sm"
            className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
            onClick={() => handleOpenDrawer()}
          >
            <Plus size={14} className="mr-1.5" />
            Issue Award
          </Button>
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
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Award Name</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Description</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAwards.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No awards found.
                  </td>
                </tr>
              ) : (
                filteredAwards.map((a) => (
                  <tr key={a.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                          <Award size={16} />
                        </div>
                        <span className="font-bold text-primary text-sm">{a.awardName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{a.category}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell max-w-xs truncate">{a.description}</td>
                    <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu 
                        onAssign={() => handleOpenAssign(a)}
                        onEdit={() => handleOpenDrawer(a)}
                        onDelete={() => handleDelete(a.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <PaginationBar currentPage={page} totalPages={Math.ceil(filteredAwards.length / 10)} onPageChange={setPage} />
        </div>
      </motion.div>

      {/* Form Drawer */}
      <FormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingAward ? "Edit Award" : "Issue New Award"}
        description={editingAward ? "Modify the existing award category details" : "Fill in the details to create a new award category"}
      >
        <div className="space-y-6 pb-10">
          {formError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-semibold shadow-xl shadow-red-200/50 overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] opacity-80 uppercase tracking-widest font-bold mb-0.5 block">Required Fields Missing</span>
                  <p className="leading-tight">{formError}</p>
                </div>
                <button 
                  onClick={() => setFormError(null)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors ml-2"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border mb-4">
              <Trophy size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Award Template Information</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="awardName">Award Name</Label>
              <Input 
                id="awardName" 
                placeholder="e.g. Member of the Month, Best Performer" 
                value={formData.awardName}
                onChange={(e) => setFormData(prev => ({ ...prev, awardName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trading">Trading</SelectItem>
                  <SelectItem value="Services">Services</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Textiles">Textiles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val: any) => setFormData(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1.5">
                <FileText size={14} className="text-muted-foreground" />
                <Label htmlFor="description">Award Description / Criteria</Label>
              </div>
              <Textarea 
                id="description" 
                placeholder="Mention the criteria for winning this award..." 
                className="min-h-[120px]"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <Button 
            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 mt-8 font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            onClick={handleSave}
          >
            {editingAward ? "Update Template" : "Create Award Category"}
          </Button>
        </div>
      </FormDrawer>

      {/* Assign Member Drawer */}
      <FormDrawer
        open={assignDrawerOpen}
        onOpenChange={setAssignDrawerOpen}
        title="Assign Award to Member"
        description={`Giving "${selectedAwardForAssign?.awardName}" to a community member`}
      >
        <div className="space-y-6 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border mb-4">
              <User size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Assignment Details</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignMember">Select Member</Label>
              <Select 
                value={assignData.memberId} 
                onValueChange={(val) => setAssignData(prev => ({ ...prev, memberId: val }))}
              >
                <SelectTrigger className="mt-1.5 focus:ring-primary/20">
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {mockMembers.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name} ({m.company})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignDate">Achievement Date</Label>
              <div className="relative">
                <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                <input 
                  id="assignDate" 
                  type="date" 
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={assignData.date}
                  onChange={(e) => setAssignData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 mt-8 font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            onClick={handleAssignSave}
          >
            Assign Award
          </Button>
        </div>
      </FormDrawer>
    </div>
  );
};

export default AwardsPage;
