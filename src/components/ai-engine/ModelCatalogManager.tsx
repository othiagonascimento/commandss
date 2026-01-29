import { useState, useMemo } from 'react';
import { 
  useAIModelsCatalog, 
  useCreateAIModel, 
  useUpdateAIModel, 
  useToggleAIModelActive,
  useDeleteAIModel,
  type AIModelCatalog,
  type CreateAIModelInput,
} from '@/hooks/useAIModelsCatalog';
import { ModelFormDialog } from './ModelFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Pencil, Trash2, Loader2, Database } from 'lucide-react';

const PROVIDER_COLORS: Record<string, string> = {
  google: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  openai: 'bg-green-500/10 text-green-600 border-green-500/30',
  anthropic: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
};

const CATEGORY_COLORS: Record<string, string> = {
  router: 'bg-sky-500/10 text-sky-600 border-sky-500/30',
  standard: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  elite: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
};

const CATEGORY_LABELS: Record<string, string> = {
  router: 'Router',
  standard: 'Standard',
  elite: 'Elite',
};

export function ModelCatalogManager() {
  const { data: models, isLoading, error } = useAIModelsCatalog();
  const createMutation = useCreateAIModel();
  const updateMutation = useUpdateAIModel();
  const toggleMutation = useToggleAIModelActive();
  const deleteMutation = useDeleteAIModel();

  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModelCatalog | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredModels = useMemo(() => {
    if (!models) return [];
    return models.filter(model => {
      const matchesSearch = 
        model.display_name.toLowerCase().includes(search.toLowerCase()) ||
        model.model_id.toLowerCase().includes(search.toLowerCase());
      const matchesProvider = providerFilter === 'all' || model.provider === providerFilter;
      const matchesCategory = categoryFilter === 'all' || model.layer_category === categoryFilter;
      return matchesSearch && matchesProvider && matchesCategory;
    });
  }, [models, search, providerFilter, categoryFilter]);

  const handleCreate = (data: CreateAIModelInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setDialogOpen(false);
      },
    });
  };

  const handleUpdate = (data: CreateAIModelInput) => {
    if (!editingModel) return;
    updateMutation.mutate({ id: editingModel.id, ...data }, {
      onSuccess: () => {
        setDialogOpen(false);
        setEditingModel(null);
      },
    });
  };

  const handleEdit = (model: AIModelCatalog) => {
    setEditingModel(model);
    setDialogOpen(true);
  };

  const handleToggle = (model: AIModelCatalog) => {
    toggleMutation.mutate({ id: model.id, is_active: !model.is_active });
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;
    deleteMutation.mutate(deleteConfirmId, {
      onSuccess: () => setDeleteConfirmId(null),
    });
  };

  const openNewDialog = () => {
    setEditingModel(null);
    setDialogOpen(true);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Erro ao carregar modelos: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Catálogo de Modelos de IA
              </CardTitle>
              <CardDescription>
                Gerencie os modelos de IA disponíveis para uso nas camadas do Motor de IA
              </CardDescription>
            </div>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Modelo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Provedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Provedores</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                <SelectItem value="router">Router</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="elite">Elite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {models?.length === 0 
                ? 'Nenhum modelo cadastrado. Clique em "Novo Modelo" para adicionar.'
                : 'Nenhum modelo encontrado com os filtros selecionados.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Ativo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Provedor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Custo/1k</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModels.map((model) => (
                    <TableRow key={model.id} className={!model.is_active ? 'opacity-50' : ''}>
                      <TableCell>
                        <Switch
                          checked={model.is_active}
                          onCheckedChange={() => handleToggle(model)}
                          disabled={toggleMutation.isPending}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{model.display_name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {model.model_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={PROVIDER_COLORS[model.provider]}>
                          {model.provider.charAt(0).toUpperCase() + model.provider.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={CATEGORY_COLORS[model.layer_category]}>
                          {CATEGORY_LABELS[model.layer_category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {model.cost_per_1k_tokens !== null 
                          ? `$${model.cost_per_1k_tokens.toFixed(4)}` 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(model)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setDeleteConfirmId(model.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Stats */}
          {models && models.length > 0 && (
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{models.length} modelos cadastrados</span>
              <span>•</span>
              <span>{models.filter(m => m.is_active).length} ativos</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <ModelFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingModel(null);
        }}
        model={editingModel}
        onSubmit={editingModel ? handleUpdate : handleCreate}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O modelo será removido permanentemente do catálogo.
              Tenants que estejam usando este modelo podem ter problemas de funcionamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
