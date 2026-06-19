import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserIcon, Mail, Phone, Camera, Lock, CheckCircle2, ShieldCheck, Key } from "lucide-react";
import api from "@/services/api";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    roleId: user.roleId,
    isActive: user.isActive ? 1 : 0,
  });

  const [roleName, setRoleName] = useState("Loading...");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ oldPin: "", newPin: "", confirmPin: "" });

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

    if (user.id && open) {
      fetchUserDetails();
      setIsChangingPassword(false);
      setPasswords({ oldPin: "", newPin: "", confirmPin: "" });
    }
  }, [user.id, user.name, user.email, user.phoneNumber, user.roleId, open]);

  const handleSave = async () => {
    if (isChangingPassword) {
      await handleChangePassword();
      return;
    }
    
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
      navigate("/");
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.oldPin || !passwords.newPin || !passwords.confirmPin) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (passwords.newPin !== passwords.confirmPin) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwords.newPin.length !== 4) {
      toast.error("New PIN must be exactly 4 digits");
      return;
    }
    
    setLoading(true);
    try {
      await api.post(`/auth/change-pin`, {
        oldPin: passwords.oldPin,
        newPin: passwords.newPin,
      });
      toast.success("Password changed successfully");
      setIsChangingPassword(false);
      setPasswords({ oldPin: "", newPin: "", confirmPin: "" });
      onOpenChange(false);
      navigate("/");
    } catch (error: any) {
      console.error("Failed to change password:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-3xl">
        <div className="relative h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-background border-b border-border">
          <div className="absolute -bottom-8 left-5">
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-card border-4 border-card shadow-xl overflow-hidden flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{profile.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-1 rounded-lg bg-primary text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 translate-y-1">
                <Camera size={12} />
              </button>
            </div>
          </div>
          <div className="absolute bottom-3 right-5 flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/50 backdrop-blur-sm border border-border/50">
              <div className={cn("w-1.5 h-1.5 rounded-full", profile.isActive ? "bg-green-500" : "bg-red-500")} />
              <span className="text-[9px] font-bold text-foreground/80 uppercase tracking-wider">{profile.isActive ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>

        <div className="pt-10 px-5 pb-5 space-y-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-foreground">
              {isChangingPassword ? "Change Password" : "Profile Settings"}
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {isChangingPassword ? "Update your 4-digit PIN" : "Manage your personal information"}
            </p>
          </div>

          {!isChangingPassword ? (
            <div className="space-y-2.5">
              <div className="grid gap-1.5">
                <Label htmlFor="profile-name" className="text-xs">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    id="profile-name"
                    className="pl-9 h-9 text-xs rounded-xl"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="profile-email" className="text-xs">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    id="profile-email"
                    className="pl-9 h-9 text-xs rounded-xl"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="profile-phone" className="text-xs">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    id="profile-phone"
                    className="pl-9 h-9 text-xs rounded-xl"
                    value={profile.phoneNumber}
                    onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="profile-role" className="text-xs">User Role</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    id="profile-role"
                    className="pl-9 h-9 text-xs rounded-xl bg-muted/30"
                    value={roleName}
                    disabled
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full h-9 rounded-xl border-dashed border-border hover:border-primary/50 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary transition-all"
                >
                  <Lock size={12} />
                  Change Password
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-1.5">
                <Label htmlFor="old-pin" className="text-xs">Current PIN</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    id="old-pin"
                    type="password"
                    maxLength={4}
                    placeholder="Enter current 4-digit PIN"
                    className="pl-9 h-9 text-xs rounded-xl"
                    value={passwords.oldPin}
                    onChange={(e) => setPasswords({ ...passwords, oldPin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="new-pin" className="text-xs">New PIN</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    id="new-pin"
                    type="password"
                    maxLength={4}
                    placeholder="Enter new 4-digit PIN"
                    className="pl-9 h-9 text-xs rounded-xl"
                    value={passwords.newPin}
                    onChange={(e) => setPasswords({ ...passwords, newPin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="confirm-pin" className="text-xs">Confirm New PIN</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    id="confirm-pin"
                    type="password"
                    maxLength={4}
                    placeholder="Confirm new 4-digit PIN"
                    className="pl-9 h-9 text-xs rounded-xl"
                    value={passwords.confirmPin}
                    onChange={(e) => setPasswords({ ...passwords, confirmPin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-3 bg-muted/20 border-t border-border flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              if (isChangingPassword) {
                setIsChangingPassword(false);
                setPasswords({ oldPin: "", newPin: "", confirmPin: "" });
              } else {
                onOpenChange(false);
              }
            }} 
            className="rounded-xl h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading}
            className="rounded-xl h-9 text-xs bg-primary hover:bg-primary/90 px-4 shadow-lg shadow-primary/20 flex items-center gap-1.5"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            {isChangingPassword ? "Update Password" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
