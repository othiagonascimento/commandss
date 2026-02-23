import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Workflow } from 'lucide-react';
import { moduleConfig, categoryColors, groupModulesByCategory } from '@/lib/modules';

interface TenantModulesEditorProps {
  modules: {
    module_ai_agent: boolean;
    module_ai_transcription: boolean;
    module_automation_flows: boolean;
    module_campaigns: boolean;
    module_ecommerce: boolean;
    module_erp_integration: boolean;
    module_api_access: boolean;
    module_whitelabel: boolean;
    module_multi_whatsapp: boolean;
  };
  onChange: (modules: TenantModulesEditorProps['modules']) => void;
  disabled?: boolean;
}

export function TenantModulesEditor({ modules, onChange, disabled }: TenantModulesEditorProps) {
  const [localModules, setLocalModules] = useState(modules);

  const handleToggle = (key: keyof typeof modules) => {
    const updated = { ...localModules, [key]: !localModules[key] };
    setLocalModules(updated);
    onChange(updated);
  };

  const groupedModules = groupModulesByCategory();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="w-5 h-5" />
          Módulos Habilitados
        </CardTitle>
        <CardDescription>
          Configure quais funcionalidades estão disponíveis para este tenant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedModules).map(([category, categoryModules]) => (
          <div key={category} className="space-y-3">
            <Badge variant="outline" className={categoryColors[category]}>
              {category}
            </Badge>
            <div className="grid gap-4">
              {categoryModules.map((module) => {
                const Icon = module.icon;
                const isEnabled = localModules[module.key as keyof typeof modules];
                
                return (
                  <div
                    key={module.key}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isEnabled ? 'border-primary/30 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Icon className={`w-5 h-5 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <Label htmlFor={module.key} className="font-medium cursor-pointer">
                          {module.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                    </div>
                    <Switch
                      id={module.key}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(module.key as keyof typeof modules)}
                      disabled={disabled}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
