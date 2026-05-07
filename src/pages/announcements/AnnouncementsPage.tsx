import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, User, Calendar, Search, Filter } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import FormDrawer from "@/components/common/FormDrawer";
import { Button } from "@/components/ui/button";
import { mockAnnouncements } from "@/data/mockData";

const AnnouncementsPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  return (
    <div className="page-container">
      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Megaphone size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Announcements</h1>
          </div>
        </div>

        {/* Search, Filters, Add - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search announcements..."
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Filters */}
          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>

          {/* New Announcement */}
          <Button
            size="sm"
            className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
            onClick={() => setDrawerOpen(true)}
          >
            + New Announcement
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockAnnouncements.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }} className="glass-card overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Megaphone size={40} className="text-primary-foreground/60" />
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-foreground">{a.title}</h3>
                <StatusBadge status={a.status} />
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.content}</p>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User size={14} />
                  <span>{a.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>{a.createdAt}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="rounded-lg flex-1">View</Button>
                <Button size="sm" className="rounded-lg flex-1 bg-primary hover:bg-primary/90" onClick={() => setDrawerOpen(true)}>Edit</Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <FormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Create Announcement" description="Add a new announcement">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Title</label>
            <input className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Enter title" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Content</label>
            <textarea className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px]" placeholder="Enter content" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Image</label>
            <input
              type="file"
              accept="image/*"
              className="w-full mt-1 rounded-xl border border-border bg-secondary/50 text-sm text-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            />
            {imageFile && (
              <p className="text-xs text-muted-foreground mt-2">Selected image: {imageFile.name}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Video</label>
            <input
              type="file"
              accept="video/*"
              className="w-full mt-1 rounded-xl border border-border bg-secondary/50 text-sm text-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
              onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
            />
            {videoFile && (
              <p className="text-xs text-muted-foreground mt-2">Selected video: {videoFile.name}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Status</label>
            <select className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option>Draft</option>
              <option>Published</option>
              <option>Archived</option>
            </select>
          </div>

          <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 mt-4">Save Announcement</Button>
        </div>
      </FormDrawer>
    </div>
  );
};

export default AnnouncementsPage;
