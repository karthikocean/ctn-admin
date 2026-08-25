import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, ArrowLeft, KeyRound, AlertCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logoHorizontal from "@/assets/logo-horizontal.png";
import api from "@/services/api";

type AuthMode = "LOGIN" | "FORGOT_EMAIL" | "FORGOT_OTP" | "FORGOT_NEW_PASSWORD";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  // App-wide Auth mode
  const [authMode, setAuthMode] = useState<AuthMode>("LOGIN");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sign In inputs
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password: Email Input
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailTouched, setForgotEmailTouched] = useState(false);

  // Forgot Password: OTP input
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);

  // Forgot Password: Reset Password inputs
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Resend OTP countdown
  const [countdown, setCountdown] = useState(0);

  // Refs for OTP focusing
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Helper to sync forgot email with login email initially
  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setForgotEmail(email);
    setForgotEmailTouched(false);
    setAuthMode("FORGOT_EMAIL");
  };

  const handleDigitChange = (
    index: number,
    value: string,
    state: string[],
    setState: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.RefObject<HTMLInputElement>[]
  ) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newState = [...state];
    newState[index] = digit;
    setState(newState);

    if (digit && index < refs.length - 1) {
      refs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    state: string[],
    refs: React.RefObject<HTMLInputElement>[]
  ) => {
    if (e.key === "Backspace" && !state[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent,
    setState: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.RefObject<HTMLInputElement>[]
  ) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, refs.length);
    const newState = [...Array(refs.length)].map((_, idx) => pastedData[idx] || "");
    setState(newState);

    const lastIndex = Math.min(pastedData.length, refs.length - 1);
    refs[lastIndex]?.current?.focus();
  };

  // Validation helpers
  const isValidEmail = (val: string) => EMAIL_REGEX.test(val.trim());
  const isPureNumber = (val: string) => /^\d+$/.test(val.trim());

  const isEmailValid = isValidEmail(email);
  const isForgotEmailValid = isValidEmail(forgotEmail);
  const isPasswordValid = password.trim().length >= 1;
  const isOtpComplete = otp.every((digit) => digit !== "");

  const newPasswordStrength = checkPasswordStrength(newPassword);
  const isNewPasswordValid = newPasswordStrength.isValid;
  const isConfirmPasswordValid = isNewPasswordValid && newPassword === confirmPassword;

  // Custom email error message helper
  const getEmailErrorMessage = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return "Email address is required";
    if (isPureNumber(trimmed)) return "Phone numbers are not allowed. Please enter your email address.";
    if (!trimmed.includes("@")) return "Email address must include an '@' symbol.";
    if (!isValidEmail(trimmed)) return "Please enter a valid email address (e.g. admin@trustednetwork.in).";
    return "";
  };

  // LOGIN SUBMIT
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!isEmailValid) {
      toast({
        title: "Invalid Email",
        description: getEmailErrorMessage(email),
        variant: "destructive",
      });
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: "Missing Password",
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }

    if (loading) return;

    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);

    if (result.success) {
      setIsSuccess(true);
      toast({
        title: "Success",
        description: result.message,
        variant: "success",
      });
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 800);
    } else {
      toast({
        title: "Authentication Failed",
        description: result.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  // FORGOT PASSWORD: EMAIL SUBMIT
  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotEmailTouched(true);

    if (!isForgotEmailValid) {
      toast({
        title: "Invalid Email",
        description: getEmailErrorMessage(forgotEmail),
        variant: "destructive",
      });
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-pin", {
        email: forgotEmail.trim().toLowerCase(),
      });

      if (response.data.success) {
        toast({
          title: "OTP Sent",
          description: response.data.message || "Verification code has been sent to your email.",
          variant: "success",
        });
        setOtp(["", "", "", ""]);
        setAuthMode("FORGOT_OTP");
        setCountdown(60);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to send OTP.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Something went wrong. Please check your email address.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // FORGOT PASSWORD: OTP SUBMIT
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !isOtpComplete) return;

    setLoading(true);
    try {
      const otpString = otp.join("");
      const response = await api.post("/auth/verify-otp", {
        email: forgotEmail.trim().toLowerCase(),
        otp: otpString,
      });

      if (response.data.success) {
        toast({
          title: "Verified",
          description: response.data.message || "OTP verified successfully.",
          variant: "success",
        });
        setNewPassword("");
        setConfirmPassword("");
        setNewPasswordTouched(false);
        setConfirmPasswordTouched(false);
        setAuthMode("FORGOT_NEW_PASSWORD");
      } else {
        toast({
          title: "Error",
          description: response.data.message || "OTP verification failed.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Verification Failed",
        description: err.response?.data?.message || "Invalid or expired OTP.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // RESET PASSWORD SUBMIT
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPasswordTouched(true);
    setConfirmPasswordTouched(true);

    if (!newPasswordStrength.isValid) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/reset-pin", {
        email: forgotEmail.trim().toLowerCase(),
        newPassword: newPassword,
      });

      if (response.data.success) {
        toast({
          title: "Password Reset Successful",
          description: "Your password has been updated. Please sign in with your new password.",
          variant: "success",
        });
        setEmail(forgotEmail);
        setPassword("");
        setEmailTouched(false);
        setPasswordTouched(false);
        setAuthMode("LOGIN");
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to reset password.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Reset Failed",
        description: err.response?.data?.message || "Failed to reset your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP trigger
  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-pin", {
        email: forgotEmail.trim().toLowerCase(),
      });
      if (response.data.success) {
        toast({
          title: "OTP Resent",
          description: "A new OTP code has been sent.",
          variant: "success",
        });
        setOtp(["", "", "", ""]);
        setCountdown(60);
        setTimeout(() => {
          otpRefs[0].current?.focus();
        }, 50);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to resend OTP.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Header content based on state
  const getHeaderContent = () => {
    switch (authMode) {
      case "LOGIN":
        return {
          title: "Sign In",
          subtitle: "Enter your registered email and password to continue",
        };
      case "FORGOT_EMAIL":
        return {
          title: "Forgot Password",
          subtitle: "Enter your registered email address to receive an OTP",
        };
      case "FORGOT_OTP":
        return {
          title: "Verify OTP",
          subtitle: `We've sent a 4-digit verification code to ${forgotEmail}`,
        };
      case "FORGOT_NEW_PASSWORD":
        return {
          title: "Reset Password",
          subtitle: "Create a secure password with 8+ characters, uppercase, number & symbol",
        };
    }
  };

  const header = getHeaderContent();

  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  const showEmailError = emailTouched && email.length > 0 && !isEmailValid;
  const showForgotEmailError = forgotEmailTouched && forgotEmail.length > 0 && !isForgotEmailValid;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#001938]">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#001938] via-[#001227] to-[#000b18]" />

      {/* Premium background decorative blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#d1962a]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#d1962a]/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[480px] p-6"
      >
        {/* Main Card with layout animation */}
        <motion.div
          layout
          className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-10 md:p-12 border border-gray-100 overflow-hidden"
        >
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-full max-w-[280px] h-16 flex items-center justify-center mb-5">
              <img src={logoHorizontal} alt="Trusted Network Logo" className="w-full h-full object-contain" />
            </div>

            <div className="text-center space-y-1.5">
              <h1 className="text-2xl font-black text-[#001938] tracking-tight">{header.title}</h1>
              <p className="text-gray-600 text-xs font-semibold">{header.subtitle}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* SIGN IN FORM */}
            {authMode === "LOGIN" && (
              <motion.form
                key="login"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleLoginSubmit}
                className="space-y-6"
                noValidate
              >
                <div className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#001938]/80 ml-1">Email Address</label>
                    <div className="relative flex items-center group">
                      <div
                        className={`absolute left-4 transition-colors pointer-events-none ${
                          showEmailError
                            ? "text-red-500"
                            : isEmailValid
                            ? "text-green-600"
                            : "text-gray-400 group-focus-within:text-[#d1962a]"
                        }`}
                      >
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (!emailTouched) setEmailTouched(true);
                        }}
                        onBlur={() => setEmailTouched(true)}
                        autoComplete="email"
                        autoFocus
                        className={`
                          w-full pl-12 pr-11 py-4 rounded-[12px] text-[#001938] text-sm font-semibold transition-all placeholder:text-gray-400 placeholder:font-normal
                          ${
                            showEmailError
                              ? "bg-red-50/40 border border-red-400 focus:outline-none focus:ring-4 focus:ring-red-500/15 focus:border-red-500"
                              : isEmailValid
                              ? "bg-green-50/20 border border-green-400 focus:outline-none focus:ring-4 focus:ring-green-500/15 focus:border-green-500"
                              : "bg-gray-50/50 border border-gray-300 focus:outline-none focus:ring-4 focus:ring-[#d1962a]/10 focus:border-[#d1962a]"
                          }
                        `}
                      />
                      {isEmailValid && (
                        <div className="absolute right-4 text-green-500">
                          <CheckCircle2 size={18} />
                        </div>
                      )}
                      {showEmailError && (
                        <div className="absolute right-4 text-red-500">
                          <AlertCircle size={18} />
                        </div>
                      )}
                    </div>
                    {showEmailError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[11px] font-bold text-red-500 ml-1 flex items-center gap-1"
                      >
                        {getEmailErrorMessage(email)}
                      </motion.p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-xs font-bold text-[#001938]/80">Password</label>
                      <a
                        href="#"
                        onClick={handleForgotPasswordClick}
                        className="text-xs font-black text-[#d1962a] hover:text-[#b88020] hover:underline transition-all"
                      >
                        Forgot Password?
                      </a>
                    </div>
                    <div className="relative flex items-center group">
                      <div className="absolute left-4 text-gray-400 group-focus-within:text-[#d1962a] transition-colors pointer-events-none">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setPasswordTouched(true)}
                        autoComplete="current-password"
                        className="w-full pl-12 pr-12 py-4 rounded-[12px] bg-gray-50/50 border border-gray-300 text-[#001938] text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-[#d1962a]/10 focus:border-[#d1962a] transition-all placeholder:text-gray-400 placeholder:font-normal"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sign In Button */}
                <div className="space-y-4 pt-2">
                  <Button
                    type="submit"
                    className={`
                      w-full py-7 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg
                      ${
                        loading || !isEmailValid || !isPasswordValid
                          ? "bg-gray-100 text-gray-400 border border-gray-300 shadow-none cursor-not-allowed"
                          : "bg-gradient-to-r from-[#d1962a] to-[#b88020] text-[#001938] hover:from-[#e0a234] hover:to-[#c68b25]"
                      }
                    `}
                    disabled={loading || !isEmailValid || !isPasswordValid}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isSuccess ? (
                      <div className="flex items-center gap-2 text-[#001938]">
                        <CheckCircle2 size={18} />
                        <span>Login Successful</span>
                      </div>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}

            {/* FORGOT PASSWORD: EMAIL SCREEN */}
            {authMode === "FORGOT_EMAIL" && (
              <motion.form
                key="forgot-email"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleForgotEmailSubmit}
                className="space-y-6"
                noValidate
              >
                <div className="space-y-4">
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#001938]/80 ml-1">Registered Email</label>
                    <div className="relative flex items-center group">
                      <div
                        className={`absolute left-4 transition-colors pointer-events-none ${
                          showForgotEmailError
                            ? "text-red-500"
                            : isForgotEmailValid
                            ? "text-green-600"
                            : "text-gray-400 group-focus-within:text-[#d1962a]"
                        }`}
                      >
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        placeholder="Enter your registered email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          if (!forgotEmailTouched) setForgotEmailTouched(true);
                        }}
                        onBlur={() => setForgotEmailTouched(true)}
                        autoFocus
                        className={`
                          w-full pl-12 pr-11 py-4 rounded-[12px] text-[#001938] text-sm font-semibold transition-all placeholder:text-gray-400 placeholder:font-normal
                          ${
                            showForgotEmailError
                              ? "bg-red-50/40 border border-red-400 focus:outline-none focus:ring-4 focus:ring-red-500/15 focus:border-red-500"
                              : isForgotEmailValid
                              ? "bg-green-50/20 border border-green-400 focus:outline-none focus:ring-4 focus:ring-green-500/15 focus:border-green-500"
                              : "bg-gray-50/50 border border-gray-300 focus:outline-none focus:ring-4 focus:ring-[#d1962a]/10 focus:border-[#d1962a]"
                          }
                        `}
                      />
                      {isForgotEmailValid && (
                        <div className="absolute right-4 text-green-500">
                          <CheckCircle2 size={18} />
                        </div>
                      )}
                      {showForgotEmailError && (
                        <div className="absolute right-4 text-red-500">
                          <AlertCircle size={18} />
                        </div>
                      )}
                    </div>
                    {showForgotEmailError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[11px] font-bold text-red-500 ml-1 flex items-center gap-1"
                      >
                        {getEmailErrorMessage(forgotEmail)}
                      </motion.p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Button
                    type="submit"
                    className={`
                      w-full py-7 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg
                      ${
                        loading || !isForgotEmailValid
                          ? "bg-gray-100 text-gray-400 border border-gray-300 shadow-none cursor-not-allowed"
                          : "bg-gradient-to-r from-[#d1962a] to-[#b88020] text-[#001938] hover:from-[#e0a234] hover:to-[#c68b25]"
                      }
                    `}
                    disabled={loading || !isForgotEmailValid}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Send OTP</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </Button>

                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAuthMode("LOGIN")}
                      className="text-xs font-black text-[#d1962a] hover:text-[#b88020] hover:bg-[#d1962a]/5 transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Sign In</span>
                    </Button>
                  </div>
                </div>
              </motion.form>
            )}

            {/* FORGOT PASSWORD: OTP VERIFY SCREEN */}
            {authMode === "FORGOT_OTP" && (
              <motion.form
                key="forgot-otp"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleOtpSubmit}
                className="space-y-8"
              >
                <div className="space-y-6">
                  {/* 4-digit OTP Inputs */}
                  <div className="flex justify-between gap-4">
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} className="relative flex-1 aspect-square max-w-[60px]">
                        <input
                          ref={otpRefs[index]}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={otp[index]}
                          onChange={(e) => handleDigitChange(index, e.target.value, otp, setOtp, otpRefs)}
                          onKeyDown={(e) => handleKeyDown(index, e, otp, otpRefs)}
                          onPaste={index === 0 ? (e) => handlePaste(e, setOtp, otpRefs) : undefined}
                          className={`
                            w-full h-full text-center text-2xl font-bold rounded-xl bg-gray-50/50 border border-gray-300 transition-all focus:outline-none
                            ${otp[index] ? "border-[#d1962a] ring-4 ring-[#d1962a]/15 text-[#001938]" : "border-gray-300"}
                            focus:border-[#d1962a] focus:ring-4 focus:ring-[#d1962a]/15
                          `}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="text-center">
                    {countdown > 0 ? (
                      <span className="text-xs font-semibold text-gray-500">
                        Resend OTP in <strong className="text-[#d1962a]">{countdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-xs font-black text-[#d1962a] hover:text-[#b88020] hover:underline transition-all"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Button
                    type="submit"
                    className={`
                      w-full py-7 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg
                      ${
                        loading || !isOtpComplete
                          ? "bg-gray-100 text-gray-400 border border-gray-300 shadow-none cursor-not-allowed"
                          : "bg-gradient-to-r from-[#d1962a] to-[#b88020] text-[#001938] hover:from-[#e0a234] hover:to-[#c68b25]"
                      }
                    `}
                    disabled={loading || !isOtpComplete}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Verify OTP</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </Button>

                  <div className="flex justify-center gap-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAuthMode("FORGOT_EMAIL")}
                      className="text-xs font-black text-[#d1962a] hover:text-[#b88020] hover:bg-[#d1962a]/5 transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      <span>Change Email</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAuthMode("LOGIN")}
                      className="text-xs font-black text-gray-500 hover:text-[#001938] hover:bg-gray-100 transition-all"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.form>
            )}

            {/* FORGOT PASSWORD: NEW PASSWORD SCREEN */}
            {authMode === "FORGOT_NEW_PASSWORD" && (
              <motion.form
                key="forgot-new-password"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleResetPasswordSubmit}
                className="space-y-6"
                noValidate
              >
                <div className="space-y-4">
                  {/* Enter New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#001938]/80 ml-1 flex items-center gap-1">
                      <KeyRound size={14} className="text-[#d1962a]" />
                      <span>Enter New Password</span>
                    </label>
                    <div className="relative flex items-center group">
                      <div className="absolute left-4 text-gray-400 group-focus-within:text-[#d1962a] transition-colors pointer-events-none">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Create strong password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (!newPasswordTouched) setNewPasswordTouched(true);
                        }}
                        onBlur={() => setNewPasswordTouched(true)}
                        autoFocus
                        className={`
                          w-full pl-12 pr-12 py-4 rounded-[12px] text-[#001938] text-sm font-semibold transition-all placeholder:text-gray-400 placeholder:font-normal
                          ${
                            newPasswordTouched && !isNewPasswordValid
                              ? "bg-red-50/30 border border-red-300 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-400"
                              : isNewPasswordValid
                              ? "bg-green-50/20 border border-green-400 focus:outline-none focus:ring-4 focus:ring-green-500/15 focus:border-green-500"
                              : "bg-gray-50/50 border border-gray-300 focus:outline-none focus:ring-4 focus:ring-[#d1962a]/10 focus:border-[#d1962a]"
                          }
                        `}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Live Password Strength Requirements */}
                    <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80 space-y-1.5 mt-2">
                      <p className="text-[11px] font-bold text-[#001938]/70 mb-1">Password Requirements:</p>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className={`flex items-center gap-1.5 font-medium ${newPasswordStrength.hasLength ? "text-green-600" : "text-gray-500"}`}>
                          {newPasswordStrength.hasLength ? <Check size={13} className="stroke-[3]" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-400 ml-1 mr-0.5" />}
                          <span>Min. 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-medium ${newPasswordStrength.hasUpper ? "text-green-600" : "text-gray-500"}`}>
                          {newPasswordStrength.hasUpper ? <Check size={13} className="stroke-[3]" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-400 ml-1 mr-0.5" />}
                          <span>1 Uppercase (A-Z)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-medium ${newPasswordStrength.hasNumber ? "text-green-600" : "text-gray-500"}`}>
                          {newPasswordStrength.hasNumber ? <Check size={13} className="stroke-[3]" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-400 ml-1 mr-0.5" />}
                          <span>1 Number (0-9)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-medium ${newPasswordStrength.hasSpecial ? "text-green-600" : "text-gray-500"}`}>
                          {newPasswordStrength.hasSpecial ? <Check size={13} className="stroke-[3]" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-400 ml-1 mr-0.5" />}
                          <span>1 Special char (!@#$...)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#001938]/80 ml-1 flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-[#d1962a]" />
                      <span>Confirm New Password</span>
                    </label>
                    <div className="relative flex items-center group">
                      <div className="absolute left-4 text-gray-400 group-focus-within:text-[#d1962a] transition-colors pointer-events-none">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (!confirmPasswordTouched) setConfirmPasswordTouched(true);
                        }}
                        onBlur={() => setConfirmPasswordTouched(true)}
                        className={`
                          w-full pl-12 pr-12 py-4 rounded-[12px] text-[#001938] text-sm font-semibold transition-all placeholder:text-gray-400 placeholder:font-normal
                          ${
                            confirmPasswordTouched && confirmPassword && !isConfirmPasswordValid
                              ? "bg-red-50/40 border border-red-400 focus:outline-none focus:ring-4 focus:ring-red-500/15 focus:border-red-500"
                              : confirmPassword && isConfirmPasswordValid
                              ? "bg-green-50/20 border border-green-400 focus:outline-none focus:ring-4 focus:ring-green-500/15 focus:border-green-500"
                              : "bg-gray-50/50 border border-gray-300 focus:outline-none focus:ring-4 focus:ring-[#d1962a]/10 focus:border-[#d1962a]"
                          }
                        `}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {confirmPasswordTouched && confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[11px] font-bold text-red-500 ml-1">Passwords do not match.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Button
                    type="submit"
                    className={`
                      w-full py-7 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg
                      ${
                        loading || !isNewPasswordValid || !isConfirmPasswordValid
                          ? "bg-gray-100 text-gray-400 border border-gray-300 shadow-none cursor-not-allowed"
                          : "bg-gradient-to-r from-[#d1962a] to-[#b88020] text-[#001938] hover:from-[#e0a234] hover:to-[#c68b25]"
                      }
                    `}
                    disabled={loading || !isNewPasswordValid || !isConfirmPasswordValid}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </Button>

                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAuthMode("LOGIN")}
                      className="text-xs font-black text-gray-500 hover:text-[#001938] hover:bg-gray-100 transition-all"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer info */}
        <div className="mt-10 text-center space-y-4">
          <p className="text-[#d1962a]/80 text-[10px] font-extrabold uppercase tracking-[0.2em]">
            SECURE ADMINISTRATIVE PORTAL
          </p>
          <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-white/50 uppercase tracking-widest">
            <span className="hover:text-[#d1962a] cursor-pointer transition-colors">Privacy Policy</span>
            <div className="w-1 h-1 rounded-full bg-[#d1962a]/40" />
            <span className="hover:text-[#d1962a] cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
