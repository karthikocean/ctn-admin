import { useState, useEffect, useRef } from "react";
import { Search, Filter, MessageSquare, Handshake, Layout, ClipboardList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/social/PostCard";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import PaginationBar from "@/components/common/PaginationBar";
import { getPosts } from "@/api/PostApi";
import type { Post } from "@/types";

interface GenericActivityPageProps {
  type: "ASK" | "GIVE" | "PROMOTION" | "REQUIREMENT";
  title: string;
  searchPlaceholder: string;
  icon: any;
  loaderTitle: string;
  loaderSubtitle: string;
}

const GenericActivityPage = ({
  type,
  title,
  searchPlaceholder,
  icon: Icon,
  loaderTitle,
  loaderSubtitle,
}: GenericActivityPageProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isMounted = useRef(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const result = await getPosts({
        page: page - 1,
        limit: 9, // clean 3x3 layout
        type,
        search,
      });
      setPosts(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error(`Error fetching ${type} posts:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleReload = () => {
    if (search !== "") {
      setSearch("");
    } else if (page !== 1) {
      setPage(1);
    } else {
      fetchPosts();
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchPosts();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 space-y-4 max-w-[1600px] mx-auto relative overflow-hidden">
      {loading && posts.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title={loaderTitle}
          subtitle={loaderSubtitle}
        />
      )}

      {/* Single Row Header (fixed at top) */}
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">{title}</h1>
          </div>
        </div>

        {/* Search, Filters */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 sm:w-64 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 transition-all duration-300"
            />
          </div>

          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs" onClick={handleReload}>
            <Filter size={14} className="mr-1.5" />
            Reload
          </Button>
        </div>
      </div>

      {/* Scrollable Middle Area containing Grid of Cards */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-1">
        {loading && posts.length > 0 ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground max-w-md mx-auto">
            No records found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* Footer (fixed at bottom) */}
      {!loading && posts.length > 0 && (
        <div className="flex-shrink-0 pt-0 pb-1 border-t border-border bg-background/80 backdrop-blur-sm z-10">
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export const AskPage = () => (
  <GenericActivityPage
    type="ASK"
    title="Ask Activities"
    searchPlaceholder="Search asks..."
    icon={MessageSquare}
    loaderTitle="Loading Ask Activities..."
    loaderSubtitle="Connecting to community requests"
  />
);

export const GivePage = () => (
  <GenericActivityPage
    type="GIVE"
    title="Give Activities"
    searchPlaceholder="Search gives..."
    icon={Handshake}
    loaderTitle="Loading Give Activities..."
    loaderSubtitle="Connecting to community offers"
  />
);

export const PostPage = () => (
  <GenericActivityPage
    type="PROMOTION"
    title="Post Activities"
    searchPlaceholder="Search posts..."
    icon={Layout}
    loaderTitle="Loading Social Posts..."
    loaderSubtitle="Connecting to community updates"
  />
);

export const RequirementPage = () => (
  <GenericActivityPage
    type="REQUIREMENT"
    title="Requirement Activities"
    searchPlaceholder="Search requirements..."
    icon={ClipboardList}
    loaderTitle="Loading Requirements..."
    loaderSubtitle="Connecting to business requirements"
  />
);
