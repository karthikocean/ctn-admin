import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/context/AuthContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { ProtectedRoute, PublicRoute, PermissionRoute } from "@/components/ProtectedRoute";
import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import RolesPage from "@/pages/roles/RolesPage";
import MembersPage from "@/pages/members/MembersPage";
import { AskPage, GivePage, PostPage, RequirementPage } from "@/pages/activities/ActivitiesPage";
import SpotlightPage from "@/pages/spotlight/SpotlightPage";
import SpotlightRequestsPage from "@/pages/spotlight/SpotlightRequestsPage";
import RegionsPage from "@/pages/regions/RegionsPage";
import FranchisesPage from "@/pages/regions/FranchisesPage";
import CategoriesPage from "@/pages/categories/CategoriesPage";
import { SubCategoriesPage } from "@/pages/categories/CategoriesPage";
import ReferralCategoriesPage from "@/pages/categories/ReferralCategoriesPage";
import AnnouncementsPage from "@/pages/announcements/AnnouncementsPage";
import BlogsPage from "@/pages/blogs/BlogsPage";
import TrainingsPage from "@/pages/trainings/TrainingsPage";
import TrainingCategoriesPage from "@/pages/trainings/TrainingCategoriesPage";
import PointsPage from "@/pages/points/PointsPage";
import AllocatePointsPage from "@/pages/points/AllocatePointsPage";
import AwardsPage from "@/pages/awards/AwardsPage";
import MemberAwardsPage from "@/pages/awards/MemberAwardsPage";
import ConnectionsPage from "@/pages/connections/ConnectionsPage";
import ContributionsPage from "@/pages/contributions/ContributionsPage";
import FranchiseCommissionReportPage from "@/pages/reports/FranchiseCommissionReportPage"; // Newly added report page
import ReportHistoryPage from "@/pages/reports/ReportHistoryPage";
import ReportsPage from "@/pages/reports/ReportsPage";

import SubscriptionPage from "@/pages/subscription/SubscriptionPage";
import PlansPage from "@/pages/plans/PlansPage";
import ReferralsPage from "@/pages/referrals/ReferralsPage";
import BillingsPage from "@/pages/billings/BillingsPage";
import CouponsPage from "@/pages/coupons/CouponsPage";
import MarketplaceCategoryPage from "@/pages/marketplace/MarketplaceCategoryPage";
import ModulesPage from "@/pages/modules/ModulesPage";
import HelpCenterPage from "@/pages/helpcenter/HelpCenterPage";
import NotFound from "@/pages/NotFound";
import { sidebarNavItems } from "@/config/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const LandingRoute = () => {
  const { hasPermission, isLoading } = useAuth();

  // Find target path helper
  const getFirstPermittedPath = () => {
    for (const item of sidebarNavItems) {
      if (!item.moduleId) continue;

      if (item.children) {
        const allowedChild = item.children.find(child => !child.moduleId || hasPermission(child.moduleId, "view"));
        if (allowedChild) return allowedChild.path;
      } else {
        if (hasPermission(item.moduleId, "view") && item.path) {
          return item.path;
        }
      }
    }
    return "";
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasPermission("dashboard", "view")) {
    return <DashboardPage />;
  }

  const fallbackPath = getFirstPermittedPath();
  if (fallbackPath) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Fallback if absolutely no permissions are granted
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl border border-border">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
      <p className="text-slate-500 max-w-xs">
        You do not have permission to view any dashboard or administrative modules.
      </p>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner richColors position="top-right" duration={2000} />

      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<LandingRoute />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/spotlight" element={
                <PermissionRoute module="spotlight_creation" action="view">
                  <SpotlightPage />
                </PermissionRoute>
              } />
              <Route path="/spotlight/requests" element={
                <PermissionRoute module="spotlight_request" action="view">
                  <SpotlightRequestsPage />
                </PermissionRoute>
              } />
              <Route path="/activities/ask" element={<AskPage />} />
              <Route path="/activities/give" element={<GivePage />} />
              <Route path="/activities/post" element={<PostPage />} />
              <Route path="/activities/requirement" element={<RequirementPage />} />
              <Route path="/regions" element={<RegionsPage />} />
              <Route path="/franchises" element={<FranchisesPage />} />
              <Route path="/categories" element={
                <PermissionRoute module="main_categories" action="view">
                  <CategoriesPage />
                </PermissionRoute>
              } />
              <Route path="/categories/sub" element={
                <PermissionRoute module="sub_categories" action="view">
                  <SubCategoriesPage />
                </PermissionRoute>
              } />
              <Route path="/categories/referrals" element={
                <PermissionRoute module="referral_categories" action="view">
                  <ReferralCategoriesPage />
                </PermissionRoute>
              } />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/trainings" element={<TrainingsPage />} />
              <Route path="/trainings/categories" element={
                <PermissionRoute module="training_categories" action="view">
                  <TrainingCategoriesPage />
                </PermissionRoute>
              } />
              <Route path="/points" element={<PointsPage />} />
              <Route path="/allocate-points" element={<AllocatePointsPage />} />
              <Route path="/allocate-points/edit/:id" element={<AllocatePointsPage />} />
              <Route path="/awards" element={<AwardsPage />} />
              <Route path="/awards/members" element={<MemberAwardsPage />} />
              <Route path="/connections" element={<ConnectionsPage />} />
              <Route path="/contributions" element={<ContributionsPage />} />
              <Route path="/reports" element={
                <PermissionRoute module="reports" action="view">
                  <ReportsPage />
                </PermissionRoute>
              } />
              <Route path="/reports/subscription-renewals" element={
                <PermissionRoute module="subscription_renewal_report" action="view">
                  <ReportsPage defaultTab="renewals" />
                </PermissionRoute>
              } />
              <Route path="/reports/free-subscription-endings" element={
                <PermissionRoute module="free_subscription_ending_report" action="view">
                  <ReportsPage defaultTab="free-endings" />
                </PermissionRoute>
              } />
              <Route path="/reports/franchise-commission" element={
                <PermissionRoute module="franchise_commission_report" action="view">
                  <FranchiseCommissionReportPage />
                </PermissionRoute>
              } />
              <Route path="/reports/history" element={
                <PermissionRoute module="report_history" action="view">
                  <ReportHistoryPage />
                </PermissionRoute>
              } />

              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="/plans" element={<PlansPage />} />
              <Route path="/referrals" element={<ReferralsPage />} />
              <Route path="/billings" element={<BillingsPage />} />
              <Route path="/coupons" element={
                <PermissionRoute module="coupons" action="view">
                  <CouponsPage />
                </PermissionRoute>
              } />
              <Route path="/marketplace-category" element={<MarketplaceCategoryPage />} />
              <Route path="/modules" element={
                <PermissionRoute module="modules" action="view">
                  <ModulesPage />
                </PermissionRoute>
              } />
              <Route path="/help-center" element={
                <PermissionRoute module="help_center" action="view">
                  <HelpCenterPage />
                </PermissionRoute>
              } />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
