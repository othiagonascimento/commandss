import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  MoreHorizontal,
  Shield,
  Users,
  UserCog,
  Trash2,
  Edit,
  Mail,
  Check,
  X,
  Palette,
  Lock,
  UserPlus,
} from 'lucide-react';

interface MasterRole {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
}

interface MasterUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  roles: MasterRole[];
}

interface MasterPermission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
}

export default function MasterUsers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<MasterRole | null>(null);
  const [newUserData, setNewUserData] = useState({ email: '', full_name: '', role_ids: [] as string[] });
  const [newRoleData, setNewRoleData] = useState({ name: '', display_name: '', description: '', color: '#6366f1' });

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['master-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_roles')
        .select('*')
        .order('display_name');
      if (error) throw error;
      return data as MasterRole[];
    },
  });

  // Fetch permissions
  const { data: permissions = [] } = useQuery({
    queryKey: ['master-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_permissions')
        .select('*')
        .order('category, name');
      if (error) throw error;
      return data as MasterPermission[];
    },
  });

  // Fetch role permissions
  const { data: rolePermissions = [] } = useQuery({
    queryKey: ['master-role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_role_permissions')
        .select('role_id, permission_id');
      if (error) throw error;
      return data as RolePermission[];
    },
  });

  // Fetch users with their roles
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['master-users'],
    queryFn: async () => {
      const { data: usersData, error: usersError } = await supabase
        .from('master_users')
        .select('*')
        .order('full_name');
      if (usersError) throw usersError;

      const { data: userRolesData, error: rolesError } = await supabase
        .from('master_user_roles')
        .select('master_user_id, role_id');
      if (rolesError) throw rolesError;

      const { data: rolesData, error: allRolesError } = await supabase
        .from('master_roles')
        .select('*');
      if (allRolesError) throw allRolesError;

      const rolesMap = new Map(rolesData.map((r) => [r.id, r]));

      return usersData.map((user) => ({
        ...user,
        roles: userRolesData
          .filter((ur) => ur.master_user_id === user.id)
          .map((ur) => rolesMap.get(ur.role_id))
          .filter(Boolean) as MasterRole[],
      })) as MasterUser[];
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: typeof newRoleData) => {
      const { error } = await supabase.from('master_roles').insert({
        name: data.name.toLowerCase().replace(/\s+/g, '_'),
        display_name: data.display_name,
        description: data.description || null,
        color: data.color,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-roles'] });
      setIsRoleDialogOpen(false);
      setNewRoleData({ name: '', display_name: '', description: '', color: '#6366f1' });
      toast.success('Cargo criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar cargo: ' + error.message);
    },
  });

  // Update role permissions mutation
  const updateRolePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      // Remove all current permissions
      const { error: deleteError } = await supabase
        .from('master_role_permissions')
        .delete()
        .eq('role_id', roleId);
      if (deleteError) throw deleteError;

      // Add new permissions
      if (permissionIds.length > 0) {
        const { error: insertError } = await supabase.from('master_role_permissions').insert(
          permissionIds.map((permissionId) => ({
            role_id: roleId,
            permission_id: permissionId,
          }))
        );
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-role-permissions'] });
      toast.success('Permissões atualizadas!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar permissões: ' + error.message);
    },
  });

  // Toggle user active status
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('master_users')
        .update({ is_active: isActive })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-users'] });
      toast.success('Status atualizado!');
    },
  });

  // Invite user mutation
  const inviteUserMutation = useMutation({
    mutationFn: async (data: typeof newUserData) => {
      const { data: result, error } = await supabase.functions.invoke('master-invite', {
        body: {
          email: data.email,
          full_name: data.full_name,
          role_ids: data.role_ids,
        },
      });
      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['master-users'] });
      setIsUserDialogOpen(false);
      setNewUserData({ email: '', full_name: '', role_ids: [] });
      
      // Show success with temp password (in production, send via email)
      toast.success(
        `Usuário criado! Senha temporária: ${result.temp_password}`,
        { duration: 10000 }
      );
    },
    onError: (error) => {
      toast.error('Erro ao convidar usuário: ' + error.message);
    },
  });
  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, MasterPermission[]>);

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoles = roles.filter(
    (role) =>
      role.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRolePermissions = (roleId: string) => {
    return rolePermissions.filter((rp) => rp.role_id === roleId).map((rp) => rp.permission_id);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Usuários do Master"
        description="Gerencie usuários, cargos e permissões de acesso ao painel administrativo"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="h-4 w-4" />
              Cargos
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Lock className="h-4 w-4" />
              Permissões
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            {activeTab === 'users' && (
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Convidar Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Convidar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Informe os dados do usuário para convidá-lo ao painel administrativo.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input
                        placeholder="Ex: João Silva"
                        value={newUserData.full_name}
                        onChange={(e) =>
                          setNewUserData({ ...newUserData, full_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="joao@empresa.com"
                        value={newUserData.email}
                        onChange={(e) =>
                          setNewUserData({ ...newUserData, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cargos</Label>
                      <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                        {roles.map((role) => (
                          <label
                            key={role.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                          >
                            <Checkbox
                              checked={newUserData.role_ids.includes(role.id)}
                              onCheckedChange={(checked) => {
                                setNewUserData({
                                  ...newUserData,
                                  role_ids: checked
                                    ? [...newUserData.role_ids, role.id]
                                    : newUserData.role_ids.filter((id) => id !== role.id),
                                });
                              }}
                            />
                            <Badge
                              variant="secondary"
                              style={{ backgroundColor: role.color + '20', color: role.color }}
                            >
                              {role.display_name}
                            </Badge>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => inviteUserMutation.mutate(newUserData)}
                      disabled={!newUserData.full_name || !newUserData.email || inviteUserMutation.isPending}
                    >
                      {inviteUserMutation.isPending ? 'Enviando...' : 'Enviar Convite'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {activeTab === 'roles' && (
              <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Cargo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Cargo</DialogTitle>
                    <DialogDescription>
                      Defina um novo cargo com suas características. As permissões podem ser
                      configuradas depois.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nome de Exibição</Label>
                      <Input
                        placeholder="Ex: Suporte Técnico"
                        value={newRoleData.display_name}
                        onChange={(e) =>
                          setNewRoleData({ ...newRoleData, display_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Identificador (slug)</Label>
                      <Input
                        placeholder="Ex: suporte_tecnico"
                        value={newRoleData.name}
                        onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        placeholder="Descreva as responsabilidades deste cargo..."
                        value={newRoleData.description}
                        onChange={(e) =>
                          setNewRoleData({ ...newRoleData, description: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cor</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={newRoleData.color}
                          onChange={(e) => setNewRoleData({ ...newRoleData, color: e.target.value })}
                          className="h-10 w-20 rounded cursor-pointer"
                        />
                        <Badge style={{ backgroundColor: newRoleData.color, color: 'white' }}>
                          {newRoleData.display_name || 'Preview'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => createRoleMutation.mutate(newRoleData)}
                      disabled={!newRoleData.display_name || !newRoleData.name}
                    >
                      Criar Cargo
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lista de Usuários
              </CardTitle>
              <CardDescription>
                {filteredUsers.length} usuário(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Usuários são adicionados quando fazem login no sistema
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Cargos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Desde</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{user.full_name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <Badge
                                key={role.id}
                                variant="secondary"
                                style={{ backgroundColor: role.color + '20', color: role.color }}
                              >
                                {role.display_name}
                              </Badge>
                            ))}
                            {user.roles.length === 0 && (
                              <span className="text-sm text-muted-foreground">Sem cargo</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <UserCog className="h-4 w-4 mr-2" />
                                Gerenciar Cargos
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Enviar Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleUserStatusMutation.mutate({
                                    userId: user.id,
                                    isActive: !user.is_active,
                                  })
                                }
                              >
                                {user.is_active ? (
                                  <>
                                    <X className="h-4 w-4 mr-2" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Ativar
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rolesLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : (
              filteredRoles.map((role, index) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: role.color + '20' }}
                          >
                            <Shield className="h-5 w-5" style={{ color: role.color }} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{role.display_name}</CardTitle>
                            <p className="text-xs text-muted-foreground font-mono">{role.name}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedRole(role)}>
                              <Lock className="h-4 w-4 mr-2" />
                              Configurar Permissões
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Palette className="h-4 w-4 mr-2" />
                              Alterar Cor
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {role.description || 'Sem descrição'}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {getRolePermissions(role.id).length} permissões
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setSelectedRole(role)}
                        >
                          <Lock className="h-3 w-3 mr-1" />
                          Permissões
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <div className="grid gap-6">
            {Object.entries(permissionsByCategory).map(([category, perms]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    {category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {perms.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{perm.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{perm.code}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Role Permissions Dialog */}
      <Dialog open={!!selectedRole} onOpenChange={(open) => !open && setSelectedRole(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: selectedRole?.color + '20' }}
              >
                <Shield className="h-4 w-4" style={{ color: selectedRole?.color }} />
              </div>
              Permissões: {selectedRole?.display_name}
            </DialogTitle>
            <DialogDescription>
              Selecione as permissões que este cargo deve ter acesso
            </DialogDescription>
          </DialogHeader>

          {selectedRole && (
            <div className="space-y-6 py-4">
              {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <div key={category}>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    {category}
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {perms.map((perm) => {
                      const isChecked = getRolePermissions(selectedRole.id).includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const currentPerms = getRolePermissions(selectedRole.id);
                              const newPerms = checked
                                ? [...currentPerms, perm.id]
                                : currentPerms.filter((id) => id !== perm.id);
                              updateRolePermissionsMutation.mutate({
                                roleId: selectedRole.id,
                                permissionIds: newPerms,
                              });
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{perm.name}</p>
                            {perm.description && (
                              <p className="text-xs text-muted-foreground">{perm.description}</p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRole(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
