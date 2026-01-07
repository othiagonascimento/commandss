import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { brandingApi, BrandingData, BrandingPayload } from '@/services/masterApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Save, Image } from 'lucide-react';
import { toast } from 'sonner';

interface BrandingManagementProps {
  tenantId: string;
  branding?: BrandingData | null;
  planType: string;
  isLoading?: boolean;
}

export function BrandingManagement({ tenantId, branding, planType, isLoading }: BrandingManagementProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<BrandingPayload>({
    company_name: branding?.company_name || '',
    primary_color: branding?.primary_color || '#3b82f6',
    secondary_color: branding?.secondary_color || '#6366f1',
    logo_url: branding?.logo_url || '',
    logo_white_url: branding?.logo_white_url || '',
    favicon_url: branding?.favicon_url || '',
  });

  const updateMutation = useMutation({
    mutationFn: async (data: BrandingPayload) => {
      const result = await brandingApi.update(tenantId, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Branding atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
    },
    onError: (err: Error) => {
      toast.error(`Erro ao atualizar: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const isBasicPlan = planType === 'basic';
  const allowedFields = branding?.allowed_fields || [];

  const canEditField = (field: string): boolean => {
    if (planType === 'enterprise') return true;
    if (planType === 'pro') {
      return ['company_name', 'logo_url', 'logo_white_url', 'favicon_url'].includes(field);
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
      </div>
    );
  }

  if (isBasicPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personalização Visual</CardTitle>
          <CardDescription>
            Disponível nos planos Pro e Enterprise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              O plano Basic usa o branding padrão do sistema.
            </p>
            <Badge variant="secondary">Upgrade para Pro para personalizar</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Personalização Visual</CardTitle>
              <CardDescription>
                Configure a identidade visual do tenant
                {planType === 'pro' && (
                  <Badge variant="secondary" className="ml-2">Pro</Badge>
                )}
                {planType === 'enterprise' && (
                  <Badge className="ml-2 bg-warning text-warning-foreground">Enterprise</Badge>
                )}
              </CardDescription>
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company_name">Nome de Exibição</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              placeholder="Nome da empresa"
              disabled={!canEditField('company_name')}
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Cor Principal</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-14 h-10 p-1 cursor-pointer"
                  disabled={!canEditField('primary_color')}
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="flex-1"
                  disabled={!canEditField('primary_color')}
                />
              </div>
              {!canEditField('primary_color') && (
                <p className="text-xs text-muted-foreground">Disponível no plano Enterprise</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondary_color">Cor Secundária</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="w-14 h-10 p-1 cursor-pointer"
                  disabled={!canEditField('secondary_color')}
                />
                <Input
                  value={formData.secondary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                  className="flex-1"
                  disabled={!canEditField('secondary_color')}
                />
              </div>
              {!canEditField('secondary_color') && (
                <p className="text-xs text-muted-foreground">Disponível no plano Enterprise</p>
              )}
            </div>
          </div>

          {/* Logos */}
          <div className="space-y-4">
            <h4 className="font-medium">Logos</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo Principal (URL)</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://..."
                  disabled={!canEditField('logo_url')}
                />
                {formData.logo_url && (
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <img 
                      src={formData.logo_url} 
                      alt="Logo preview" 
                      className="max-h-12 object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo_white_url">Logo Branca (URL)</Label>
                <Input
                  id="logo_white_url"
                  value={formData.logo_white_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_white_url: e.target.value }))}
                  placeholder="https://..."
                  disabled={!canEditField('logo_white_url')}
                />
                {formData.logo_white_url && (
                  <div className="mt-2 p-4 bg-foreground rounded-lg">
                    <img 
                      src={formData.logo_white_url} 
                      alt="Logo white preview" 
                      className="max-h-12 object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="favicon_url">Favicon (URL)</Label>
              <Input
                id="favicon_url"
                value={formData.favicon_url}
                onChange={(e) => setFormData(prev => ({ ...prev, favicon_url: e.target.value }))}
                placeholder="https://..."
                disabled={!canEditField('favicon_url')}
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: 32x32 ou 64x64 pixels, formato .ico ou .png
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <h4 className="font-medium">Preview</h4>
            <div 
              className="p-6 rounded-lg border"
              style={{ 
                background: `linear-gradient(135deg, ${formData.primary_color}20, ${formData.secondary_color}20)`,
                borderColor: formData.primary_color 
              }}
            >
              <div className="flex items-center gap-3">
                {formData.logo_url ? (
                  <img 
                    src={formData.logo_url} 
                    alt="Logo" 
                    className="h-10 object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: formData.primary_color }}
                  >
                    {formData.company_name?.charAt(0) || 'T'}
                  </div>
                )}
                <span className="font-semibold" style={{ color: formData.primary_color }}>
                  {formData.company_name || 'Nome da Empresa'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
