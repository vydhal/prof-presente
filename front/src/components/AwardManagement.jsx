import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getAssetUrl } from "../lib/utils"; // NOVO: Para resolver a URL da imagem


const AwardManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAward, setEditingAward] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", criteria: "" });
  const [insigniaFile, setInsigniaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // 1. Busca todas as premiações para exibir na tabela
  const { data: awards, isLoading } = useQuery({
    queryKey: ["admin-awards"],
    queryFn: () => api.get("/awards").then((res) => res.data.awards),
  });

  // 2. Mutação para criar ou atualizar uma premiação
  const createOrUpdateMutation = useMutation({
    mutationFn: (formData) => {
      return editingAward
        ? api.put(`/awards/${editingAward.id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        : api.post("/awards", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
    },
    onSuccess: () => {
      toast.success(
        `Premiação ${editingAward ? "atualizada" : "criada"} com sucesso!`
      );
      queryClient.invalidateQueries(["admin-awards"]);
      setIsDialogOpen(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Erro ao salvar premiação."),
  });

  // 3. Mutação para deletar uma premiação
  const deleteMutation = useMutation({
    mutationFn: (awardId) => api.delete(`/awards/${awardId}`),
    onSuccess: () => {
      toast.success("Premiação deletada com sucesso!");
      queryClient.invalidateQueries(["admin-awards"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Erro ao deletar premiação."),
  });

  const handleOpenDialog = (award = null) => {
    setEditingAward(award);
    if (award) {
      setForm({
        name: award.name,
        description: award.description,
        criteria: award.criteria,
      });
      setPreviewUrl(award.imageUrl ? getAssetUrl(award.imageUrl) : null);
    } else {
      setForm({ name: "", description: "", criteria: "" });
      setPreviewUrl(null);
    }
    setInsigniaFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (awardId) => {
    if (window.confirm("Tem certeza que deseja excluir esta premiação?")) {
      deleteMutation.mutate(awardId);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInsigniaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("criteria", form.criteria);
    if (insigniaFile) {
      formData.append("imageUrl", insigniaFile);
    }
    createOrUpdateMutation.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Premiações</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Nova Premiação
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Critério</TableHead>
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
                awards?.map((award) => (
                  <TableRow key={award.id}>
                    <TableCell className="font-medium">{award.name}</TableCell>
                    <TableCell>{award.criteria}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(award)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(award.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAward ? "Editar Premiação" : "Criar Nova Premiação"}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes da premiação abaixo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Nome da Premiação"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Textarea
              placeholder="Descrição"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <Textarea
              placeholder="Critério (Ex: Realizar 5 check-ins ou mais)"
              value={form.criteria}
              onChange={(e) => setForm({ ...form, criteria: e.target.value })}
              required
            />

            {/* ALTERAÇÃO: Campo de upload de arquivo */}
            <div className="space-y-2">
              <Label htmlFor="insignia-image">Imagem da Insígnia</Label>
              <Input
                id="insignia-image"
                type="file"
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/svg+xml"
              />
            </div>

            {/* NOVO: Pré-visualização da imagem */}
            {previewUrl && (
              <div className="flex flex-col items-center p-4 border rounded-lg bg-gray-50">
                <img
                  src={previewUrl}
                  alt="Pré-visualização"
                  className="h-24 w-24 object-contain"
                />
                <p className="text-xs text-gray-500 mt-2">Pré-visualização</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createOrUpdateMutation.isPending}>
                {createOrUpdateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AwardManagement;
