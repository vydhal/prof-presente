import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsAPI } from "../lib/api";
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
import { toast } from "sonner";
import { getAssetUrl } from "../lib/utils";
import { Upload, Image as ImageIcon, Globe, Type } from "lucide-react";

const BrandingManagement = () => {
    const queryClient = useQueryClient();
    const [platformName, setPlatformName] = useState("");
    const [logoPreview, setLogoPreview] = useState(null);
    const [faviconPreview, setFaviconPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [faviconFile, setFaviconFile] = useState(null);

    const { data: settings, isLoading } = useQuery({
        queryKey: ["system-settings"],
        queryFn: async () => {
            const response = await settingsAPI.get();
            return response.data;
        },
    });

    useEffect(() => {
        if (settings) {
            setPlatformName(settings.platformName || "");
            if (settings.logoUrl) setLogoPreview(getAssetUrl(settings.logoUrl));
            if (settings.faviconUrl) setFaviconPreview(getAssetUrl(settings.faviconUrl));
        }
    }, [settings]);

    const mutation = useMutation({
        mutationFn: (formData) => settingsAPI.update(formData),
        onSuccess: () => {
            queryClient.invalidateQueries(["system-settings"]);
            // Trigger a custom event to update branding elsewhere
            window.dispatchEvent(new Event("branding:updated"));
            toast.success("Personalização atualizada com sucesso!");
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao atualizar personalização");
        },
    });

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleFaviconChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFaviconFile(file);
            setFaviconPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("platformName", platformName);
        if (logoFile) formData.append("logo", logoFile);
        if (faviconFile) formData.append("favicon", faviconFile);

        mutation.mutate(formData);
    };

    if (isLoading) {
        return <div className="p-8 text-center">Carregando configurações...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Personalização da Plataforma</h2>
                <p className="text-muted-foreground">Customize a identidade visual do seu sistema.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Type className="h-5 w-5 text-blue-500" />
                            Identificação
                        </CardTitle>
                        <CardDescription>Nome principal do sistema que aparecerá em títulos e abas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="platformName">Nome da Plataforma</Label>
                            <Input
                                id="platformName"
                                value={platformName}
                                onChange={(e) => setPlatformName(e.target.value)}
                                placeholder="Ex: SEDUC Eventos"
                                required
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-blue-500" />
                            Logotipo
                        </CardTitle>
                        <CardDescription>Logo principal exibida no cabeçalho e login.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col items-center gap-4">
                            {logoPreview ? (
                                <div className="relative h-20 w-auto bg-slate-900/5 dark:bg-white/5 rounded-lg p-2 border flex items-center justify-center">
                                    <img
                                        src={logoPreview}
                                        alt="Logo Preview"
                                        className="max-h-full w-auto object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="h-20 w-full bg-muted rounded-lg flex flex-col items-center justify-center border border-dashed">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground opacity-20" />
                                    <span className="text-xs text-muted-foreground">Sem logo</span>
                                </div>
                            )}

                            <div className="w-full">
                                <Label
                                    htmlFor="logo-upload"
                                    className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {logoFile ? "Trocar Logo" : "Selecionar Logo"}
                                    <Input
                                        id="logo-upload"
                                        type="file"
                                        className="sr-only"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                    />
                                </Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-500" />
                            Favicon
                        </CardTitle>
                        <CardDescription>Ícone exibido na aba do navegador (recomendado .ico ou .png 32x32).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col items-center gap-4">
                            {faviconPreview ? (
                                <div className="h-12 w-12 bg-slate-900/5 dark:bg-white/5 rounded-lg p-1 border flex items-center justify-center">
                                    <img
                                        src={faviconPreview}
                                        alt="Favicon Preview"
                                        className="h-8 w-8 object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="h-12 w-12 bg-muted rounded-lg flex flex-col items-center justify-center border border-dashed">
                                    <Globe className="h-6 w-6 text-muted-foreground opacity-20" />
                                </div>
                            )}

                            <div className="w-full">
                                <Label
                                    htmlFor="favicon-upload"
                                    className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {faviconFile ? "Trocar Ícone" : "Selecionar Ícone"}
                                    <Input
                                        id="favicon-upload"
                                        type="file"
                                        className="sr-only"
                                        accept="image/x-icon,image/png,image/svg+xml"
                                        onChange={handleFaviconChange}
                                    />
                                </Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 flex justify-end">
                    <Button type="submit" disabled={mutation.isPending} className="px-8 font-bold">
                        {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default BrandingManagement;
