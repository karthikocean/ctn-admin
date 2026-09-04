import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  UserX,
  Clock,
  FileText,
  MessageSquare,
  Gift,
  ClipboardList,
  Activity,
  FileX,
  MessageSquareOff,
  HeartOff,
  ClipboardX,
  Handshake,
  UserPlus,
  Receipt,
  IndianRupee,
  ChevronRight,
  Briefcase
} from "lucide-react";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

const iconMap: Record<string, ReactNode> = {
  Users: <Users size={22} />,
  UserCheck: <UserCheck size={22} />,
  UserX: <UserX size={22} />,
  Clock: <Clock size={22} />,
  FileText: <FileText size={22} />,
  MessageSquare: <MessageSquare size={22} />,
  Gift: <Gift size={22} />,
  ClipboardList: <ClipboardList size={22} />,
  Activity: <Activity size={22} />,
  FileX: <FileX size={22} />,
  MessageSquareOff: <MessageSquareOff size={22} />,
  HeartOff: <HeartOff size={22} />,
  ClipboardX: <ClipboardX size={22} />,
  Handshake: <Handshake size={22} />,
  UserPlus: <UserPlus size={22} />,
  Receipt: <Receipt size={22} />,
  Briefcase: <Briefcase size={22} />,
  IndianRupee: <IndianRupee size={22} />,
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: string;
  iconColor?: string;
  delay?: number;
  path?: string;
  onClick?: () => void;
}

const StatCard = ({ title, value, change, changeType = "neutral", icon, iconColor, delay = 0, path, onClick }: StatCardProps) => {
  const navigate = useNavigate();
  const iconElement = iconMap[icon] || <Activity size={22} />;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  const isClickable = Boolean(path || onClick);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={isClickable ? handleClick : undefined}
      className={`stat-card relative group ${
        isClickable ? "cursor-pointer hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99]" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            {isClickable && (
              <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            )}
          </div>
          <p className="text-2xl font-bold text-foreground truncate" title={typeof value === "number" ? value.toLocaleString("en-IN") : String(value)}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {change && (
            <div className="flex items-center gap-1 text-xs">
              {changeType === "positive" && <TrendingUp size={14} className="text-emerald-500" />}
              {changeType === "negative" && <TrendingDown size={14} className="text-accent" />}
              <span className={
                changeType === "positive" ? "text-emerald-500" :
                changeType === "negative" ? "text-accent" : "text-muted-foreground"
              }>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl transition-transform group-hover:scale-105 ${iconColor || "bg-primary/10 text-primary"}`}>
          {iconElement}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
