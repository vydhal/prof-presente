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
  DialogTrigger,
  DialogDescription,
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
import { Plus, Edit, Trash2, Upload } from "lucide-react";

const WorkplaceManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    city: "",
    state: "",
  });

  // NOVO: Estados para o dialog de importação
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);

  // Hook para buscar as localidades
  const { data, isLoading } = useQuery({
    queryKey: ["workplaces"],
    queryFn: async () => {
      const response = await api.get("/workplaces?limit=200"); // Aumentando o limite
      return response.data.workplaces;
    },
  });

  // Hooks de Mutação (Criar, Atualizar, Deletar)
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries(["workplaces"]);
      setIsDialogOpen(false);
      setEditingWorkplace(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Ocorreu um erro");
    },
  };

  const createMutation = useMutation({
    mutationFn: (newData) => api.post("/workplaces", newData),
    ...mutationOptions,
    onSuccess: () => {
      toast.success("Localidade criada com sucesso!");
      mutationOptions.onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/workplaces/${id}`, data),
    ...mutationOptions,
    onSuccess: () => {
      toast.success("Localidade atualizada com sucesso!");
      mutationOptions.onSuccess();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/workplaces/${id}`),
    ...mutationOptions,
    onSuccess: () => {
      toast.success("Localidade excluída com sucesso!");
      queryClient.invalidateQueries(["workplaces"]); // Apenas invalida, sem fechar dialog
    },
  });

  // NOVO: Mutação para importar o CSV
  const importMutation = useMutation({
    mutationFn: (formData) =>
      api.post("/workplaces/import/csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: (data) => {
      const { imported, skipped, total } = data.data.summary;
      toast.success("Importação Concluída!", {
        description: `${imported} de ${total} localidades importadas. ${skipped} ignoradas (duplicadas ou com erro).`,
      });
      queryClient.invalidateQueries(["workplaces"]);
      setIsImportDialogOpen(false);
      setCsvFile(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao importar arquivo.");
    },
  });

  // Funções de manipulação do formulário
  const resetForm = () => {
    setFormData({ name: "", description: "", city: "", state: "" });
  };

  const handleOpenDialog = (workplace = null) => {
    if (workplace) {
      setEditingWorkplace(workplace);
      setFormData({
        name: workplace.name,
        description: workplace.description || "",
        city: workplace.city,
        state: workplace.state,
      });
    } else {
      setEditingWorkplace(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingWorkplace) {
      updateMutation.mutate({ id: editingWorkplace.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // NOVO: Função para lidar com o envio do CSV
  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error("Por favor, selecione um arquivo CSV.");
      return;
    }
    const formData = new FormData();
    formData.append("file", csvFile);
    importMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciar Localidades</CardTitle>
          <CardDescription>
            Adicione, edite ou remova unidades educacionais.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Importar CSV
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Nova Localidade
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cidade/Estado</TableHead>
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
              data?.map((workplace) => (
                <TableRow key={workplace.id}>
                  <TableCell className="font-medium">
                    {workplace.name}
                  </TableCell>
                  <TableCell>{`${workplace.city}/${workplace.state}`}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(workplace)}
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
                            Esta ação não pode ser desfeita. Isso irá remover
                            permanentemente a localidade.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(workplace.id)}
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
                {editingWorkplace ? "Editar Localidade" : "Nova Localidade"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Unidade</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado (UF)</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    required
                    maxLength={2}
                  />
                </div>
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

        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Importar Localidades via CSV</DialogTitle>
              <DialogDescription>
                Selecione um arquivo .csv com as colunas: name, description,
                city, state.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleImportSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="csvFile">Arquivo CSV</Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={importMutation.isPending}>
                  {importMutation.isPending ? "Importando..." : "Importar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default WorkplaceManagement;
