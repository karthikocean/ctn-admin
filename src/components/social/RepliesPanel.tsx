import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Reply } from "@/types";
import ReplyItem from "./ReplyItem";

interface RepliesPanelProps {
  replies: Reply[];
}

const RepliesPanel = ({ replies }: RepliesPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="glass-card h-fit sticky top-6 flex flex-col max-h-[calc(100vh-140px)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
        <h2 className="font-semibold text-sm">REPLIES ({replies.length})</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal size={16} />
        </Button>
      </div>

      {/* Replies List with scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 scroll-smooth">
        {replies.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            No replies yet. Be the first to respond!
          </div>
        ) : (
          replies.map((reply) => (
            <ReplyItem key={reply.id} reply={reply} />
          ))
        )}
      </div>
    </motion.div>
  );
};

export default RepliesPanel;
