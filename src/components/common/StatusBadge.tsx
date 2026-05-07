import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  onClick?: () => void;
}

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-muted text-muted-foreground border-border",
  suspended: "bg-red-50 text-accent border-red-200",
  expired: "bg-red-50 text-accent border-red-200",
  expiring_soon: "bg-amber-50 text-amber-700 border-amber-200",
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-muted text-muted-foreground border-border",
  archived: "bg-muted text-muted-foreground border-border",
  upcoming: "bg-blue-50 text-primary border-blue-200",
  ongoing: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-red-50 text-accent border-red-200",
  scheduled: "bg-blue-50 text-primary border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  earned: "bg-emerald-50 text-emerald-700 border-emerald-200",
  redeemed: "bg-blue-50 text-primary border-blue-200",
  closed: "bg-muted text-muted-foreground border-border",
};

const StatusBadge = ({ status, className, onClick }: StatusBadgeProps) => {
  const style = statusStyles[status.toLowerCase()] || statusStyles.active;
  const label = status.replace(/_/g, " ");

  return (
    <span 
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize", 
        style, 
        className,
        onClick && "cursor-pointer hover:opacity-80 transition-opacity"
      )}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
