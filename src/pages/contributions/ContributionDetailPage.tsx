import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, FileText, Phone, Mail, MapPin, Handshake, Users, Receipt, IndianRupee, Image as ImageIcon, CheckCircle2, MessageSquare } from "lucide-react";
import { getContributionDetails } from "@/api/ContributionsApi";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import StatusBadge from "@/components/common/StatusBadge";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const getFullUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_MEDIA_URL || "http://localhost:5001";
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

const formatType = (type: string) => {
  if (!type) return "";
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const ContributionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contribution, setContribution] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await getContributionDetails(id);
        if (response.success && response.data) {
          setContribution(response.data);
        } else {
          setError("Failed to load contribution details.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load contribution details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <GlobalNetworkLoader
        fullScreen={false}
        title="Loading Contribution..."
        subtitle="Retrieving value exchange metadata"
      />
    );
  }

  if (error || !contribution) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <FileText size={24} />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">Error</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">{error || "Contribution not found."}</p>
        <Button onClick={() => navigate("/contributions")} className="rounded-xl">
          <ArrowLeft size={16} className="mr-2" /> Back to Log
        </Button>
      </div>
    );
  }

  const isOneToOne = contribution.type === "one_to_one";
  const isThankYouSlip = contribution.type === "thank_you_slip";
  const isReferral = contribution.type === "referral";

  // Check if there are any notes/comments to display
  const hasComments = isThankYouSlip ? contribution.businessDetails : (isReferral ? contribution.referralDetails?.comments : false);

  return (
    <div className="page-container w-full max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/contributions")}
            className="rounded-xl border border-border bg-card hover:bg-secondary text-foreground hover:text-primary h-9 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              Contribution Details
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border bg-primary/5 text-primary border-primary/20">
                {formatType(contribution.type)}
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">Value exchange record details</p>
          </div>
        </div>
      </div>

      {/* Grid Layout using all free horizontal space */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main Section (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Member Connection Diagram */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6"
          >
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Users size={14} /> Network Connection
            </h3>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-primary/[0.02] border border-primary/5">
              {/* Giver Node */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-col sm:flex-row">
                  <Avatar className="w-12 h-12 border-2 border-background shadow-md">
                    <AvatarImage src={getFullUrl(contribution.sender?.profilePhoto)} alt={contribution.sender?.fullName} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-sm text-primary font-bold">
                      {contribution.sender?.fullName?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm text-foreground truncate">{contribution.sender?.fullName || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{contribution.sender?.businessName || "No Company"}</p>
                    <span className="inline-block text-[9px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded mt-1">Giver</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-muted-foreground w-full pt-2 border-t border-border/40 sm:border-0">
                  {contribution.sender?.mobileNumber && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Phone size={11} className="text-primary/70 shrink-0" />
                      <span>{contribution.sender.mobileNumber}</span>
                    </div>
                  )}
                  {contribution.sender?.email && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Mail size={11} className="text-primary/70 shrink-0" />
                      <span className="truncate max-w-[180px]">{contribution.sender.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dotted Flow Connector */}
              <div className="flex sm:flex-row flex-col items-center justify-center shrink-0 gap-1.5 py-2 w-full sm:w-auto">
                <div className="h-6 w-[2px] sm:h-[2px] sm:w-16 border-l-2 sm:border-l-0 sm:border-t-2 border-dashed border-primary/20" />
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary shadow-sm">
                  ➜
                </div>
                <div className="h-6 w-[2px] sm:h-[2px] sm:w-16 border-l-2 sm:border-l-0 sm:border-t-2 border-dashed border-primary/20" />
              </div>

              {/* Recipient Node */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-col sm:flex-row">
                  <Avatar className="w-12 h-12 border-2 border-background shadow-md">
                    <AvatarImage src={getFullUrl(contribution.receiver?.profilePhoto)} alt={contribution.receiver?.fullName} className="object-cover" />
                    <AvatarFallback className="bg-primary/5 text-sm text-primary/80 font-bold">
                      {contribution.receiver?.fullName?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm text-foreground truncate">{contribution.receiver?.fullName || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{contribution.receiver?.businessName || "No Company"}</p>
                    <span className="inline-block text-[9px] font-bold text-muted-foreground uppercase tracking-wider bg-secondary px-1.5 py-0.5 rounded mt-1">Recipient</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-muted-foreground w-full pt-2 border-t border-border/40 sm:border-0">
                  {contribution.receiver?.mobileNumber && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Phone size={11} className="text-primary/70 shrink-0" />
                      <span>{contribution.receiver.mobileNumber}</span>
                    </div>
                  )}
                  {contribution.receiver?.email && (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Mail size={11} className="text-primary/70 shrink-0" />
                      <span className="truncate max-w-[180px]">{contribution.receiver.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Memo & Comments Card */}
          {hasComments && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4"
            >
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare size={14} /> Comments & Memo
              </h3>
              <div className="p-4 rounded-2xl bg-primary/[0.01] border border-border text-sm text-foreground/80 font-medium whitespace-pre-line leading-relaxed">
                {isThankYouSlip ? contribution.businessDetails : contribution.referralDetails?.comments}
              </div>
            </motion.div>
          )}

          {/* Supporting Media (One to One) */}
          {isOneToOne && contribution.media && Array.isArray(contribution.media) && contribution.media.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4"
            >
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                <ImageIcon size={14} /> Verification Media / Photos
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {contribution.media.map((img: string, idx: number) => (
                  <a
                    key={idx}
                    href={getFullUrl(img)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-border shadow-sm bg-secondary hover:shadow-md transition-all duration-300"
                  >
                    <img
                      src={getFullUrl(img)}
                      alt={`One-to-One Media ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Section: Core Transaction Details & Metadata (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Transaction Core Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
          >
            {/* Small Banner Header */}
            <div className="p-4 bg-primary/[0.04] border-b border-border flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/15">
                {isOneToOne && <Handshake size={15} />}
                {isThankYouSlip && <IndianRupee size={15} />}
                {isReferral && <Users size={15} />}
              </div>
              <span className="text-xs font-black text-primary tracking-wide uppercase">
                {isThankYouSlip ? "Slip Details" : isReferral ? "Lead Info" : "Session Info"}
              </span>
            </div>

            {/* Thank You Slip Content */}
            {isThankYouSlip && (
              <div className="p-6 text-center space-y-2.5">
                <p className="text-[10px] font-extrabold text-primary/70 uppercase tracking-widest">Business Value Generated</p>
                <p className="text-3xl font-black text-primary tracking-tight">₹{contribution.amount?.toLocaleString() || 0}</p>
                <span className="inline-block text-[10px] font-bold text-primary bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/10 mt-1">
                  Exchange Realized
                </span>
              </div>
            )}

            {/* Referral Content */}
            {isReferral && (
              <div className="p-6 space-y-4">
                <div className="space-y-1 pb-3 border-b border-border/60">
                  <span className="text-muted-foreground font-bold uppercase tracking-wider text-[9px]">Contact Name</span>
                  <p className="font-extrabold text-sm text-foreground">{contribution.referralDetails?.referralName || "—"}</p>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-bold uppercase tracking-wider text-[9px]">Mobile Phone</span>
                    <p className="font-semibold text-foreground/90 flex items-center gap-1.5">
                      <Phone size={12} className="text-primary/70 shrink-0" />
                      {contribution.referralDetails?.referralMobile || "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-bold uppercase tracking-wider text-[9px]">Email Address</span>
                    <p className="font-semibold text-foreground/90 flex items-center gap-1.5 truncate">
                      <Mail size={12} className="text-primary/70 shrink-0" />
                      <span className="truncate">{contribution.referralDetails?.referralEmail || "—"}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-bold uppercase tracking-wider text-[9px]">Location</span>
                    <p className="font-semibold text-foreground/90 flex items-center gap-1.5">
                      <MapPin size={12} className="text-primary/70 shrink-0" />
                      {contribution.referralDetails?.location || "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* One to One Content */}
            {isOneToOne && (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                  <Handshake size={18} />
                </div>
                <p className="font-bold text-sm text-foreground mt-2">1-on-1 Session</p>
                <p className="text-xs text-muted-foreground">Successfully logged & verified.</p>
              </div>
            )}
          </motion.div>

          {/* Status & Metadata Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4"
          >
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-border pb-2">Slip Metadata</h3>

            <div className="space-y-3.5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Date Logged</span>
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar size={12} className="text-primary/75" />
                  {contribution.date ? format(new Date(contribution.date), "PPP") : "—"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pt-2 text-[10px] text-emerald-600 font-bold border-t border-border/50">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span>Security Stamp: System Verified</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContributionDetailPage;
