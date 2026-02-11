import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, TenantUser, CreateUserPayload } from '@/services/masterApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Loader2, Edit, Power, Trash2, Key, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { z } from 'zod';

// Map role codes to friendly Portuguese names
const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  seller: 'Vendedor',
  viewer: 'Visualizador',
  moderator: 'Moderador',
  super_admin: 'Super Admin',
  user: 'Usuário',
};

const getRoleLabel = (role: string): string => {
  return ROLE_LABELS[role] || role;
};

interface UserManagementProps {
  tenantId: string;
  users: TenantUser[] | null | undefined;
  isLoading?: boolean;
}

const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['admin', 'manager', 'seller']),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export function UserManagement({ tenantId, users, isLoading }: UserManagementProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<TenantUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formData, setFormData] = useState<CreateUserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'seller',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async (data: CreateUserPayload) => {
      const result = await usersApi.create(tenantId, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Usuário criado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] });
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<TenantUser> }) => {
      const result = await usersApi.update(tenantId, userId, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Usuário atualizado!');
      setIsDialogOpen(false);
      setEditingUser(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] });
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await usersApi.deactivate(tenantId, userId);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success('Usuário desativado.');
      queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] });
    },
    onError: () => {
      toast.error('Erro ao desativar usuário.');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const result = await usersApi.update(tenantId, userId, { password });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
      setIsPasswordDialogOpen(false);
      setPasswordUser(null);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
    },
    onError: (err: Error) => {
      setPasswordError(err.message);
    },
  });

  const resendWelcomeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await usersApi.resendWelcomeEmail(tenantId, userId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Email de boas-vindas reenviado!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao reenviar email: ${err.message}`);
    },
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'seller' });
    setFormError(null);
  };

  const handleOpenChangePassword = (user: TenantUser) => {
    setPasswordUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setIsPasswordDialogOpen(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }
    if (!passwordUser) return;

    changePasswordMutation.mutate({ userId: passwordUser.id, password: newPassword });
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (user: TenantUser) => {
    setEditingUser(user);
    // Map user role to valid form role
    let formRole: 'admin' | 'manager' | 'seller' = 'seller';
    if (user.role === 'admin') formRole = 'admin';
    else if (user.role === 'manager') formRole = 'manager';
    else if (user.role === 'seller') formRole = 'seller';
    
    setFormData({
      name: user.name || user.full_name || '',
      email: user.email,
      password: '',
      role: formRole,
    });
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (editingUser) {
      updateMutation.mutate({ 
        userId: editingUser.id, 
        data: { name: formData.name, role: formData.role } 
      });
    } else {
      const validation = createUserSchema.safeParse(formData);
      if (!validation.success) {
        setFormError(validation.error.errors[0].message);
        return;
      }
      createMutation.mutate({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Usuários do Tenant</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser 
                    ? 'Atualize as informações do usuário'
                    : 'Preencha os dados para criar um novo usuário'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do usuário"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@empresa.com"
                    disabled={!!editingUser}
                    required={!editingUser}
                  />
                </div>
                
                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                      required={!editingUser}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as 'admin' | 'manager' | 'seller' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="seller">Vendedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingUser ? (
                    'Salvar'
                  ) : (
                    'Criar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Password Change Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <form onSubmit={handlePasswordSubmit}>
              <DialogHeader>
                <DialogTitle>Alterar Senha</DialogTitle>
                <DialogDescription>
                  Defina uma nova senha para {passwordUser?.name || passwordUser?.email}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Salvar Senha'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Carregando usuários...
        </div>
      ) : users && users.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? 'default' : 'secondary'}>
                    {user.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(user.created_at), 'dd MMM yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(user)}
                      title="Editar usuário"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenChangePassword(user)}
                      title="Alterar senha"
                    >
                      <Key className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => resendWelcomeMutation.mutate(user.id)}
                      disabled={resendWelcomeMutation.isPending}
                      title="Reenviar email de boas-vindas"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                    
                    {user.is_active && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive" title="Desativar usuário">
                            <Power className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Desativar usuário?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O usuário {user.name} será desativado e não poderá mais acessar o sistema.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deactivateMutation.mutate(user.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Desativar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center py-8 text-muted-foreground">
          Nenhum usuário encontrado.
        </p>
      )}
    </div>
  );
}
