import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useDebounce } from "../hooks/useDebounce"; // Hook para debounce
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import { Badge } from "./ui/badge";
import { Shield, Key, Search, Plus, UserPlus, Calendar, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import AdminUserRegister from "./AdminUserRegister";

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms de delay

  const [selectedUser, setSelectedUser] = useState(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false); // NOVO
  const [newRole, setNewRole] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedUserForEnrollments, setSelectedUserForEnrollments] = useState(null);
  const [isEnrollmentsDialogOpen, setIsEnrollmentsDialogOpen] = useState(false);

  // Edit User State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // QUERY: Histórico de inscrições do usuário
  const { data: userEnrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ["user-enrollments", selectedUserForEnrollments?.id],
    queryFn: async () => {
      if (!selectedUserForEnrollments) return [];
      const response = await api.get(`/users/${selectedUserForEnrollments.id}/enrollments`);
      return response.data;
    },
    enabled: !!selectedUserForEnrollments,
  });

  // QUERY ATUALIZADA para paginação e busca
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, debouncedSearchTerm],
    queryFn: async () => {
      const response = await api.get("/users", {
        params: {
          page,
          limit: 10, // Define quantos usuários por página
          search: debouncedSearchTerm,
        },
      });
      return response.data;
    },
    // Mantém os dados antigos visíveis enquanto a nova página carrega
    keepPreviousData: true,
  });

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      const response = await api.patch(`/users/${userId}/role`, { role });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      toast.success("Tipo de usuário atualizado com sucesso!");
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error || "Erro ao atualizar tipo de usuário"
      );
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }) => {
      const response = await api.post(`/users/${userId}/reset-password`, {
        newPassword,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso!");
      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao redefinir senha");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      const response = await api.put(`/users/${userId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      toast.success("Dados do usuário atualizados com sucesso!");
      setIsEditDialogOpen(false);
      setUserToEdit(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao atualizar usuário");
    },
  });

  const handleRoleChange = () => {
    if (!newRole) {
      toast.error("Selecione um tipo de usuário");
      return;
    }
    updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
  };

  const handleEditClick = (user) => {
    setUserToEdit(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editName.trim() || !editEmail.trim()) {
      toast.error("Nome e Email são obrigatórios");
      return;
    }
    updateUserMutation.mutate({
      userId: userToEdit.id,
      data: { name: editName, email: editEmail }
    });
  };


  const handlePasswordReset = () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    resetPasswordMutation.mutate({ userId: selectedUser.id, newPassword });
  };

  const openRoleDialog = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsRoleDialogOpen(true);
  };

  const openPasswordDialog = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setIsPasswordDialogOpen(true);
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      ADMIN: { label: "Administrador", variant: "destructive" },
      GESTOR_ESCOLA: { label: "Gestor Educacional", variant: "outline" },
      ORGANIZER: { label: "Organizador", variant: "default" },
      CHECKIN_COORDINATOR: { label: "Coord. Check-in", variant: "secondary" },
      TEACHER: { label: "Professor", variant: "outline" },
      USER: { label: "Usuário", variant: "outline" },
    };
    const config = roleConfig[role] || roleConfig.USER;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading && page === 1 && !searchTerm) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-gray-500">Carregando usuários...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>
            Gerencie tipos de usuário e redefina senhas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-auto flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reseta para a primeira página ao buscar
                }}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsRegisterDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>

          <div className="rounded-md border-none md:border">
            {/* MOBILE VIEW: Cards */}
            <div className="md:hidden space-y-4">
              {isLoading ? (
                <div className="text-center p-4">Carregando...</div>
              ) : users.length === 0 ? (
                <div className="text-center p-4 text-gray-500">Nenhum usuário encontrado</div>
              ) : (
                users.map((user) => (
                  <Card key={user.id} className="overflow-hidden border shadow-sm">
                    <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                      <span className="font-semibold truncate max-w-[200px]">{user.name}</span>
                      {getRoleBadge(user.role)}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-muted-foreground text-xs font-medium uppercase">Email</p>
                        <p className="text-sm break-all">{user.email}</p>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRoleDialog(user)}
                          className="h-8"
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Tipo
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPasswordDialog(user)}
                          className="h-8"
                        >
                          <Key className="h-4 w-4 mr-1" />
                          Senha
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* DESKTOP VIEW: Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Buscando...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-gray-500"
                      >
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(user)}
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil mr-1"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRoleDialog(user)}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Tipo
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPasswordDialog(user)}
                          >
                            <Key className="h-4 w-4 mr-1" />
                            Senha
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUserForEnrollments(user);
                              setIsEnrollmentsDialogOpen(true);
                            }}
                            title="Ver Inscrições"
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Histórico
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* COMPONENTE DE PAGINAÇÃO */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Total: {pagination?.total || 0} usuário(s)
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((old) => Math.max(old - 1, 1));
                    }}
                    disabled={page === 1}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-4 text-sm">
                    Página {pagination?.page} de {pagination?.pages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination && page < pagination.pages) {
                        setPage((old) => old + 1);
                      }
                    }}
                    disabled={!pagination || page >= pagination.pages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para alterar tipo de usuário */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Tipo de Usuário</DialogTitle>
            <DialogDescription>
              Alterando tipo para: <strong>{selectedUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Usuário</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Usuário</SelectItem>
                  <SelectItem value="TEACHER">Professor</SelectItem>
                  <SelectItem value="CHECKIN_COORDINATOR">
                    Coordenador de Check-in
                  </SelectItem>
                  <SelectItem value="ORGANIZER">Organizador</SelectItem>
                  <SelectItem value="GESTOR_ESCOLA">
                    Gestor Educacional
                  </SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRoleChange} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE EDIÇÃO DE USUÁRIO */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize o nome ou email do usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="email@exemplo.com"
                type="email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Dialog para redefinir senha */}
      < Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Redefinindo senha para: <strong>{selectedUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePasswordReset}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Redefinindo..." : "Redefinir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para criar uma nova conta manualmente.
            </DialogDescription>
          </DialogHeader>
          <AdminUserRegister
            onSuccess={() => {
              setIsRegisterDialogOpen(false);
              queryClient.invalidateQueries(["admin-users"]);
            }}
            onCancel={() => setIsRegisterDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para Histórico de Inscrições */}
      <Dialog open={isEnrollmentsDialogOpen} onOpenChange={setIsEnrollmentsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Inscrições</DialogTitle>
            <DialogDescription>
              Eventos participados por <strong>{selectedUserForEnrollments?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          {isLoadingEnrollments ? (
            <div className="py-8 text-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Carregando histórico...</p>
            </div>
          ) : userEnrollments && userEnrollments.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check-in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.eventId}>
                      <TableCell className="font-medium">{enrollment.eventTitle}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(enrollment.eventDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="w-3 h-3 mr-1" />
                          {enrollment.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        {enrollment.status === "APPROVED" ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none">Confirmado</Badge>
                        ) : enrollment.status === "PENDING" ? (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Pendente</Badge>
                        ) : (
                          <Badge variant="destructive">Cancelado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {enrollment.checkInTime ? (
                          <div className="flex items-center text-green-600 font-medium text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(enrollment.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center bg-gray-50 rounded-lg border border-dashed">
              <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma inscrição encontrada</p>
              <p className="text-sm text-gray-400">Este usuário ainda não se inscreveu em eventos.</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollmentsDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default UserManagement;
