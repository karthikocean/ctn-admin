import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import RegionsPage from "@/pages/regions/RegionsPage";
import CategoriesPage from "@/pages/categories/CategoriesPage";
import { SubCategoriesPage } from "@/pages/categories/CategoriesPage";
import ReferralCategoriesPage from "@/pages/categories/ReferralCategoriesPage";
import AnnouncementsPage from "@/pages/announcements/AnnouncementsPage";
import EventsPage from "@/pages/events/EventsPage";
import TrainingsPage from "@/pages/trainings/TrainingsPage";
import PointsPage from "@/pages/points/PointsPage";
import AllocatePointsPage from "@/pages/points/AllocatePointsPage";
import AwardsPage from "@/pages/awards/AwardsPage";
import MemberAwardsPage from "@/pages/awards/MemberAwardsPage";
import ConnectionsPage from "@/pages/connections/ConnectionsPage";
import ContributionsPage from "@/pages/contributions/ContributionsPage";
import ReportsPage from "@/pages/reports/ReportsPage";
import SubscriptionPage from "@/pages/subscription/SubscriptionPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

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
              <Route path="/" element={<DashboardPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/spotlight" element={
                <PermissionRoute module="spotlight" action="view">
                  <SpotlightPage />
                </PermissionRoute>
              } />
              <Route path="/activities/ask" element={<AskPage />} />
              <Route path="/activities/give" element={<GivePage />} />
              <Route path="/activities/post" element={<PostPage />} />
              <Route path="/activities/requirement" element={<RequirementPage />} />
              <Route path="/regions" element={<RegionsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/sub" element={<SubCategoriesPage />} />
              <Route path="/categories/referrals" element={<ReferralCategoriesPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/trainings" element={<TrainingsPage />} />
              <Route path="/points" element={<PointsPage />} />
              <Route path="/allocate-points" element={<AllocatePointsPage />} />
              <Route path="/allocate-points/edit/:id" element={<AllocatePointsPage />} />
              <Route path="/awards" element={<AwardsPage />} />
              <Route path="/awards/members" element={<MemberAwardsPage />} />
              <Route path="/connections" element={<ConnectionsPage />} />
              <Route path="/contributions" element={<ContributionsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
