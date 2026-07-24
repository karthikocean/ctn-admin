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
  IndianRupee
} from "lucide-react";
import { ReactNode } from "react";

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
}

const StatCard = ({ title, value, change, changeType = "neutral", icon, iconColor, delay = 0 }: StatCardProps) => {
  const iconElement = iconMap[icon] || <Activity size={22} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
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
        <div className={`p-3 rounded-xl ${iconColor || "bg-primary/10 text-primary"}`}>
          {iconElement}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
