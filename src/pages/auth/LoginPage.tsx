import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Loader2, Globe, CheckCircle2, ChevronDown, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logoHorizontal from "@/assets/logo-horizontal.png";
import api from "@/services/api";

type AuthMode = "LOGIN" | "FORGOT_PIN_PHONE" | "FORGOT_PIN_OTP" | "FORGOT_PIN_NEW_PIN";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  
  // App-wide Auth mode
  const [authMode, setAuthMode] = useState<AuthMode>("LOGIN");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sign In inputs
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);

  // Forgot PIN: Phone Input
  const [forgotPhone, setForgotPhone] = useState("");

  // Forgot PIN: OTP input
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);

  // Forgot PIN: Reset PIN inputs
  const [newPin, setNewPin] = useState<string[]>(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState<string[]>(["", "", "", ""]);

  // Resend OTP countdown
  const [countdown, setCountdown] = useState(0);

  // Refs for focusing
  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const newPinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const confirmPinRefs = [
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

  // Helper to sync forgot phone with login phone initially
  const handleForgotPinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setForgotPhone(phone);
    setAuthMode("FORGOT_PIN_PHONE");
  };

  // Reusable input handlers
  const handlePhoneChange = (value: string, isForgot = false) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 10);
    if (isForgot) {
      setForgotPhone(cleaned);
    } else {
      setPhone(cleaned);
    }
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

  const isPhoneValid = phone.length === 10;
  const isForgotPhoneValid = forgotPhone.length === 10;
  const isPinComplete = pin.every(digit => digit !== "");
  const isOtpComplete = otp.every(digit => digit !== "");
  const isNewPinComplete = newPin.every(digit => digit !== "");
  const isConfirmPinComplete = confirmPin.every(digit => digit !== "");

  // LOGIN SUBMIT
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !isPinComplete || !isPhoneValid) return;

    setLoading(true);
    const pinString = pin.join("");
    const result = await login(phone, pinString);

    if (result.success) {
      setIsSuccess(true);
      toast({
        title: "Success",
        description: result.message,
        variant: "success"
      });
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 800);
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive"
      });
      setPin(["", "", "", ""]);
      pinRefs[0].current?.focus();
      setLoading(false);
    }
  };

  // FORGOT PHONE SUBMIT
  const handleForgotPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !isForgotPhoneValid) return;

    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-pin", {
        phoneNumber: forgotPhone
      });

      if (response.data.success) {
        toast({
          title: "OTP Sent",
          description: response.data.message || "OTP has been sent to your mobile number.",
          variant: "success"
        });
        setOtp(["", "", "", ""]);
        setAuthMode("FORGOT_PIN_OTP");
        setCountdown(60); // Resend interval
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to send OTP.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Something went wrong. Please check your phone number.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // OTP SUBMIT
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !isOtpComplete) return;

    setLoading(true);
    try {
      const otpString = otp.join("");
      const response = await api.post("/auth/verify-otp", {
        phoneNumber: forgotPhone,
        otp: otpString
      });

      if (response.data.success) {
        toast({
          title: "Verified",
          description: response.data.message || "OTP verified successfully.",
          variant: "success"
        });
        setNewPin(["", "", "", ""]);
        setConfirmPin(["", "", "", ""]);
        setAuthMode("FORGOT_PIN_NEW_PIN");
      } else {
        toast({
          title: "Error",
          description: response.data.message || "OTP verification failed.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Verification Failed",
        description: err.response?.data?.message || "Invalid or expired OTP.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // RESET PIN SUBMIT
  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !isNewPinComplete || !isConfirmPinComplete) return;

    const newPinString = newPin.join("");
    const confirmPinString = confirmPin.join("");

    if (newPinString !== confirmPinString) {
      toast({
        title: "PIN Mismatch",
        description: "New PIN and Confirm PIN do not match.",
        variant: "destructive"
      });
      setConfirmPin(["", "", "", ""]);
      confirmPinRefs[0].current?.focus();
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/reset-pin", {
        phoneNumber: forgotPhone,
        newPin: newPinString
      });

      if (response.data.success) {
        toast({
          title: "PIN Reset Successful",
          description: "Your PIN has been updated. Please sign in.",
          variant: "success"
        });
        setPhone(forgotPhone);
        setPin(["", "", "", ""]);
        setAuthMode("LOGIN");
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to reset PIN.",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Reset Failed",
        description: err.response?.data?.message || "Failed to reset your PIN. Please try again.",
        variant: "destructive"
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
        phoneNumber: forgotPhone
      });
      if (response.data.success) {
        toast({
          title: "OTP Resent",
          description: "A new OTP has been sent.",
          variant: "success"
        });
        setCountdown(60);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to resend OTP.",
        variant: "destructive"
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
          subtitle: "Enter your phone number and PIN to continue"
        };
      case "FORGOT_PIN_PHONE":
        return {
          title: "Forgot PIN",
          subtitle: "Enter your registered phone number to receive an OTP"
        };
      case "FORGOT_PIN_OTP":
        return {
          title: "Verify OTP",
          subtitle: `We've sent a 4-digit verification code to +91 ${forgotPhone}`
        };
      case "FORGOT_PIN_NEW_PIN":
        return {
          title: "Reset PIN",
          subtitle: "Create your new secure 4-digit login PIN"
        };
    }
  };

  const header = getHeaderContent();

  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

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
              <p className="text-gray-600 text-xs font-semibold">
                {header.subtitle}
              </p>
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
                className="space-y-8"
              >
                <div className="space-y-6">
                  {/* Phone Field */}
                  <div className="space-y-2">
                    <div className="relative flex items-center group">
                      <input
                        type="tel"
                        placeholder="Enter Phone Number"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        maxLength={10}
                        className="w-full px-6 py-4 rounded-[12px] bg-gray-50/50 border border-gray-300 text-[#001938] text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#d1962a]/10 focus:border-[#d1962a] transition-all placeholder:text-gray-400"
                      />
                      {isPhoneValid && (
                        <div className="absolute right-4 text-green-500">
                          <CheckCircle2 size={18} fill="currentColor" className="text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4-digit PIN */}
                  <div className="space-y-4">
                    <div className="flex justify-between gap-4">
                      {[0, 1, 2, 3].map((index) => (
                        <div key={index} className="relative flex-1 aspect-square max-w-[60px]">
                          <input
                            ref={pinRefs[index]}
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={pin[index]}
                            onChange={(e) => handleDigitChange(index, e.target.value, pin, setPin, pinRefs)}
                            onKeyDown={(e) => handleKeyDown(index, e, pin, pinRefs)}
                            onPaste={index === 0 ? (e) => handlePaste(e, setPin, pinRefs) : undefined}
                            className={`
                              w-full h-full text-center text-2xl font-bold rounded-xl bg-gray-50/50 border border-gray-300 transition-all focus:outline-none
                              ${pin[index] ? 'border-[#d1962a] ring-4 ring-[#d1962a]/15' : 'border-gray-300'}
                              focus:border-[#d1962a] focus:ring-4 focus:ring-[#d1962a]/15
                            `}
                          />
                          {pin[index] && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-3 h-3 bg-[#001938] rounded-full" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="text-center">
                      <a 
                        href="#" 
                        onClick={handleForgotPinClick}
                        className="text-xs font-black text-[#d1962a] hover:text-[#b88020] hover:underline transition-all"
                      >
                        Forgot PIN?
                      </a>
                    </div>
                  </div>
                </div>

                {/* Sign In Button */}
                <div className="space-y-4 pt-2">
                  <Button
                    type="submit"
                    className={`
                      w-full py-7 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg
                      ${loading || !isPinComplete || !isPhoneValid
                        ? 'bg-gray-50 text-gray-400 border border-gray-300 shadow-none cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#d1962a] to-[#b88020] text-[#001938] hover:from-[#e0a234] hover:to-[#c68b25]'}
                    `}
                    disabled={loading || !isPinComplete || !isPhoneValid}
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

            {/* FORGOT PIN: PHONE SCREEN */}
            {authMode === "FORGOT_PIN_PHONE" && (
              <motion.form
                key="forgot-phone"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleForgotPhoneSubmit}
                className="space-y-8"
              >
                <div className="space-y-6">
                  {/* Phone Field */}
                  <div className="space-y-2">
                    <div className="relative flex items-center group">
                      <input
                        type="tel"
                        placeholder="Enter Phone Number"
                        value={forgotPhone}
                        onChange={(e) => handlePhoneChange(e.target.value, true)}
                        maxLength={10}
                        className="w-full px-6 py-4 rounded-[12px] bg-gray-50/50 border border-gray-300 text-[#001938] text-sm font-black focus:outline-none focus:ring-4 focus:ring-[#d1962a]/10 focus:border-[#d1962a] transition-all placeholder:text-gray-400"
                      />
                      {isForgotPhoneValid && (
                        <div className="absolute right-4 text-green-500">
                          <CheckCircle2 size={18} fill="currentColor" className="text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Button
                    type="submit"
                    className={`
                      w-full py-7 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg
                      ${loading || !isForgotPhoneValid
                        ? 'bg-gray-50 text-gray-400 border border-gray-300 shadow-none cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#d1962a] to-[#b88020] text-[#001938] hover:from-[#e0a234] hover:to-[#c68b25]'}
                    `}
                    disabled={loading || !isForgotPhoneValid}
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

            {/* FORGOT PIN: OTP VERIFY SCREEN */}
            {authMode === "FORGOT_PIN_OTP" && (
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
                  {/* 4-digit OTP Inputs (show text digits for readability) */}
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
                            ${otp[index] ? 'border-[#d1962a] ring-4 ring-[#d1962a]/15 text-[#001938]' : 'border-gray-300'}
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
                      ${loading || !isOtpComplete
                        ? 'bg-gray-50 text-gray-400 border border-gray-300 shadow-none cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#d1962a] to-[#b88020] text-[#001938] hover:from-[#e0a234] hover:to-[#c68b25]'}
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
                      onClick={() => setAuthMode("FORGOT_PIN_PHONE")}
                      className="text-xs font-black text-[#d1962a] hover:text-[#b88020] hover:bg-[#d1962a]/5 transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      <span>Change Number</span>
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

            {/* FORGOT PIN: NEW PIN SCREEN */}
            {authMode === "FORGOT_PIN_NEW_PIN" && (
              <motion.form
                key="forgot-new-pin"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleResetPinSubmit}
                className="space-y-6"
              >
                <div className="space-y-4">
                  {/* Enter New PIN Section */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#001938] flex items-center gap-1">
                      <Lock size={12} className="text-[#d1962a]" />
                      <span>Enter New PIN</span>
                    </label>
                    <div className="flex justify-between gap-4">
                      {[0, 1, 2, 3].map((index) => (
                        <div key={index} className="relative flex-1 aspect-square max-w-[60px]">
                          <input
                            ref={newPinRefs[index]}
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={newPin[index]}
                            onChange={(e) => handleDigitChange(index, e.target.value, newPin, setNewPin, newPinRefs)}
                            onKeyDown={(e) => handleKeyDown(index, e, newPin, newPinRefs)}
                            onPaste={index === 0 ? (e) => handlePaste(e, setNewPin, newPinRefs) : undefined}
                            className={`
                              w-full h-full text-center text-2xl font-bold rounded-xl bg-gray-50/50 border border-gray-300 transition-all focus:outline-none
                              ${newPin[index] ? 'border-[#d1962a] ring-4 ring-[#d1962a]/15' : 'border-gray-300'}
                              focus:border-[#d1962a] focus:ring-4 focus:ring-[#d1962a]/15
                            `}
                          />
                          {newPin[index] && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-3 h-3 bg-[#001938] rounded-full" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confirm New PIN Section */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#001938] flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-[#d1962a]" />
                      <span>Confirm New PIN</span>
                    </label>
                    <div className="flex justify-between gap-4">
                      {[0, 1, 2, 3].map((index) => (
                        <div key={index} className="relative flex-1 aspect-square max-w-[60px]">
                          <input
                            ref={confirmPinRefs[index]}
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={confirmPin[index]}
                            onChange={(e) => handleDigitChange(index, e.target.value, confirmPin, setConfirmPin, confirmPinRefs)}
                            onKeyDown={(e) => handleKeyDown(index, e, confirmPin, confirmPinRefs)}
                            onPaste={index === 0 ? (e) => handlePaste(e, setConfirmPin, confirmPinRefs) : undefined}
                            className={`
                              w-full h-full text-center text-2xl font-bold rounded-xl bg-gray-50/50 border border-gray-300 transition-all focus:outline-none
                              ${confirmPin[index] ? 'border-[#d1962a] ring-4 ring-[#d1962a]/15' : 'border-gray-300'}
                              focus:border-[#d1962a] focus:ring-4 focus:ring-[#d1962a]/15
                            `}
                          />
                          {confirmPin[index] && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-3 h-3 bg-[#001938] rounded-full" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Button
                    type="submit"
                    className={`
                      w-full py-7 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg
                      ${loading || !isNewPinComplete || !isConfirmPinComplete
                        ? 'bg-gray-50 text-gray-400 border border-gray-300 shadow-none cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#d1962a] to-[#b88020] text-[#001938] hover:from-[#e0a234] hover:to-[#c68b25]'}
                    `}
                    disabled={loading || !isNewPinComplete || !isConfirmPinComplete}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Reset PIN</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </Button>
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







