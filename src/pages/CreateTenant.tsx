import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { tenantsApi, CreateTenantPayload } from '@/services/masterApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Building2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const createTenantSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  slug: z.string().min(2, 'Slug deve ter pelo menos 2 caracteres').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  plan_type: z.enum(['basic', 'pro', 'enterprise']),
  company_name: z.string().optional(),
  primary_color: z.string().optional(),
  admin_email: z.string().email('Email inválido').optional().or(z.literal('')),
  admin_name: z.string().optional(),
  admin_password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional().or(z.literal('')),
});

type FormData = z.infer<typeof createTenantSchema>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CreateTenant() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    plan_type: 'basic',
    company_name: '',
    primary_color: '#3b82f6',
    admin_email: '',
    admin_name: '',
    admin_password: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: CreateTenantPayload = {
        name: data.name,
        slug: data.slug,
        subdomain: data.slug,
        plan_type: data.plan_type,
        branding: {
          company_name: data.company_name || data.name,
          primary_color: data.primary_color,
        },
      };
      
      const result = await tenantsApi.create(payload);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      toast.success('Tenant criado com sucesso!');
      navigate(`/tenants/${data?.id || ''}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validation = createTenantSchema.safeParse(formData);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    createMutation.mutate(formData);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: slugify(name),
    }));
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Novo Tenant
          </h1>
          <p className="text-muted-foreground">
            Crie uma nova empresa no sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados principais do tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Minha Empresa"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="minha-empresa"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Será usado na URL: {formData.slug || 'slug'}.suaapp.com
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan_type">Plano *</Label>
                <Select 
                  value={formData.plan_type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, plan_type: v as FormData['plan_type'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic - Funcionalidades essenciais</SelectItem>
                    <SelectItem value="pro">Pro - Recursos avançados + Branding</SelectItem>
                    <SelectItem value="enterprise">Enterprise - Tudo + Customização total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Personalização visual (opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nome de Exibição</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Nome para exibir no sistema"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary_color">Cor Principal</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin User (optional) */}
          <Card>
            <CardHeader>
              <CardTitle>Usuário Administrador</CardTitle>
              <CardDescription>Criar um admin inicial (opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_name">Nome do Admin</Label>
                  <Input
                    id="admin_name"
                    value={formData.admin_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, admin_name: e.target.value }))}
                    placeholder="João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_email">Email do Admin</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    value={formData.admin_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, admin_email: e.target.value }))}
                    placeholder="admin@empresa.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin_password">Senha Inicial</Label>
                <Input
                  id="admin_password"
                  type="password"
                  value={formData.admin_password}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_password: e.target.value }))}
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo 6 caracteres. O usuário poderá alterar depois.
                </p>
              </div>
            </CardContent>
          </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Tenant'
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/tenants')}>
            Cancelar
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
