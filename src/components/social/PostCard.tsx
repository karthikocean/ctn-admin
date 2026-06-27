import { motion } from "framer-motion";
import { MessageCircle, Share, MoreHorizontal, MapPin, Clock, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Post } from "@/types";

interface PostCardProps {
  post: Post;
  onReport?: (post: Post) => void;
}

const getFullUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_API_URL?.replace("/api/admin", "") || "http://localhost:5001";
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

const PostCard = ({ post, onReport }: PostCardProps) => {
  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const parseContent = (text: string) => {
    if (!text) return "";
    return text.split(/(@[a-zA-Z0-9_]+|#[a-zA-Z0-9_]+)/).map((part, i) => {
      if (part.startsWith("@") || part.startsWith("#")) {
        return (
          <span key={i} className="text-primary font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const memberName = post.member?.fullName || "Anonymous";
  const businessName = post.member?.businessName;
  const profilePhotoUrl = post.member?.profilePhoto ? getFullUrl(post.member.profilePhoto) : undefined;
  const postImageUrl = post.media && post.media.length > 0 ? getFullUrl(post.media[0]) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-200"
    >
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4">
          <div className="flex items-start gap-3 min-w-0 pr-2">
            <Avatar className="h-11 w-11 border-0 bg-slate-200 flex-shrink-0">
              {profilePhotoUrl && <AvatarImage src={profilePhotoUrl} alt={memberName} className="object-cover" />}
              <AvatarFallback className="bg-slate-200 text-slate-600 text-base font-medium">
                {getInitials(memberName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-[15px] font-semibold text-slate-900 leading-tight break-words">{memberName}</h3>
              {businessName && (
                <p className="text-[13px] text-blue-600 font-medium leading-tight mt-1 break-words">
                  {businessName}
                </p>
              )}
              <p className="text-[12px] text-slate-400 mt-1">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 -mt-1 -mr-2 flex-shrink-0">
                <MoreHorizontal size={24} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => onReport && onReport(post)} 
                className="cursor-pointer gap-2 text-red-600 focus:text-red-700 focus:bg-red-50"
              >
                <AlertTriangle size={14} />
                <span>Report</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="px-5 pb-4 space-y-3">
          {post.title && (
            <h4 className="font-bold text-[16px] text-slate-900 leading-tight">{post.title}</h4>
          )}

          {/* Location & Period Info Row */}
          {(post.location || post.period) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px] text-slate-600">
              {post.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={18} className="text-slate-400" />
                  <span>{post.location}</span>
                </div>
              )}
              {post.period && (
                <div className="flex items-center gap-1.5">
                  <Clock size={18} className="text-slate-400" />
                  <span>{post.period}</span>
                </div>
              )}
            </div>
          )}

          <p 
            className="text-[15px] text-slate-800 leading-relaxed whitespace-pre-wrap line-clamp-3"
            title={post.description}
          >
            {parseContent(post.description)}
          </p>
        </div>

        {/* Image - ALWAYS RENDER */}
        <div className="px-5 pb-5 mt-auto">
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
            <AspectRatio ratio={16 / 9}>
              <img
                src={postImageUrl || "invalid_url"}
                alt="Post content"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/600x400/f8fafc/94a3b8?text=Image+Not+Found";
                }}
              />
            </AspectRatio>
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-start gap-6 px-5 py-3 border-t border-slate-100 bg-white rounded-b-xl">
        <div className="flex items-center gap-2 text-slate-500 hover:text-slate-700 cursor-pointer transition-colors">
          <MessageCircle size={22} className="stroke-[1.5]" />
          <span className="text-sm font-medium">{post.responsedCount || 0}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-500 hover:text-slate-700 cursor-pointer transition-colors">
          <Share size={22} className="stroke-[1.5]" />
          <span className="text-sm font-medium">{post.sharedCount || 0}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;
