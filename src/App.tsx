import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load heavy pages for better initial load performance
const Tenants = lazy(() => import("./pages/Tenants"));
const TenantDetail = lazy(() => import("./pages/TenantDetail"));
const CreateTenant = lazy(() => import("./pages/CreateTenant"));
const NewContract = lazy(() => import("./pages/NewContract"));
const Users = lazy(() => import("./pages/Users"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Settings = lazy(() => import("./pages/Settings"));
const FeatureFlags = lazy(() => import("./pages/FeatureFlags"));
const Broadcasts = lazy(() => import("./pages/Broadcasts"));
const InviteLinks = lazy(() => import("./pages/InviteLinks"));
const Templates = lazy(() => import("./pages/Templates"));
const TemplateEditor = lazy(() => import("./pages/TemplateEditor"));
const MasterUsers = lazy(() => import("./pages/MasterUsers"));
const Plans = lazy(() => import("./pages/Plans"));
const ActivityLogs = lazy(() => import("./pages/ActivityLogs"));
const TenantHealth = lazy(() => import("./pages/TenantHealth"));
const Analytics = lazy(() => import("./pages/Analytics"));

// Page loading skeleton
const PageSkeleton = () => (
  <div className="min-h-screen bg-background p-6">
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  </div>
);

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
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageSkeleton />}>
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
                <Route path="/master-users" element={<ProtectedRoute><MasterUsers /></ProtectedRoute>} />
                <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
                <Route path="/admin/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
                <Route path="/admin/templates/new" element={<ProtectedRoute><TemplateEditor /></ProtectedRoute>} />
                <Route path="/admin/templates/:id" element={<ProtectedRoute><TemplateEditor /></ProtectedRoute>} />
                <Route path="/activity-logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
                <Route path="/tenant-health" element={<ProtectedRoute><TenantHealth /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
