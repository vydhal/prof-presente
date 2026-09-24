import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tracksAPI } from "../lib/api";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog";
import {
    ArrowLeft,
    Search,
    Download,
    Users,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Eye,
    CheckCircle2,
    Circle,
    Calendar
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "../components/ui/progress";

const TrackEnrollments = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 20;

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch Track Details
    const { data: track, isLoading: isLoadingTrack } = useQuery({
        queryKey: ["admin-track", id],
        queryFn: () => tracksAPI.getById(id).then(res => res.data),
    });

    // Fetch Enrollments
    const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery({
        queryKey: ["track-enrollments", id, page, debouncedSearch],
        queryFn: async () => {
            const res = await tracksAPI.getEnrollments(id, {
                page,
                limit,
                search: debouncedSearch,
            });
            return res.data;
        },
    });

    const enrollments = enrollmentsData?.enrollments || [];
    const pagination = enrollmentsData?.pagination || { page: 1, pages: 1, total: 0 };

    // Export CSV
    const handleExportCSV = async () => {
        try {
            toast.loading("Gerando CSV...", { id: "export-csv" });
            const response = await tracksAPI.exportEnrollments(id, {
                search: debouncedSearch
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inscritos_trilha_${id}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("CSV exportado com sucesso!", { id: "export-csv" });
        } catch (error) {
            console.error("Erro ao exportar CSV:", error);
            toast.error("Erro ao exportar planilha.", { id: "export-csv" });
        }
    };

    if (isLoadingTrack) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-6 px-4">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin/tracks")} className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">{track?.title}</h1>
                    <p className="text-slate-500">Gestão de Participantes e Progresso</p>
                </div>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Inscritos ({pagination.total})</CardTitle>
                                <CardDescription>Acompanhe o andamento dos alunos na trilha.</CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Nome ou email..."
                                    className="pl-10 w-full md:w-[250px] rounded-xl border-slate-200"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" onClick={handleExportCSV} className="rounded-xl font-bold border-slate-200">
                                <Download className="h-4 w-4 mr-2" />
                                Exportar CSV
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoadingEnrollments ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                        </div>
                    ) : enrollments.length === 0 ? (
                        <div className="p-20 text-center">
                            <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">Nenhum aluno inscrito nesta trilha.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                        <TableHead className="font-bold py-4">Aluno</TableHead>
                                        <TableHead className="font-bold">E-mail</TableHead>
                                        <TableHead className="font-bold text-center">Progresso</TableHead>
                                        <TableHead className="font-bold">Status</TableHead>
                                        <TableHead className="font-bold text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {enrollments.map((enrollment) => (
                                        <TableRow key={enrollment.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 border-slate-100 dark:border-slate-800 transition-colors">
                                            <TableCell className="py-4">
                                                <div className="font-bold text-slate-900 dark:text-white">{enrollment.user.name}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{enrollment.user.profession?.name || 'Participante'}</div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                                                {enrollment.user.email}
                                            </TableCell>
                                            <TableCell className="min-w-[200px]">
                                                <div className="space-y-1.5 max-w-[180px] mx-auto">
                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        <span>{Math.round(enrollment.progress)}% ({enrollment.checkinCount}/{enrollment.totalEvents})</span>
                                                        {enrollment.progress >= 100 && <span className="text-green-500">Completo</span>}
                                                    </div>
                                                    <Progress value={enrollment.progress} className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800" indicatorClassName={enrollment.progress >= 100 ? "bg-green-500" : "bg-blue-500"} />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={enrollment.progress >= 100 ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200"}>
                                                    {enrollment.progress >= 100 ? 'Concluído' : 'Em Andamento'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="rounded-xl gap-2 hover:bg-blue-50 hover:text-blue-600">
                                                            <Eye className="w-4 h-4" />
                                                            Detalhes
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-md rounded-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle className="flex items-center gap-3">
                                                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                                                    <Users className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-lg font-black uppercase tracking-tight">{enrollment.user.name}</div>
                                                                    <div className="text-xs font-medium text-slate-500">Progresso na Trilha</div>
                                                                </div>
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                                                <div>
                                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conclusão</div>
                                                                    <div className="text-2xl font-black text-slate-900 dark:text-white">{Math.round(enrollment.progress)}%</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Etapas</div>
                                                                    <div className="text-2xl font-black text-blue-600">{enrollment.checkinCount} / {enrollment.totalEvents}</div>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                                                                    <Calendar className="w-3 h-3" />
                                                                    Status por Evento
                                                                </h4>
                                                                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                                    {enrollment.eventStatuses?.map((status, idx) => (
                                                                        <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${status.checkedIn ? 'bg-green-50/50 border-green-100' : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800'}`}>
                                                                            <div className="flex items-center gap-3 min-w-0">
                                                                                {status.checkedIn ? (
                                                                                    <div className="bg-green-100 text-green-600 p-1 rounded-full shrink-0">
                                                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-slate-300 p-1 rounded-full shrink-0">
                                                                                        <Circle className="w-3.5 h-3.5" />
                                                                                    </div>
                                                                                )}
                                                                                <span className={`text-sm font-medium truncate ${status.checkedIn ? 'text-green-700' : 'text-slate-600 dark:text-slate-400'}`}>
                                                                                    {status.title}
                                                                                </span>
                                                                            </div>
                                                                            <Badge variant="ghost" className={`text-[10px] uppercase font-black shrink-0 ${status.checkedIn ? 'text-green-600 bg-green-100' : 'text-slate-400 bg-slate-100'}`}>
                                                                                {status.checkedIn ? 'OK' : 'Pendente'}
                                                                            </Badge>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-slate-500 font-medium">
                        Página {pagination.page} de {pagination.pages}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="rounded-xl border-slate-200"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                            disabled={page === pagination.pages}
                            className="rounded-xl border-slate-200"
                        >
                            Próxima <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackEnrollments;
