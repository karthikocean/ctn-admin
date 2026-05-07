import { FileX } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

const EmptyState = ({ title = "No data found", description = "There's nothing here yet." }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="p-4 rounded-2xl bg-secondary mb-4">
      <FileX size={32} className="text-muted-foreground" />
    </div>
    <h3 className="font-semibold text-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground mt-1">{description}</p>
  </div>
);

export default EmptyState;
