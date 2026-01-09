import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
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
  Filter,
  LayoutGrid,
  List,
  Brain,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { templatesApi } from '@/services/templatesApi';
import type { Template } from '@/types/templates';

export default function Templates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await templatesApi.list();
      if (response.error) throw new Error(response.error);
      return response.data || [];
    },
  });

  const filteredTemplates = templates?.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <PageHeader
        title="Templates de Nicho"
        description="Gerencie templates para treinamento de IA por segmento"
        icon={Brain}
        actions={
          <Button onClick={() => navigate('/admin/templates/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        }
      />

      {/* Banner Educativo */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6">
        <Brain className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-sm text-foreground">O que são Templates de Nicho?</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Templates são configurações pré-definidas de IA, funil e automações para um segmento específico (ex: imobiliárias, veículos, e-commerce). 
            Quando aplicado a um tenant, o template injeta automaticamente todos os prompts, fluxos e comportamentos da IA.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <Filter className="h-4 w-4 mr-2 sm:hidden" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="universal">Universal</SelectItem>
              <SelectItem value="vendas">Vendas</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          
          {/* View Mode Toggle - Hidden on mobile */}
          <div className="hidden sm:flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

            {/* Error State */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="py-6">
                  <p className="text-destructive text-center text-sm">
                    Erro ao carregar templates: {error instanceof Error ? error.message : 'Erro desconhecido'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-16 w-full" />
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
                  <p className="text-muted-foreground text-sm mb-4">
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

            {/* Templates Grid/List */}
            {!isLoading && !error && filteredTemplates && filteredTemplates.length > 0 && (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <TemplateListItem
                      key={template.id}
                      template={template}
                      onEdit={() => navigate(`/admin/templates/${template.id}`)}
                    />
                  ))}
          </div>
        )
      )}
    </DashboardLayout>
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
    return <Badge variant={variants[category] || 'outline'} className="text-xs">{category}</Badge>;
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onEdit}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">{template.icon}</span>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg truncate">{template.name}</CardTitle>
              <CardDescription className="text-xs font-mono truncate">{template.slug}</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
            {template.description}
          </p>
        )}
        
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {getCategoryBadge(template.category)}
          {template.is_base_template && (
            <Badge variant="outline" className="border-primary text-primary text-xs">
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

interface TemplateListItemProps {
  template: Template;
  onEdit: () => void;
}

function TemplateListItem({ template, onEdit }: TemplateListItemProps) {
  const getCategoryBadge = (category: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      universal: 'default',
      vendas: 'secondary',
      custom: 'outline',
    };
    return <Badge variant={variants[category] || 'outline'} className="text-xs">{category}</Badge>;
  };

  return (
    <Card 
      className="hover:shadow-sm transition-shadow cursor-pointer" 
      onClick={onEdit}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-2xl shrink-0">{template.icon}</span>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{template.name}</h3>
              {getCategoryBadge(template.category)}
              {template.is_base_template && (
                <Badge variant="outline" className="border-primary text-primary text-xs">Base</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{template.description}</p>
          </div>
          
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>v{template.version}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{template.subscriber_count}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
