import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Zap, Check, Star, ShieldCheck, Rocket, Info, ChevronRight, ArrowRight, Plus, Pencil, Trash2, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import FormDrawer from "@/components/common/FormDrawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const initialPlans = [
  {
    id: "basic",
    name: "Basic",
    description: "Essential features for individuals",
    price: 0,
    icon: "Rocket",
    theme: "slate",
    features: [
      { label: "Connections per day", value: "10" },
      { label: "Follows", value: "5" },
      { label: "Requirements", value: "5" },
      { label: "Requests Created", value: "3" },
      { label: "Responses Allowed", value: "1" },
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    id: "intermediate",
    name: "Intermediate",
    description: "Power tools for professionals",
    price: 29,
    icon: "Zap",
    theme: "primary",
    popular: true,
    features: [
      { label: "Connections per day", value: "20" },
      { label: "Follows", value: "10" },
      { label: "Requirements", value: "10" },
      { label: "Requests Created", value: "6" },
      { label: "Responses Allowed", value: "2" },
    ],
    cta: "Upgrade Now",
    disabled: false,
  },
  {
    id: "premium",
    name: "Premium",
    description: "The ultimate networking experience",
    price: 99,
    icon: "Star",
    theme: "amber",
    features: [
      { label: "Connections per day", value: "40" },
      { label: "Follows", value: "20" },
      { label: "Requirements", value: "20" },
      { label: "Requests Created", value: "12" },
      { label: "Responses Allowed", value: "4" },
    ],
    cta: "Go Premium",
    disabled: false,
  },
];

