import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import type { OnboardingFormData } from "@/pages/CadastroLoja";

interface StepResponsavelProps {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}

// Máscara de telefone brasileiro
function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

export function StepResponsavel({ formData, updateFormData }: StepResponsavelProps) {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    updateFormData({ owner_phone: formatted });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Dados do Responsável</h2>
        <p className="text-muted-foreground">
          Quem vai gerenciar o sistema no dia a dia?
        </p>
      </div>

      {/* Form */}
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="owner_name">Nome Completo</Label>
            <Input
              id="owner_name"
              placeholder="Ex: Maria Silva"
              value={formData.owner_name}
              onChange={(e) => updateFormData({ owner_name: e.target.value })}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner_email">E-mail</Label>
            <Input
              id="owner_email"
              type="email"
              placeholder="Ex: maria@minhaloja.com"
              value={formData.owner_email}
              onChange={(e) => updateFormData({ owner_email: e.target.value })}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner_phone">WhatsApp</Label>
            <Input
              id="owner_phone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={formData.owner_phone}
              onChange={handlePhoneChange}
              className="h-12"
              maxLength={15}
            />
          </div>

          {/* Seller switch */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
            <div className="space-y-0.5">
              <Label htmlFor="owner_is_seller" className="cursor-pointer">
                Você também vai atuar nas vendas?
              </Label>
              <p className="text-xs text-muted-foreground">
                Se sim, criaremos um perfil de vendedor pra você
              </p>
            </div>
            <Switch
              id="owner_is_seller"
              checked={formData.owner_is_seller}
              onCheckedChange={(checked) => updateFormData({ owner_is_seller: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
