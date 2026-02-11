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

const EventEnrollments = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
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
        queryKey: ["event-enrollments", id],
        queryFn: async () => {
            const res = await api.get(`/enrollments/events/${id}`);
            // Normaliza a resposta (array ou objeto paginado)
            const data = res.data;
            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.enrollments)) return data.enrollments;
            return [];
        },
    });

    // Filter Enrollments based on search
    const filteredEnrollments = enrollmentsData?.filter((enrollment) => {
        if (!debouncedSearch) return true;
        const searchLower = debouncedSearch.toLowerCase();
        return (
            enrollment.user.name.toLowerCase().includes(searchLower) ||
            enrollment.user.email.toLowerCase().includes(searchLower)
        );
    }) || [];

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

    // Move Participant Logic
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [targetEventId, setTargetEventId] = useState("");
    const [eventSearch, setEventSearch] = useState("");

    const { data: eventsList } = useQuery({
        queryKey: ["admin-events-list", eventSearch],
        queryFn: async () => {
            const res = await api.get("/events", {
                params: { search: eventSearch, limit: 5 }
            });
            return res.data.events;
        },
        enabled: isMoveModalOpen
    });

    const moveParticipantMutation = useMutation({
        mutationFn: async ({ enrollmentId, targetEventId }) => {
            await api.patch(`/enrollments/${enrollmentId}/move`, { targetEventId });
        },
        onSuccess: () => {
            toast.success("Participante movido com sucesso!");
            setIsMoveModalOpen(false);
            setTargetEventId("");
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
                            <CardTitle>Participantes ({filteredEnrollments.length})</CardTitle>
                            <CardDescription>
                                Visualize e gerencie os inscritos neste evento.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome ou email..."
                                    className="pl-8 w-[250px] or w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" onClick={() => toast.info("Exportação em breve!")}>
                                <Download className="h-4 w-4 mr-2" />
                                Exportar CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoadingEnrollments ? (
                        <div className="p-8 text-center">Carregando inscrições...</div>
                    ) : filteredEnrollments.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">Nenhuma inscrição encontrada{debouncedSearch && " para a busca atual"}.</div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Data Inscrição</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEnrollments.map((enrollment) => (
                                        <TableRow key={enrollment.id}>
                                            <TableCell className="font-medium">{enrollment.user.name}</TableCell>
                                            <TableCell>{enrollment.user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={enrollment.status === 'APPROVED' ? 'default' : 'secondary'}>
                                                    {enrollment.status === 'APPROVED' ? 'Confirmado' : enrollment.status}
                                                </Badge>
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
                    )}
                </CardContent>
            </Card>

            {/* Move Participant Modal */}
            <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Mover Participante</DialogTitle>
                        <CardDescription>
                            Selecione o evento de destino para <strong>{selectedEnrollment?.user.name}</strong>.
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
                                enrollmentId: selectedEnrollment.id,
                                targetEventId
                            })}
                        >
                            {moveParticipantMutation.isPending ? "Movendo..." : "Confirmar Mudança"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EventEnrollments;
