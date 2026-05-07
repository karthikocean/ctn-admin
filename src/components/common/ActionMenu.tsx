import { MoreHorizontal, Eye, Pencil, Trash2, UserPlus } from "lucide-react";
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
  onAddUser?: () => void;
  onAssign?: () => void;
}

const ActionMenu = ({ onView, onEdit, onDelete, onAddUser, onAssign }: ActionMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <MoreHorizontal size={16} />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {onAddUser && <DropdownMenuItem onClick={onAddUser}><UserPlus size={14} className="mr-2" /> Add User</DropdownMenuItem>}
      {onAssign && <DropdownMenuItem onClick={onAssign}><UserPlus size={14} className="mr-2" /> Assign Member</DropdownMenuItem>}
      {onView && <DropdownMenuItem onClick={onView}><Eye size={14} className="mr-2" /> View</DropdownMenuItem>}
      {onEdit && <DropdownMenuItem onClick={onEdit}><Pencil size={14} className="mr-2" /> Edit</DropdownMenuItem>}
      {onDelete && <DropdownMenuItem onClick={onDelete} className="text-accent"><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default ActionMenu;
