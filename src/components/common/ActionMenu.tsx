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
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
      >
        <MoreHorizontal size={16} />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-40">
      {onAddUser && <DropdownMenuItem onClick={onAddUser} className="focus:bg-primary/5 focus:text-primary cursor-pointer"><UserPlus size={14} className="mr-2" /> Add User</DropdownMenuItem>}
      {onAssign && <DropdownMenuItem onClick={onAssign} className="focus:bg-primary/5 focus:text-primary cursor-pointer"><UserPlus size={14} className="mr-2" /> Assign Member</DropdownMenuItem>}
      {onView && <DropdownMenuItem onClick={onView} className="focus:bg-primary/5 focus:text-primary cursor-pointer"><Eye size={14} className="mr-2" /> View</DropdownMenuItem>}
      {onEdit && <DropdownMenuItem onClick={onEdit} className="focus:bg-primary/5 focus:text-primary cursor-pointer"><Pencil size={14} className="mr-2" /> Edit</DropdownMenuItem>}
      {onDelete && <DropdownMenuItem onClick={onDelete} className="focus:bg-red-50 focus:text-red-600 cursor-pointer text-red-600"><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default ActionMenu;
