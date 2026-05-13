import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  scrollable?: boolean;
}

const FormDrawer = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  children,
  scrollable = true 
}: FormDrawerProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="sm:max-w-xl h-full flex flex-col overflow-hidden">
      <SheetHeader className="shrink-0">
        <SheetTitle>{title}</SheetTitle>
        {description && <SheetDescription>{description}</SheetDescription>}
      </SheetHeader>
      <div className={cn("mt-6 flex-1 min-h-0", scrollable && "overflow-y-auto space-y-4")}>
        {children}
      </div>
    </SheetContent>
  </Sheet>
);

export default FormDrawer;
