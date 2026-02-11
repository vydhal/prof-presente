import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bannersAPI } from "../lib/api";
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
import { Textarea } from "./ui/textarea";
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
import {
    Plus,
    Trash2,
    Edit,
    Image as ImageIcon,
    ExternalLink,
    Upload,
} from "lucide-react";
import { toast } from "sonner";
import { getAssetUrl } from "../lib/utils";
import { Switch } from "./ui/switch";

const BannerManagement = () => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const [form, setForm] = useState({
        title: "",
        description: "",
        linkUrl: "",
        order: "0",
        isActive: true,
    });

    const { data: banners, isLoading } = useQuery({
        queryKey: ["admin-banners"],
        queryFn: async () => {
            const response = await bannersAPI.getAll();
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (formData) => bannersAPI.create(formData),
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-banners"]);
            toast.success("Banner criado com sucesso!");
            closeDialog();
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao criar banner");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }) => bannersAPI.update(id, formData),
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-banners"]);
            toast.success("Banner atualizado com sucesso!");
            closeDialog();
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao atualizar banner");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => bannersAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["admin-banners"]);
            toast.success("Banner excluído com sucesso!");
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao excluir banner");
        },
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("title", form.title);
        formData.append("description", form.description);
        formData.append("linkUrl", form.linkUrl);
        formData.append("order", form.order);
        formData.append("isActive", form.isActive);
        if (imageFile) {
            formData.append("bannerThumbnail", imageFile);
        }

        if (editingBanner) {
            updateMutation.mutate({ id: editingBanner.id, formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (banner) => {
        setEditingBanner(banner);
        setForm({
            title: banner.title,
            description: banner.description || "",
            linkUrl: banner.linkUrl || "",
            order: banner.order.toString(),
            isActive: banner.isActive,
        });
        setPreviewUrl(getAssetUrl(banner.imageUrl));
        setIsDialogOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm("Tem certeza que deseja excluir este banner?")) {
            deleteMutation.mutate(id);
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingBanner(null);
        setPreviewUrl(null);
        setImageFile(null);
        setForm({
            title: "",
            description: "",
            linkUrl: "",
            order: "0",
            isActive: true,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de Banners</h2>
                    <p className="text-muted-foreground">Adicione e gerencie os banners da página inicial.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Novo Banner
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingBanner ? "Editar Banner" : "Novo Banner"}</DialogTitle>
                            <DialogDescription>
                                Preencha os dados do banner. Clique em salvar quando terminar.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Título</Label>
                                <Input
                                    id="title"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="Título do banner"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Descrição (Opcional)</Label>
                                <Textarea
                                    id="description"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Breve texto sobre o banner"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="linkUrl">Link (URL)</Label>
                                <Input
                                    id="linkUrl"
                                    value={form.linkUrl}
                                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                                    placeholder="https://exemplo.com/evento"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="order">Ordem</Label>
                                    <Input
                                        id="order"
                                        type="number"
                                        value={form.order}
                                        onChange={(e) => setForm({ ...form, order: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 pt-8">
                                    <Switch
                                        id="is-active"
                                        checked={form.isActive}
                                        onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                                    />
                                    <Label htmlFor="is-active">Ativo</Label>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Imagem do Banner</Label>
                                <div className="flex flex-col items-center gap-4">
                                    {previewUrl ? (
                                        <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden border">
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full aspect-[21/9] bg-muted rounded-lg flex flex-col items-center justify-center border border-dashed text-muted-foreground">
                                            <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                                            <p className="text-xs">Nenhuma imagem selecionada</p>
                                        </div>
                                    )}
                                    <div className="flex w-full items-center justify-center">
                                        <Label
                                            htmlFor="banner-image"
                                            className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            {imageFile ? "Trocar Imagem" : "Selecionar Imagem"}
                                            <Input
                                                id="banner-image"
                                                type="file"
                                                className="sr-only"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                        </Label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={closeDialog}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {editingBanner ? "Atualizar" : "Criar"} Banner
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Imagem</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Ordem</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Carregando banners...
                                    </TableCell>
                                </TableRow>
                            ) : banners?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Nenhum banner cadastrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                banners?.map((banner) => (
                                    <TableRow key={banner.id}>
                                        <TableCell>
                                            <img
                                                src={getAssetUrl(banner.imageUrl)}
                                                alt={banner.title}
                                                className="w-20 aspect-video object-cover rounded border"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{banner.title}</div>
                                            {banner.description && (
                                                <div className="text-xs text-muted-foreground line-clamp-1">
                                                    {banner.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 font-mono">{banner.order}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${banner.isActive
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    }`}
                                            >
                                                {banner.isActive ? "Ativo" : "Inativo"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {banner.linkUrl && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                        title="Ver Link"
                                                    >
                                                        <a href={banner.linkUrl} target="_blank" rel="noreferrer">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(banner)}
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(banner.id)}
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                                    title="Excluir"
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
};

export default BannerManagement;
