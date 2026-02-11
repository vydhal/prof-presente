import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { bannersAPI } from "../lib/api";
import { Button } from "./ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getAssetUrl } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const HeroCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const { data: banners, isLoading } = useQuery({
        queryKey: ["active-banners"],
        queryFn: async () => {
            const response = await bannersAPI.getActive();
            return response.data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    useEffect(() => {
        if (!isAutoPlaying || !banners || banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, banners]);

    const handleNext = () => {
        setIsAutoPlaying(false);
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const handlePrev = () => {
        setIsAutoPlaying(false);
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    if (isLoading) {
        return (
            <div className="relative rounded-2xl overflow-hidden min-h-[500px] md:aspect-[21/9] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!banners || banners.length === 0) {
        // Fallback for no banners
        return (
            <section className="relative rounded-2xl overflow-hidden min-h-[500px] md:aspect-[21/9] group shadow-2xl">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1540575861501-7ad058c78a30?q=80&w=2070&auto=format&fit=crop')` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-[#101922]"></div>
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-12 flex flex-col justify-end h-full">
                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">
                        Bem-vindo ao <span className="text-blue-500">Portal de Eventos</span>
                    </h2>
                    <p className="text-slate-200 text-sm md:text-lg mb-6 max-w-xl">
                        Explore as melhores oportunidades de formação continuada e eventos educacionais da nossa região.
                    </p>
                    <Link to="/register">
                        <Button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 rounded-lg font-bold w-full sm:w-auto">
                            Cadastre-se para participar
                        </Button>
                    </Link>
                </div>
            </section>
        );
    }

    const currentBanner = banners[currentIndex];

    return (
        <section className="relative rounded-2xl overflow-hidden min-h-[500px] md:aspect-[21/9] group shadow-2xl">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentBanner.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${getAssetUrl(currentBanner.imageUrl)}')` }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#101922] md:to-[#101922]/90"></div>

                    <div className="absolute inset-x-0 bottom-0 p-6 md:p-12 w-full md:w-2/3 flex flex-col justify-end h-full">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="flex gap-2 mb-4">
                                <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Destaque</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 drop-shadow-lg lg:max-w-4xl">
                                {currentBanner.title}
                            </h2>
                            {currentBanner.description && (
                                <p className="text-slate-200 text-sm md:text-lg mb-6 line-clamp-3 md:line-clamp-2 max-w-xl">
                                    {currentBanner.description}
                                </p>
                            )}
                            <div className="flex flex-col sm:flex-row gap-3">
                                {currentBanner.linkUrl && (
                                    currentBanner.linkUrl.startsWith("http") ? (
                                        <a
                                            href={currentBanner.linkUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full sm:w-auto"
                                        >
                                            <Button className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 rounded-xl font-black flex items-center justify-center gap-2 group/btn text-base shadow-xl shadow-blue-500/20 transition-all">
                                                Saiba Mais
                                                <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                                            </Button>
                                        </a>
                                    ) : (
                                        <Link to={currentBanner.linkUrl} className="w-full sm:w-auto">
                                            <Button className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 rounded-xl font-black flex items-center justify-center gap-2 group/btn text-base shadow-xl shadow-blue-500/20 transition-all">
                                                Saiba Mais
                                                <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                                            </Button>
                                        </Link>
                                    )
                                )}
                                {!currentBanner.linkUrl && (
                                    <Link to="/register" className="w-full sm:w-auto">
                                        <Button className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 rounded-xl font-black flex items-center justify-center gap-2 group/btn text-base">
                                            Participar agora
                                            <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-20"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-20"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-6 right-6 md:right-12 flex gap-2 z-20">
                        {banners.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setIsAutoPlaying(false);
                                    setCurrentIndex(idx);
                                }}
                                className={`h-1.5 transition-all rounded-full ${idx === currentIndex ? "w-8 bg-blue-500" : "w-2 bg-white/30 hover:bg-white/50"}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
};

export default HeroCarousel;
