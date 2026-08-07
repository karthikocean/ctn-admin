import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  delay?: number;
  path?: string;
  onClick?: () => void;
}

const ChartCard = ({ title, subtitle, children, action, delay = 0, path, onClick }: ChartCardProps) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.recharts-wrapper')) {
      return;
    }
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
      className={`glass-card p-6 ${
        isClickable ? "cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all duration-200 group relative" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h3>
            {isClickable && <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />}
          </div>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
};

export default ChartCard;
