import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eventsAPI, tracksAPI } from "../lib/api";
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
    Loader2
} from "lucide-react";
import HeroCarousel from "../components/HeroCarousel";
import { useBranding } from "../contexts/BrandingContext";
import LogoDefault from "../assets/logo-prof-presente.svg";

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
    const { platformName, logoUrl } = useBranding();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Theme Toggler
    useEffect(() => {
        // Check system preference or localStorage
        const savedTheme = localStorage.getItem("theme");
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

        if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add("dark");
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
            setIsDarkMode(true);
        }
    };

    // Fetch Public Events
    const { data: allEvents, isLoading, isError, error } = useQuery({
        queryKey: ["landing-public-events-v3"], // Force refresh
        queryFn: async () => {
            // We use public: true to ensure access for unauthenticated users
            // We use limit: 100 to ensure we catch 'In Progress' events 
            const response = await eventsAPI.getAll({ public: true, limit: 100 });
            return response.data?.events || response.data || [];
        },
    });

    // Fetch Public Tracks
    const { data: allTracks, isLoading: tracksLoading } = useQuery({
        queryKey: ["landing-public-tracks"],
        queryFn: async () => {
            const response = await tracksAPI.getAll();
            return response.data || [];
        },
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

    // Main grid always shows upcoming (no filter)
    const upcomingEvents = allEvents?.slice(0, 6) || [];

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
                                            <img src={event.imageUrl || "https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2070&auto=format&fit=crop"} className="w-full h-full object-cover" />
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
                    <div className="flex items-center gap-2 shrink-0">
                        {logoUrl ? (
                            <img src={logoUrl} alt={platformName} className="h-10 w-auto object-contain" />
                        ) : (
                            <div className="bg-[#137fec] p-1.5 rounded-lg text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                                </svg>
                            </div>
                        )}
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {platformName}
                        </h1>
                    </div>

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
                        <nav className="flex items-center gap-4 text-sm font-semibold mr-4">
                            <a href="#" className="hover:text-[#137fec] transition-colors">Início</a>
                            <a href="#events" className="hover:text-[#137fec] transition-colors">Eventos</a>
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

                        <Link to="/login">
                            <Button className="bg-[#137fec] hover:bg-[#137fec]/90 text-white rounded-lg font-bold shadow-lg shadow-[#137fec]/20 transition-all whitespace-nowrap">
                                Entrar / Cadastrar-se
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

                            <a href="#" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Início</a>
                            <a href="#events" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Eventos</a>
                            <a href="#" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Sobre</a>
                        </nav>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Link to="/login" className="w-full block">
                                <Button className="w-full bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold">
                                    Entrar / Cadastrar-se
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 space-y-8 md:space-y-12">

                {/* HERO SECTION */}
                <HeroCarousel />

                {/* CATEGORY TABS (Static for prototype) */}
                <section className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    <Button className="rounded-full bg-[#137fec] text-white hover:bg-[#137fec]/90 gap-2 px-6">
                        <LayoutGrid className="h-5 w-5" /> Todos os Eventos
                    </Button>
                    <Button variant="outline" className="rounded-full border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 gap-2 px-6 text-slate-700 dark:text-slate-200 border-none">
                        <GraduationCap className="h-5 w-5" /> Pedagogia
                    </Button>
                    <Button variant="outline" className="rounded-full border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 gap-2 px-6 text-slate-700 dark:text-slate-200 border-none">
                        <Laptop className="h-5 w-5" /> Tecnologia
                    </Button>
                    <Button variant="outline" className="rounded-full border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 gap-2 px-6 text-slate-700 dark:text-slate-200 border-none">
                        <Palette className="h-5 w-5" /> Arte & Cultura
                    </Button>
                    <Button variant="outline" className="rounded-full border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 gap-2 px-6 text-slate-700 dark:text-slate-200 border-none">
                        <Users className="h-5 w-5" /> Gestão
                    </Button>
                </section>

                {/* LEARNING TRACKS SECTION (BENTO GRID) */}
                <section id="tracks" className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-2">
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-[0.2em]">Formação Continuada</span>
                            <h3 className="text-3xl font-black tracking-tight drop-shadow-sm">Trilhas de Aprendizado</h3>
                            <p className="text-slate-500 max-w-xl">Sequências completas de eventos desenhadas para sua especialização profissional.</p>
                        </div>
                        <a href="#events" className="text-[#137fec] text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                            Explorar Eventos Avulsos <ArrowRight className="h-4 w-4" />
                        </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {tracksLoading ? (
                            <div className="col-span-1 md:col-span-4 flex justify-center py-20">
                                <Loader2 className="h-10 w-10 animate-spin text-[#137fec]" />
                            </div>
                        ) : allTracks?.length === 0 ? (
                            <div className="col-span-1 md:col-span-4 text-center py-20 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                <GraduationCap className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500 italic">Nenhuma trilha disponível no momento.</p>
                            </div>
                        ) : (
                            allTracks?.map((track, trackIdx) => (
                                <div
                                    key={track.id}
                                    className={`relative overflow-hidden group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col ${trackIdx === 0 ? 'md:col-span-2 md:row-span-2' : 'md:col-span-2 lg:col-span-1'
                                        }`}
                                >
                                    {/* Track Header/Badge */}
                                    <div className="absolute top-6 left-6 z-10">
                                        <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/10">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">{track._count?.events || 0} Etapas</span>
                                        </div>
                                    </div>

                                    {/* Image Container */}
                                    <div className={`relative overflow-hidden ${trackIdx === 0 ? 'h-64 md:h-80' : 'h-48'}`}>
                                        <img
                                            src={track.imageUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            alt={track.title}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-transparent"></div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-8 flex-1 flex flex-col">
                                        <h4 className="text-2xl font-black mb-3 tracking-tight group-hover:text-blue-500 transition-colors">{track.title}</h4>
                                        <p className="text-slate-500 text-sm line-clamp-2 mb-6 leading-relaxed">
                                            {track.description}
                                        </p>

                                        {/* Journey Preview */}
                                        <div className="space-y-4 mb-8">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sua Jornada:</p>
                                            <div className="space-y-2">
                                                {track.events?.slice(0, 3).map((te, idx) => (
                                                    <div key={te.id} className="flex items-center gap-3 group/item">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors shrink-0">
                                                            {idx + 1}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors">
                                                            {te.event?.title}
                                                        </span>
                                                    </div>
                                                ))}
                                                {(track._count?.events || 0) > 3 && (
                                                    <p className="pl-9 text-[10px] font-bold text-blue-500">+ {(track._count?.events || 0) - 3} outros eventos</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <Link to="/login" className="block w-full">
                                                <Button className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white rounded-2xl font-black text-base shadow-xl shadow-slate-200 dark:shadow-none transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]">
                                                    Começar Trilha
                                                    <ArrowRight className="w-5 h-5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent my-12"></div>
                </section>

                {/* EVENTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="events">

                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold tracking-tight">Próximos Eventos</h3>
                            <a href="#" className="text-[#137fec] text-sm font-semibold flex items-center gap-1 hover:underline">
                                Ver Todos <ChevronRight className="h-4 w-4" />
                            </a>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {isLoading ? (
                                <div className="col-span-1 md:col-span-2 flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#137fec]" />
                                </div>
                            ) : isError ? (
                                <div className="col-span-1 md:col-span-2 text-center py-12 text-red-500">
                                    <p>Não foi possível carregar os eventos. Tente novamente mais tarde.</p>
                                    {error?.message && <p className="text-xs mt-2 text-slate-400">{error.message}</p>}
                                </div>
                            ) : upcomingEvents.length === 0 ? (
                                <div className="col-span-1 md:col-span-2 text-center py-12 text-slate-500">
                                    <p>Nenhum evento disponível no momento.</p>
                                </div>
                            ) : (
                                upcomingEvents.map(event => (
                                    <div key={event.id} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-[#137fec]/50 transition-all hover:scale-[1.02] shadow-sm hover:shadow-lg group cursor-pointer">
                                        <div className="relative h-48">
                                            <img
                                                src={event.imageUrl || "https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2070&auto=format&fit=crop"}
                                                alt={event.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg text-center shadow-lg">
                                                <span className="block text-xs font-bold text-[#137fec] uppercase">{getMonthAbbr(event.startDate)}</span>
                                                <span className="block text-lg font-black dark:text-white leading-tight">{getDay(event.startDate)}</span>
                                            </div>
                                            {!event.location && event.isOnline && (
                                                <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase">Online</div>
                                            )}
                                        </div>
                                        <div className="p-5 space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                                <MapPin className="h-3.5 w-3.5" /> Local: {event.location || "Online"}
                                            </div>
                                            <h4 className="text-lg font-bold leading-tight line-clamp-2 min-h-[3.5rem]">{event.title}</h4>
                                            <div className="flex items-center justify-between pt-2">
                                                {/* Mock price/free logic */}
                                                <span className="text-emerald-500 font-bold">Gratuito</span>
                                                <Link to={`/events/${event.id}`}>
                                                    <Button size="sm" className="bg-[#137fec]/10 hover:bg-[#137fec] text-[#137fec] hover:text-white rounded-lg text-xs font-bold transition-colors">
                                                        Ver Detalhes
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* SIDEBAR (Calendar & Widgets) */}
                    <aside className="lg:col-span-4 space-y-8">
                        {/* Calendar Widget */}
                        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold">Calendário</h3>
                                <div className="flex gap-2">
                                    <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ChevronLeft className="h-5 w-5 text-slate-400" /></button>
                                    <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ChevronRight className="h-5 w-5 text-slate-400" /></button>
                                </div>
                            </div>
                            <div className="text-center text-sm font-semibold text-slate-500 mb-4">Outubro 2024</div>
                            {/* Simplified Grid Mockup */}
                            <div className="grid grid-cols-7 gap-y-4 text-center text-sm">
                                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                                    <div key={day} className="text-slate-400 font-medium text-xs uppercase">{day}</div>
                                ))}
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <div key={day} className={`py-1 text-xs ${day === 24 ? 'bg-[#137fec]/20 text-[#137fec] rounded-lg font-bold relative' : ''}`}>
                                        {day}
                                        {day === 24 && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#137fec] rounded-full"></div>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Widget */}
                        <div className="bg-[#137fec]/10 border border-[#137fec]/20 rounded-xl p-6 space-y-4">
                            <h3 className="font-bold text-lg text-[#137fec]">Compartilhe seu saber!</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Tem um workshop ou palestra incrível? Envie sua proposta para fazer parte do nosso próximo grande evento.
                            </p>
                            <Button className="w-full bg-[#137fec] hover:bg-[#137fec]/90 text-white text-sm font-bold">
                                Enviar Proposta
                            </Button>
                        </div>
                    </aside>

                </div>
            </main>

            {/* FOOTER */}
            <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 mt-12 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1 space-y-4">
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

                    <div>
                        <h4 className="font-bold mb-4">Links Rápidos</h4>
                        <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                            <li><a href="#" className="hover:text-[#137fec]">Próximos Eventos</a></li>
                            <li><a href="#" className="hover:text-[#137fec]">Workshops em Destaque</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4">Suporte</h4>
                        <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                            <li><a href="#" className="hover:text-[#137fec]">Central de Ajuda</a></li>
                            <li><a href="#" className="hover:text-[#137fec]">Política de Privacidade</a></li>
                        </ul>
                    </div>

                    <div>
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
        </div>
    );
};

export default LandingPage;
