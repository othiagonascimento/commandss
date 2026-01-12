import { BarChart3, MessageCircle, Package, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { OnboardingFormData } from "@/pages/CadastroLoja";

interface StepOperacaoProps {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder: string;
}

function MetricCard({ icon: Icon, label, description, value, onChange, placeholder }: MetricCardProps) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <p className="font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Input
            type="number"
            placeholder={placeholder}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            className="h-10"
          />
        </div>
      </div>
    </div>
  );
}

export function StepOperacao({ formData, updateFormData }: StepOperacaoProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Raio-X da Operação</h2>
        <p className="text-muted-foreground">
          Nos conte um pouco sobre o volume do seu negócio
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          icon={MessageCircle}
          label="Atendimentos mensais"
          description="Média de conversas no WhatsApp"
          value={formData.monthly_attendances}
          onChange={(v) => updateFormData({ monthly_attendances: v })}
          placeholder="Ex: 500"
        />
        
        <MetricCard
          icon={Package}
          label="Produtos no catálogo"
          description="Quantos itens você vende"
          value={formData.catalog_products}
          onChange={(v) => updateFormData({ catalog_products: v })}
          placeholder="Ex: 150"
        />
        
        <MetricCard
          icon={Smartphone}
          label="Números de WhatsApp"
          description="Quantos vai conectar ao sistema"
          value={formData.whatsapp_numbers}
          onChange={(v) => updateFormData({ whatsapp_numbers: v })}
          placeholder="Ex: 2"
        />
      </div>

      {/* Niche */}
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-2">
          <Label htmlFor="niche">Qual o nicho da sua loja?</Label>
          <Input
            id="niche"
            placeholder="Ex: Veículos, Moda, Eletrônicos, Cosméticos..."
            value={formData.niche}
            onChange={(e) => updateFormData({ niche: e.target.value })}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            Isso nos ajuda a personalizar a IA para o seu mercado
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
