import { motion } from "framer-motion";
import { MessageCircle, Share, MoreHorizontal, MapPin, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { Post } from "@/types";

interface PostCardProps {
  post: Post;
}

const getFullUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_API_URL?.replace("/api/admin", "") || "http://localhost:5001";
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

const PostCard = ({ post }: PostCardProps) => {
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
      className="glass-card overflow-hidden flex flex-col justify-between h-full hover:shadow-md transition-shadow duration-300 border border-border/50"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border border-border">
              {profilePhotoUrl && <AvatarImage src={profilePhotoUrl} alt={memberName} className="object-cover" />}
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(memberName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm text-foreground leading-snug">{memberName}</h3>
              {businessName && (
                <p className="text-xs text-primary/80 font-medium leading-none mt-0.5">
                  {businessName}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <MoreHorizontal size={16} />
          </Button>
        </div>

        {/* Content */}
        <div className="px-4 pb-3 space-y-2">
          {post.title && (
            <h4 className="font-bold text-sm text-foreground">{post.title}</h4>
          )}

          {/* Location & Period Info Row */}
          {(post.location || post.period) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {post.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={13} className="text-primary/70" />
                  <span>{post.location}</span>
                </div>
              )}
              {post.period && (
                <div className="flex items-center gap-1">
                  <Clock size={13} className="text-primary/70" />
                  <span>{post.period}</span>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {parseContent(post.description)}
          </p>
        </div>

        {/* Image */}
        {postImageUrl && (
          <div className="mt-2 border-t border-b border-border/40">
            <AspectRatio ratio={16 / 9} className="bg-muted">
              <img
                src={postImageUrl}
                alt="Post content"
                className="w-full h-full object-cover"
              />
            </AspectRatio>
          </div>
        )}
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-start gap-6 px-4 py-3 border-t border-border/40 bg-secondary/5">
        <div className="flex items-center gap-2 text-muted-foreground/80">
          <MessageCircle size={18} className="stroke-[1.8]" />
          <span className="text-xs font-semibold">{post.responsedCount || 0}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground/80">
          <Share size={18} className="stroke-[1.8]" />
          <span className="text-xs font-semibold">{post.sharedCount || 0}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;
