import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Reply } from "@/types";

interface ReplyItemProps {
  reply: Reply;
  isNested?: boolean;
  onReply?: (replyId: string) => void;
}

const ReplyItem = ({ reply, isNested = false, onReply }: ReplyItemProps) => {
  const { authorName, authorHandle, avatarColor, initials, timestamp, content, nestedReplies } = reply;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(isNested ? "ml-12 mt-3 pl-4 bg-muted/30 rounded-lg py-3" : "py-3")}
    >
      <div className="flex items-start gap-3">
        {/* Colored circle avatar */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0",
            avatarColor
          )}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{authorName}</span>
            <span className="text-xs text-muted-foreground">{authorHandle}</span>
            <span className="text-xs text-muted-foreground">· {timestamp}</span>
            {isNested && (
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto p-0">
                <MoreHorizontal size={14} />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{content}</p>
        </div>
      </div>

      {/* Nested replies */}
      {nestedReplies && nestedReplies.length > 0 && (
        <div className="mt-3 space-y-1">
          {nestedReplies.map((nested) => (
            <ReplyItem key={nested.id} reply={nested} isNested={true} onReply={onReply} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ReplyItem;
