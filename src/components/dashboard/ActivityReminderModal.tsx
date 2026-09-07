import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BellRing, Send, Users, AlertCircle, Loader2 } from "lucide-react";
import { sendActivityGapReminder } from "@/api/PushNotificationApi";

export type ActivityGapType = "notPosted" | "notAsked" | "notGiven" | "notRequirements";

interface ActivityReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityType: ActivityGapType;
  cardTitle: string;
  count: number;
  regionId?: string;
  categoryId?: string;
  regionName?: string;
}

const activityDefaults: Record<
  ActivityGapType,
  { label: string; defaultTitle: string; defaultMessage: string }
> = {
  notPosted: {
    label: "Members Who Haven't Posted Today",
    defaultTitle: "Daily Post Reminder",
    defaultMessage:
      "You haven't shared your post today. Create your post now to keep your business visible to fellow members!",
  },
  notAsked: {
    label: "Members Who Haven't Asked Today",
    defaultTitle: "Daily Ask Reminder",
    defaultMessage:
      "You haven't shared your Ask today. Let other members know what referrals or help you are looking for!",
  },
  notGiven: {
    label: "Members Who Haven't Given Today",
    defaultTitle: "Daily Give Reminder",
    defaultMessage:
      "You haven't shared a Give today. Support fellow members by passing a lead or referral opportunity!",
  },
  notRequirements: {
    label: "Members Without Requirements Today",
    defaultTitle: "Daily Requirement Reminder",
    defaultMessage:
      "You haven't posted your business requirements today. Share what products or services you need!",
  },
};

export const ActivityReminderModal: React.FC<ActivityReminderModalProps> = ({
  isOpen,
  onClose,
  activityType,
  cardTitle,
  count,
  regionId,
  categoryId,
  regionName,
}) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaults = activityDefaults[activityType] || activityDefaults.notPosted;

  useEffect(() => {
    if (isOpen) {
      setTitle(defaults.defaultTitle);
      setMessage(defaults.defaultMessage);
    }
  }, [isOpen, activityType, defaults.defaultTitle, defaults.defaultMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both notification title and message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await sendActivityGapReminder({
        activityType,
        title: title.trim(),
        message: message.trim(),
        regionId: regionId || undefined,
        categoryId: categoryId || undefined,
      });

      toast({
        title: "Reminder Dispatched",
        description: `Push notifications successfully queued for ${count.toLocaleString("en-IN")} members via BullMQ.`,
      });

      onClose();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.message || "Failed to send reminder notifications.";
      toast({
        title: "Dispatch Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <BellRing size={22} />
              </div>
              <div>
                <DialogTitle className="text-xl">Send Activity Reminder</DialogTitle>
                <DialogDescription>
                  Send a push notification reminder to active members for {cardTitle.toLowerCase()}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Target Audience Summary Card */}
            <div className="p-3.5 rounded-xl bg-muted/50 border border-border/60 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Target Audience</p>
                <p className="text-sm font-semibold text-foreground">{defaults.label}</p>
                {regionName && (
                  <p className="text-xs text-primary font-medium">Filter: {regionName}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border text-foreground font-bold text-sm shadow-xs">
                <Users size={16} className="text-muted-foreground" />
                <span>{count.toLocaleString("en-IN")} Members</span>
              </div>
            </div>

            {/* Notification Title Input */}
            <div className="space-y-1.5">
              <Label htmlFor="notification-title" className="text-xs font-semibold">
                Notification Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="notification-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notification title"
                disabled={isSubmitting}
                maxLength={100}
                required
              />
            </div>

            {/* Notification Message Input */}
            <div className="space-y-1.5">
              <Label htmlFor="notification-message" className="text-xs font-semibold">
                Notification Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="notification-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter message body"
                rows={3}
                disabled={isSubmitting}
                maxLength={300}
                required
              />
            </div>

            {/* Architecture / Queue info badge */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>
                Notifications are dispatched asynchronously via BullMQ background workers with batched FCM delivery to ensure high performance.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || count === 0}
              className="gap-2 min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Queueing...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send Notification</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default ActivityReminderModal;
