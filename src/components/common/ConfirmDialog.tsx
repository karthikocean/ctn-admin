import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void;
  confirmLabel?: string;
  variant?: "destructive" | "default";
}

const ConfirmDialog = ({
  open, onOpenChange, title = "Are you sure?",
  description = "This action cannot be undone.",
  onConfirm, confirmLabel = "Delete", variant = "destructive"
}: ConfirmDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md rounded-2xl">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10">
            <AlertTriangle size={20} className="text-accent" />
          </div>
          <div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="mt-1">{description}</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <DialogFooter className="gap-2">
        <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          className="rounded-xl"
          variant={variant === "destructive" ? "destructive" : "default"}
          onClick={() => { onConfirm(); onOpenChange(false); }}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ConfirmDialog;
