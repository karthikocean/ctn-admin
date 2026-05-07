import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Clock, Calendar, Users, Search, Filter } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import FormDrawer from "@/components/common/FormDrawer";
import { Button } from "@/components/ui/button";
import { mockTrainings } from "@/data/mockData";

const TrainingsPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState("");

  return (
    <div className="page-container">
      {/* Single Row Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
            <GraduationCap size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Trainings</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold md:hidden">Curriculum</p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search sessions..."
              className="h-10 pl-9 pr-4 w-full rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="icon" className="h-10 w-10 md:w-auto md:px-4 rounded-xl border-border bg-card flex-1 sm:flex-initial">
              <Filter size={16} className="md:mr-2" />
              <span className="hidden md:inline">Filters</span>
            </Button>

            <Button
              className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-sm font-semibold flex-1 sm:flex-initial"
              onClick={() => setDrawerOpen(true)}
            >
              + Add Training
            </Button>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTrainings.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <GraduationCap size={20} className="text-primary" />
              </div>
              <StatusBadge status={t.status} />
            </div>
            <h3 className="font-semibold text-foreground">{t.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">by {t.trainer}</p>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Calendar size={14} /> {t.date}</div>
              <div className="flex items-center gap-2"><Clock size={14} /> {t.time} · {t.duration}</div>
            </div>
            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span>{t.attendees} attendees</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t.viewCount}</span>
                  <span>views</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <FormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Add Training" description="Schedule a new training session">
        <div className="space-y-4">
          {[
            "Title",
            "Trainer",
          ].map((f) => (
            <div key={f}>
              <label className="text-sm font-medium text-foreground">{f}</label>
              <input className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={`Enter ${f.toLowerCase()}`} />
            </div>
          ))}

          <div>
            <label className="text-sm font-medium text-foreground">Photo Upload</label>
            <input
              type="file"
              accept="image/*"
              className="w-full mt-1 rounded-xl border border-border bg-secondary/50 text-sm text-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            />
            {imageFile && <p className="text-xs text-muted-foreground mt-2">Selected image: {imageFile.name}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Video Upload</label>
            <input
              type="file"
              accept="video/*"
              className="w-full mt-1 rounded-xl border border-border bg-secondary/50 text-sm text-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
              onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
            />
            {videoFile && <p className="text-xs text-muted-foreground mt-2">Selected video: {videoFile.name}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Question</label>
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Enter question"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Options</label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
                <input
                  type="text"
                  value={option}
                  onChange={(event) => {
                    const updated = [...options];
                    updated[index] = event.target.value;
                    setOptions(updated);
                  }}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder={`Option ${index + 1}`}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Correct Answer</label>
            <select
              value={correctOption}
              onChange={(event) => setCorrectOption(event.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select correct answer</option>
              {options.map((option, index) => (
                <option key={index} value={option}>{`Option ${index + 1}`}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Date</label>
              <input type="date" className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Duration</label>
              <input className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. 3 hours" />
            </div>
          </div>

          <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 mt-4">Save Training</Button>
        </div>
      </FormDrawer>
    </div>
  );
};

export default TrainingsPage;
