import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Settings = lazy(() => import("./pages/Settings"));
const FeatureFlags = lazy(() => import("./pages/FeatureFlags"));
const Comunicados = lazy(() => import("./pages/Comunicados"));
const InviteLinks = lazy(() => import("./pages/InviteLinks"));
const Templates = lazy(() => import("./pages/Templates"));
const TemplateEditor = lazy(() => import("./pages/TemplateEditor"));
const MasterUsers = lazy(() => import("./pages/MasterUsers"));
const Plans = lazy(() => import("./pages/Plans"));
const ActivityLogs = lazy(() => import("./pages/ActivityLogs"));
const TenantHealth = lazy(() => import("./pages/TenantHealth"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ScheduledTasks = lazy(() => import("./pages/ScheduledTasks"));

const Rankings = lazy(() => import("./pages/Rankings"));
const Simulator = lazy(() => import("./pages/Simulator"));
const APICosts = lazy(() => import("./pages/APICosts"));
const AIDiagnostics = lazy(() => import("./pages/AIDiagnostics"));
const CadastroLoja = lazy(() => import("./pages/CadastroLoja"));
const AdminCadastros = lazy(() => import("./pages/AdminCadastros"));
const Operations = lazy(() => import("./pages/Operations"));
const Install = lazy(() => import("./pages/Install"));
const Docs = lazy(() => import("./pages/Docs"));

// Command AI — área operacional executiva privada (apenas master)
const CommandShell = lazy(() => import("./components/command/CommandShell").then(m => ({ default: m.CommandShell })));
const CommandCockpit = lazy(() => import("./pages/command/Cockpit"));
const CommandPlaceholder = lazy(() => import("./pages/command/Placeholder"));

// FinOps pages (Master only)
const FinOpsOverview = lazy(() => import("./pages/finops/FinOpsOverviewPage"));
const FinOpsTenants = lazy(() => import("./pages/finops/FinOpsTenantsPage"));
const FinOpsUsers = lazy(() => import("./pages/finops/FinOpsUsersPage"));
const FinOpsAI = lazy(() => import("./pages/finops/FinOpsAIPage"));
const FinOpsMedia = lazy(() => import("./pages/finops/FinOpsMediaPage"));
const FinOpsInfra = lazy(() => import("./pages/finops/FinOpsInfraPage"));
const FinOpsInvestor = lazy(() => import("./pages/finops/FinOpsInvestorPage"));
const FinOpsAnomalies = lazy(() => import("./pages/finops/FinOpsAnomaliesPage"));
const FinOpsPricing = lazy(() => import("./pages/finops/FinOpsPricingSettingsPage"));
const FinOpsBudgets = lazy(() => import("./pages/finops/FinOpsBudgetSettingsPage"));

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
      // Ignore RLS configuration errors - they're handled by retrying via Edge Functions
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('configuration parameter') || errorMessage.includes('42602')) {
        console.warn('[QueryCache] RLS configuration error - this should be handled by Edge Functions');
        return;
      }
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
                <Route path="/tenants/:id" element={<ProtectedRoute><TenantDetail /></ProtectedRoute>} />
                <Route path="/tenants/:id/edit" element={<Navigate to="../" replace relative="path" />} />
                <Route path="/rankings" element={<ProtectedRoute><Rankings /></ProtectedRoute>} />
                <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/feature-flags" element={<ProtectedRoute><FeatureFlags /></ProtectedRoute>} />
                <Route path="/comunicados" element={<ProtectedRoute><Comunicados /></ProtectedRoute>} />
                <Route path="/invite-links" element={<ProtectedRoute><InviteLinks /></ProtectedRoute>} />
                <Route path="/master-users" element={<ProtectedRoute><MasterUsers /></ProtectedRoute>} />
                <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
                <Route path="/admin/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
                <Route path="/admin/templates/new" element={<ProtectedRoute><TemplateEditor /></ProtectedRoute>} />
                <Route path="/admin/templates/:id" element={<ProtectedRoute><TemplateEditor /></ProtectedRoute>} />
                <Route path="/activity-logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
                <Route path="/tenant-health" element={<ProtectedRoute><TenantHealth /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/scheduled-tasks" element={<ProtectedRoute><ScheduledTasks /></ProtectedRoute>} />
                <Route path="/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
                <Route path="/api-costs" element={<ProtectedRoute><APICosts /></ProtectedRoute>} />
                <Route path="/ai-diagnostics" element={<ProtectedRoute><AIDiagnostics /></ProtectedRoute>} />
                <Route path="/operations" element={<ProtectedRoute><Operations /></ProtectedRoute>} />
                <Route path="/admin/cadastros" element={<ProtectedRoute><AdminCadastros /></ProtectedRoute>} />
                <Route path="/docs" element={<ProtectedRoute><Docs /></ProtectedRoute>} />
                <Route path="/docs/:docId" element={<ProtectedRoute><Docs /></ProtectedRoute>} />
                <Route path="/docs/:docId/:sectionId" element={<ProtectedRoute><Docs /></ProtectedRoute>} />

                {/* FinOps / Unit Economics — Master only */}
                <Route path="/finops" element={<ProtectedRoute><FinOpsOverview /></ProtectedRoute>} />
                <Route path="/finops/tenants" element={<ProtectedRoute><FinOpsTenants /></ProtectedRoute>} />
                <Route path="/finops/users" element={<ProtectedRoute><FinOpsUsers /></ProtectedRoute>} />
                <Route path="/finops/ai" element={<ProtectedRoute><FinOpsAI /></ProtectedRoute>} />
                <Route path="/finops/media" element={<ProtectedRoute><FinOpsMedia /></ProtectedRoute>} />
                <Route path="/finops/infra" element={<ProtectedRoute><FinOpsInfra /></ProtectedRoute>} />
                <Route path="/finops/investor" element={<ProtectedRoute><FinOpsInvestor /></ProtectedRoute>} />
                <Route path="/finops/anomalies" element={<ProtectedRoute><FinOpsAnomalies /></ProtectedRoute>} />
                <Route path="/finops/settings/pricing" element={<ProtectedRoute><FinOpsPricing /></ProtectedRoute>} />
                <Route path="/finops/settings/budgets" element={<ProtectedRoute><FinOpsBudgets /></ProtectedRoute>} />

                {/* Command AI — operação executiva privada */}
                <Route path="/command" element={<CommandShell />}>
                  <Route index element={<CommandCockpit />} />
                  <Route path=":module" element={<CommandPlaceholder />} />
                </Route>

                {/* Public onboarding route - URL curta e amigável */}
                <Route path="/cadastro" element={<CadastroLoja />} />
                <Route path="/install" element={<Install />} />
                {/* Redirecionamentos para URLs antigas */}
                <Route path="/cadastro-loja" element={<Navigate to="/cadastro" replace />} />
                <Route path="/cadastros-loja" element={<Navigate to="/cadastro" replace />} />
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