const SubscriptionPage = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState(() => {
    const stored = localStorage.getItem("subscriptionPlans");
    return stored ? JSON.parse(stored) : initialPlans;
  });
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({
    name: "",
    description: "",
    price: 0,
    icon: "Zap",
    theme: "slate",
    popular: false,
    features: [
      { label: "Connections per day", value: "" },
      { label: "Follows", value: "" },
      { label: "Requirements", value: "" },
      { label: "Requests Created", value: "" },
      { label: "Responses Allowed", value: "" },
    ]
  });

  useEffect(() => {
    localStorage.setItem("subscriptionPlans", JSON.stringify(plans));
  }, [plans]);

  const handleOpenDrawer = (plan: any | null = null) => {
    setFormError(null);
    if (plan) {
      setEditingPlan(plan);
      setFormData({ ...plan });
    } else {
      setEditingPlan(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        icon: "Zap",
        theme: "slate",
        popular: false,
        features: [
          { label: "Connections per day", value: "" },
          { label: "Follows", value: "" },
          { label: "Requirements", value: "" },
          { label: "Requests Created", value: "" },
          { label: "Responses Allowed", value: "" },
        ]
      });
    }
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.description) {
      setFormError("Plan name and description are required.");
      return;
    }
    setFormError(null);

    if (editingPlan) {
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...p, ...formData } : p));
      toast({ title: "Updated", description: "Subscription plan updated successfully." });
    } else {
      const newPlan = {
        ...formData,
        id: `plan-${Date.now()}`,
        cta: "Upgrade Now",
        disabled: false
      };
      setPlans(prev => [...prev, newPlan]);
      toast({ title: "Created", description: "New subscription plan added." });
    }
    setDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
    toast({ title: "Deleted", description: "Subscription plan removed." });
  };

  const handleAction = (planId: string) => {
    setLoadingPlan(planId);
    setTimeout(() => setLoadingPlan(null), 1500);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Rocket": return <Rocket className="w-5 h-5" />;
      case "Star": return <Star className="w-5 h-5" />;
      case "Zap":
      default: return <Zap className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-20 overflow-x-hidden">
      <TooltipProvider>
        {/* Header Section */}
        <div className="relative mb-12 pt-8">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 backdrop-blur-sm">
                <ShieldCheck size={14} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Strategic Billing Control</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                Plans & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Subscriptions</span>
              </h1>
              <p className="text-sm text-slate-700 dark:text-slate-200 max-w-xl font-semibold leading-relaxed">
                Define the architecture of your business growth. Configure tier pricing, specialized feature limits, and popular highlights.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-4 w-full lg:w-auto">
              <div className="bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-md flex items-center gap-1 shadow-sm">
                <button 
                  onClick={() => setIsYearly(false)}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all duration-300 ${!isYearly ? 'bg-white dark:bg-slate-700 shadow-md text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setIsYearly(true)}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all duration-300 flex items-center gap-2 ${isYearly ? 'bg-white dark:bg-slate-700 shadow-md text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
                >
                  Yearly
                  <span className="bg-primary/10 text-primary text-[8px] font-black px-1 py-0.5 rounded-sm uppercase italic">Save 20%</span>
                </button>
              </div>

              <Button
                onClick={() => handleOpenDrawer()}
                className="w-full sm:w-auto h-12 rounded-xl bg-slate-900 hover:bg-primary text-white font-bold px-6 shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-95 group"
              >
                <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Add Plan
              </Button>
            </div>
          </div>
        </div>

        {/* Responsive Grid System - 3 Desktop, 2 Tablet, 1 Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {plans.map((plan: any) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                group relative flex flex-col p-8 rounded-2xl transition-all duration-500 w-full min-w-0 h-full
                ${plan.popular 
                  ? 'bg-slate-900 text-white shadow-2xl ring-1 ring-slate-800' 
                  : 'bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-lg hover:border-primary/40'
                }
              `}
            >
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <button 
                  onClick={() => handleOpenDrawer(plan)}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${plan.popular ? 'bg-white/10 hover:bg-white text-white hover:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 hover:bg-primary text-slate-600 dark:text-slate-400 hover:text-white'}`}
                >
                  <Pencil size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(plan.id)}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${plan.popular ? 'bg-white/10 hover:bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-red-500 text-slate-600 dark:text-slate-400 hover:text-white'}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {plan.popular && (
                <div className="mb-6">
                  <Badge className="bg-primary text-white border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-primary/20">
                    Featured Tier
                  </Badge>
                </div>
              )}

              <div className="mb-8">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-md ${
                  plan.popular 
                    ? 'bg-primary text-white shadow-primary/20' 
                    : plan.theme === 'amber' 
                      ? 'bg-amber-100 text-amber-600 shadow-amber-50' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold'
                }`}>
                  {getIcon(plan.icon)}
                </div>
                <h3 className="text-xl font-black mb-1 uppercase tracking-tight">{plan.name}</h3>
                <p className={`text-xs font-semibold leading-relaxed ${plan.popular ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-black tracking-tight ${plan.popular ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    ₹{isYearly ? Math.floor(plan.price * 0.8 * 12) : plan.price}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${plan.popular ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    /{isYearly ? 'yearly' : 'monthly'}
                  </span>
                </div>
              </div>

              <div className={`h-px w-full mb-8 ${plan.popular ? 'bg-slate-800' : 'bg-slate-100 dark:bg-slate-800'}`} />

              <div className="flex-grow space-y-5 mb-10">
                {plan.features.map((feature: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                        plan.popular ? 'bg-primary/20 text-primary' : 'bg-primary/5 text-primary dark:bg-primary/10'
                      }`}>
                        <Check size={10} className="stroke-[4]" />
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-tight ${
                        plan.popular ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {feature.label}
                      </span>
                    </div>
                    <span className={`text-sm font-black tabular-nums ${plan.popular ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {feature.value}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                disabled={plan.disabled}
                onClick={() => handleAction(plan.id)}
                className={`
                  w-full h-12 rounded-xl font-black text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-lg active:scale-95
                  ${plan.disabled 
                    ? 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 border-2 border-slate-300 dark:border-slate-700 cursor-default shadow-none pointer-events-none' 
                    : plan.popular 
                      ? 'bg-primary hover:bg-white text-white hover:text-primary' 
                      : 'bg-slate-900 hover:bg-primary text-white'}
                `}
              >
                {loadingPlan === plan.id ? "..." : (
                  <div className="flex items-center justify-center gap-2">
                    {plan.cta}
                    {!plan.disabled && <ArrowRight size={18} />}
                  </div>
                )}
              </Button>
            </motion.div>
          ))}
        </div>
      </TooltipProvider>

      {/* CRUD Form Drawer */}
      <FormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingPlan ? "Modify Strategy" : "Define New Strategy"}
        description={editingPlan ? "Optimize the core parameters for this growth tier" : "Engineer a new subscription experience for your network"}
      >
        <div className="space-y-8 pb-12">
          {formError && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-600 text-white px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl flex flex-col gap-1">
              <span className="opacity-90">Architecture Error</span>
              {formError}
            </motion.div>
          )}

          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap size={16} className="text-primary" />
              </div>
              <h3 className="text-[11px] font-black text-slate-950 dark:text-white uppercase tracking-[0.2em]">Primary Config</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-700 dark:text-slate-200">Strategy Nomenclature</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., QUANTUM, ENTERPRISE, SCALE"
                  className="h-12 rounded-2xl border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm font-bold focus:ring-primary/20" 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-700 dark:text-slate-200">Value Proposition</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Summarize the core impact of this tier..."
                  className="rounded-2xl border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm font-medium min-h-[100px] leading-relaxed" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-700 dark:text-slate-200">Base Unit Price</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                    <Input 
                      type="number"
                      value={formData.price} 
                      onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                      className="h-12 pl-8 rounded-2xl border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 font-black text-lg" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-slate-700 dark:text-slate-200">Visual Symbol</Label>
                  <select 
                    value={formData.icon}
                    onChange={(e) => setFormData({...formData, icon: e.target.value})}
                    className="w-full h-12 rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Zap">⚡ Lightning Bolt</option>
                    <option value="Rocket">🚀 Rocket Launch</option>
                    <option value="Star">✨ Premium Star</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <LayoutGrid size={16} className="text-amber-700" />
              </div>
              <h3 className="text-[11px] font-black text-slate-950 dark:text-white uppercase tracking-[0.2em]">Operational Limits</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4 bg-slate-100/50 dark:bg-slate-800/20 p-6 rounded-[32px] border border-slate-200 dark:border-slate-700">
              {formData.features.map((feature: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <div className="flex-grow">
                    <span className="text-[9px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-1 block">{feature.label}</span>
                    <Input 
                      value={feature.label} 
                      readOnly
                      className="h-9 rounded-xl bg-white dark:bg-slate-900 border-none text-[11px] font-bold text-slate-600 dark:text-slate-400" 
                    />
                  </div>
                  <div className="w-24">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 block text-right">Limit</span>
                    <Input 
                      value={feature.value} 
                      onChange={(e) => {
                        const newFeatures = [...formData.features];
                        newFeatures[idx].value = e.target.value;
                        setFormData({...formData, features: newFeatures});
                      }}
                      placeholder="∞"
                      className="h-9 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-right font-black text-xs focus:ring-primary/20" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div 
            onClick={() => setFormData({...formData, popular: !formData.popular})}
            className={`flex items-center justify-between p-6 rounded-[32px] border cursor-pointer transition-all duration-300 ${formData.popular ? 'bg-primary/10 border-primary/30' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${formData.popular ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                <Star size={18} fill={formData.popular ? "currentColor" : "none"} />
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">Highlight Achievement</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Mark as the most popular recommendation</p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${formData.popular ? 'border-primary bg-primary text-white' : 'border-slate-300'}`}>
              {formData.popular && <Check size={12} className="stroke-[4]" />}
            </div>
          </div>

          <Button 
            onClick={handleSave}
            className="w-full h-16 rounded-[24px] bg-primary hover:bg-primary/90 text-white dark:bg-white dark:text-primary dark:hover:bg-slate-100 font-black text-sm uppercase tracking-widest shadow-2xl transition-all duration-300 active:scale-95 mt-4"
          >
            {editingPlan ? "Apply Configuration Update" : "Deploy Strategy Tier"}
          </Button>
        </div>
      </FormDrawer>
    </div>
  );
};

export default SubscriptionPage;
