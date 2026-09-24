import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesAPI } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { HexColorPicker } from "react-colorful";

export default function AdminCategories() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        color: "#137fec"
    });
    const [showColorPicker, setShowColorPicker] = useState(false);

    const { data: categories, isLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const response = await categoriesAPI.getAll();
            return response.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: (data) => categoriesAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(["categories"]);
            toast.success("Categoria criada com sucesso!");
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao criar categoria");
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => categoriesAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(["categories"]);
            toast.success("Categoria atualizada com sucesso!");
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao atualizar categoria");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => categoriesAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["categories"]);
            toast.success("Categoria removida com sucesso!");
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao remover categoria");
        }
    });

    const resetForm = () => {
        setFormData({ name: "", color: "#137fec" });
        setEditingCategory(null);
        setShowColorPicker(false);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            color: category.color || "#137fec"
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (category) => {
        if (category._count?.events > 0) {
            toast.error("Não é possível remover categoria com eventos vinculados.");
            return;
        }
        if (window.confirm("Deseja realmente remover esta categoria?")) {
            deleteMutation.mutate(category.id);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flexjustify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>
                    <p className="text-muted-foreground">Crie e edite as categorias dos eventos</p>
                </div>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                        </DialogTitle>
                        <DialogDescription>
                            Preencha os dados da categoria abaixo.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Categoria</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Cor da Tag</Label>
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-10 h-10 rounded-md border shadow-sm cursor-pointer"
                                    style={{ backgroundColor: formData.color }}
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                />
                                <Input
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    placeholder="#000000"
                                    className="flex-1"
                                />
                            </div>
                            {showColorPicker && (
                                <div className="mt-2 p-2 border rounded-md inline-block bg-white shadow-lg z-50">
                                    <HexColorPicker color={formData.color} onChange={(val) => setFormData({ ...formData, color: val })} />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                {editingCategory ? "Salvar Alterações" : "Criar Categoria"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cor</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Eventos Vinculados</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4">Carregando...</TableCell>
                                </TableRow>
                            ) : categories?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                        Nenhuma categoria encontrada
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories?.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>
                                            <div
                                                className="w-6 h-6 rounded-full border shadow-sm"
                                                style={{ backgroundColor: category.color }}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell>{category._count?.events || 0}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(category)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(category)}
                                                    disabled={category._count?.events > 0}
                                                >
                                                    <Trash2 className="h-4 w-4" />
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
        </div>
    );
}
