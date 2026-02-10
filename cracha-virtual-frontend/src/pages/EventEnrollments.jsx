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
} from "lucide-react";
import { toast } from "sonner";
import { getAssetUrl } from "../lib/utils";

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
                                                {enrollment.status === 'APPROVED' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleResendEmail(enrollment.id)}
                                                        disabled={resendEmailMutation.isPending}
                                                        title="Reenviar E-mail de Confirmação"
                                                    >
                                                        <Mail className="h-4 w-4 mr-2" />
                                                        Reenviar Email
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default EventEnrollments;
