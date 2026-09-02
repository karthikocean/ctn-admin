import { LucideIcon, Users, Shield, MapPin, Megaphone, Calendar, FileText, GraduationCap, BarChart3, Layers, Link2, Gift, Trophy, Medal, LayoutDashboard, UserCheck, Activity, CreditCard, Star, Globe, Ticket, ShoppingBag, HelpCircle, Headset } from "lucide-react";

export interface SidebarNavItem {
  title: string;
  path?: string;
  icon: LucideIcon;
  moduleId?: string;
  children?: { title: string; path: string; moduleId?: string }[];
}

export const sidebarNavItems: SidebarNavItem[] = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard, moduleId: "dashboard" },
  { title: "User Roles & Permissions", path: "/roles", icon: Shield, moduleId: "roles_permissions" },
  { title: "Business Regions", path: "/regions", icon: MapPin, moduleId: "business_regions" },
  { title: "Franchises", path: "/franchises", icon: Globe, moduleId: "franchises" },
  { title: "Franchise Applications", path: "/franchise-applications", icon: FileText, moduleId: "franchise_applications" },
  {
    title: "Categories", path: "/categories", icon: Layers, moduleId: "categories",
    children: [
      { title: "Main Categories", path: "/categories", moduleId: "main_categories" },
      { title: "Sub Categories", path: "/categories/sub", moduleId: "sub_categories" },
      { title: "Referral Categories", path: "/categories/referrals", moduleId: "referral_categories" },
    ],
  },
  { title: "Announcements", path: "/announcements", icon: Megaphone, moduleId: "announcements" },
  { title: "Blogs", path: "/blogs", icon: FileText, moduleId: "blogs" },
  {
    title: "Trainings", icon: GraduationCap, moduleId: "trainings",
    children: [
      { title: "Trainings Management", path: "/trainings", moduleId: "trainings" },
      { title: "Training Categories", path: "/trainings/categories", moduleId: "training_categories" },
    ],
  },
  {
    title: "Points", path: "/points", icon: Trophy, moduleId: "points",
    children: [
      { title: "Points Management", path: "/points", moduleId: "points" },
      { title: "Allocate Points", path: "/allocate-points", moduleId: "points" },
    ],
  },
  // {
  //   title: "Awards", path: "/awards", icon: Medal, moduleId: "awards",
  //   children: [
  //     { title: "Awards Management", path: "/awards", moduleId: "awards" },
  //     { title: "Member Awards", path: "/awards/members", moduleId: "awards" },
  //   ],
  // },
  { title: "Members", path: "/members", icon: UserCheck, moduleId: "members" },
  {
    title: "Activities", icon: Activity, moduleId: "activities",
    children: [
      { title: "Asks", path: "/activities/ask", moduleId: "asks" },
      { title: "Gives", path: "/activities/give", moduleId: "gives" },
      { title: "Posts", path: "/activities/post", moduleId: "posts" },
      { title: "Requirements", path: "/activities/requirement", moduleId: "requirements" },
    ],
  },
  {
    title: "Spotlight",
    icon: Star,
    moduleId: "spotlight",
    children: [
      { title: "Spotlight Request", path: "/spotlight/requests", moduleId: "spotlight_request" },
      { title: "Spotlight Creation", path: "/spotlight", moduleId: "spotlight_creation" },
    ],
  },
  { title: "Connections", path: "/connections", icon: Link2, moduleId: "connections" },
  { title: "Contributions", path: "/contributions", icon: Gift, moduleId: "contributions" },
  {
    title: "Reports", icon: BarChart3, moduleId: "reports",
    children: [
      { title: "Subscription Renewal Report", path: "/reports/subscription-renewals", moduleId: "subscription_renewal_report" },
      { title: "Free Subscription Ending Report", path: "/reports/free-subscription-endings", moduleId: "free_subscription_ending_report" },
      { title: "Franchise Commission Report", path: "/reports/franchise-commission", moduleId: "franchise_commission_report" },
      { title: "Report History", path: "/reports/history", moduleId: "report_history" },
    ],
  },

  { title: "Plans", path: "/plans", icon: Layers, moduleId: "plans" },
  { title: "Referrals", path: "/referrals", icon: Users, moduleId: "referral" },
  { title: "Billings", path: "/billings", icon: CreditCard, moduleId: "billings" },
  { title: "Coupons", path: "/coupons", icon: Ticket, moduleId: "coupons" },
  // { title: "Marketplace Category", path: "/marketplace-category", icon: ShoppingBag, moduleId: "marketplace_category" },
  { title: "Help Center", path: "/help-center", icon: HelpCircle, moduleId: "help_center" },
  { title: "Enquiries", path: "/enquiries", icon: HelpCircle, moduleId: "enquiries" },
  { title: "Support", path: "/support", icon: Headset, moduleId: "support" },
  { title: "Modules", path: "/modules", icon: Layers, moduleId: "modules" },
];

