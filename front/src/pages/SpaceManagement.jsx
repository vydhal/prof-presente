import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { spacesAPI, equipmentsAPI } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useBranding } from "../contexts/BrandingContext";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { toast } from "sonner";
import {
    Plus,
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    CheckCircle2,
    XCircle,
    Hourglass,
    Volume2,
    Mic,
    Monitor,
    Laptop,
    Layout,
    Users,
    Settings,
    Download,
    History,
    Edit,
    Trash,
    Search,
    Filter,
} from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const ICON_MAP = {
    Volume2: Volume2,
    Mic: Mic,
    Monitor: Monitor,
    Laptop: Laptop,
    Layout: Layout,
    Users: Users,
};

const SpaceManagement = () => {
    const { user } = useAuth();
    const { platformName } = useBranding();
    const queryClient = useQueryClient();
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
    const [editingSpace, setEditingSpace] = useState(null);
    const [activeTab, setActiveTab] = useState("agenda");
    const [needsCerimonial, setNeedsCerimonial] = useState(false);
    const [formDate, setFormDate] = useState(new Date());

    // Filtros
    const [statusFilter, setStatusFilter] = useState("all");
    const [spaceFilter, setSpaceFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [equipmentForm, setEquipmentForm] = useState({ name: "", totalQuantity: "", icon: "Layout" });

    // Modais de Observação
    const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
    const [observationText, setObservationText] = useState("");
    const [actingReservation, setActingReservation] = useState(null);
    const [actingStatus, setActingStatus] = useState("");

    const isAdminOrCerimonial = user?.role === "ADMIN" || user?.role === "CERIMONIAL";

    // Queries
    const { data: config } = useQuery({
        queryKey: ["spaces-config"],
        queryFn: () => spacesAPI.getConfig().then(res => res.data),
    });

    const { data: spaces } = useQuery({
        queryKey: ["spaces"],
        queryFn: () => spacesAPI.getAll().then(res => res.data),
    });

    const { data: reservations, isLoading } = useQuery({
        queryKey: ["reservations", statusFilter, spaceFilter],
        queryFn: () => spacesAPI.getReservations({
            status: statusFilter === "all" ? undefined : statusFilter,
            spaceId: spaceFilter === "all" ? undefined : spaceFilter,
        }).then(res => res.data),
    });

    const { data: inventory } = useQuery({
        queryKey: ["inventory"],
        queryFn: () => equipmentsAPI.getAll().then(res => res.data),
        enabled: !!user,
    });

    const { data: availability } = useQuery({
        queryKey: ["equipment-availability", formDate],
        queryFn: () => equipmentsAPI.getAvailability(format(formDate, "yyyy-MM-dd")).then(res => res.data),
        enabled: !!formDate,
    });

    // Mutations
    const createReservationMutation = useMutation({
        mutationFn: (data) => spacesAPI.createReservation(data),
        onSuccess: () => {
            queryClient.invalidateQueries(["reservations"]);
            setIsRequestModalOpen(false);
            toast.success("Solicitação enviada com sucesso!");
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao enviar solicitação.");
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, data }) => spacesAPI.updateReservationStatus(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(["reservations"]);
            toast.success("Status atualizado!");
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao atualizar status.");
        }
    });

    const upsertSpaceMutation = useMutation({
        mutationFn: (data) => data.id ? spacesAPI.update(data.id, data) : spacesAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(["spaces"]);
            setIsSpaceModalOpen(false);
            setEditingSpace(null);
            toast.success("Local salvo com sucesso!");
        },
    });

    const deleteSpaceMutation = useMutation({
        mutationFn: (id) => spacesAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["spaces"]);
            toast.success("Local removido.");
        },
    });

    const updateConfigMutation = useMutation({
        mutationFn: (data) => spacesAPI.updateConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries(["spaces-config"]);
            toast.success("Configurações salvas!");
        },
        onError: (error) => {
            toast.error("Erro ao salvar configurações.");
        }
    });

    const upsertEquipmentMutation = useMutation({
        mutationFn: (data) => data.id ? equipmentsAPI.update(data.id, data) : equipmentsAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(["inventory"]);
            queryClient.invalidateQueries(["equipment-availability"]);
            toast.success("Equipamento salvo!");
            setEquipmentForm({ name: "", totalQuantity: "", icon: "Layout" });
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao salvar equipamento.");
        }
    });

    const deleteEquipmentMutation = useMutation({
        mutationFn: (id) => equipmentsAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["inventory"]);
            toast.success("Equipamento removido.");
        },
    });

    // Cálculos
    const stats = useMemo(() => {
        if (!reservations) return { total: 0, pending: 0, approved: 0, thisMonth: 0 };
        const now = new Date();
        return {
            total: reservations.length,
            pending: reservations.filter(r => r.status === "PENDING").length,
            approved: reservations.filter(r => r.status === "APPROVED").length,
            thisMonth: reservations.filter(r => {
                const date = parseISO(r.date);
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length,
        };
    }, [reservations]);

    const filteredAgenda = useMemo(() => {
        if (!reservations) return [];
        return reservations.filter(r => isSameDay(parseISO(r.date), formDate));
    }, [reservations, formDate]);

    const handleExport = async () => {
        try {
            const res = await spacesAPI.exportReservations({
                status: statusFilter === "all" ? undefined : statusFilter,
                spaceId: spaceFilter === "all" ? undefined : spaceFilter,
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'reservas_espacos.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Erro ao exportar dados.");
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            PENDING: { label: "Pendente", color: "bg-amber-100/80 text-amber-700 border-amber-200 shadow-sm", icon: Hourglass },
            APPROVED: { label: "Aprovado", color: "bg-emerald-100/80 text-emerald-700 border-emerald-200 shadow-sm", icon: CheckCircle2 },
            REJECTED: { label: "Rejeitado", color: "bg-rose-100/80 text-rose-700 border-rose-200 shadow-sm", icon: XCircle },
            REALLOCATED: { label: "Realocado", color: "bg-blue-100/80 text-blue-700 border-blue-200 shadow-sm", icon: MapPin },
        };
        const config = variants[status] || variants.PENDING;
        const Icon = config.icon;
        return (
            <Badge className={`px-2 py-1 flex items-center gap-1.5 font-black uppercase text-[9px] tracking-wider border transition-all ${config.color}`}>
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-6 pb-20 lg:pb-6">
            {/* Header Moderno */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                        Gestão de Espaços
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Coordenação e Reservas de Ambientes • {platformName || "SEDUC Eventos"}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {isAdminOrCerimonial && (
                        <Button onClick={handleExport} variant="outline" className="gap-2 border-slate-200 shadow-sm">
                            <Download className="h-4 w-4" />
                            Exportar CSV
                        </Button>
                    )}
                    <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-lg shadow-blue-100 dark:shadow-none transition-all hover:scale-[1.02]">
                                <Plus className="h-5 w-5" />
                                Nova Solicitação
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl flex items-center gap-3">
                                    <CalendarIcon className="h-6 w-6 text-blue-600" />
                                    Solicitar Espaço
                                </DialogTitle>
                                <DialogDescription>
                                    Reserve um ambiente para seu evento. A equipe do Cerimonial analisará seu pedido.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                const data = Object.fromEntries(formData.entries());
                                const equipment = {};
                                inventory?.forEach(item => {
                                    equipment[item.id] = formData.get(item.id) === "on";
                                });
                                createReservationMutation.mutate({
                                    ...data,
                                    equipment,
                                    date: format(formDate, "yyyy-MM-dd"),
                                    needsCerimonial,
                                });
                            }} className="grid gap-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nome do Evento</Label>
                                        <Input name="eventTitle" placeholder="Ex: Jornada Pedagógica" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Número do Chamado (1Doc)</Label>
                                        <Input name="oneDocNumber" placeholder="Ex: 12345/2026" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Setor Responsável</Label>
                                        <Select name="sector" required>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent>
                                                {config?.sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Local do Evento</Label>
                                        <Select name="spaceId" required>
                                            <SelectTrigger><SelectValue placeholder="Selecione o local" /></SelectTrigger>
                                            <SelectContent>
                                                {spaces?.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.capacity} pessoas)</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Data do Evento</Label>
                                        <Input
                                            name="date"
                                            type="date"
                                            value={format(formDate, "yyyy-MM-dd")}
                                            onChange={(e) => setFormDate(parseISO(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Início</Label>
                                        <Input name="startTime" type="time" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Término</Label>
                                        <Input name="endTime" type="time" required />
                                    </div>
                                </div>
                                <div className="space-y-4 pt-2 border-t">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-bold">Apoio do Cerimonial</Label>
                                            <p className="text-xs text-slate-500">Solicitar presença de um cerimonialista no evento.</p>
                                        </div>
                                        <Checkbox
                                            checked={needsCerimonial}
                                            onCheckedChange={setNeedsCerimonial}
                                            className="h-6 w-6"
                                        />
                                    </div>
                                    {needsCerimonial && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                            <Label className="text-blue-600 font-bold">Link da Minuta/Roteiro (Google Docs)</Label>
                                            <Input name="eventScriptUrl" placeholder="https://docs.google.com/document/d/..." required={needsCerimonial} />
                                            <p className="text-[10px] text-slate-400 italic">* Certifique-se de que o documento esteja público ou compartilhado com o cerimonial.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Descrição</Label>
                                    <Textarea name="description" placeholder="Objetivo do evento e observações..." rows={3} />
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-base font-semibold">Equipamentos e Serviços</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {(inventory || []).filter(item => {
                                            // Se não houver configuração explícita de IDs REAIS (UUIDs), mostramos tudo
                                            const habilitatedIds = config?.equipment || [];
                                            const hasValidConfig = habilitatedIds.some(id => inventory.some(inv => inv.id === id));

                                            if (!hasValidConfig) return true; // Mostra tudo se nada válido foi configurado
                                            return habilitatedIds.includes(item.id);
                                        }).map(item => {
                                            const Icon = ICON_MAP[item.icon] || Layout;
                                            return (
                                                <div key={item.id} className="flex items-center space-x-2 border rounded-xl p-3 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors border-slate-200">
                                                    <Checkbox id={item.id} name={item.id} />
                                                    <Label htmlFor={item.id} className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                                                        <Icon className="h-4 w-4 text-blue-500" />
                                                        {item.name}
                                                    </Label>
                                                </div>
                                            );
                                        })}
                                        {inventory?.length === 0 && (
                                            <p className="text-xs text-slate-400 col-span-full italic">Nenhum equipamento cadastrado no inventário.</p>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={createReservationMutation.isPending} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
                                        {createReservationMutation.isPending ? "Processando..." : "Enviar Solicitação"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Estátisticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Geral", value: stats.total, color: "blue", icon: CalendarIcon },
                    { label: "Pendentes", value: stats.pending, color: "amber", icon: Hourglass },
                    { label: "Aprovados", value: stats.approved, color: "green", icon: CheckCircle2 },
                    { label: "Ocupação/Mês", value: stats.thisMonth, color: "purple", icon: Settings },
                ].map((stat, i) => (
                    <Card key={i} className={`border-none shadow-sm bg-${stat.color}-500 text-white overflow-hidden relative`}>
                        <div className="p-5 relative z-10">
                            <p className={`text-${stat.color}-50 text-xs font-bold uppercase tracking-wider`}>{stat.label}</p>
                            <h3 className="text-3xl font-black mt-1">{stat.value}</h3>
                        </div>
                        <stat.icon className={`absolute -right-4 -bottom-4 h-24 w-24 text-white opacity-10`} />
                    </Card>
                ))}
            </div>

            {/* Abas de Gestão (Admin/Cerimonial) */}
            <Tabs defaultValue="agenda" className="w-full" onValueChange={setActiveTab}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                    <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 h-auto grid grid-cols-2 lg:flex w-full md:w-auto">
                        <TabsTrigger value="agenda" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 py-2 px-6">Agenda</TabsTrigger>
                        <TabsTrigger value="pedidos" className="data-[state=active]:bg-white py-2 px-6">Pedidos</TabsTrigger>
                        {isAdminOrCerimonial && (
                            <>
                                <TabsTrigger value="locais" className="data-[state=active]:bg-white py-2 px-6">Locais</TabsTrigger>
                                <TabsTrigger value="inventario" className="data-[state=active]:bg-white py-2 px-6">Inventário</TabsTrigger>
                                <TabsTrigger value="config" className="data-[state=active]:bg-white py-2 px-6">Formulário</TabsTrigger>
                            </>
                        )}
                    </TabsList>

                    {/* Filtros Visíveis em Agenda e Pedidos */}
                    {(activeTab === "agenda" || activeTab === "pedidos") && (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar evento..."
                                    className="pl-10 h-10 border-slate-200"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px] h-10"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="PENDING">Pendentes</SelectItem>
                                    <SelectItem value="APPROVED">Aprovados</SelectItem>
                                    <SelectItem value="REJECTED">Rejeitados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* ABA: AGENDA VISUAL */}
                <TabsContent value="agenda" className="m-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                        <div className="lg:col-span-4">
                            <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-950">
                                <CardHeader className="bg-blue-600 text-white p-6">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <CalendarIcon className="h-5 w-5" />
                                        {format(formDate, "MMMM yyyy", { locale: ptBR })}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <Calendar
                                        mode="single"
                                        selected={formDate}
                                        onSelect={(date) => date && setFormDate(date)}
                                        className="w-full"
                                        locale={ptBR}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 italic">
                                    {format(formDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                </h2>
                                <Badge variant="secondary" className="bg-slate-200 text-slate-800">
                                    {filteredAgenda.length} Eventos
                                </Badge>
                            </div>

                            <div className="bg-white dark:bg-slate-950 border rounded-3xl overflow-hidden shadow-xl min-h-[600px]">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-[600px] bg-slate-50/50 backdrop-blur-sm">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                                            <p className="text-slate-500 font-bold">Sincronizando compromissos...</p>
                                        </div>
                                    </div>
                                ) : filteredAgenda.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-[600px] text-center p-8">
                                        <div className="h-24 w-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center shadow-inner mb-6">
                                            <CalendarIcon className="h-12 w-12 text-slate-300" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2 italic">Agenda Livre</h3>
                                        <p className="text-slate-500 max-w-sm mx-auto font-medium">Não há eventos registrados para este dia. Que tal iniciar uma nova solicitação?</p>
                                        <Button className="mt-8 bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-2xl shadow-lg shadow-blue-200 transition-all hover:scale-105" onClick={() => setIsRequestModalOpen(true)}>
                                            <Plus className="h-5 w-5 mr-2" />
                                            Nova Solicitação
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="p-6 space-y-6 max-h-[800px] overflow-y-auto custom-scrollbar">
                                        {filteredAgenda
                                            .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
                                            .map((res) => {
                                                const start = parseISO(res.startTime);
                                                const end = parseISO(res.endTime);

                                                return (
                                                    <div key={res.id} className="relative group animate-in fade-in slide-in-from-bottom-4 duration-300">
                                                        <div className="flex gap-6">
                                                            {/* Horário Lateral */}
                                                            <div className="w-24 flex-shrink-0 pt-2 text-right">
                                                                <div className="text-lg font-black text-slate-900 dark:text-white leading-none">
                                                                    {start ? format(start, "HH:mm") : "--:--"}
                                                                </div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                                    até {end ? format(end, "HH:mm") : "--:--"}
                                                                </div>
                                                            </div>

                                                            {/* Linha do Tempo Visual */}
                                                            <div className="relative flex flex-col items-center">
                                                                <div className={`h-4 w-4 rounded-full border-4 border-white dark:border-slate-950 shadow-md z-10 
                                                                ${res.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                                <div className="flex-1 w-0.5 bg-slate-100 dark:bg-slate-800 absolute top-4 bottom-0 -z-0" />
                                                            </div>

                                                            {/* Conteúdo do Card */}
                                                            <div className={`flex-1 rounded-3xl p-5 border-2 transition-all hover:shadow-xl hover:-translate-y-1
                                                            ${res.status === 'APPROVED' ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30' : 'bg-amber-50/30 border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/30'}`}>
                                                                <div className="flex items-start justify-between gap-4 mb-4">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                                                                {res.eventTitle}
                                                                            </h4>
                                                                            {getStatusBadge(res.status)}
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg uppercase">
                                                                                {res.sector}
                                                                            </span>
                                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                                                1Doc: {res.oneDocNumber || "N/A"}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="flex flex-col items-end gap-1">
                                                                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                                                                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                                                                                {res.space?.name}
                                                                            </span>
                                                                            <span className="text-[10px] font-black text-slate-400 uppercase">
                                                                                Sol: {res.requesterName}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Área de Detalhes Adicionais */}
                                                                <div className="flex flex-wrap gap-2 mb-4">
                                                                    {res.needsCerimonial && (
                                                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[10px] font-black uppercase">
                                                                            Apoio Cerimonial
                                                                        </Badge>
                                                                    )}
                                                                    {res.equipment && Object.entries(res.equipment).map(([key, value]) => {
                                                                        if (!value) return null;
                                                                        const item = inventory?.find(eq => eq.id === key);
                                                                        return (
                                                                            <Badge key={key} variant="outline" className="text-[10px] bg-slate-50/50 text-slate-500 font-bold">
                                                                                {item?.name || key}
                                                                            </Badge>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Observações de Gestão */}
                                                                {res.observations && (
                                                                    <div className={`p-4 rounded-2xl border flex gap-3 animate-in zoom-in-95 duration-500
                                                                    ${res.status === 'REJECTED' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                                                                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-inherit">
                                                                            {res.status === 'REJECTED' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Nota do Gestor</p>
                                                                            <p className="text-sm font-medium italic">"{res.observations}"</p>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Ações Rápidas (Admin) */}
                                                                {isAdminOrCerimonial && res.status === 'PENDING' && (
                                                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                                                                        <Button size="sm" variant="outline" className="h-9 px-4 rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50" onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActingReservation(res);
                                                                            setActingStatus("REJECTED");
                                                                            setObservationText("");
                                                                            setIsObservationModalOpen(true);
                                                                        }}>
                                                                            <XCircle className="h-4 w-4 mr-2" />
                                                                            Indisponibilizar
                                                                        </Button>
                                                                        <Button size="sm" className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100" onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActingReservation(res);
                                                                            setActingStatus("APPROVED");
                                                                            setObservationText("");
                                                                            setIsObservationModalOpen(true);
                                                                        }}>
                                                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                                                            Aprovar Espaço
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA: LISTA DE PEDIDOS */}
                <TabsContent value="pedidos">
                    <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-950">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-900 border-b">
                                <TableRow>
                                    <TableHead className="font-bold">Evento</TableHead>
                                    <TableHead className="font-bold">Solicitante</TableHead>
                                    <TableHead className="font-bold">Apoios</TableHead>
                                    <TableHead className="font-bold">Data/Hora</TableHead>
                                    <TableHead className="font-bold">Local</TableHead>
                                    <TableHead className="font-bold text-center">Status</TableHead>
                                    <TableHead className="font-bold text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reservations?.filter(r =>
                                    r.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    r.requesterName.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell>
                                            <div className="font-bold">{r.eventTitle}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">1Doc: {r.oneDocNumber || "N/A"}</div>
                                            <div className="text-[10px] text-slate-500 uppercase">{r.sector}</div>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">{r.requesterName}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {r.needsCerimonial && (
                                                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">Cerimonial</Badge>
                                                )}
                                                {r.equipment && Object.entries(r.equipment).map(([key, value]) => {
                                                    if (!value) return null;
                                                    const item = inventory?.find(eq => eq.id === key);
                                                    return (
                                                        <Badge key={key} variant="outline" className="text-[10px] bg-slate-50 text-slate-500 border-slate-200">
                                                            {item?.name || key}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-bold">{format(parseISO(r.date), "dd/MM/yyyy")}</div>
                                            <div className="text-xs text-slate-500 whitespace-nowrap">
                                                {format(parseISO(r.startTime), "HH:mm")} - {format(parseISO(r.endTime), "HH:mm")}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-bold text-blue-600">{r.space?.name}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {getStatusBadge(r.status)}
                                                {r.observations && (
                                                    <p className="text-[10px] text-slate-400 italic font-medium max-w-[120px] truncate" title={r.observations}>
                                                        "{r.observations}"
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isAdminOrCerimonial ? (
                                                r.status === "PENDING" ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="outline" size="sm" className="h-8 text-red-600 border-red-200 hover:bg-red-50" onClick={() => {
                                                            setActingReservation(r);
                                                            setActingStatus("REJECTED");
                                                            setObservationText("");
                                                            setIsObservationModalOpen(true);
                                                        }}>
                                                            <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                                                        </Button>
                                                        <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700" onClick={() => {
                                                            setActingReservation(r);
                                                            setActingStatus("APPROVED");
                                                            setObservationText("");
                                                            setIsObservationModalOpen(true);
                                                        }}>
                                                            <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button variant="ghost" size="sm" className="h-8 text-slate-400 gap-1" onClick={() => updateStatusMutation.mutate({ id: r.id, data: { status: "PENDING" } })}>
                                                        <History className="h-4 w-4" /> Voltar para Pendente
                                                    </Button>
                                                )
                                            ) : (
                                                <span className="text-xs text-slate-400 italic font-medium">Apenas Leitura</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* ABA: LOCAIS (CRUD) */}
                <TabsContent value="locais">
                    <Card className="border-none shadow-md bg-white dark:bg-slate-950">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 dark:bg-slate-900/50 p-6">
                            <div>
                                <CardTitle className="text-xl font-black">Auditórios e Salas</CardTitle>
                                <CardDescription>Gerencie os locais disponíveis para reserva.</CardDescription>
                            </div>
                            <Button className="bg-blue-600 font-bold gap-2" onClick={() => { setEditingSpace(null); setIsSpaceModalOpen(true); }}>
                                <Plus className="h-4 w-4" /> Novo Local
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Capacidade</TableHead>
                                        <TableHead>Localização</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {spaces?.map(s => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-bold text-slate-800 dark:text-slate-100">{s.name}</TableCell>
                                            <TableCell className="font-medium text-slate-600">{s.capacity} Pessoas</TableCell>
                                            <TableCell className="text-slate-500 text-sm">{s.location}</TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => { setEditingSpace(s); setIsSpaceModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteSpaceMutation.mutate(s.id)}><Trash className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Dialog open={isSpaceModalOpen} onOpenChange={setIsSpaceModalOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingSpace ? "Editar Local" : "Novo Local"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                upsertSpaceMutation.mutate({
                                    id: editingSpace?.id,
                                    ...Object.fromEntries(formData.entries())
                                });
                            }} className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nome do Local</Label>
                                    <Input name="name" defaultValue={editingSpace?.name} placeholder="Ex: Auditório II" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Capacidade (Aprox.)</Label>
                                    <Input name="capacity" type="number" defaultValue={editingSpace?.capacity} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Endereço/Bloco</Label>
                                    <Input name="location" defaultValue={editingSpace?.location} placeholder="Ex: Bloco A - Primeiro Andar" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Descrição</Label>
                                    <Textarea name="description" defaultValue={editingSpace?.description} />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="w-full bg-blue-600" disabled={upsertSpaceMutation.isPending}>Salvar Local</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* ABA: INVENTÁRIO (ESTOQUE) */}
                <TabsContent value="inventario">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <Card className="lg:col-span-1 border-none shadow-md bg-white dark:bg-slate-950 h-fit">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
                                <CardTitle className="text-lg font-bold">Gestão de Itens</CardTitle>
                                <CardDescription>Cadastre a quantidade total disponível.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    upsertEquipmentMutation.mutate({
                                        ...equipmentForm,
                                        totalQuantity: parseInt(equipmentForm.totalQuantity) || 0
                                    });
                                }} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Nome do Equipamento</Label>
                                        <Input
                                            value={equipmentForm.name}
                                            onChange={(e) => setEquipmentForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Ex: Projetor Epson"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Qtd. Total em Estoque</Label>
                                        <Input
                                            type="number"
                                            value={equipmentForm.totalQuantity}
                                            onChange={(e) => setEquipmentForm(prev => ({ ...prev, totalQuantity: e.target.value }))}
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ícone (Lucide)</Label>
                                        <Select
                                            value={equipmentForm.icon}
                                            onValueChange={(val) => setEquipmentForm(prev => ({ ...prev, icon: val }))}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.keys(ICON_MAP).map(icon => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="submit" className="w-full bg-blue-600 font-bold" disabled={upsertEquipmentMutation.isPending}>
                                        {upsertEquipmentMutation.isPending ? "Salvando..." : "Adicionar ao Estoque"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="lg:col-span-3 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {inventory?.map(item => (
                                    <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                                                    {(() => {
                                                        const Icon = ICON_MAP[item.icon] || Layout;
                                                        return <Icon className="h-6 w-6 text-blue-600" />;
                                                    })()}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{item.name}</h3>
                                                    <p className="text-xs text-slate-500 font-medium tracking-tight">Capacidade total: {item.totalQuantity} unidades</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => {
                                                    const newQty = window.prompt(`Nova quantidade para ${item.name}:`, item.totalQuantity);
                                                    if (newQty !== null) upsertEquipmentMutation.mutate({ ...item, totalQuantity: newQty });
                                                }}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteEquipmentMutation.mutate(item.id)}><Trash className="h-4 w-4" /></Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <Card className="border-none shadow-md bg-white dark:bg-slate-950">
                                <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 p-6">
                                    <div>
                                        <CardTitle className="text-xl font-black">Disponibilidade por Dia</CardTitle>
                                        <CardDescription>Ocupação dos itens em {format(formDate, "dd/MM/yyyy")}</CardDescription>
                                    </div>
                                    <Input
                                        type="date"
                                        className="w-40"
                                        value={format(formDate, "yyyy-MM-dd")}
                                        onChange={(e) => setFormDate(parseISO(e.target.value))}
                                    />
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item</TableHead>
                                                <TableHead className="text-center">Total</TableHead>
                                                <TableHead className="text-center">Em Uso</TableHead>
                                                <TableHead className="text-center">Disponível</TableHead>
                                                <TableHead className="text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {availability?.map(acc => (
                                                <TableRow key={acc.id}>
                                                    <TableCell className="font-bold">{acc.name}</TableCell>
                                                    <TableCell className="text-center font-medium">{acc.totalQuantity}</TableCell>
                                                    <TableCell className="text-center text-red-500 font-bold">{acc.used}</TableCell>
                                                    <TableCell className="text-center text-green-600 font-bold">{acc.available}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge className={acc.available > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                                            {acc.available > 0 ? "Disponível" : "Esgotado"}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!availability || availability.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-slate-400 font-medium italic">Nenhum equipamento cadastrado.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* ABA: CONFIG DO FORMULÁRIO */}
                <TabsContent value="config">
                    <Card className="border-none shadow-md bg-white dark:bg-slate-950">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
                            <CardTitle className="text-xl font-black italic">Setores do Formulário</CardTitle>
                            <CardDescription>Edite a lista de setores responsáveis que aparecem para o organizador.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                            <div className="space-y-4">
                                <Label className="text-lg font-bold">Equipamentos Habilitados no Formulário</Label>
                                <p className="text-sm text-slate-500">Selecione quais itens do inventário aparecerão para os usuários.</p>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {inventory?.map(item => {
                                        // Filtramos IDs que não são UUIDs (lixo de configurações antigas)
                                        const isEnabled = config?.equipment?.includes(item.id);
                                        return (
                                            <div key={item.id} className={`flex items-center space-x-2 border rounded-xl p-3 transition-colors ${isEnabled ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20' : 'bg-slate-50 border-slate-200'}`}>
                                                <Checkbox
                                                    id={`config-${item.id}`}
                                                    checked={isEnabled}
                                                    onCheckedChange={(checked) => {
                                                        const current = (config?.equipment || []).filter(id => {
                                                            // Limpar IDs antigos que não existem no inventário atual
                                                            return inventory.some(inv => inv.id === id);
                                                        });
                                                        const updated = checked
                                                            ? [...current, item.id]
                                                            : current.filter(id => id !== item.id);
                                                        updateConfigMutation.mutate({ ...config, equipment: updated });
                                                    }}
                                                />
                                                <Label htmlFor={`config-${item.id}`} className="text-sm font-semibold cursor-pointer flex-1">
                                                    {item.name}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                    {(!inventory || inventory.length === 0) && (
                                        <div className="col-span-full p-6 border border-dashed rounded-xl flex flex-col items-center gap-2 bg-slate-50">
                                            <Layout className="h-8 w-8 text-slate-300" />
                                            <p className="text-sm text-slate-500 font-medium">Cadastre itens no Inventário primeiro.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pt-8 border-t">
                                <div className="flex items-center justify-between">
                                    <Label className="text-lg font-bold">Setores Responsáveis</Label>
                                    <Button size="sm" variant="outline" onClick={() => {
                                        const sector = window.prompt("Nome do Setor:");
                                        if (sector) {
                                            const newSectors = [...(config?.sectors || []), sector];
                                            updateConfigMutation.mutate({ ...config, sectors: newSectors });
                                        }
                                    }}><Plus className="h-4 w-4" /></Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {config?.sectors.map((s, idx) => (
                                        <Badge key={idx} variant="secondary" className="px-3 py-1 gap-2 bg-white border border-slate-200">
                                            {s}
                                            <button className="text-red-500" onClick={() => {
                                                const filtered = config.sectors.filter((_, i) => i !== idx);
                                                updateConfigMutation.mutate({ ...config, sectors: filtered });
                                            }}><XCircle className="h-3 w-3" /></button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal de Observações/Motivo de Rejeição */}
            <Dialog open={isObservationModalOpen} onOpenChange={setIsObservationModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {actingStatus === "APPROVED" ? (
                                <><CheckCircle2 className="h-5 w-5 text-green-600" /> Aprovar com Observação</>
                            ) : (
                                <><XCircle className="h-5 w-5 text-red-600" /> Motivo da Rejeição</>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {actingStatus === "APPROVED"
                                ? "Adicione alguma observação importante para o solicitante (opcional)."
                                : "Por favor, informe ao organizador o motivo pelo qual a solicitação foi negada."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="observation" className="mb-2 block font-bold">
                            {actingStatus === "APPROVED" ? "Observações Internas/Externas" : "Motivo"}
                        </Label>
                        <Textarea
                            id="observation"
                            placeholder={actingStatus === "APPROVED" ? "Ex: Aprovado, mas o projetor do local está em manutenção..." : "Ex: O local já estará ocupado por uma manutenção preventiva..."}
                            value={observationText}
                            onChange={(e) => setObservationText(e.target.value)}
                            rows={4}
                            required={actingStatus === "REJECTED"}
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsObservationModalOpen(false)}>Cancelar</Button>
                        <Button
                            className={actingStatus === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                            onClick={() => {
                                if (actingStatus === "REJECTED" && !observationText) {
                                    toast.error("O motivo da rejeição é obrigatório.");
                                    return;
                                }
                                updateStatusMutation.mutate({
                                    id: actingReservation.id,
                                    data: {
                                        status: actingStatus,
                                        observations: observationText
                                    }
                                });
                                setIsObservationModalOpen(false);
                            }}
                        >
                            Confirmar {actingStatus === "APPROVED" ? "Aprovação" : "Rejeição"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SpaceManagement;
