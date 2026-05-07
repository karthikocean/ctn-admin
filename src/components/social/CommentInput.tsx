import { useState } from "react";
import { Smile, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CommentInputProps {
  userInitials?: string;
  onSend?: (comment: string) => void;
}

const CommentInput = ({ userInitials = "AK", onSend }: CommentInputProps) => {
  const [comment, setComment] = useState("");

  const handleSend = () => {
    if (comment.trim() && onSend) {
      onSend(comment.trim());
      setComment("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
          {userInitials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 border border-border/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
        <Input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment..."
          className="border-none bg-transparent p-0 focus-visible:ring-0 text-sm"
        />
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Add emoji"
        >
          <Smile size={18} />
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={!comment.trim()}
          className="text-primary hover:text-primary/80 disabled:text-muted-foreground transition-colors p-1"
          aria-label="Send comment"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default CommentInput;
