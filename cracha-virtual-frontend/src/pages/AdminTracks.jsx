import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tracksAPI, eventsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Search, Link as LinkIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const AdminTracks = () => {
    const queryClient = useQueryClient();
    // const { notify } = useNotification(); // Removido
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTrack, setEditingTrack] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Estados do formulário
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        eventIds: []
    });

    // Buscar todas as trilhas
    const { data: tracks, isLoading: loadingTracks } = useQuery({
        queryKey: ['admin-tracks'],
        queryFn: async () => {
            const resp = await tracksAPI.getAll();
            return Array.isArray(resp.data) ? resp.data : [];
        }
    });

    // Buscar todos os eventos (para vincular)
    const { data: eventsData, isLoading: loadingEvents } = useQuery({
        queryKey: ['admin-events-list'],
        queryFn: async () => {
            const resp = await eventsAPI.getAll({ limit: 100 });
            return resp.data.events;
        }
    });

    // Mutação para criar/atualizar
    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (editingTrack) return tracksAPI.update(editingTrack.id, data);
            return tracksAPI.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-tracks']);
            toast.success(editingTrack ? 'Trilha atualizada!' : 'Trilha criada!');
            closeDialog();
        },
        onError: (err) => {
            const errorMsg = err.response?.data?.details
                ? `${err.response.data.error}: ${err.response.data.details}`
                : (err.response?.data?.error || 'Erro ao salvar trilha');
            toast.error(errorMsg);
        }
    });

    // Mutação para deletar
    const deleteMutation = useMutation({
        mutationFn: (id) => tracksAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-tracks']);
            toast.success('Trilha removida!');
        }
    });

    const openDialog = (track = null) => {
        if (track) {
            setEditingTrack(track);
            // O track da API vem com events: [{ eventId, order, event: {...} }]
            setFormData({
                title: track.title,
                description: track.description,
                imageUrl: track.imageUrl || '',
                eventIds: track.events?.map(e => e.eventId) || []
            });
        } else {
            setEditingTrack(null);
            setFormData({ title: '', description: '', imageUrl: '', eventIds: [] });
            setSelectedFile(null);
            setImagePreview(null);
        }
        setIsDialogOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingTrack(null);
        setSelectedFile(null);
        setImagePreview(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('eventIds', JSON.stringify(formData.eventIds));

        if (selectedFile) {
            data.append('trackThumbnail', selectedFile);
        } else if (formData.imageUrl) {
            data.append('imageUrl', formData.imageUrl);
        }

        saveMutation.mutate(data);
    };

    const toggleEventSelection = (eventId) => {
        setFormData(prev => {
            const isSelected = prev.eventIds.includes(eventId);
            if (isSelected) {
                return { ...prev, eventIds: prev.eventIds.filter(id => id !== eventId) };
            } else {
                return { ...prev, eventIds: [...prev.eventIds, eventId] };
            }
        });
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Gerenciar Trilhas</h1>
                    <p className="text-slate-500">Crie e organize trilhas de formação continuada.</p>
                </div>
                <Button onClick={() => openDialog()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6">
                    <Plus className="w-5 h-5 mr-2" /> Nova Trilha
                </Button>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 overflow-hidden rounded-2xl">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow>
                            <TableHead className="font-bold">Trilha</TableHead>
                            <TableHead className="font-bold">Eventos</TableHead>
                            <TableHead className="font-bold">Criada em</TableHead>
                            <TableHead className="text-right font-bold">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingTracks ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                                </TableCell>
                            </TableRow>
                        ) : tracks?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10 text-slate-500 italic">
                                    Nenhuma trilha cadastrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tracks?.map((track) => (
                                <TableRow key={track.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                                                {track.imageUrl ? (
                                                    <img src={track.imageUrl} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <LinkIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{track.title}</div>
                                                <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">{track.description}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-bold">
                                            {track._count.events} Etapas
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {new Date(track.createdAt).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openDialog(track)} className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (confirm('Deseja realmente excluir esta trilha?')) {
                                                        deleteMutation.mutate(track.id);
                                                    }
                                                }}
                                                className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* DIALOG DE CRIAÇÃO/EDIÇÃO */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl sm:rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">{editingTrack ? 'Editar Trilha' : 'Nova Trilha'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Título</label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ex: Formação em IA para Professores"
                                    className="rounded-xl border-slate-200"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Descrição</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descreva o objetivo da trilha..."
                                    className="rounded-xl border-slate-200 min-h-[100px]"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Imagem da Trilha (Opcional)</label>
                                <div className="flex items-center gap-4">
                                    {(imagePreview || formData.imageUrl) && (
                                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-100 flex-shrink-0">
                                            <img src={imagePreview || formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <Input
                                            type="file"
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="rounded-xl border-slate-200 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">PNG, JPG ou WEBP até 5MB.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Vincular Eventos ({formData.eventIds.length})</label>
                                </div>

                                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                                    <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                        {loadingEvents ? (
                                            <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /></div>
                                        ) : eventsData?.map((event) => {
                                            const isSelected = formData.eventIds.includes(event.id);
                                            return (
                                                <div
                                                    key={event.id}
                                                    onClick={() => toggleEventSelection(event.id)}
                                                    className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-700'}`}>
                                                            {isSelected && <Plus className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold line-clamp-1">{event.title}</div>
                                                            <div className="text-xs text-slate-500">{new Date(event.startDate).toLocaleDateString('pt-BR')}</div>
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <Badge className="bg-blue-600 text-white border-none text-[10px]">Selecionado</Badge>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="ghost" onClick={closeDialog} className="rounded-xl font-bold">Cancelar</Button>
                            <Button
                                type="submit"
                                disabled={saveMutation.isLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8"
                            >
                                {saveMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingTrack ? 'Salvar Alterações' : 'Criar Trilha')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminTracks;
