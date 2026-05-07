import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import type { Activity } from "@/types";
import CommentInput from "./CommentInput";

interface PostCardProps {
  post: Activity;
}

const PostCard = ({ post }: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const handleLike = () => {
    if (isLiked) {
      setLikesCount((prev) => prev - 1);
    } else {
      setLikesCount((prev) => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleComment = (comment: string) => {
    // In a real app, this would add the comment to the post
    // For now, just clear the input and potentially show comments
    setCommentText("");
    setShowComments(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const parseContent = (text: string) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(post.memberName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm text-foreground">{post.memberName}</h3>
            <p className="text-xs text-muted-foreground">
              @{post.memberName.toLowerCase().replace(/\s/g, "")} · {post.date}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal size={16} />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4">
        <p className="text-sm text-foreground leading-relaxed">{parseContent(post.content)}</p>
      </div>

      {/* Image with 4:5 aspect ratio */}
      {post.imageUrl && (
        <div className="mt-3">
          <AspectRatio ratio={4 / 5} className="bg-muted">
            <img
              src={post.imageUrl}
              alt="Post content"
              className="w-full h-full object-cover rounded-md"
            />
          </AspectRatio>
        </div>
      )}

      {/* Action Row */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-2 transition-colors",
              isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            )}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>

          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Comments">
            <MessageCircle size={18} />
            <span className="text-sm">{post.comments}</span>
          </button>

          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Share">
            <Share size={18} />
          </button>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bookmark size={18} />
        </Button>
      </div>

      {/* Comment Input */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-border/50">
        <CommentInput userInitials="AK" onSend={handleComment} />
      </div>
    </motion.div>
  );
};

export default PostCard;
