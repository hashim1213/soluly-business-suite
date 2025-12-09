import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tickets from "./pages/Tickets";
import FeatureRequests from "./pages/FeatureRequests";
import CustomerQuotes from "./pages/CustomerQuotes";
import Feedback from "./pages/Feedback";
import Emails from "./pages/Emails";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
          <Route
            path="/projects"
            element={
              <AppLayout>
                <Projects />
              </AppLayout>
            }
          />
          <Route
            path="/tickets"
            element={
              <AppLayout>
                <Tickets />
              </AppLayout>
            }
          />
          <Route
            path="/tickets/features"
            element={
              <AppLayout>
                <FeatureRequests />
              </AppLayout>
            }
          />
          <Route
            path="/tickets/quotes"
            element={
              <AppLayout>
                <CustomerQuotes />
              </AppLayout>
            }
          />
          <Route
            path="/tickets/feedback"
            element={
              <AppLayout>
                <Feedback />
              </AppLayout>
            }
          />
          <Route
            path="/emails"
            element={
              <AppLayout>
                <Emails />
              </AppLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <AppLayout>
                <Settings />
              </AppLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
