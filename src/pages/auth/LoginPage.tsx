import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Loader2, Globe, CheckCircle2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logoHorizontal from "@/assets/logo-horizontal.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
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
      inputRefs[0].current?.focus();
      setLoading(false);
    }

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
        {/* Main Card */}
        <div className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-10 md:p-12 border border-gray-100">

          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-full max-w-[280px] h-16 flex items-center justify-center mb-5">
              <img src={logoHorizontal} alt="Trusted Network Logo" className="w-full h-full object-contain" />
            </div>

            <div className="text-center space-y-1.5">
              <h1 className="text-2xl font-black text-[#001938] tracking-tight">Sign In</h1>
              <p className="text-gray-600 text-xs font-semibold">
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
                  <a href="#" className="text-xs font-black text-[#d1962a] hover:text-[#b88020] hover:underline transition-all">
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

              <div className="text-center">
                <p className="text-xs font-semibold text-gray-600 tracking-wide cursor-pointer hover:text-[#001938] transition-colors">
                  New to Globe Connect? <span className="text-[#d1962a] font-black hover:underline">Register Now</span>
                </p>
              </div>
            </div>
          </form>
        </div>

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






