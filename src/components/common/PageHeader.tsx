import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

const PageHeader = ({ title, subtitle, icon, children }: PageHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="page-header"
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );
};

export default PageHeader;
