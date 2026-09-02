import { MoreHorizontal, Eye, Pencil, Trash2, UserPlus, CheckCircle2, X, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ActionMenuProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  downloadLabel?: string;
  onAddUser?: () => void;
  onAssign?: () => void;
  onToggleStatus?: () => void;
  statusLabel?: string;
}

const ActionMenu = ({ onView, onEdit, onDelete, onDownload, downloadLabel = "Download", onAddUser, onAssign, onToggleStatus, statusLabel }: ActionMenuProps) => {
  const hasAnyAction = !!(onView || onEdit || onDelete || onDownload || onAddUser || onAssign || onToggleStatus);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={!hasAnyAction}>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-sm disabled:opacity-40 disabled:pointer-events-none"
          disabled={!hasAnyAction}
        >
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      {hasAnyAction && (
        <DropdownMenuContent align="end" className="w-44" onCloseAutoFocus={(e) => e.preventDefault()}>
          {onView && <DropdownMenuItem onClick={onView} className="focus:bg-primary/5 focus:text-primary cursor-pointer"><Eye size={14} className="mr-2" /> View</DropdownMenuItem>}
          {onDownload && (
            <DropdownMenuItem onClick={onDownload} className="focus:bg-primary/5 focus:text-primary cursor-pointer">
              <Download size={14} className="mr-2 text-primary" /> {downloadLabel}
            </DropdownMenuItem>
          )}
          {onAddUser && <DropdownMenuItem onClick={onAddUser} className="focus:bg-primary/5 focus:text-primary cursor-pointer"><UserPlus size={14} className="mr-2" /> Add User</DropdownMenuItem>}
          {onAssign && <DropdownMenuItem onClick={onAssign} className="focus:bg-primary/5 focus:text-primary cursor-pointer"><UserPlus size={14} className="mr-2" /> Assign Member</DropdownMenuItem>}
          {onEdit && <DropdownMenuItem onClick={onEdit} className="focus:bg-primary/5 focus:text-primary cursor-pointer"><Pencil size={14} className="mr-2" /> Edit</DropdownMenuItem>}
          {onToggleStatus && (
            <DropdownMenuItem onClick={onToggleStatus} className="focus:bg-primary/5 focus:text-primary cursor-pointer">
              {statusLabel?.toLowerCase() === "active" ? (
                <>
                  <X size={14} className="mr-2" /> Deactivate
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="mr-2" /> Activate
                </>
              )}
            </DropdownMenuItem>
          )}
          {onDelete && <DropdownMenuItem onClick={onDelete} className="focus:bg-red-50 focus:text-red-600 cursor-pointer text-red-600"><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
};

export default ActionMenu;
