import { useState } from "react";
import { GitBranch, Plus, X, Package, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { OnboardingFormData } from "@/pages/CadastroLoja";

interface StepFunilProps {
  formData: OnboardingFormData;
  updateFormData: (updates: Partial<OnboardingFormData>) => void;
}

interface EditableListProps {
  title: string;
  description: string;
  icon: React.ElementType;
  items: string[];
  onUpdate: (items: string[]) => void;
  placeholder: string;
}

function EditableList({ title, description, icon: Icon, items, onUpdate, placeholder }: EditableListProps) {
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      onUpdate([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const handleRemove = (index: number) => {
    onUpdate(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Card className="border-border/50">
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Items list - larger touch targets */}
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted border border-border text-sm"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add new - larger inputs */}
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-12 text-base"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleAdd}
            className="min-w-[48px] h-12"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function StepFunil({ formData, updateFormData }: StepFunilProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <GitBranch className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Processo de Vendas</h2>
        <p className="text-sm text-muted-foreground">
          Configure as etapas do seu funil e categorias
        </p>
      </div>

      {/* Funnel stages */}
      <EditableList
        title="Etapas do Funil"
        description="Fases do seu processo de vendas"
        icon={GitBranch}
        items={formData.funnel_stages}
        onUpdate={(items) => updateFormData({ funnel_stages: items })}
        placeholder="Ex: Proposta Enviada"
      />

      {/* Product categories */}
      <EditableList
        title="Categorias de Produtos"
        description="Organize seus produtos"
        icon={Package}
        items={formData.product_categories}
        onUpdate={(items) => updateFormData({ product_categories: items })}
        placeholder="Ex: Acessórios"
      />

      {/* Tips */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/20">
        <Info className="w-5 h-5 text-info shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          <strong>Dica:</strong> Você pode alterar isso depois no painel. 
          Por enquanto, deixe como está se não tiver certeza.
        </p>
      </div>
    </div>
  );
}
