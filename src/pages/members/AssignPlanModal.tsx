import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getPlans } from "@/api/PlansApi";
import { assignMemberPlan } from "@/api/MembersApi";
import {
  Loader2,
  Check,
  Layers,
  Sparkles,
  Calendar,
  AlertCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AssignPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any | null;
  onSuccess: () => void;
}

export const AssignPlanModal = ({
  open,
  onOpenChange,
  member,
  onSuccess
}: AssignPlanModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && member) {
      fetchPlans();
    } else {
      setSelectedPlanId(null);
    }
  }, [open, member]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await getPlans({ limit: 100 });
      const planList = response.data || [];
      const activePlans = planList.filter(
        (p: any) => p.status === "active" && !p.isDeleted
      );
      setPlans(activePlans);
      if (activePlans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(activePlans[0]._id);
      }
    } catch (error: any) {
      console.error("Failed to load plans:", error);
      toast({
        title: "Error Loading Plans",
        description: error.response?.data?.message || "Could not retrieve available plans.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!member?._id || !selectedPlanId) return;

    const chosenPlan = plans.find((p) => p._id === selectedPlanId);
    setSubmitting(true);
    try {
      await assignMemberPlan(member._id, selectedPlanId);
      toast({
        title: "Plan Assigned Successfully",
        description: `Assigned "${chosenPlan?.title || "Plan"}" to ${member.fullName || "member"}.`,
      });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error assigning plan:", error);
      toast({
        title: "Failed to Assign Plan",
        description: error.response?.data?.message || "An error occurred while assigning the plan.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlan = plans.find((p) => p._id === selectedPlanId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Assign Subscription Plan</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Select an active plan to assign to{" "}
                <span className="font-semibold text-foreground">
                  {member?.fullName || "Member"}
                </span>
                {member?.businessName ? ` (${member.businessName})` : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground font-medium">Loading available plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center border rounded-xl border-dashed">
              <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-sm font-semibold text-foreground">No Active Plans Available</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                There are no active plans configured. Please create or activate a plan in the Plans section first.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Choose Plan
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan._id;
                  const finalPrice =
                    plan.offerPrice !== null && plan.offerPrice !== undefined && plan.offerPrice >= 0
                      ? plan.offerPrice
                      : plan.amount;
                  const hasDiscount =
                    plan.offerPrice !== null &&
                    plan.offerPrice !== undefined &&
                    plan.offerPrice < plan.amount;

                  return (
                    <div
                      key={plan._id}
                      onClick={() => setSelectedPlanId(plan._id)}
                      className={cn(
                        "relative flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0 pr-3">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-muted-foreground/30 bg-background"
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground">
                              {plan.title}
                            </span>
                            {plan.trialDays > 0 && (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 border-amber-300 text-[10px] py-0 px-1.5 h-4 font-semibold"
                              >
                                <Clock className="w-2.5 h-2.5 mr-1" />
                                {plan.trialDays} Days Trial
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="bg-primary/5 text-primary border-primary/20 text-[10px] py-0 px-1.5 h-4 capitalize"
                            >
                              <Calendar className="w-2.5 h-2.5 mr-1" />
                              {plan.billingCycle || "yearly"}
                            </Badge>
                          </div>

                          {plan.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {plan.description}
                            </p>
                          )}

                          {plan.modules && plan.modules.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] text-muted-foreground">
                              <span className="inline-flex items-center font-medium text-foreground/80">
                                <Sparkles className="w-3 h-3 text-primary mr-1" />
                                {plan.modules.length} Modules Included
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex flex-col items-end">
                          <span className="text-base font-bold text-foreground">
                            {finalPrice === 0 ? "Free" : `₹${finalPrice.toLocaleString("en-IN")}`}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-muted-foreground line-through">
                              ₹{plan.amount.toLocaleString("en-IN")}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">
                            / {plan.billingCycle || "year"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={!selectedPlanId || submitting || plans.length === 0}
            className="rounded-xl font-semibold gap-1.5"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Assigning..." : `Assign ${selectedPlan?.title ? `"${selectedPlan.title}"` : "Plan"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
