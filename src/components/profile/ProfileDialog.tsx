import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserIcon, Mail, Phone, Camera, Lock, CheckCircle2, ShieldCheck, Key, Eye, EyeOff, Check } from "lucide-react";
import api from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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

const SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;/]/;

const checkPasswordStrength = (pwd: string) => ({
  hasLength: pwd.length >= 8,
  hasUpper: /[A-Z]/.test(pwd),
  hasNumber: /[0-9]/.test(pwd),
  hasSpecial: SPECIAL_CHAR_REGEX.test(pwd),
  isValid:
    pwd.length >= 8 &&
    /[A-Z]/.test(pwd) &&
    /[0-9]/.test(pwd) &&
    SPECIAL_CHAR_REGEX.test(pwd),
});

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
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const newPasswordStrength = checkPasswordStrength(passwords.newPassword);

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
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
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
    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (passwords.oldPassword === passwords.newPassword) {
      toast.error("New password cannot be the same as current password");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (!newPasswordStrength.isValid) {
      toast.error("Password must be at least 8 characters long and include an uppercase letter, a number, and a special character");
      return;
    }
    
    setLoading(true);
    try {
      await api.post(`/auth/change-pin`, {
        oldPin: passwords.oldPassword,
        newPin: passwords.newPassword,
      });
      toast.success("Password changed successfully");
      setIsChangingPassword(false);
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
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
      <DialogContent className="max-w-[380px] p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-3xl">
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
              {isChangingPassword ? "Update your account password with security criteria" : "Manage your personal information"}
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
              {/* Current Password */}
              <div className="grid gap-1.5">
                <Label htmlFor="old-password" className="text-xs">Current Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    id="old-password"
                    type={showOldPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    className="pl-9 pr-9 h-9 text-xs rounded-xl"
                    value={passwords.oldPassword}
                    onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showOldPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="grid gap-1.5">
                <Label htmlFor="new-password" className="text-xs">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    className="pl-9 pr-9 h-9 text-xs rounded-xl"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>

                {/* Same password warning */}
                {passwords.oldPassword && passwords.newPassword && passwords.oldPassword === passwords.newPassword && (
                  <p className="text-[10px] text-destructive font-medium ml-1">New password cannot be the same as current password.</p>
                )}

                {/* Real-time Checklist */}
                {passwords.newPassword && (
                  <div className="p-2.5 bg-muted/40 rounded-xl border border-border/70 space-y-1 mt-1 text-[10px]">
                    <div className="grid grid-cols-2 gap-1">
                      <div className={`flex items-center gap-1 ${newPasswordStrength.hasLength ? "text-green-600 font-semibold" : "text-muted-foreground"}`}>
                        {newPasswordStrength.hasLength ? <Check size={11} className="stroke-[3]" /> : <div className="w-1 h-1 rounded-full bg-muted-foreground ml-1 mr-0.5" />}
                        <span>Min. 8 chars</span>
                      </div>
                      <div className={`flex items-center gap-1 ${newPasswordStrength.hasUpper ? "text-green-600 font-semibold" : "text-muted-foreground"}`}>
                        {newPasswordStrength.hasUpper ? <Check size={11} className="stroke-[3]" /> : <div className="w-1 h-1 rounded-full bg-muted-foreground ml-1 mr-0.5" />}
                        <span>1 Uppercase (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${newPasswordStrength.hasNumber ? "text-green-600 font-semibold" : "text-muted-foreground"}`}>
                        {newPasswordStrength.hasNumber ? <Check size={11} className="stroke-[3]" /> : <div className="w-1 h-1 rounded-full bg-muted-foreground ml-1 mr-0.5" />}
                        <span>1 Number (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${newPasswordStrength.hasSpecial ? "text-green-600 font-semibold" : "text-muted-foreground"}`}>
                        {newPasswordStrength.hasSpecial ? <Check size={11} className="stroke-[3]" /> : <div className="w-1 h-1 rounded-full bg-muted-foreground ml-1 mr-0.5" />}
                        <span>1 Special char</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="grid gap-1.5">
                <Label htmlFor="confirm-password" className="text-xs">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="pl-9 pr-9 h-9 text-xs rounded-xl"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                  <p className="text-[10px] text-destructive font-medium ml-1">Passwords do not match.</p>
                )}
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
                setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
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
            disabled={loading || (isChangingPassword && (!newPasswordStrength.isValid || passwords.newPassword !== passwords.confirmPassword || passwords.oldPassword === passwords.newPassword))}
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
