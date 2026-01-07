import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { brandingApi, BrandingData, BrandingPayload } from '@/services/masterApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Image, Eye, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { BrandingPreview } from './BrandingPreview';

interface BrandingManagementProps {
  tenantId: string;
  branding?: BrandingData | null;
  planType: string;
  isLoading?: boolean;
}

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Lato', label: 'Lato' },
];

const borderRadiusOptions = [
  { value: 'none', label: 'Nenhum (0px)' },
  { value: 'sm', label: 'Pequeno (4px)' },
  { value: 'md', label: 'Médio (8px)' },
  { value: 'lg', label: 'Grande (12px)' },
  { value: 'xl', label: 'Extra Grande (16px)' },
  { value: 'full', label: 'Completo (9999px)' },
];

export function BrandingManagement({ tenantId, branding, planType, isLoading }: BrandingManagementProps) {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<BrandingPayload>({
    company_name: '',
    tagline: '',
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    accent_color: '#22d3ee',
    text_color: '#1f2937',
    background_color: '#ffffff',
    font_family: 'Inter',
    border_radius: 'md',
    logo_url: '',
    logo_white_url: '',
    symbol_url: '',
    favicon_url: '',
    login_background_url: '',
    custom_css: '',
    footer_text: '',
  });

  useEffect(() => {
    if (branding) {
      setFormData({
        company_name: branding.company_name || '',
        tagline: branding.tagline || '',
        primary_color: branding.primary_color || '#6366f1',
        secondary_color: branding.secondary_color || '#8b5cf6',
        accent_color: branding.accent_color || '#22d3ee',
        text_color: branding.text_color || '#1f2937',
        background_color: branding.background_color || '#ffffff',
        font_family: branding.font_family || 'Inter',
        border_radius: branding.border_radius || 'md',
        logo_url: branding.logo_url || '',
        logo_white_url: branding.logo_white_url || '',
        symbol_url: branding.symbol_url || '',
        favicon_url: branding.favicon_url || '',
        login_background_url: branding.login_background_url || '',
        custom_css: branding.custom_css || '',
        footer_text: branding.footer_text || '',
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
      primary_color: '#6366f1',
      secondary_color: '#8b5cf6',
      accent_color: '#22d3ee',
      text_color: '#1f2937',
      background_color: '#ffffff',
      font_family: 'Inter',
      border_radius: 'md',
      logo_url: '',
      logo_white_url: '',
      symbol_url: '',
      favicon_url: '',
      login_background_url: '',
      custom_css: '',
      footer_text: '',
    });
  };

  const isBasicPlan = planType === 'basic';
  const isProPlan = planType === 'pro';
  const isEnterprise = planType === 'enterprise';

  const canEditField = (field: string): boolean => {
    if (isEnterprise) return true;
    if (isProPlan) {
      return ['company_name', 'tagline', 'logo_url', 'logo_white_url', 'symbol_url', 'favicon_url'].includes(field);
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
          <CardDescription>Disponível nos planos Pro e Enterprise</CardDescription>
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

  if (showPreview) {
    return (
      <BrandingPreview 
        branding={formData} 
        onClose={() => setShowPreview(false)} 
      />
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Personalização Visual</CardTitle>
              <CardDescription className="flex items-center gap-2">
                Configure a identidade visual do tenant
                {isProPlan && <Badge variant="secondary">Pro</Badge>}
                {isEnterprise && <Badge className="bg-warning text-warning-foreground">Enterprise</Badge>}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
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
        <CardContent>
          <Tabs defaultValue="identity" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="identity">Identidade</TabsTrigger>
              <TabsTrigger value="colors" disabled={!canEditField('primary_color')}>
                Cores {!canEditField('primary_color') && '🔒'}
              </TabsTrigger>
              <TabsTrigger value="typography" disabled={!canEditField('font_family')}>
                Tipografia {!canEditField('font_family') && '🔒'}
              </TabsTrigger>
              <TabsTrigger value="advanced" disabled={!canEditField('custom_css')}>
                Avançado {!canEditField('custom_css') && '🔒'}
              </TabsTrigger>
            </TabsList>

            {/* Identity Tab */}
            <TabsContent value="identity" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="Slogan da empresa"
                    disabled={!canEditField('tagline')}
                  />
                </div>
              </div>

              {/* Logos */}
              <div className="space-y-4">
                <h4 className="font-medium">Logos e Imagens</h4>
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

                  <div className="space-y-2">
                    <Label htmlFor="symbol_url">Símbolo/Ícone (URL)</Label>
                    <Input
                      id="symbol_url"
                      value={formData.symbol_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, symbol_url: e.target.value }))}
                      placeholder="https://..."
                      disabled={!canEditField('symbol_url')}
                    />
                    {formData.symbol_url && (
                      <div className="mt-2 p-4 bg-muted rounded-lg flex justify-center">
                        <img 
                          src={formData.symbol_url} 
                          alt="Symbol preview" 
                          className="max-h-10 w-10 object-contain"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}
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
              </div>

              {/* Quick Preview */}
              <div className="space-y-2">
                <h4 className="font-medium">Preview Rápido</h4>
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
                    <div>
                      <span className="font-semibold" style={{ color: formData.primary_color }}>
                        {formData.company_name || 'Nome da Empresa'}
                      </span>
                      {formData.tagline && (
                        <p className="text-sm text-muted-foreground">{formData.tagline}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'primary_color', label: 'Cor Principal', description: 'Cor principal da marca' },
                  { id: 'secondary_color', label: 'Cor Secundária', description: 'Cor de destaque secundária' },
                  { id: 'accent_color', label: 'Cor de Destaque', description: 'Usada em CTAs e links' },
                  { id: 'text_color', label: 'Cor do Texto', description: 'Cor padrão dos textos' },
                  { id: 'background_color', label: 'Cor de Fundo', description: 'Fundo principal' },
                ].map(({ id, label, description }) => (
                  <div key={id} className="space-y-2">
                    <Label htmlFor={id}>{label}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={id}
                        type="color"
                        value={formData[id as keyof BrandingPayload] as string || '#000000'}
                        onChange={(e) => setFormData(prev => ({ ...prev, [id]: e.target.value }))}
                        className="w-14 h-10 p-1 cursor-pointer"
                        disabled={!canEditField(id)}
                      />
                      <Input
                        value={formData[id as keyof BrandingPayload] as string || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [id]: e.target.value }))}
                        className="flex-1"
                        disabled={!canEditField(id)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>

              {/* Color palette preview */}
              <div className="space-y-2">
                <h4 className="font-medium">Paleta de Cores</h4>
                <div className="flex gap-2">
                  {[
                    formData.primary_color,
                    formData.secondary_color,
                    formData.accent_color,
                    formData.text_color,
                    formData.background_color,
                  ].map((color, i) => (
                    <div 
                      key={i}
                      className="w-12 h-12 rounded-lg border shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="font_family">Família de Fontes</Label>
                  <Select
                    value={formData.font_family}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, font_family: value }))}
                    disabled={!canEditField('font_family')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map(font => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="border_radius">Arredondamento de Bordas</Label>
                  <Select
                    value={formData.border_radius}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, border_radius: value }))}
                    disabled={!canEditField('border_radius')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {borderRadiusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Typography preview */}
              <div className="space-y-2">
                <h4 className="font-medium">Preview de Tipografia</h4>
                <div 
                  className="p-6 rounded-lg border bg-muted/50"
                  style={{ fontFamily: formData.font_family }}
                >
                  <h1 className="text-3xl font-bold mb-2" style={{ color: formData.primary_color }}>
                    Título Principal
                  </h1>
                  <h2 className="text-xl font-semibold mb-2" style={{ color: formData.secondary_color }}>
                    Subtítulo de Exemplo
                  </h2>
                  <p style={{ color: formData.text_color }}>
                    Este é um exemplo de texto parágrafo usando a fonte {formData.font_family}. 
                    A tipografia é fundamental para a identidade visual da sua marca.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login_background_url">Imagem de Fundo do Login (URL)</Label>
                  <Input
                    id="login_background_url"
                    value={formData.login_background_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, login_background_url: e.target.value }))}
                    placeholder="https://..."
                    disabled={!canEditField('login_background_url')}
                  />
                  {formData.login_background_url && (
                    <div className="mt-2 h-32 rounded-lg overflow-hidden">
                      <img 
                        src={formData.login_background_url} 
                        alt="Login background preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_text">Texto do Rodapé</Label>
                  <Input
                    id="footer_text"
                    value={formData.footer_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, footer_text: e.target.value }))}
                    placeholder="© 2024 Sua Empresa. Todos os direitos reservados."
                    disabled={!canEditField('footer_text')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom_css">CSS Personalizado</Label>
                  <Textarea
                    id="custom_css"
                    value={formData.custom_css}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_css: e.target.value }))}
                    placeholder=".custom-class { ... }"
                    className="font-mono text-sm min-h-[200px]"
                    disabled={!canEditField('custom_css')}
                  />
                  <p className="text-xs text-muted-foreground">
                    ⚠️ CSS avançado. Cuidado com alterações que podem quebrar o layout.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </form>
  );
}
