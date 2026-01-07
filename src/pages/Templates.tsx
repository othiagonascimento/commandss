import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Search, 
  FileText, 
  Users, 
  Clock, 
  GitBranch,
  MoreVertical,
  Copy,
  History,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { templatesApi } from '@/services/templatesApi';
import type { Template } from '@/types/templates';

export default function Templates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await templatesApi.list();
      if (response.error) throw new Error(response.error);
      return response.data || [];
    },
  });

  const filteredTemplates = templates?.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      universal: 'default',
      vendas: 'secondary',
      custom: 'outline',
    };
    return <Badge variant={variants[category] || 'outline'}>{category}</Badge>;
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsed={!sidebarOpen} onCollapse={(c) => setSidebarOpen(!c)} mobileOpen={false} onMobileClose={() => {}} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Templates de Nicho</h1>
                <p className="text-muted-foreground">
                  Gerencie templates de configuração para diferentes nichos de mercado
                </p>
              </div>
              <Button onClick={() => navigate('/admin/templates/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Error State */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="py-6">
                  <p className="text-destructive text-center">
                    Erro ao carregar templates: {error instanceof Error ? error.message : 'Erro desconhecido'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredTemplates?.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    {search ? 'Tente ajustar sua busca' : 'Comece criando seu primeiro template'}
                  </p>
                  {!search && (
                    <Button onClick={() => navigate('/admin/templates/new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Template
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Templates Grid */}
            {!isLoading && !error && filteredTemplates && filteredTemplates.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={() => navigate(`/admin/templates/${template.id}`)}
                    onHistory={() => navigate(`/admin/templates/${template.id}/history`)}
                    onSubscribers={() => navigate(`/admin/templates/${template.id}/subscribers`)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  onEdit: () => void;
  onHistory: () => void;
  onSubscribers: () => void;
}

function TemplateCard({ template, onEdit, onHistory, onSubscribers }: TemplateCardProps) {
  const getCategoryBadge = (category: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      universal: 'default',
      vendas: 'secondary',
      custom: 'outline',
    };
    return <Badge variant={variants[category] || 'outline'}>{category}</Badge>;
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onEdit}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{template.icon}</span>
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="text-xs font-mono">{template.slug}</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <FileText className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onHistory(); }}>
                <History className="h-4 w-4 mr-2" />
                Histórico
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSubscribers(); }}>
                <Users className="h-4 w-4 mr-2" />
                Assinantes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {template.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {template.description}
          </p>
        )}
        
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {getCategoryBadge(template.category)}
          {template.is_base_template && (
            <Badge variant="outline" className="border-primary text-primary">
              <GitBranch className="h-3 w-3 mr-1" />
              Base
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>v{template.version || '1.0'}</span>
          </div>
          {template.subscriber_count !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{template.subscriber_count} tenants</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
