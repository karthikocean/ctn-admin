import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, MessageSquare, Handshake, Layout, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockActivities } from "@/data/mockData";
import PostCard from "@/components/social/PostCard";
import RepliesPanel from "@/components/social/RepliesPanel";

export const AskPage = () => {
  const filtered = mockActivities.filter(a => a.type === "ask");
  const [searchQuery, setSearchQuery] = useState("");

  const asks = useMemo(() => {
    if (!searchQuery.trim()) return filtered;
    const query = searchQuery.toLowerCase();
    return filtered.filter(
      (ask) =>
        ask.memberName.toLowerCase().includes(query) ||
        ask.content.toLowerCase().includes(query) ||
        ask.title.toLowerCase().includes(query)
    );
  }, [filtered, searchQuery]);

  const selectedAsk = asks[0];

  return (
    <div className="page-container">
      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Ask Activities</h1>
          </div>
        </div>

        {/* Search, Filters - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search asks..."
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Ask Card */}
        <div>
          {selectedAsk ? (
            <PostCard post={selectedAsk} />
          ) : (
            <div className="glass-card p-8 text-center text-muted-foreground">
              No asks found matching your search.
            </div>
          )}
        </div>

        {/* Right column - Replies Panel */}
        <div>
          {selectedAsk && <RepliesPanel replies={selectedAsk.replies} />}
          {!selectedAsk && asks.length > 0 && (
            <div className="glass-card p-8 text-center text-muted-foreground">
              Select an ask to view replies
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const GivePage = () => {
  const filtered = mockActivities.filter(a => a.type === "give");
  const [searchQuery, setSearchQuery] = useState("");

  const gives = useMemo(() => {
    if (!searchQuery.trim()) return filtered;
    const query = searchQuery.toLowerCase();
    return filtered.filter(
      (give) =>
        give.memberName.toLowerCase().includes(query) ||
        give.content.toLowerCase().includes(query) ||
        give.title.toLowerCase().includes(query)
    );
  }, [filtered, searchQuery]);

  const selectedGive = gives[0];

  return (
    <div className="page-container">
      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Handshake size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Give Activities</h1>
          </div>
        </div>

        {/* Search, Filters - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search gives..."
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Give Card */}
        <div>
          {selectedGive ? (
            <PostCard post={selectedGive} />
          ) : (
            <div className="glass-card p-8 text-center text-muted-foreground">
              No gives found matching your search.
            </div>
          )}
        </div>

        {/* Right column - Replies Panel */}
        <div>
          {selectedGive && <RepliesPanel replies={selectedGive.replies} />}
          {!selectedGive && gives.length > 0 && (
            <div className="glass-card p-8 text-center text-muted-foreground">
              Select an offer to view replies
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PostPage = () => {
  const filtered = mockActivities.filter(a => a.type === "post");
  const [searchQuery, setSearchQuery] = useState("");

  const posts = useMemo(() => {
    if (!searchQuery.trim()) return filtered;
    const query = searchQuery.toLowerCase();
    return filtered.filter(
      (post) =>
        post.memberName.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.title.toLowerCase().includes(query)
    );
  }, [filtered, searchQuery]);

  const selectedPost = posts[0];

  return (
    <div className="page-container">
      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layout size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Post Activities</h1>
          </div>
        </div>

        {/* Search, Filters - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search posts..."
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Post Card */}
        <div>
          {selectedPost ? (
            <PostCard post={selectedPost} />
          ) : (
            <div className="glass-card p-8 text-center text-muted-foreground">
              No posts found matching your search.
            </div>
          )}
        </div>

        {/* Right column - Replies Panel */}
        <div>
          {selectedPost && <RepliesPanel replies={selectedPost.replies} />}
          {!selectedPost && posts.length > 0 && (
            <div className="glass-card p-8 text-center text-muted-foreground">
              Select a post to view replies
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const RequirementPage = () => {
  const filtered = mockActivities.filter(a => a.type === "requirement");
  const [searchQuery, setSearchQuery] = useState("");

  const requirements = useMemo(() => {
    if (!searchQuery.trim()) return filtered;
    const query = searchQuery.toLowerCase();
    return filtered.filter(
      (req) =>
        req.memberName.toLowerCase().includes(query) ||
        req.content.toLowerCase().includes(query) ||
        req.title.toLowerCase().includes(query)
    );
  }, [filtered, searchQuery]);

  const selectedRequirement = requirements[0];

  return (
    <div className="page-container">
      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardList size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Requirement Activities</h1>
          </div>
        </div>

        {/* Search, Filters - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search requirements..."
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Requirement Card */}
        <div>
          {selectedRequirement ? (
            <PostCard post={selectedRequirement} />
          ) : (
            <div className="glass-card p-8 text-center text-muted-foreground">
              No requirements found matching your search.
            </div>
          )}
        </div>

        {/* Right column - Replies Panel */}
        <div>
          {selectedRequirement && <RepliesPanel replies={selectedRequirement.replies} />}
          {!selectedRequirement && requirements.length > 0 && (
            <div className="glass-card p-8 text-center text-muted-foreground">
              Select a requirement to view replies
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
