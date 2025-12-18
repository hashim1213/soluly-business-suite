import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PostHogProvider } from "@/contexts/PostHogContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { OrgGuard } from "@/components/auth/OrgGuard";
import { OrgRedirect } from "@/components/auth/OrgRedirect";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Auth pages
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import AcceptInvite from "./pages/auth/AcceptInvite";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// App pages
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Tickets from "./pages/Tickets";
import TicketDetail from "./pages/TicketDetail";
import TeamMembers from "./pages/TeamMembers";
import TeamMemberDetail from "./pages/TeamMemberDetail";
import CRM from "./pages/CRM";
import FeatureRequests from "./pages/FeatureRequests";
import FeatureRequestDetail from "./pages/FeatureRequestDetail";
import CustomerQuotes from "./pages/CustomerQuotes";
import QuoteDetail from "./pages/QuoteDetail";
import Feedback from "./pages/Feedback";
import FeedbackDetail from "./pages/FeedbackDetail";
import Issues from "./pages/Issues";
import Emails from "./pages/Emails";
import Settings from "./pages/Settings";
import GmailCallback from "./pages/GmailCallback";
import Financials from "./pages/Financials";
import BusinessCosts from "./pages/BusinessCosts";
import Forms from "./pages/Forms";
import FormBuilder from "./pages/FormBuilder";
import FormResponses from "./pages/FormResponses";
import FormSubmit from "./pages/public/FormSubmit";
import ContactDetail from "./pages/ContactDetail";
import ClientDetail from "./pages/ClientDetail";
import Reports from "./pages/Reports";
import Projections from "./pages/Projections";
import NotFound from "./pages/NotFound";

// Configure QueryClient with better defaults for stability
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry failed queries aggressively - prevents freeze loops
      retry: 1,
      retryDelay: 1000,
      // Keep data fresh for 30 seconds
      staleTime: 30 * 1000,
      // Cache data for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Don't refetch on window focus by default (prevents unnecessary requests)
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect automatically
      refetchOnReconnect: false,
    },
    mutations: {
      // Don't retry mutations
      retry: 0,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <PostHogProvider>
              <Routes>
            {/* Public landing page */}
            <Route path="/welcome" element={<Landing />} />

            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/invite/:token" element={<AcceptInvite />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* OAuth callback routes */}
            <Route path="/auth/gmail/callback" element={<GmailCallback />} />

            {/* Public form submission */}
            <Route path="/f/:token" element={<FormSubmit />} />

            {/* Root - Landing for guests, workspace for authenticated */}
            <Route path="/" element={<OrgRedirect />} />

            {/* Organization-scoped protected routes */}
            <Route path="/org/:slug" element={<OrgGuard />}>
              <Route element={<AuthGuard />}>
                <Route
                  index
                  element={
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  }
                />
                <Route
                  path="projects"
                  element={
                    <AppLayout>
                      <Projects />
                    </AppLayout>
                  }
                />
                <Route
                  path="projects/:projectId"
                  element={
                    <AppLayout>
                      <ProjectDetail />
                    </AppLayout>
                  }
                />
                <Route
                  path="tickets"
                  element={
                    <AppLayout>
                      <Tickets />
                    </AppLayout>
                  }
                />
                <Route
                  path="tickets/:ticketId"
                  element={
                    <AppLayout>
                      <TicketDetail />
                    </AppLayout>
                  }
                />
                <Route
                  path="team"
                  element={
                    <AppLayout>
                      <TeamMembers />
                    </AppLayout>
                  }
                />
                <Route
                  path="team/:memberId"
                  element={
                    <AppLayout>
                      <TeamMemberDetail />
                    </AppLayout>
                  }
                />
                <Route
                  path="crm"
                  element={
                    <AppLayout>
                      <CRM />
                    </AppLayout>
                  }
                />
                <Route
                  path="contacts/:contactId"
                  element={
                    <AppLayout>
                      <ContactDetail />
                    </AppLayout>
                  }
                />
                <Route
                  path="clients/:clientId"
                  element={
                    <AppLayout>
                      <ClientDetail />
                    </AppLayout>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <AppLayout>
                      <Reports />
                    </AppLayout>
                  }
                />
                <Route
                  path="tickets/features"
                  element={
                    <AppLayout>
                      <FeatureRequests />
                    </AppLayout>
                  }
                />
                <Route
                  path="features/:featureId"
                  element={
                    <AppLayout>
                      <FeatureRequestDetail />
                    </AppLayout>
                  }
                />
                <Route
                  path="tickets/quotes"
                  element={
                    <AppLayout>
                      <CustomerQuotes />
                    </AppLayout>
                  }
                />
                <Route
                  path="quotes/:quoteId"
                  element={
                    <AppLayout>
                      <QuoteDetail />
                    </AppLayout>
                  }
                />
                <Route
                  path="tickets/feedback"
                  element={
                    <AppLayout>
                      <Feedback />
                    </AppLayout>
                  }
                />
                <Route
                  path="feedback/:feedbackId"
                  element={
                    <AppLayout>
                      <FeedbackDetail />
                    </AppLayout>
                  }
                />
                <Route
                  path="tickets/issues"
                  element={
                    <AppLayout>
                      <Issues />
                    </AppLayout>
                  }
                />
                <Route
                  path="emails"
                  element={
                    <AppLayout>
                      <Emails />
                    </AppLayout>
                  }
                />
                <Route
                  path="financials"
                  element={
                    <AppLayout>
                      <Financials />
                    </AppLayout>
                  }
                />
                <Route
                  path="expenses"
                  element={
                    <AppLayout>
                      <BusinessCosts />
                    </AppLayout>
                  }
                />
                <Route
                  path="projections"
                  element={
                    <AppLayout>
                      <Projections />
                    </AppLayout>
                  }
                />
                <Route
                  path="forms"
                  element={
                    <AppLayout>
                      <Forms />
                    </AppLayout>
                  }
                />
                <Route
                  path="forms/:displayId"
                  element={
                    <AppLayout>
                      <FormBuilder />
                    </AppLayout>
                  }
                />
                <Route
                  path="forms/:displayId/responses"
                  element={
                    <AppLayout>
                      <FormResponses />
                    </AppLayout>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <AppLayout>
                      <Settings />
                    </AppLayout>
                  }
                />
              </Route>
            </Route>

            {/* Legacy routes - redirect to org-scoped routes */}
            <Route element={<AuthGuard />}>
              <Route path="/projects" element={<OrgRedirect />} />
              <Route path="/tickets" element={<OrgRedirect />} />
              <Route path="/team" element={<OrgRedirect />} />
              <Route path="/crm" element={<OrgRedirect />} />
              <Route path="/settings" element={<OrgRedirect />} />
            </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
              </PostHogProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
    <Analytics />
  </ErrorBoundary>
);

export default App;
