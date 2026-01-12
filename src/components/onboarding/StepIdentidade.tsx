import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { OnboardingFormData } from "@/pages/CadastroLoja";

interface StepIdentidadeProps {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}

export function StepIdentidade({ formData, updateFormData }: StepIdentidadeProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Vamos conhecer seu negócio</h2>
        <p className="text-muted-foreground">
          Conte um pouco sobre sua empresa para personalizarmos tudo pra você
        </p>
      </div>

      {/* Form */}
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company_name">Nome da Empresa</Label>
            <Input
              id="company_name"
              placeholder="Ex: Loja da Maria Modas"
              value={formData.company_name}
              onChange={(e) => updateFormData({ company_name: e.target.value })}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_name">Nome Curto (Apelido)</Label>
            <Input
              id="short_name"
              placeholder="Ex: Maria Modas"
              value={formData.short_name}
              onChange={(e) => updateFormData({ short_name: e.target.value })}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              Esse nome aparecerá nos cabeçalhos e menus do sistema
            </p>
          </div>

          {/* Preview */}
          {formData.short_name && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-2">Preview do nome curto:</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {formData.short_name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-foreground">{formData.short_name}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="slogan">Slogan (opcional)</Label>
            <Input
              id="slogan"
              placeholder="Ex: Moda que combina com você"
              value={formData.slogan}
              onChange={(e) => updateFormData({ slogan: e.target.value })}
              className="h-12"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
