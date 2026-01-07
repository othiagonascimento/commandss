import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { toast } from "sonner";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Tenants from "./pages/Tenants";
import TenantDetail from "./pages/TenantDetail";
import CreateTenant from "./pages/CreateTenant";
import NewContract from "./pages/NewContract";
import Users from "./pages/Users";
import Subscriptions from "./pages/Subscriptions";
import Settings from "./pages/Settings";
import FeatureFlags from "./pages/FeatureFlags";
import Broadcasts from "./pages/Broadcasts";
import InviteLinks from "./pages/InviteLinks";
import Templates from "./pages/Templates";
import TemplateEditor from "./pages/TemplateEditor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error('[QueryCache] Error:', error);
      const message = error instanceof Error ? error.message : 'Erro ao carregar dados';
      toast.error(message);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error('[MutationCache] Error:', error);
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
    mutations: {
      retry: 0,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/tenants" element={<ProtectedRoute><Tenants /></ProtectedRoute>} />
              <Route path="/tenants/new" element={<ProtectedRoute><CreateTenant /></ProtectedRoute>} />
              <Route path="/tenants/contract" element={<ProtectedRoute><NewContract /></ProtectedRoute>} />
              <Route path="/tenants/:id" element={<ProtectedRoute><TenantDetail /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/feature-flags" element={<ProtectedRoute><FeatureFlags /></ProtectedRoute>} />
              <Route path="/broadcasts" element={<ProtectedRoute><Broadcasts /></ProtectedRoute>} />
              <Route path="/invite-links" element={<ProtectedRoute><InviteLinks /></ProtectedRoute>} />
              <Route path="/admin/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
              <Route path="/admin/templates/new" element={<ProtectedRoute><TemplateEditor /></ProtectedRoute>} />
              <Route path="/admin/templates/:id" element={<ProtectedRoute><TemplateEditor /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
