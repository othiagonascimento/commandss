import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { brandingApi, BrandingData, BrandingPayload } from '@/services/masterApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from './ImageUpload';

interface BrandingManagementProps {
  tenantId: string;
  branding?: BrandingData | null;
  planType: string;
  isLoading?: boolean;
}

export function BrandingManagement({ tenantId, branding, planType, isLoading }: BrandingManagementProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<BrandingPayload>({
    company_name: '',
    tagline: '',
    logo_url: '',
    logo_white_url: '',
    symbol_url: '',
    favicon_url: '',
  });

  useEffect(() => {
    if (branding) {
      setFormData({
        company_name: branding.company_name || '',
        tagline: branding.tagline || '',
        logo_url: branding.logo_url || '',
        logo_white_url: branding.logo_white_url || '',
        symbol_url: branding.symbol_url || '',
        favicon_url: branding.favicon_url || '',
      });
    }
  }, [branding]);

  const updateMutation = useMutation({
    mutationFn: async (data: BrandingPayload) => {
      const result = await brandingApi.update(tenantId, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Branding atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['tenant-branding', tenantId] });
    },
    onError: (err: Error) => {
      toast.error(`Erro ao atualizar: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleReset = () => {
    setFormData({
      company_name: branding?.company_name || '',
      tagline: branding?.tagline || '',
      logo_url: branding?.logo_url || '',
      logo_white_url: branding?.logo_white_url || '',
      symbol_url: branding?.symbol_url || '',
      favicon_url: branding?.favicon_url || '',
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Identidade Visual</CardTitle>
              <CardDescription>
                Configure o nome e logos do tenant
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button type="submit" size="sm" disabled={updateMutation.isPending}>
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
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome de Exibição</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                placeholder="Slogan da empresa"
              />
            </div>
          </div>

          {/* Logos with Upload */}
          <div className="space-y-4">
            <h4 className="font-medium">Logos e Imagens</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Logo Principal</Label>
                <ImageUpload
                  value={formData.logo_url || ''}
                  onChange={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
                  tenantId={tenantId}
                  folder="logo"
                  previewBgClass="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Logo Branca</Label>
                <ImageUpload
                  value={formData.logo_white_url || ''}
                  onChange={(url) => setFormData(prev => ({ ...prev, logo_white_url: url }))}
                  tenantId={tenantId}
                  folder="logo-white"
                  previewBgClass="bg-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label>Símbolo/Ícone</Label>
                <ImageUpload
                  value={formData.symbol_url || ''}
                  onChange={(url) => setFormData(prev => ({ ...prev, symbol_url: url }))}
                  tenantId={tenantId}
                  folder="symbol"
                  previewClassName="max-h-10 w-10 object-contain"
                />
              </div>

              <div className="space-y-2">
                <Label>Favicon</Label>
                <ImageUpload
                  value={formData.favicon_url || ''}
                  onChange={(url) => setFormData(prev => ({ ...prev, favicon_url: url }))}
                  tenantId={tenantId}
                  folder="favicon"
                  previewClassName="max-h-8 w-8 object-contain"
                />
                <p className="text-xs text-muted-foreground">
                  Recomendado: 32x32 ou 64x64 pixels
                </p>
              </div>
            </div>
          </div>

          {/* Quick Preview */}
          <div className="space-y-2">
            <h4 className="font-medium">Preview</h4>
            <div className="p-6 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                {formData.logo_url ? (
                  <img 
                    src={formData.logo_url} 
                    alt="Logo" 
                    className="h-10 object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {formData.company_name?.charAt(0) || 'T'}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-foreground">
                    {formData.company_name || 'Nome da Empresa'}
                  </span>
                  {formData.tagline && (
                    <p className="text-sm text-muted-foreground">{formData.tagline}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info about standardization */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              💡 <strong>UI Padronizada:</strong> O sistema CRM utiliza cores, fontes e estilos padrão para garantir consistência e performance. 
              Personalizações visuais avançadas estão disponíveis apenas para o site/e-commerce público do tenant.
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
