import { LucideIcon, Users, Shield, MapPin, Megaphone, Calendar, GraduationCap, BarChart3, Layers, Link2, Gift, Trophy, Medal, LayoutDashboard, UserCheck, Activity, CreditCard, Star, Globe } from "lucide-react";

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
  {
    title: "Categories", path: "/categories", icon: Layers, moduleId: "categories",
    children: [
      { title: "Main Categories", path: "/categories", moduleId: "categories" },
      { title: "Sub Categories", path: "/categories/sub", moduleId: "categories" },
      { title: "Referral Categories", path: "/categories/referrals", moduleId: "categories" },
    ],
  },
  { title: "Announcements", path: "/announcements", icon: Megaphone, moduleId: "announcements" },
  { title: "Events", path: "/events", icon: Calendar, moduleId: "events" },
  {
    title: "Trainings", icon: GraduationCap, moduleId: "trainings",
    children: [
      { title: "Trainings Management", path: "/trainings", moduleId: "trainings" },
      { title: "Training Categories", path: "/trainings/categories", moduleId: "trainings" },
    ],
  },
  {
    title: "Points", path: "/points", icon: Trophy, moduleId: "points",
    children: [
      { title: "Points Management", path: "/points", moduleId: "points" },
      { title: "Allocate Points", path: "/allocate-points", moduleId: "points" },
    ],
  },
  {
    title: "Awards", path: "/awards", icon: Medal, moduleId: "awards",
    children: [
      { title: "Awards Management", path: "/awards", moduleId: "awards" },
      { title: "Member Awards", path: "/awards/members", moduleId: "awards" },
    ],
  },
  { title: "Members", path: "/members", icon: UserCheck, moduleId: "members" },
  {
    title: "Activities", icon: Activity, moduleId: "activities",
    children: [
      { title: "Asks", path: "/activities/ask", moduleId: "activities" },
      { title: "Gives", path: "/activities/give", moduleId: "activities" },
      { title: "Posts", path: "/activities/post", moduleId: "activities" },
      { title: "Requirements", path: "/activities/requirement", moduleId: "activities" },
    ],
  },
  {
    title: "Spotlight",
    icon: Star,
    moduleId: "spotlight",
    children: [
      { title: "Spotlight Request", path: "/spotlight/requests", moduleId: "spotlight" },
      { title: "Spotlight Creation", path: "/spotlight", moduleId: "spotlight" },

    ],
  },
  { title: "Connections", path: "/connections", icon: Link2, moduleId: "connections" },
  { title: "Contributions", path: "/contributions", icon: Gift, moduleId: "contributions" },
  {
    title: "Reports", icon: BarChart3, moduleId: "reports",
    children: [
      { title: "Dashboard", path: "/reports", moduleId: "reports" },
      { title: "Report History", path: "/reports/history", moduleId: "reports" },
    ],
  },

  { title: "Plan & Subscription", path: "/subscription", icon: CreditCard, moduleId: "subscription" },
  { title: "Plans", path: "/plans", icon: Layers, moduleId: "plans" },
  { title: "Referrals", path: "/referrals", icon: Users, moduleId: "members" },
  { title: "Billings", path: "/billings", icon: CreditCard, moduleId: "members" },
];

