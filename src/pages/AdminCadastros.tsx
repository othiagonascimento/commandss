import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  FileText, Eye, CheckCircle, Clock, AlertCircle, 
  Building2, RefreshCw, Search, ChevronRight, X
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

export default function AdminCadastros() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<OnboardingSubmission | null>(null);

  const { data: submissions, isLoading, refetch } = useQuery({
    queryKey: ["onboarding-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as OnboardingSubmission[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("onboarding_submissions")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado!");
      queryClient.invalidateQueries({ queryKey: ["onboarding-submissions"] });
      if (selectedSubmission) {
        setSelectedSubmission(prev => prev ? { ...prev, status: "approved" } : null);
      }
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const filteredSubmissions = submissions?.filter((s) =>
    s.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getFormDataValue = (submission: OnboardingSubmission, key: string): string => {
    if (!submission.form_data || typeof submission.form_data !== 'object') return "-";
    const data = submission.form_data as Record<string, unknown>;
    const value = data[key];
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "boolean") return value ? "Sim" : "Não";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
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
                  placeholder="Buscar por nome da empresa..."
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
                                {getFormDataValue(submission, "owner_email")}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {submission.created_at
                            ? format(new Date(submission.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={status.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSubmission(submission)}
                            className="gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Ver detalhes
                            <ChevronRight className="w-3 h-3" />
                          </Button>
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
            <Tabs defaultValue="data" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="data">Dados</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="data" className="mt-4">
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  <div className="space-y-6 pr-4">
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
                      {selectedSubmission.status !== "approved" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: selectedSubmission.id, status: "approved" })}
                          disabled={updateStatusMutation.isPending}
                          className="gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprovar
                        </Button>
                      )}
                    </div>

                    <Separator />

                    {/* Identidade */}
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        Identidade
                      </h4>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nome</span>
                          <span className="font-medium">{getFormDataValue(selectedSubmission, "company_name")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nome Curto</span>
                          <span className="font-medium">{getFormDataValue(selectedSubmission, "short_name")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Slogan</span>
                          <span className="font-medium">{getFormDataValue(selectedSubmission, "slogan")}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Responsável */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Responsável</h4>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nome</span>
                          <span className="font-medium">{getFormDataValue(selectedSubmission, "owner_name")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">E-mail</span>
                          <span className="font-medium">{getFormDataValue(selectedSubmission, "owner_email")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Telefone</span>
                          <span className="font-medium">{getFormDataValue(selectedSubmission, "owner_phone")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Atua em vendas?</span>
                          <span className="font-medium">{getFormDataValue(selectedSubmission, "owner_is_seller")}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Operação */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Operação</h4>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Atendimentos/mês</span>
                          <span className="font-medium">{getFormDataValue(selectedSubmission, "monthly_attendances")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Produtos</span>
                          <span className="font-medium">{getFormDataValue(selectedSubmission, "catalog_products")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">WhatsApps</span>
                          <span className="font-medium">{getFormDataValue(selectedSubmission, "whatsapp_numbers")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nicho</span>
                          <span className="font-medium">{getFormDataValue(selectedSubmission, "niche")}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Imagens */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Imagens</h4>
                      <div className="grid gap-3 grid-cols-3">
                        {["logo_url", "symbol_url", "logo_white_url"].map((key) => {
                          const url = getFormDataValue(selectedSubmission, key);
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
                    </div>

                    <Separator />

                    {/* IA */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">IA</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Personalidade:</span>
                          <p className="mt-1 p-2 rounded bg-muted/30 border border-border text-xs">
                            {getFormDataValue(selectedSubmission, "ai_personality")}
                          </p>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Responde fora do horário?</span>
                          <span className="font-medium">{getFormDataValue(selectedSubmission, "ai_respond_outside_hours")}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Funil */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">Funil & Produtos</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Etapas do funil:</span>
                          <p className="mt-1">{getFormDataValue(selectedSubmission, "funnel_stages")}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Categorias:</span>
                          <p className="mt-1">{getFormDataValue(selectedSubmission, "product_categories")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="json" className="mt-4">
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  <pre className="p-4 rounded-lg bg-muted/30 border border-border text-xs overflow-auto">
                    {JSON.stringify(selectedSubmission.form_data, null, 2)}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
