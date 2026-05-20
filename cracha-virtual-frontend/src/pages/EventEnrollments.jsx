import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "../components/ui/card";
import {
    ArrowLeft,
    Mail,
    Search,
    Download,
    MoreHorizontal,
    CheckCircle2,
    XCircle,
    Clock,
    Trash2,
    ArrowRightLeft,
    UserPlus,
    Award,
} from "lucide-react";
import { toast } from "sonner";
import { getAssetUrl } from "../lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";

const EventEnrollments = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 20;

    const [checkinFilter, setCheckinFilter] = useState("ALL");
    const [selectedEnrollments, setSelectedEnrollments] = useState([]);

    useEffect(() => {
        setSelectedEnrollments([]);
    }, [page, debouncedSearch, checkinFilter]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch Event Details
    const { data: event, isLoading: isLoadingEvent } = useQuery({
        queryKey: ["event", id],
        queryFn: async () => {
            const res = await api.get(`/events/${id}`);
            return res.data;
        },
    });

    // Fetch Enrollments
    const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery({
        queryKey: ["event-enrollments", id, page, debouncedSearch],
        queryFn: async () => {
            const res = await api.get(`/enrollments/events/${id}`, {
                params: {
                    page,
                    limit,
                    search: debouncedSearch,
                    checkinStatus: checkinFilter !== "ALL" ? checkinFilter : undefined
                }
            });
            return res.data;
        },
    });

    const enrollments = enrollmentsData?.enrollments || [];
    const pagination = enrollmentsData?.pagination || { page: 1, pages: 1, total: 0 };

    // CSV Export
    const handleExportCSV = async () => {
        try {
            toast.loading("Gerando arquivo CSV...", { id: "export-csv" });
            const response = await api.get(`/enrollments/events/${id}/export`, {
                params: {
                    search: debouncedSearch,
                    checkinStatus: checkinFilter !== "ALL" ? checkinFilter : undefined
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = `inscritos_evento_${id}.csv`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("CSV exportado com sucesso!", { id: "export-csv" });
        } catch (error) {
            console.error("Erro ao exportar CSV:", error);
            toast.error("Erro ao exportar planilha.", { id: "export-csv" });
        }
    };

    // Resend Email Mutation
    const resendEmailMutation = useMutation({
        mutationFn: async (enrollmentId) => {
            await api.post(`/enrollments/${enrollmentId}/resend-confirmation`);
        },
        onSuccess: () => {
            toast.success("E-mail reenviado com sucesso!");
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao reenviar e-mail.");
        },
    });

    const handleResendEmail = (enrollmentId) => {
        if (window.confirm("Deseja reenviar o e-mail de confirmação para este usuário?")) {
            resendEmailMutation.mutate(enrollmentId);
        }
    };

    // Delete Participant Mutation
    const deleteParticipantMutation = useMutation({
        mutationFn: async (enrollmentId) => {
            await api.delete(`/enrollments/${enrollmentId}/permanent`);
        },
        onSuccess: () => {
            toast.success("Inscrição excluída permanentemente!");
            queryClient.invalidateQueries(["event-enrollments", id]);
            queryClient.invalidateQueries(["event", id]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao excluir participante.");
        },
    });

    const handleDeleteParticipant = (enrollmentId) => {
        if (window.confirm("ATENÇÃO: Isso excluirá permanentemente a inscrição e liberará a vaga. Esta ação não pode ser desfeita. Deseja continuar?")) {
            deleteParticipantMutation.mutate(enrollmentId);
        }
    };

    // Send Individual Certificate Logic
    const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
    const [certificateUser, setCertificateUser] = useState(null);

    const sendCertificateMutation = useMutation({
        mutationFn: async ({ eventId, userId }) => {
            const res = await api.post(`/events/${eventId}/send-certificate-individual/${userId}`);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Certificado enviado com sucesso!");
            setIsCertificateModalOpen(false);
            setCertificateUser(null);
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao enviar certificado.");
        },
    });

    const handleSendCertificate = (enrollment) => {
        setCertificateUser(enrollment.user);
        setIsCertificateModalOpen(true);
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedEnrollments(enrollments.map(e => e.id));
        } else {
            setSelectedEnrollments([]);
        }
    };

    const handleSelectOne = (checked, enrollmentId) => {
        if (checked) {
            setSelectedEnrollments(prev => [...prev, enrollmentId]);
        } else {
            setSelectedEnrollments(prev => prev.filter(id => id !== enrollmentId));
        }
    };

    const handleBulkMove = () => {
        if (selectedEnrollments.length === 0) return;
        setIsMoveModalOpen(true);
        setSelectedEnrollment(null); // indica que é em massa
    };

    // Move Participant Logic
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [targetEventId, setTargetEventId] = useState("");
    const [eventSearch, setEventSearch] = useState("");

    const { data: eventsList } = useQuery({
        queryKey: ["admin-events-list", eventSearch],
        queryFn: async () => {
            const res = await api.get("/events", {
                params: { search: eventSearch, limit: 5, managedOnly: true }
            });
            return res.data.events;
        },
        enabled: isMoveModalOpen
    });

    const moveParticipantMutation = useMutation({
        mutationFn: async ({ enrollmentId, targetEventId }) => {
            if (enrollmentId === "BULK") {
                await Promise.all(
                    selectedEnrollments.map((paramId) =>
                        api.patch(`/enrollments/${paramId}/move`, { targetEventId })
                    )
                );
            } else {
                await api.patch(`/enrollments/${enrollmentId}/move`, { targetEventId });
            }
        },
        onSuccess: () => {
            toast.success(selectedEnrollment ? "Participante movido com sucesso!" : "Participantes movidos com sucesso!");
            setIsMoveModalOpen(false);
            setTargetEventId("");
            setSelectedEnrollments([]);
            queryClient.invalidateQueries(["event-enrollments", id]);
            queryClient.invalidateQueries(["event", id]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao mover participante.");
        },
    });

    const handleMoveParticipant = (enrollment) => {
        setSelectedEnrollment(enrollment);
        setIsMoveModalOpen(true);
    };

    // Add Participant Logic
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [debouncedUserSearch, setDebouncedUserSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedUserSearch(userSearch);
        }, 500);
        return () => clearTimeout(timer);
    }, [userSearch]);

    const { data: usersList, isLoading: isLoadingUsers } = useQuery({
        queryKey: ["admin-users-search", debouncedUserSearch],
        queryFn: async () => {
            if (!debouncedUserSearch) return [];
            const res = await api.get("/users", {
                params: { search: debouncedUserSearch, limit: 10 }
            });
            return res.data.users;
        },
        enabled: isAddModalOpen && debouncedUserSearch.length > 2
    });

    const adminEnrollMutation = useMutation({
        mutationFn: async (userId) => {
            await api.post(`/enrollments/admin/enroll`, { eventId: id, userId });
        },
        onSuccess: () => {
            toast.success("Usuário inscrito com sucesso!");
            queryClient.invalidateQueries(["event-enrollments", id]);
            queryClient.invalidateQueries(["event", id]);
            // Não fechamos o modal para permitir adicionar mais pessoas seguidamente
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao inscrever usuário.");
        },
    });

    const handleAdminEnroll = (userId) => {
        adminEnrollMutation.mutate(userId);
    };

    if (isLoadingEvent) {
        return <div className="p-8 text-center">Carregando evento...</div>;
    }

    if (!event) {
        return <div className="p-8 text-center text-red-500">Evento não encontrado.</div>;
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
                    <p className="text-muted-foreground">Gerenciamento de Inscrições</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Participantes ({pagination.total})</CardTitle>
                            <CardDescription>
                                Visualize e gerencie os inscritos neste evento.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {selectedEnrollments.length > 0 && (
                                <Button variant="secondary" size="sm" onClick={handleBulkMove} className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
                                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                                    Mover ({selectedEnrollments.length})
                                </Button>
                            )}
                            <Button variant="default" size="sm" onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Adicionar Participante
                            </Button>
                            <select
                                value={checkinFilter}
                                onChange={(e) => setCheckinFilter(e.target.value)}
                                className="px-3 py-2 border rounded-md bg-background text-sm text-muted-foreground outline-none"
                            >
                                <option value="ALL">Todos os Status</option>
                                <option value="WITH_CHECKIN">Com Check-in</option>
                                <option value="WITHOUT_CHECKIN">Sem Check-in</option>
                            </select>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome ou email..."
                                    className="pl-8 w-[250px] or w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" onClick={handleExportCSV}>
                                <Download className="h-4 w-4 mr-2" />
                                Exportar CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingEnrollments ? (
                        <div className="p-8 text-center">Carregando inscrições...</div>
                    ) : enrollments.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">Nenhuma inscrição encontrada{debouncedSearch && " para a busca atual"}.</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={enrollments.length > 0 && selectedEnrollments.length === enrollments.length}
                                                    onCheckedChange={handleSelectAll}
                                                    aria-label="Selecionar tudo"
                                                />
                                            </TableHead>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Check-in</TableHead>
                                            <TableHead>Data Inscrição</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {enrollments.map((enrollment) => (
                                            <TableRow key={enrollment.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedEnrollments.includes(enrollment.id)}
                                                        onCheckedChange={(checked) => handleSelectOne(checked, enrollment.id)}
                                                        aria-label={`Selecionar ${enrollment.user.name}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{enrollment.user.name}</TableCell>
                                                <TableCell>{enrollment.user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={enrollment.status === 'APPROVED' ? 'default' : 'secondary'}>
                                                        {enrollment.status === 'APPROVED' ? 'Confirmado' : enrollment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {enrollment.checkInTime ? (
                                                        <span className="text-green-600 font-medium whitespace-nowrap text-sm">
                                                            Presente ({new Date(enrollment.checkInTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })})
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{new Date(enrollment.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {enrollment.status === 'APPROVED' && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleResendEmail(enrollment.id)}
                                                                disabled={resendEmailMutation.isPending}
                                                                title="Reenviar E-mail de Confirmação"
                                                            >
                                                                <Mail className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {enrollment.status === 'APPROVED' && enrollment.checkInTime && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                                                onClick={() => handleSendCertificate(enrollment)}
                                                                disabled={sendCertificateMutation.isPending}
                                                                title="Enviar Certificado Individual"
                                                            >
                                                                <Award className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-blue-600 hover:text-blue-700"
                                                            onClick={() => handleMoveParticipant(enrollment)}
                                                            title="Mover Participante"
                                                        >
                                                            <ArrowRightLeft className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() => handleDeleteParticipant(enrollment.id)}
                                                            disabled={deleteParticipantMutation.isPending}
                                                            title="Excluir Participante (Libera Vaga)"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {pagination.pages > 1 && (
                                <div className="flex items-center justify-between py-4">
                                    <div className="text-sm text-muted-foreground">
                                        Página {pagination.page} de {pagination.pages}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            Anterior
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                                            disabled={page === pagination.pages}
                                        >
                                            Próxima
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Move Participant Modal */}
            <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Mover Participante</DialogTitle>
                        <CardDescription>
                            {selectedEnrollment ? (
                                <>Selecione o evento de destino para <strong>{selectedEnrollment?.user.name}</strong>.</>
                            ) : (
                                <>Selecione o evento de destino para os <strong>{selectedEnrollments.length} participantes selecionados</strong>.</>
                            )}
                        </CardDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Buscar Evento de Destino</label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Nome do evento..."
                                    className="pl-8"
                                    value={eventSearch}
                                    onChange={(e) => setEventSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Selecione na lista:</label>
                            <div className="border rounded-md max-h-[200px] overflow-y-auto">
                                {eventsList?.map((ev) => (
                                    <div
                                        key={ev.id}
                                        className={`p-3 cursor-pointer hover:bg-muted border-b last:border-0 flex justify-between items-center ${targetEventId === ev.id ? 'bg-muted border-primary' : ''}`}
                                        onClick={() => setTargetEventId(ev.id)}
                                    >
                                        <div>
                                            <p className="font-medium text-sm">{ev.title}</p>
                                            <p className="text-xs text-muted-foreground">{ev.location}</p>
                                        </div>
                                        {targetEventId === ev.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                    </div>
                                ))}
                                {eventsList?.length === 0 && (
                                    <p className="p-4 text-center text-sm text-muted-foreground">Nenhum evento encontrado.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsMoveModalOpen(false)}>Cancelar</Button>
                        <Button
                            disabled={!targetEventId || moveParticipantMutation.isPending}
                            onClick={() => moveParticipantMutation.mutate({
                                enrollmentId: selectedEnrollment ? selectedEnrollment.id : "BULK",
                                targetEventId
                            })}
                        >
                            {moveParticipantMutation.isPending ? "Movendo..." : "Confirmar Mudança"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Participant Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Participante ao Evento</DialogTitle>
                        <CardDescription>
                            Busque por pessoas já cadastradas na plataforma para inscrevê-las neste evento.
                        </CardDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Buscar Usuário</label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Nome ou e-mail (mínimo 3 caracteres)..."
                                    className="pl-8"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Resultados da busca:</label>
                            <div className="border rounded-md max-h-[300px] overflow-y-auto">
                                {!debouncedUserSearch || debouncedUserSearch.length < 3 ? (
                                    <p className="p-8 text-center text-sm text-muted-foreground">Digite pelo menos 3 caracteres para buscar.</p>
                                ) : isLoadingUsers ? (
                                    <p className="p-8 text-center text-sm text-muted-foreground">Buscando...</p>
                                ) : usersList?.length === 0 ? (
                                    <p className="p-8 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
                                ) : (
                                    usersList?.map((u) => {
                                        const isAlreadyEnrolled = enrollments.some(e => e.userId === u.id);
                                        return (
                                            <div
                                                key={u.id}
                                                className="p-3 border-b last:border-0 flex justify-between items-center hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{u.name}</span>
                                                    <span className="text-xs text-muted-foreground">{u.email}</span>
                                                    {u.professionName && (
                                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded w-fit mt-1">
                                                            {u.professionName}
                                                        </span>
                                                    )}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant={isAlreadyEnrolled ? "outline" : "default"}
                                                    disabled={isAlreadyEnrolled || adminEnrollMutation.isPending}
                                                    onClick={() => handleAdminEnroll(u.id)}
                                                    className={!isAlreadyEnrolled ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                                                >
                                                    {isAlreadyEnrolled ? "Já Inscrito" : adminEnrollMutation.isPending ? "Inscrevendo..." : "Inscrever"}
                                                </Button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => {
                            setIsAddModalOpen(false);
                            setUserSearch("");
                        }}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Send Certificate Modal */}
            <Dialog open={isCertificateModalOpen} onOpenChange={setIsCertificateModalOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600 font-bold">
                            <Award className="h-5 w-5" />
                            Enviar Certificado Individual
                        </DialogTitle>
                        <CardDescription>
                            Deseja gerar e enviar por e-mail o certificado de participação para <strong>{certificateUser?.name}</strong> ({certificateUser?.email})?
                        </CardDescription>
                    </DialogHeader>

                    <div className="py-2 space-y-2">
                        <p className="text-xs text-muted-foreground">
                            O certificado será enviado se o participante cumprir todos os requisitos do evento e o organizador já tiver configurado o template do certificado.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" size="sm" onClick={() => setIsCertificateModalOpen(false)}>Cancelar</Button>
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={sendCertificateMutation.isPending}
                            onClick={() => sendCertificateMutation.mutate({
                                eventId: id,
                                userId: certificateUser?.id
                            })}
                        >
                            {sendCertificateMutation.isPending ? "Enviando..." : "Confirmar Envio"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EventEnrollments;
