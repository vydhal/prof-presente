import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Trophy, Monitor, Users, List, Hash, Play, Settings2, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useSocket } from "../../contexts/SocketContext";
import { useQuery } from "@tanstack/react-query";
import { eventsAPI } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

const GiveawayControl = ({ eventId }) => {
    const socket = useSocket();
    const [mode, setMode] = useState("numbers"); // 'numbers' | 'names'
    const [isPrepared, setIsPrepared] = useState(false);

    // Config State
    const [preparedConfig, setPreparedConfig] = useState(null);
    const [prize, setPrize] = useState("");

    // Numbers Config
    const [quantity, setQuantity] = useState(1);
    const [minRange, setMinRange] = useState(1);
    const [maxRange, setMaxRange] = useState(100);

    // List Config
    const [listText, setListText] = useState("");

    // Options
    const [options, setOptions] = useState({
        sortResults: true,
        countdown: true,
        allowRepeat: false
    });

    // Enrollments fetching for "Import" feature
    const { data: enrollments, isLoading } = useQuery({
        queryKey: ["enrollments", eventId],
        queryFn: async () => {
            const res = await eventsAPI.getEnrollments(eventId);
            return res.data;
        },
        enabled: mode === "names" // Only fetch if tab is active
    });

    const handleImportEnrollments = () => {
        if (!enrollments) return;
        const names = enrollments.map(e => e.user.name).join("\n");
        setListText(names);
        toast.success(`${enrollments.length} participantes importados!`);
    };

    const handlePrepare = () => {
        let config = { type: mode, quantity: parseInt(quantity), options };

        if (mode === "numbers") {
            config.min = parseInt(minRange);
            config.max = parseInt(maxRange);
        } else {
            const items = listText.split("\n").filter(line => line.trim() !== "");
            if (items.length === 0) {
                toast.error("A lista está vazia!");
                return;
            }
            config.items = items;
            config.totalItems = items.length;
        }

        // Include Prize in payload
        socket.emit("prepare_giveaway", { eventId, config, prize });
        setPreparedConfig({ ...config, prize });
        setIsPrepared(true);
        toast.info("Configuração enviada para o telão!");
    };

    const handleStart = () => {
        if (!preparedConfig) return;
        socket.emit("start_giveaway", { eventId, config: preparedConfig, prize: preparedConfig.prize });
        toast.success("Sorteio iniciado!");
    };

    const handleCancel = () => {
        setIsPrepared(false);
        setPreparedConfig(null);
        socket.emit("prepare_giveaway", { eventId, config: null }); // Clear
    };

    return (
        <Card className="w-full shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1720] transition-colors">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-t-lg">
                <CardTitle className="text-base font-semibold flex items-center justify-between text-slate-800 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="bg-yellow-500/10 p-1.5 rounded-full">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                        </div>
                        Controle de Sorteio
                    </div>
                    {isPrepared && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 animate-pulse border-emerald-500/20">
                            Pronto para Sortear
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
                {isPrepared ? (
                    <div className="text-center py-8 space-y-4">
                        <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                            <Monitor className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-black">Valendo</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 drop-shadow-lg">{prize || "Sorteio Geral"}</p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl inline-block text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                            {preparedConfig.type === 'numbers' ? (
                                <span className="uppercase tracking-wider">{preparedConfig.quantity} número(s) entre <b className="text-blue-400">{preparedConfig.min}</b> e <b className="text-blue-400">{preparedConfig.max}</b></span>
                            ) : (
                                <span className="uppercase tracking-wider">{preparedConfig.quantity} vencedor(es) de <b className="text-purple-400">{preparedConfig.totalItems}</b> participantes</span>
                            )}
                        </div>

                        <div className="flex gap-3 justify-center pt-4">
                            <Button variant="outline" size="lg" onClick={handleCancel} className="w-full md:w-auto bg-white dark:bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 font-bold uppercase text-[11px] tracking-widest transition-all">
                                Cancelar
                            </Button>
                            <Button size="lg" className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-900/20 font-bold uppercase text-[11px] tracking-widest" onClick={handleStart}>
                                <Play className="w-4 h-4 mr-2 fill-current" /> INICIAR SORTEIO
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* PRIZE INPUT */}
                        <div className="space-y-2">
                            <Label htmlFor="prize" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">Prêmio / Título (Opcional)</Label>
                            <Input
                                id="prize"
                                placeholder="Ex: Livro, Pix de R$50, Brinde Especial..."
                                value={prize}
                                onChange={(e) => setPrize(e.target.value)}
                                className="h-12 text-lg border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/20 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all rounded-xl"
                            />
                        </div>

                        <Tabs value={mode} onValueChange={setMode} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
                                <TabsTrigger value="numbers" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md font-bold gap-2 text-xs uppercase tracking-wider transition-all">
                                    <Hash className="w-4 h-4" /> Números
                                </TabsTrigger>
                                <TabsTrigger value="names" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 data-[state=active]:shadow-md font-bold gap-2 text-xs uppercase tracking-wider transition-all">
                                    <List className="w-4 h-4" /> Nomes / Lista
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="numbers" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Quantidade de Vencedores</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={quantity}
                                                onChange={(e) => setQuantity(e.target.value)}
                                                className="pl-4 text-center text-xl font-black h-14 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white rounded-xl"
                                                min={1}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase pointer-events-none">
                                                Participantes
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Intervalo do Sorteio</Label>
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase">De</span>
                                                <Input
                                                    type="number"
                                                    value={minRange}
                                                    onChange={(e) => setMinRange(e.target.value)}
                                                    className="pl-10 text-center font-bold h-14 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white rounded-xl"
                                                />
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase">Até</span>
                                                <Input
                                                    type="number"
                                                    value={maxRange}
                                                    onChange={(e) => setMaxRange(e.target.value)}
                                                    className="pl-10 text-center font-bold h-14 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="names" className="space-y-5 animate-in slide-in-from-right-2 duration-300">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lista de Itens (um por linha)</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 text-[10px] font-black uppercase tracking-wider border-slate-800 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30"
                                        onClick={handleImportEnrollments}
                                        disabled={isLoading}
                                    >
                                        <Users className="w-3.5 h-3.5 mr-2" /> Importar Inscritos
                                    </Button>
                                </div>

                                <div className="relative">
                                    <Textarea
                                        value={listText}
                                        onChange={(e) => setListText(e.target.value)}
                                        placeholder="Digite ou cole os nomes aqui..."
                                        rows={6}
                                        className="bg-slate-50 dark:bg-black/20 min-h-[150px] font-mono text-sm border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:border-purple-500/50 placeholder:text-slate-300 dark:placeholder:text-slate-700 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 rounded-xl"
                                    />
                                    <div className="absolute bottom-3 right-3 text-[10px] font-black uppercase bg-white/80 dark:bg-slate-800/80 backdrop-blur px-2 py-1 rounded border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                                        {listText ? listText.split("\n").filter(l => l.trim()).length : 0} itens
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-24">Vencedores:</Label>
                                    <Input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="w-24 h-9 text-center font-bold bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg"
                                        min={1}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

                        <Separator className="bg-slate-800" />

                        {/* OPTIONS */}
                        <div className="bg-slate-50 dark:bg-black/20 p-5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                                <Settings2 className="w-4 h-4 text-blue-500" /> Opções do Sorteio
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-slate-800/50">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={options.sortResults}
                                            onChange={(e) => setOptions({ ...options, sortResults: e.target.checked })}
                                            className="peer h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200">Ordenar resultados (Crescente / A-Z)</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-slate-800/50">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={options.countdown}
                                            onChange={(e) => setOptions({ ...options, countdown: e.target.checked })}
                                            className="peer h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200">Adicionar contagem regressiva (Suspense)</span>
                                </label>

                                <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-slate-800/50">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={options.allowRepeat}
                                            onChange={(e) => setOptions({ ...options, allowRepeat: e.target.checked })}
                                            className="peer h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200">Permitir repetição (mesmo número/nome)</span>
                                </label>
                            </div>
                        </div>

                        <Button className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.15)] mt-4 rounded-xl transition-all" onClick={handlePrepare}>
                            <Monitor className="w-5 h-5 mr-3" />
                            Preparar Tela
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default GiveawayControl;
