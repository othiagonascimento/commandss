import { useState } from "react";
import { safeArray } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { 
  FileText, Eye, CheckCircle, Clock, AlertCircle, 
  Building2, RefreshCw, Search, ChevronRight, Copy, 
  Plus, User, Phone, Mail, Briefcase, Bot, Palette
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Json } from "@/integrations/supabase/types";

interface OnboardingSubmission {
  id: string;
  company_name: string | null;
  form_data: Json | null;
  status: string | null;
  created_at: string | null;
}

const statusConfig = {
  pending: { label: "Pendente", color: "bg-warning/10 text-warning border-warning/30", icon: Clock },
  approved: { label: "Aprovado", color: "bg-success/10 text-success border-success/30", icon: CheckCircle },
  rejected: { label: "Rejeitado", color: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertCircle },
};

// Helper to safely get form data value
function getFormValue(formData: Json | null, key: string): string {
  if (!formData || typeof formData !== 'object' || Array.isArray(formData)) return "-";
  const data = formData as Record<string, unknown>;
  const value = data[key];
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// Component for a copyable field
function CopyField({ label, value }: { label: string; value: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value === "-" ? "" : value);
    toast.success(`"${label}" copiado!`);
  };

  return (
    <div className="flex items-center justify-between py-1.5 group">
      <div className="flex-1 min-w-0">
        <span className="text-muted-foreground text-sm">{label}</span>
        <p className="font-medium truncate">{value}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={handleCopy}
      >
        <Copy className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Component for a section with copy all button
function Section({ 
  title, 
  icon: Icon, 
  children, 
  copyText 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
  copyText: string;
}) {
  const handleCopyAll = () => {
    navigator.clipboard.writeText(copyText);
    toast.success(`Seção "${title}" copiada!`);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </h4>
        <Button variant="ghost" size="sm" onClick={handleCopyAll} className="h-7 text-xs gap-1">
          <Copy className="w-3 h-3" />
          Copiar
        </Button>
      </div>
      <div className="pl-6 space-y-1">
        {children}
      </div>
    </div>
  );
}

export default function AdminCadastros() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<OnboardingSubmission | null>(null);

  // Fetch via Edge Function to bypass RLS
  const { data: submissions, isLoading, refetch } = useQuery({
    queryKey: ["onboarding-submissions"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("master-onboarding", {
        method: "GET",
      });

      if (response.error) throw response.error;
      return safeArray<OnboardingSubmission>(response.data?.data ?? response.data);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await supabase.functions.invoke("master-onboarding", {
        body: { action: "update_status", id, status },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Status atualizado para ${variables.status === 'approved' ? 'Aprovado' : 'Rejeitado'}!`);
      queryClient.invalidateQueries({ queryKey: ["onboarding-submissions"] });
      if (selectedSubmission) {
        setSelectedSubmission(prev => prev ? { ...prev, status: variables.status } : null);
      }
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const filteredSubmissions = submissions?.filter((s) =>
    s.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    getFormValue(s.form_data, "owner_email").toLowerCase().includes(search.toLowerCase())
  );

  // Build copy text for each section
  const buildIdentityText = (s: OnboardingSubmission) => 
    `IDENTIDADE\nNome: ${getFormValue(s.form_data, "company_name")}\nNome Curto: ${getFormValue(s.form_data, "short_name")}\nSlogan: ${getFormValue(s.form_data, "slogan")}`;

  const buildResponsibleText = (s: OnboardingSubmission) =>
    `RESPONSÁVEL\nNome: ${getFormValue(s.form_data, "owner_name")}\nEmail: ${getFormValue(s.form_data, "owner_email")}\nTelefone: ${getFormValue(s.form_data, "owner_phone")}\nAtua em vendas: ${getFormValue(s.form_data, "owner_is_seller")}`;

  const buildOperationText = (s: OnboardingSubmission) =>
    `OPERAÇÃO\nAtendimentos/mês: ${getFormValue(s.form_data, "monthly_attendances")}\nProdutos: ${getFormValue(s.form_data, "catalog_products")}\nWhatsApps: ${getFormValue(s.form_data, "whatsapp_numbers")}\nNicho: ${getFormValue(s.form_data, "niche")}`;

  const buildAIText = (s: OnboardingSubmission) =>
    `IA\nPersonalidade: ${getFormValue(s.form_data, "ai_personality")}\nResponde fora do horário: ${getFormValue(s.form_data, "ai_respond_outside_hours")}`;

  const buildFunnelText = (s: OnboardingSubmission) =>
    `FUNIL\nEtapas: ${getFormValue(s.form_data, "funnel_stages")}\nCategorias: ${getFormValue(s.form_data, "product_categories")}`;

  const copyAllAsJSON = (s: OnboardingSubmission) => {
    navigator.clipboard.writeText(JSON.stringify(s.form_data, null, 2));
    toast.success("JSON completo copiado!");
  };

  // Navigate to create tenant with pre-filled data
  const handleCreateTenant = (s: OnboardingSubmission) => {
    const name = getFormValue(s.form_data, "company_name");
    const shortName = getFormValue(s.form_data, "short_name");
    const email = getFormValue(s.form_data, "owner_email");
    const ownerName = getFormValue(s.form_data, "owner_name");
    const logoUrl = getFormValue(s.form_data, "logo_url");
    const primaryColor = getFormValue(s.form_data, "primary_color");

    const params = new URLSearchParams();
    params.set("prefill", "true");
    if (name !== "-") params.set("name", name);
    if (shortName !== "-") params.set("slug", shortName.toLowerCase().replace(/\s+/g, '-'));
    if (email !== "-") params.set("email", email);
    if (ownerName !== "-") params.set("admin_name", ownerName);
    if (logoUrl !== "-") params.set("logo_url", logoUrl);
    if (primaryColor !== "-") params.set("primary_color", primaryColor);
    params.set("submission_id", s.id);

    navigate(`/tenants/new?${params.toString()}`);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Cadastros de Lojas"
        description="Gerencie os cadastros de novos clientes"
        icon={FileText}
      />

      <div className="space-y-6">
        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{submissions?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total de cadastros</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {submissions?.filter((s) => s.status === "pending").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {submissions?.filter((s) => s.status === "approved").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Aprovados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Cadastros Recebidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredSubmissions?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum cadastro encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions?.map((submission) => {
                    const status = statusConfig[submission.status as keyof typeof statusConfig] || statusConfig.pending;
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={submission.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {submission.company_name || "Sem nome"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getFormValue(submission.form_data, "niche")}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {getFormValue(submission.form_data, "owner_name")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getFormValue(submission.form_data, "owner_email")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {submission.created_at
                            ? format(new Date(submission.created_at), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={status.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                              className="gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateTenant(submission)}
                              className="gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              Criar Tenant
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Sheet */}
      <Sheet open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {selectedSubmission?.company_name || "Detalhes do Cadastro"}
            </SheetTitle>
          </SheetHeader>

          {selectedSubmission && (
            <ScrollArea className="h-[calc(100vh-8rem)] mt-6 pr-4">
              <div className="space-y-6">
                {/* Status & Actions */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <div>
                    <p className="text-sm text-muted-foreground">Status atual</p>
                    <Badge 
                      variant="outline" 
                      className={statusConfig[selectedSubmission.status as keyof typeof statusConfig]?.color || statusConfig.pending.color}
                    >
                      {statusConfig[selectedSubmission.status as keyof typeof statusConfig]?.label || "Pendente"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {selectedSubmission.status !== "approved" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: selectedSubmission.id, status: "approved" })}
                        disabled={updateStatusMutation.isPending}
                        className="gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprovar
                      </Button>
                    )}
                    {selectedSubmission.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: selectedSubmission.id, status: "rejected" })}
                        disabled={updateStatusMutation.isPending}
                        className="gap-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Rejeitar
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Identidade */}
                <Section 
                  title="Identidade" 
                  icon={Building2} 
                  copyText={buildIdentityText(selectedSubmission)}
                >
                  <CopyField label="Nome" value={getFormValue(selectedSubmission.form_data, "company_name")} />
                  <CopyField label="Nome Curto" value={getFormValue(selectedSubmission.form_data, "short_name")} />
                  <CopyField label="Slogan" value={getFormValue(selectedSubmission.form_data, "slogan")} />
                </Section>

                <Separator />

                {/* Responsável */}
                <Section 
                  title="Responsável" 
                  icon={User} 
                  copyText={buildResponsibleText(selectedSubmission)}
                >
                  <CopyField label="Nome" value={getFormValue(selectedSubmission.form_data, "owner_name")} />
                  <CopyField label="Email" value={getFormValue(selectedSubmission.form_data, "owner_email")} />
                  <CopyField label="Telefone" value={getFormValue(selectedSubmission.form_data, "owner_phone")} />
                  <CopyField label="Atua em vendas?" value={getFormValue(selectedSubmission.form_data, "owner_is_seller")} />
                </Section>

                <Separator />

                {/* Operação */}
                <Section 
                  title="Operação" 
                  icon={Briefcase} 
                  copyText={buildOperationText(selectedSubmission)}
                >
                  <CopyField label="Atendimentos/mês" value={getFormValue(selectedSubmission.form_data, "monthly_attendances")} />
                  <CopyField label="Produtos" value={getFormValue(selectedSubmission.form_data, "catalog_products")} />
                  <CopyField label="WhatsApps" value={getFormValue(selectedSubmission.form_data, "whatsapp_numbers")} />
                  <CopyField label="Nicho" value={getFormValue(selectedSubmission.form_data, "niche")} />
                </Section>

                <Separator />

                {/* IA */}
                <Section 
                  title="IA" 
                  icon={Bot} 
                  copyText={buildAIText(selectedSubmission)}
                >
                  <CopyField label="Personalidade" value={getFormValue(selectedSubmission.form_data, "ai_personality")} />
                  <CopyField label="Responde fora do horário?" value={getFormValue(selectedSubmission.form_data, "ai_respond_outside_hours")} />
                </Section>

                <Separator />

                {/* Visual */}
                <Section 
                  title="Visual" 
                  icon={Palette} 
                  copyText={`Logo: ${getFormValue(selectedSubmission.form_data, "logo_url")}\nCor: ${getFormValue(selectedSubmission.form_data, "primary_color")}`}
                >
                  <CopyField label="Cor Primária" value={getFormValue(selectedSubmission.form_data, "primary_color")} />
                  
                  {/* Images Preview */}
                  <div className="grid gap-3 grid-cols-3 mt-3">
                    {["logo_url", "symbol_url", "logo_white_url"].map((key) => {
                      const url = getFormValue(selectedSubmission.form_data, key);
                      const label = key === "logo_url" ? "Logo" : key === "symbol_url" ? "Símbolo" : "Logo Branca";
                      
                      return (
                        <div key={key} className="space-y-1">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          {url !== "-" ? (
                            <div className="w-full aspect-square rounded-lg border border-border bg-muted/30 overflow-hidden">
                              <img src={url} alt={label} className="w-full h-full object-contain p-2" />
                            </div>
                          ) : (
                            <div className="w-full aspect-square rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">-</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Section>

                <Separator />

                {/* Funil */}
                <Section 
                  title="Funil & Produtos" 
                  icon={Briefcase} 
                  copyText={buildFunnelText(selectedSubmission)}
                >
                  <CopyField label="Etapas do funil" value={getFormValue(selectedSubmission.form_data, "funnel_stages")} />
                  <CopyField label="Categorias" value={getFormValue(selectedSubmission.form_data, "product_categories")} />
                </Section>

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => copyAllAsJSON(selectedSubmission)}
                  >
                    <Copy className="w-4 h-4" />
                    Copiar JSON
                  </Button>
                  <Button 
                    className="flex-1 gap-2"
                    onClick={() => {
                      handleCreateTenant(selectedSubmission);
                      setSelectedSubmission(null);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Criar Tenant
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
