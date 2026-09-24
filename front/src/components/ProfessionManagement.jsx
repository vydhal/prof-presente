import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
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
} from "./ui/alert-dialog";
import { Plus, Edit, Trash2 } from "lucide-react";

const ProfessionManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfession, setEditingProfession] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  // Hook para buscar as profissões
  const { data, isLoading } = useQuery({
    queryKey: ["professions"],
    queryFn: async () => {
      // ASSUMINDO QUE ESTE ENDPOINT SERÁ CRIADO
      const response = await api.get("/professions?limit=200");
      return response.data.professions;
    },
  });

  // Hooks de Mutação
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries(["professions"]);
      setIsDialogOpen(false);
      setEditingProfession(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Ocorreu um erro");
    },
  };

  const createMutation = useMutation({
    mutationFn: (newData) => api.post("/professions", newData), // ASSUMINDO ROTA
    ...mutationOptions,
    onSuccess: () => {
      toast.success("Profissão criada com sucesso!");
      mutationOptions.onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/professions/${id}`, data), // ASSUMINDO ROTA
    ...mutationOptions,
    onSuccess: () => {
      toast.success("Profissão atualizada com sucesso!");
      mutationOptions.onSuccess();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/professions/${id}`), // ASSUMINDO ROTA
    ...mutationOptions,
    onSuccess: () => {
      toast.success("Profissão excluída com sucesso!");
      queryClient.invalidateQueries(["professions"]);
    },
  });

  // Funções do formulário
  const resetForm = () => setFormData({ name: "", description: "" });

  const handleOpenDialog = (profession = null) => {
    if (profession) {
      setEditingProfession(profession);
      setFormData({
        name: profession.name,
        description: profession.description || "",
      });
    } else {
      setEditingProfession(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProfession) {
      updateMutation.mutate({ id: editingProfession.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciar Profissões</CardTitle>
          <CardDescription>
            Adicione, edite ou remova profissões.
          </CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Nova Profissão
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : (
              data?.map((profession) => (
                <TableRow key={profession.id}>
                  <TableCell className="font-medium">
                    {profession.name}
                  </TableCell>
                  <TableCell>{profession.description}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(profession)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(profession.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Dialog para Criar/Editar */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProfession ? "Editar Profissão" : "Nova Profissão"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Profissão</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProfessionManagement;
