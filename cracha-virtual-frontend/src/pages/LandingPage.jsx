import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eventsAPI, tracksAPI, proposalsAPI, categoriesAPI } from "../lib/api";
import { getAssetUrl } from "../lib/utils";
import { useAuth } from "../hooks/useAuth.jsx";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
    Search,
    Moon,
    Sun,
    Calendar,
    MapPin,
    Video,
    ArrowRight,
    LayoutGrid,
    GraduationCap,
    Laptop,
    Palette,
    Users,
    FlaskConical,
    ChevronRight,
    ChevronLeft,
    Share2,
    Mail,
    Menu,
    X,
    Loader2,
    Home
} from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "../components/ui/carousel";
import PublicBottomNav from "../components/PublicBottomNav";
import HeroCarousel from "../components/HeroCarousel";
import { useBranding } from "../contexts/BrandingContext";
import LogoDefault from "../assets/logo-prof-presente.svg";
import { Calendar as CalendarUI } from "../components/ui/calendar";
import { toast } from "sonner";
import { isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useDebounce } from "../hooks/useDebounce";

const getMonthAbbr = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
};

const getDay = (dateString) => {
    const date = new Date(dateString);
    return date.getDate();
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
};

const LandingPage = () => {
    const { user } = useAuth();
    const { platformName, logoUrl } = useBranding();
    const { theme, toggleTheme } = useTheme();
    const isDarkMode = theme === 'dark';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [proposalModalOpen, setProposalModalOpen] = useState(false);
    const [proposalForm, setProposalForm] = useState({ name: "", email: "", phone: "", topic: "", description: "" });
    const [proposalLoading, setProposalLoading] = useState(false);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dateEventsModalOpen, setDateEventsModalOpen] = useState(false);
    const [selectedDateEvents, setSelectedDateEvents] = useState([]);

    const handleProposalSubmit = async (e) => {
        e.preventDefault();
        setProposalLoading(true);
        try {
            await proposalsAPI.submit(proposalForm);
            toast.success("Proposta enviada com sucesso!");
            setProposalModalOpen(false);
            setProposalForm({ name: "", email: "", phone: "", topic: "", description: "" });
        } catch (err) {
            toast.error("Erro ao enviar proposta. Tente novamente.");
        } finally {
            setProposalLoading(false);
        }
    };

    const handleDateSelect = (date) => {
        if (!date) return;
        setSelectedDate(date);

        // Find events for this date
        if (allEvents) {
            const eventsOnDate = allEvents.filter(event => {
                if (!event.startDate) return false;
                const eventDate = parseISO(event.startDate);
                return isSameDay(eventDate, date);
            });

            if (eventsOnDate.length > 0) {
                setSelectedDateEvents(eventsOnDate);
                setDateEventsModalOpen(true);
            }
        }
    };

    const handleShareTrack = async (track) => {
        const url = `${window.location.origin}/dashboard`;
        const title = track.title || "Trilha EduAgenda";
        const text = `Confira esta trilha de aprendizado: ${title}`;

        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
            } catch (err) {
                console.log("Erro ao compartilhar", err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                alert("Link copiado para a área de transferência!");
            } catch (err) {
                alert("Não foi possível copiar o link.");
            }
        }
    };




    // Fetch Public Events
    const { data: allEvents, isLoading, isError, error } = useQuery({
        queryKey: ["landing-public-events"],
        queryFn: async () => {
            const response = await eventsAPI.getAll({ public: true, upcoming: true, limit: 100 });
            const data = response.data?.events || response.data;
            return Array.isArray(data) ? data : [];
        },
        staleTime: 30000, // 30 seconds
    });

    // Fetch Public Tracks
    const { data: allTracks, isLoading: tracksLoading } = useQuery({
        queryKey: ["landing-public-tracks"],
        queryFn: async () => {
            const response = await tracksAPI.getAll();
            return Array.isArray(response.data) ? response.data : [];
        },
        staleTime: 30000,
    });

    // Fetch Categories
    const { data: categoriesArray } = useQuery({
        queryKey: ["landing-categories"],
        queryFn: async () => {
            const response = await categoriesAPI.getAll();
            return response.data;
        },
        staleTime: 30000,
    });

    // Client-side filtering for MODAL
    const searchResults = allEvents?.filter(event => {
        if (!debouncedSearchTerm) return false; // Don't show anything if empty in modal logic usually, or show all? User said "ao pesquisar...", assuming results appear as typed.
        const term = debouncedSearchTerm.toLowerCase();
        return (
            event.title?.toLowerCase().includes(term) ||
            event.description?.toLowerCase().includes(term) ||
            event.location?.toLowerCase().includes(term)
        );
    }) || [];

    // Main grid: Show events that are either in progress or upcoming
    const upcomingEvents = allEvents?.filter(e => {
        if (!e.endDate) return false;
        const now = new Date();
        const endDate = new Date(e.endDate);

        // DEBUG: Se o título contém "Passado", removemos sumariamente
        if (e.title?.toLowerCase().includes("passado")) return false;
        if (e.title?.toLowerCase().includes("mock")) return false;

        // Filtro de tempo restrito
        return endDate.getTime() > now.getTime();
    })
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 6) || [];

    const handleSearchClick = () => {
        setSearchModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] text-[#0d141b] dark:text-slate-100 transition-colors duration-300 font-sans">

            {/* SEARCH MODAL */}
            <Dialog open={searchModalOpen} onOpenChange={setSearchModalOpen} modal>
                {/* Controlled by custom trigger usually, but we can wrap or use state. We used DialogTrigger or controlled state? 
                     Let's use a controlled Dialog with `searchModalOpen` state. 
                 */}
                <DialogContent className="sm:max-w-[600px] p-0 gap-0 bg-white dark:bg-[#101922] border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Search className="w-5 h-5 text-slate-400" />
                        <Input
                            className="border-none shadow-none focus-visible:ring-0 px-0 text-base bg-transparent"
                            placeholder="Pesquisar eventos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")}><X className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                        )}
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {isLoading ? (
                            <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-[#137fec]" /></div>
                        ) : isError ? (
                            <div className="py-8 flex justify-center text-red-500">Erro ao carregar eventos.</div>
                        ) : searchTerm === "" ? (
                            <div className="py-12 text-center text-slate-500 text-sm">
                                <p>Digite para buscar eventos...</p>
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="py-12 text-center text-slate-500 text-sm">
                                <p>Nenhum evento encontrado.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {searchResults.map(event => (
                                    <Link
                                        to={`/events/${event.id}`}
                                        key={event.id}
                                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                                        onClick={() => setSearchModalOpen(false)}
                                    >
                                        <div className="w-12 h-12 rounded-md bg-slate-200 shrink-0 overflow-hidden">
                                            <img src={event.imageUrl ? getAssetUrl(event.imageUrl) : "https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2070&auto=format&fit=crop"} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm group-hover:text-[#137fec]">{event.title}</h4>
                                            <p className="text-xs text-slate-500 truncate max-w-[300px]">{event.location || "Online"} • {formatDate(event.startDate)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* HEADER */}
            <header className="sticky top-0 z-50 w-full border-b border-[#e7edf3] dark:border-slate-800 bg-white/80 dark:bg-[#101922]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

                    {/* LOGO */}
                    <Link to="/" className="flex items-center gap-2 shrink-0 group">
                        {logoUrl ? (
                            <img src={logoUrl} alt={platformName} className="h-10 w-auto object-contain" />
                        ) : (
                            <div className="bg-[#137fec] p-1.5 rounded-lg text-white group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                                </svg>
                            </div>
                        )}
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {platformName}
                        </h1>
                    </Link>

                    {/* SEARCH BAR (Desktop Trigger) */}
                    <div className="flex-1 max-w-xl hidden lg:block">
                        <div
                            className="relative group cursor-text"
                            onClick={() => setSearchModalOpen(true)}
                        >
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-[#137fec] transition-colors" />
                            <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-500 dark:text-slate-400 border border-transparent group-hover:border-[#137fec]/30 transition-all">
                                Buscar eventos...
                            </div>
                        </div>
                    </div>

                    {/* DESKTOP ACTIONS */}
                    <div className="hidden lg:flex items-center gap-3">
                        <nav className="flex items-center gap-4 text-sm font-semibold mr-4 text-slate-600 dark:text-slate-400">
                            <Link to="/" className="hover:text-[#137fec] transition-colors">Início</Link>
                            <Link to="/events" className="hover:text-[#137fec] transition-colors">Eventos</Link>
                            <Link to="/tracks" className="hover:text-[#137fec] transition-colors">Trilhas</Link>
                            <a href="#" className="hover:text-[#137fec] transition-colors">Sobre</a>
                        </nav>

                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                            title="Alternar tema"
                        >
                            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

                        <Link to={user ? "/dashboard" : "/login"}>
                            <Button className="bg-[#137fec] hover:bg-[#137fec]/90 text-white rounded-lg font-bold shadow-lg shadow-[#137fec]/20 transition-all whitespace-nowrap">
                                {user ? "Acessar Painel" : "Entrar / Cadastrar-se"}
                            </Button>
                        </Link>
                    </div>

                    {/* MOBILE ACTIONS */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <button
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                            onClick={() => setSearchModalOpen(true)}
                        >
                            <Search className="h-6 w-6" />
                        </button>

                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                        >
                            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* MOBILE MENU DROPDOWN */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101922] p-4 space-y-4 absolute w-full shadow-xl animate-in slide-in-from-top-5">
                        <nav className="flex flex-col gap-2 font-medium text-slate-600 dark:text-slate-300">
                            <Link to="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Início</Link>
                            <Link to="/events" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Eventos</Link>
                            <Link to="/tracks" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Trilhas</Link>
                            <a href="#" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Sobre</a>
                        </nav>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Link to={user ? "/dashboard" : "/login"} className="w-full block" onClick={() => setMobileMenuOpen(false)}>
                                <Button className="w-full bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold">
                                    {user ? "Acessar Painel" : "Entrar / Cadastrar-se"}
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-8 md:space-y-12">

                {/* HERO SECTION */}
                <HeroCarousel />

                {/* CATEGORY TABS (Dynamic) */}
                <section className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    <Link to="/events">
                        <Button className={`rounded-full gap-2 px-6 ${!searchTerm ? 'bg-[#137fec] text-white' : 'variant-outline text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800'}`}>
                            <LayoutGrid className="h-5 w-5" /> Todos os Eventos
                        </Button>
                    </Link>
                    {categoriesArray?.map((cat) => {
                        // Map category name to icon
                        let Icon = GraduationCap;
                        if (cat.name.toLowerCase().includes('tecnologia')) Icon = Laptop;
                        if (cat.name.toLowerCase().includes('arte') || cat.name.toLowerCase().includes('cultura')) Icon = Palette;
                        if (cat.name.toLowerCase().includes('gestão')) Icon = Users;
                        if (cat.name.toLowerCase().includes('ciência')) Icon = FlaskConical;

                        return (
                            <Link to={`/events?category=${cat.id}`} key={cat.id}>
                                <Button
                                    variant="outline"
                                    className="rounded-full border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 gap-2 px-6 text-slate-700 dark:text-slate-200 border-none"
                                >
                                    <Icon className="h-4 w-4" style={{ color: cat.color }} />
                                    {cat.name}
                                </Button>
                            </Link>
                        );
                    })}
                </section>

                {/* LEARNING TRACKS SECTION (BENTO GRID) */}
                <section id="tracks" className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-2">
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-[0.2em]">Formação Continuada</span>
                            <h3 className="text-3xl font-black tracking-tight drop-shadow-sm">Trilhas de Aprendizado</h3>
                            <p className="text-slate-500 max-w-xl">Sequências completas de eventos desenhadas para sua especialização profissional.</p>
                        </div>
                        <Link to="/tracks" className="text-[#137fec] text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                            Ver Todas as Trilhas <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    <div className="relative px-12 md:px-0">
                        {tracksLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="h-10 w-10 animate-spin text-[#137fec]" />
                            </div>
                        ) : allTracks?.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                <GraduationCap className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500 italic">Nenhuma trilha disponível no momento.</p>
                            </div>
                        ) : (
                            <Carousel opts={{ align: "start" }} className="w-full">
                                <CarouselContent className="-ml-4">
                                    {allTracks?.map((track) => (
                                        <CarouselItem key={track.id} className="pl-4 basis-[85%] sm:basis-[70%] md:basis-1/2 lg:basis-1/3">
                                            <div
                                                className="relative overflow-hidden group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                                            >
                                                {/* Track Header/Badge */}
                                                <div className="absolute top-6 left-6 z-10">
                                                    <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/10">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">{track._count?.events || 0} Etapas</span>
                                                    </div>
                                                </div>

                                                <div className="absolute top-6 right-6 z-10">
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); handleShareTrack(track); }}
                                                        className="bg-black/50 hover:bg-black/70 backdrop-blur-md p-2 rounded-full flex items-center justify-center border border-white/10 text-white transition-colors"
                                                        title="Compartilhar Trilha"
                                                    >
                                                        <Share2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Image Container */}
                                                <div className="relative overflow-hidden h-28 md:h-36 shrink-0 bg-slate-200 dark:bg-slate-800">
                                                    <img
                                                        src={track.imageUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                                        alt={track.title}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-transparent"></div>
                                                </div>

                                                {/* Content */}
                                                <div className="p-4 md:p-5 flex-1 flex flex-col bg-white dark:bg-slate-900 relative z-10">
                                                    <h4 className="text-base font-bold leading-snug line-clamp-2 min-h-[2.75rem] flex-1 text-slate-900 dark:text-slate-100">{track.title}</h4>
                                                    <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 mb-4">
                                                        {track.description}
                                                    </p>

                                                    {/* Journey Preview */}
                                                    <div className="space-y-3 mb-6 flex-1">
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sua Jornada</p>
                                                        <div className="space-y-2">
                                                            {track.events?.slice(0, 2).map((te, idx) => (
                                                                <div key={te.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg group/item">
                                                                    <div className="w-5 h-5 rounded-md bg-[#137fec] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate group-hover/item:text-[#137fec] transition-colors">
                                                                        {te.event?.title}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            {(track._count?.events || 0) > 2 && (
                                                                <p className="pl-2 text-[10px] font-bold text-[#137fec]">+ {(track._count?.events || 0) - 2} outras etapas</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 mt-auto">
                                                        <span className="text-emerald-500 text-xs font-bold">{track._count?.events || 0} Etapas</span>
                                                        <Link to={`/tracks/${track.id}`} className="text-[#137fec] text-xs font-bold flex items-center gap-1 group/link">
                                                            Ver detalhes
                                                            <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <div className="hidden md:block">
                                    <CarouselPrevious className="-left-12 lg:-left-16" />
                                    <CarouselNext className="-right-12 lg:-right-16" />
                                </div>
                                <div className="flex items-center justify-center gap-2 mt-6 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest md:hidden">
                                    <ChevronLeft className="w-4 h-4 animate-pulse" />
                                    <span>Deslize para ver mais</span>
                                    <ChevronRight className="w-4 h-4 animate-pulse" />
                                </div>
                            </Carousel>
                        )}
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent my-12"></div>
                </section>

                {/* EVENTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="events">

                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-3xl font-black tracking-tight drop-shadow-sm flex items-center gap-2">
                                Próximos Eventos
                            </h3>
                            <Link to="/events" className="text-[#137fec] hover:underline text-sm font-bold flex items-center gap-1 group">
                                Ver Todos <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>

                        <div className="relative px-12 md:px-0">
                            {isLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#137fec]" />
                                </div>
                            ) : isError ? (
                                <div className="text-center py-12 text-red-500">
                                    <p>Não foi possível carregar os eventos. Tente novamente mais tarde.</p>
                                    {error?.message && <p className="text-xs mt-2 text-slate-400">{error.message}</p>}
                                </div>
                            ) : upcomingEvents.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <p>Nenhum evento disponível no momento.</p>
                                </div>
                            ) : (
                                <Carousel opts={{ align: "start" }} className="w-full">
                                    <CarouselContent className="-ml-4">
                                        {upcomingEvents.map(event => (
                                            <CarouselItem key={event.id} className="pl-4 basis-[85%] sm:basis-[70%] md:basis-1/2">
                                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden hover:border-[#137fec]/50 transition-all shadow-sm hover:shadow-md group h-full flex flex-col">
                                                    <div className="relative h-28 md:h-36 bg-slate-800 dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                                                        {event.imageUrl ? (
                                                            <img
                                                                src={getAssetUrl(event.imageUrl)}
                                                                alt={event.title}
                                                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                                            />
                                                        ) : (
                                                            <Users className="w-12 h-12 text-slate-600" />
                                                        )}
                                                        <div className="absolute top-3 right-3 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-center shadow-sm">
                                                            <span className="block text-[10px] font-bold text-[#137fec] uppercase tracking-wider">{getMonthAbbr(event.startDate)}</span>
                                                            <span className="block text-base font-black text-slate-900 dark:text-white leading-none mt-0.5">{getDay(event.startDate)}</span>
                                                        </div>
                                                        {!event.location && event.isOnline && (
                                                            <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase">Online</div>
                                                        )}
                                                    </div>
                                                    <div className="p-4 md:p-5 flex-1 flex flex-col">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                                                            <MapPin className="h-3 w-3" /> {event.location || "Online"}
                                                        </div>
                                                        <h4 className="text-base font-bold leading-snug line-clamp-2 min-h-[2.75rem] flex-1 text-slate-900 dark:text-slate-100">{event.title}</h4>
                                                        <div className="flex items-center justify-between pt-4 mt-auto">
                                                            <span className="text-emerald-500 text-xs font-bold">Gratuito</span>
                                                            <Link to={`/events/${event.id}`} className="text-[#137fec] text-xs font-bold flex items-center gap-1 group/link">
                                                                Ver detalhes
                                                                <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <div className="hidden md:block">
                                        <CarouselPrevious className="-left-12 lg:-left-16" />
                                        <CarouselNext className="-right-12 lg:-right-16" />
                                    </div>
                                    <div className="flex items-center justify-center gap-2 mt-6 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest md:hidden">
                                        <ChevronLeft className="w-4 h-4 animate-pulse" />
                                        <span>Deslize para ver mais</span>
                                        <ChevronRight className="w-4 h-4 animate-pulse" />
                                    </div>
                                </Carousel>
                            )}
                        </div>
                    </div>

                    {/* SIDEBAR (Calendar & Widgets) */}
                    <aside className="lg:col-span-4 space-y-8">
                        {/* Calendar Widget */}
                        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-[#137fec]" /> Calendário de Eventos</h3>
                            </div>
                            <div className="flex justify-center w-full">
                                <CalendarUI
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={handleDateSelect}
                                    locale={ptBR}
                                    className="rounded-md border-0"
                                    modifiers={{
                                        hasEvent: (date) => {
                                            if (!allEvents) return false;
                                            return allEvents.some(event => {
                                                if (!event.startDate) return false;
                                                return isSameDay(parseISO(event.startDate), date);
                                            });
                                        }
                                    }}
                                    modifiersClassNames={{
                                        hasEvent: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-black rounded-md relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-blue-600 after:rounded-full"
                                    }}
                                />
                            </div>
                        </div>

                        {/* CTA Widget */}
                        <div className="bg-[#137fec]/10 border border-[#137fec]/20 rounded-xl p-6 space-y-4">
                            <h3 className="font-bold text-lg text-[#137fec]">Compartilhe seu saber!</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Tem um workshop ou palestra incrível? Envie sua proposta para fazer parte do nosso próximo grande evento.
                            </p>
                            <Button onClick={() => setProposalModalOpen(true)} className="w-full bg-[#137fec] hover:bg-[#137fec]/90 text-white text-sm font-bold">
                                Enviar Proposta
                            </Button>
                        </div>
                    </aside>

                </div>
            </main>

            {/* EVENTOS DA DATA SELECIONADA MODAL */}
            <Dialog open={dateEventsModalOpen} onOpenChange={setDateEventsModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-white dark:bg-[#101922] border-slate-200 dark:border-slate-800">
                    <div className="p-6">
                        <h3 className="text-xl font-bold mb-4 text-[#137fec] border-b border-slate-100 dark:border-slate-800 pb-3">
                            Eventos em {selectedDate && formatDate(selectedDate)}
                        </h3>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {selectedDateEvents.length > 0 ? (
                                selectedDateEvents.map((event) => (
                                    <div key={event.id} className="p-4 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-[#137fec]/50 transition-colors">
                                        <h4 className="font-bold text-lg">{event.title}</h4>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                                            <Calendar className="w-4 h-4" /> {formatDate(event.startDate)}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                            <MapPin className="w-4 h-4" /> {event.location || "Online"}
                                        </div>
                                        <div className="mt-4">
                                            <Link to={`/events/${event.id}`}>
                                                <Button size="sm" className="w-full bg-[#137fec]/10 text-[#137fec] hover:bg-[#137fec] hover:text-white">
                                                    Ver Detalhes do Evento
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-center py-8">Nenhum evento para esta data.</p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* COMPARTILHE SEU SABER MODAL */}
            <Dialog open={proposalModalOpen} onOpenChange={setProposalModalOpen}>
                <DialogContent className="sm:max-w-[550px] bg-white dark:bg-[#101922] border-slate-200 dark:border-slate-800">
                    <div className="p-6">
                        <h3 className="text-xl font-bold mb-2 text-[#137fec]">Compartilhe seu saber</h3>
                        <p className="text-sm text-slate-500 mb-6">Preencha os dados abaixo e a Secretaria de Educação entrará em contato.</p>

                        <form onSubmit={handleProposalSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Seu Nome *</label>
                                <Input required value={proposalForm.name} onChange={e => setProposalForm({ ...proposalForm, name: e.target.value })} placeholder="Ex: Prof. Silva" className="bg-white/5" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">E-mail *</label>
                                    <Input required type="email" value={proposalForm.email} onChange={e => setProposalForm({ ...proposalForm, email: e.target.value })} placeholder="seu@email.com" className="bg-white/5" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Telefone</label>
                                    <Input value={proposalForm.phone} onChange={e => setProposalForm({ ...proposalForm, phone: e.target.value })} placeholder="(00) 00000-0000" className="bg-white/5" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tema da Palestra/Workshop *</label>
                                <Input required value={proposalForm.topic} onChange={e => setProposalForm({ ...proposalForm, topic: e.target.value })} placeholder="Ex: Metodologias Ativas" className="bg-white/5" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Resumo Curto *</label>
                                <textarea required value={proposalForm.description} onChange={e => setProposalForm({ ...proposalForm, description: e.target.value })} className="w-full flex min-h-[80px] rounded-md border border-input dark:border-white/10 bg-transparent dark:bg-white/5 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Sobre o que você gostaria de falar?"></textarea>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setProposalModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={proposalLoading} className="bg-[#137fec] text-white hover:bg-[#137fec]/90">
                                    {proposalLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Enviar Proposta
                                </Button>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* FOOTER */}
            <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1 space-y-4 flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="flex items-center gap-2">
                            {logoUrl ? (
                                <img src={logoUrl} alt={platformName} className="h-8 w-auto object-contain" />
                            ) : (
                                <div className="bg-[#137fec] p-1.5 rounded-lg text-white">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                        <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                                    </svg>
                                </div>
                            )}
                            <h1 className="text-lg font-bold tracking-tight">{platformName}</h1>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Portal oficial de eventos e formação continuada.
                        </p>
                    </div>

                    <div className="hidden md:block">
                        <h4 className="font-bold mb-4">Links Rápidos</h4>
                        <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                            <li><a href="#" className="hover:text-[#137fec]">Próximos Eventos</a></li>
                            <li><a href="#" className="hover:text-[#137fec]">Workshops em Destaque</a></li>
                        </ul>
                    </div>

                    <div className="hidden md:block">
                        <h4 className="font-bold mb-4">Suporte</h4>
                        <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                            <li><a href="#" className="hover:text-[#137fec]">Central de Ajuda</a></li>
                            <li><a href="#" className="hover:text-[#137fec]">Política de Privacidade</a></li>
                        </ul>
                    </div>

                    <div className="hidden md:block">
                        <h4 className="font-bold mb-4">Contato</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Rua Getúlio Vargas, 123<br />Centro, Campina Grande - PB
                        </p>
                        <div className="flex gap-4">
                            <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-[#137fec] transition-colors"><Share2 className="h-4 w-4" /></button>
                            <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-[#137fec] transition-colors"><Mail className="h-4 w-4" /></button>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    © 2026 {platformName}. Desenvolvido para Excelência Educacional.
                </div>
            </footer>

            {/* BOTTOM MOBILE MENU */}
            <PublicBottomNav onSearchClick={() => setSearchModalOpen(true)} />
        </div>
    );
};

export default LandingPage;
