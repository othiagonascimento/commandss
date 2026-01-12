import { useState } from "react";
import { GitBranch, Plus, X, GripVertical, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Items list */}
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="pl-3 pr-1 py-1.5 gap-1 text-sm"
            >
              <GripVertical className="w-3 h-3 text-muted-foreground" />
              {item}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="ml-1 p-0.5 rounded hover:bg-destructive/20 hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>

        {/* Add new */}
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button type="button" variant="outline" size="icon" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
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
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <GitBranch className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Processo de Vendas</h2>
        <p className="text-muted-foreground">
          Configure as etapas do seu funil e categorias de produtos
        </p>
      </div>

      {/* Funnel stages */}
      <EditableList
        title="Etapas do Funil"
        description="Organize as fases do seu processo de vendas"
        icon={GitBranch}
        items={formData.funnel_stages}
        onUpdate={(items) => updateFormData({ funnel_stages: items })}
        placeholder="Ex: Proposta Enviada"
      />

      {/* Product categories */}
      <EditableList
        title="Categorias de Produtos"
        description="Organize seus produtos em categorias"
        icon={Package}
        items={formData.product_categories}
        onUpdate={(items) => updateFormData({ product_categories: items })}
        placeholder="Ex: Acessórios"
      />

      {/* Tips */}
      <div className="p-4 rounded-lg bg-info/10 border border-info/20">
        <p className="text-sm text-muted-foreground">
          <strong>Dica:</strong> Você poderá alterar essas configurações depois, 
          dentro do painel administrativo. Por enquanto, deixe como está se não tiver certeza.
        </p>
      </div>
    </div>
  );
}
