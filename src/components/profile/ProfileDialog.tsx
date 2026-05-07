import { useState } from "react";
import { User as UserIcon, Mail, Phone, Camera, Lock, CheckCircle2, ShieldCheck } from "lucide-react";
import api from "@/services/api";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    roleId: string;
    isActive: number | boolean;
    avatar?: string;
  };
}

const ProfileDialog = ({ open, onOpenChange, user }: ProfileDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    roleId: user.roleId,
    isActive: user.isActive ? 1 : 0,
  });

  const [roleName, setRoleName] = useState("Loading...");

  useEffect(() => {
    const fetchRoleName = async () => {
      try {
        const response = await api.get(`/roles/${user.roleId}`);
        if (response.data && response.data.name) {
          setRoleName(response.data.name);
        } else {
          setRoleName("Unknown Role");
        }
      } catch (error) {
        console.error("Failed to fetch role name:", error);
        setRoleName("N/A");
      }
    };

    if (user.roleId) {
      fetchRoleName();
    }
  }, [user.roleId]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await api.get(`/admin-users/${user.id}`);
        const userData = response.data;
        setProfile({
          name: userData.name || user.name,
          email: userData.email || user.email || "",
          phoneNumber: userData.phoneNumber || user.phoneNumber,
          roleId: userData.roleId || user.roleId,
          isActive: userData.isActive !== undefined ? (userData.isActive ? 1 : 0) : 1,
        });
      } catch (error) {
        console.error("Failed to fetch user details:", error);
      }
    };

    if (user.id) {
      fetchUserDetails();
    }
  }, [user.id, user.name, user.email, user.phoneNumber, user.roleId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        name: profile.name,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        roleId: profile.roleId,
        isActive: profile.isActive,
      };

      await api.patch(`/admin-users/${user.id}`, payload);
      toast.success("Profile updated successfully");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px] p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-3xl">
        <div className="relative h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-background border-b border-border">
          <div className="absolute -bottom-10 left-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-card border-4 border-card shadow-xl overflow-hidden flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">{profile.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 rounded-lg bg-primary text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 translate-y-1">
                <Camera size={14} />
              </button>
            </div>
          </div>
          <div className="absolute bottom-4 right-6 flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/50 backdrop-blur-sm border border-border/50">
              <div className={cn("w-1.5 h-1.5 rounded-full", profile.isActive ? "bg-green-500" : "bg-red-500")} />
              <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">{profile.isActive ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>

        <div className="pt-14 px-6 pb-6 space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-foreground">Profile Settings</h2>
            <p className="text-[11px] text-muted-foreground">Manage your personal information</p>
          </div>

          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="profile-name">Full Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="profile-name"
                  className="pl-10 rounded-xl"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="profile-email"
                  className="pl-10 rounded-xl"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="profile-phone"
                  className="pl-10 rounded-xl"
                  value={profile.phoneNumber}
                  onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-role">User Role</Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="profile-role"
                  className="pl-10 rounded-xl bg-muted/30"
                  value={roleName}
                  disabled
                />
              </div>
              <p className="text-[10px] text-muted-foreground px-1 italic italic">Role update requires administrative approval</p>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="outline" className="w-full rounded-xl border-dashed border-border hover:border-primary/50 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-all">
              <Lock size={14} />
              Change Password
            </Button>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-muted/20 border-t border-border flex items-center gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="rounded-xl bg-primary hover:bg-primary/90 px-6 shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
