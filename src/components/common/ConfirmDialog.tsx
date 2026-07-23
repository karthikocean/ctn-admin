import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  isLoading?: boolean;
}

const ConfirmDialog = ({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  onConfirm,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "destructive",
  isLoading = false
}: ConfirmDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[420px] rounded-[24px] border-none shadow-2xl p-0 overflow-hidden bg-card/95 backdrop-blur-xl">
      <div className="p-8 flex flex-col items-center text-center gap-6">
        {/* Icon Section */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center relative ${variant === "destructive" ? "bg-red-50" : "bg-primary/5"
          }`}>
          <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${variant === "destructive" ? "bg-red-200" : "bg-primary/20"
            }`} />
          <AlertTriangle
            size={40}
            className={variant === "destructive" ? "text-red-500" : "text-primary"}
          />
        </div>

        {/* Content Section */}
        <div className="space-y-2">
          <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed px-2">
            {description}
          </DialogDescription>
        </div>

        {/* Footer Section */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-2xl border-border bg-background hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-all font-semibold order-2 sm:order-1"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            className={`flex-1 h-12 rounded-2xl font-bold shadow-lg transition-all order-1 sm:order-2 ${variant === "destructive"
              ? "bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white"
              : "bg-primary hover:bg-primary/90 shadow-primary/20 text-white"
              }`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default ConfirmDialog;
