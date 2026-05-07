import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Loader2, Globe, CheckCircle2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 10);
    setPhone(cleaned);
  };

  const handlePinChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);

    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    const newPin = [...pin];
    pastedData.split("").forEach((digit, i) => {
      if (i < 4) newPin[i] = digit;
    });
    setPin(newPin);

    const lastIndex = Math.min(pastedData.length, 3);
    inputRefs[lastIndex]?.current?.focus();
  };

  const isPinComplete = pin.every(digit => digit !== "");
  const isPhoneValid = phone.length === 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !isPinComplete || !isPhoneValid) return;

    setLoading(true);
    
    const pinString = pin.join("");
    const success = await login(phone, pinString);

    if (success) {
      setIsSuccess(true);
      toast.success("Login successful! Redirecting...");
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 800);
    } else {
      toast.error("Invalid phone number or PIN. Please try again.");
      setPin(["", "", "", ""]);
      inputRefs[0].current?.focus();
      setLoading(false);
    }

  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0d2b6b]">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d2b6b] to-[#0a1f5c]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[480px] p-6"
      >
        {/* Main Card */}
        <div className="bg-[#f4f5f7] rounded-[20px] shadow-2xl p-10 md:p-12 border border-white/20">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#0a1f5c] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Globe className="text-white w-10 h-10" />
            </div>
            
            <div className="text-center space-y-2">
              <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">CREATE TRUSTED NETWORK</span>
              <h1 className="text-3xl font-bold text-[#0a1f5c] tracking-tight">Sign In</h1>
              <p className="text-gray-400 text-sm font-medium">
                Enter your phone number and PIN to continue
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
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
                    className="w-full px-6 py-4 rounded-[12px] bg-white border border-gray-100 text-[#0a1f5c] text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-gray-300"
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
                        ref={inputRefs[index]}
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={pin[index]}
                        onChange={(e) => handlePinChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        className={`
                          w-full h-full text-center text-2xl font-bold rounded-xl bg-white border transition-all focus:outline-none
                          ${pin[index] ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-gray-200'}
                          focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                        `}
                      />
                      {pin[index] && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-3 h-3 bg-[#0a1f5c] rounded-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="text-center">
                  <a href="#" className="text-sm font-bold text-[#0a1f5c] hover:underline transition-all">
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
                    ? 'bg-gray-300 text-gray-500 shadow-none cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#0d2b6b] to-[#0a1f5c] text-white hover:shadow-blue-900/20'}
                `}
                disabled={loading || !isPinComplete || !isPhoneValid}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSuccess ? (
                  <div className="flex items-center gap-2 text-green-200">
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
              
              <div className="text-center">
                <p className="text-xs font-bold text-gray-400 tracking-wide cursor-pointer hover:text-[#0a1f5c] transition-colors">
                  New to Globe Connect? <span className="text-[#0a1f5c]">Register Now</span>
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-10 text-center space-y-4">
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
            SECURE ADMINISTRATIVE PORTAL
          </p>
          <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-white/30 uppercase tracking-widest">
            <span className="hover:text-white/60 cursor-pointer">Privacy Policy</span>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span className="hover:text-white/60 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;






