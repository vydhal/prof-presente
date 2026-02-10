import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Scanner } from "@yudiel/react-qr-scanner";
import Webcam from "react-webcam";
import api from "../lib/api";
import {
  CircleCheck as CheckCircle,
  Circle as XCircle,
  QrCode,
  Keyboard,
  Camera,
  Calendar,
  AlertCircle,
  UserCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "../hooks/useDebounce";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SCAN_INTERVAL = 3000; // Intervalo entre tentativas de scan facial (em ms) - Ex: 2 segundos
const RESULT_DISPLAY_TIME = 3000; // Tempo para exibir o alerta (2 segundos)

const CheckIn = () => {
  const [scanResult, setScanResult] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isQrScanning, setIsQrScanning] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [scanError, setScanError] = useState(null);
  const scanIntervalRef = useRef(null);
  const isProcessingFacialRef = useRef(false);

  const [isFacialScanning, setIsFacialScanning] = useState(false);
  const webcamRef = useRef(null); // Ref para o componente Webcam

  // Buscar eventos disponíveis
  const { data: eventsData } = useQuery({
    queryKey: ["events-for-checkin"],
    queryFn: async () => {
      const response = await api.get("/events", { params: { limit: 100 } });
      return response.data;
    },
  });

  // Filtra os eventos para mostrar apenas os "Ativos" (Próximos ou Em Andamento)
  const ongoingEvents = eventsData?.events?.filter((event) => {
    const now = new Date();
    // O evento permanece visível até 4 horas depois de terminar (mesmo critério do backend)
    const visibilityThreshold = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const end = new Date(event.endDate);

    // Mostra se o evento ainda não terminou ou terminou há menos de 4 horas
    return end >= visibilityThreshold;
  });

  // Buscar usuários por nome
  const { data: usersData } = useQuery({
    queryKey: ["users-search", debouncedSearch, selectedEvent],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return { users: [] };
      const response = await api.get("/badges/search", {
        params: {
          query: debouncedSearch,
          eventId: selectedEvent,
        },
      });
      return response.data;
    },
    enabled: !!debouncedSearch && debouncedSearch.length >= 2,
  });

  const checkInMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/checkins", data);
      return response.data;
    },
    onSuccess: (data) => {
      setScanResult({
        success: true,
        message: "Check-in realizado com sucesso!",
        data,
      });
      toast.success("Check-in realizado com sucesso!");
      setManualInput("");
      setSearchQuery("");
    },
    onError: (error) => {
      setScanResult({
        success: false,
        message: error.response?.data?.error || "Erro ao realizar check-in",
      });
      toast.error(error.response?.data?.error || "Erro ao realizar check-in");
    },
  });

  // --- NOVA MUTAÇÃO PARA CHECK-IN FACIAL ---
  const facialCheckinMutation = useMutation({
    mutationFn: async (imageData) => {
      isProcessingFacialRef.current = true;
      try {
        const response = await api.post("/checkins/facial", {
          eventId: selectedEvent,
          imageBase64: imageData.split(",")[1],
        });
        return response.data;
      } finally {
        // Pequeno delay antes de permitir novo scan, mesmo em erro
        setTimeout(() => {
          isProcessingFacialRef.current = false;
        }, 500);
      }
    },
    onSuccess: (data) => {
      // Define o resultado para exibir o alerta
      setScanResult({
        success: true,
        message: "Check-in OK!", // Mensagem curta para o alerta
        data, // Mantém os dados para info adicional se necessário
      });
      toast.success(
        `Check-in realizado: ${data?.checkin?.userBadge?.user?.name || "Usuário"
        }`
      ); // Toast mais informativo

      // Limpa o alerta após o tempo definido
      setTimeout(() => {
        // Só limpa se o scan ainda estiver ativo (evita limpar se o usuário parou)
        if (scanIntervalRef.current) setScanResult(null);
      }, RESULT_DISPLAY_TIME);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || "Falha no Check-in";
      // Define o resultado para exibir o alerta
      setScanResult({ success: false, message: errorMessage });
      toast.error(errorMessage); // Mantém o toast para detalhes

      // Limpa o alerta após o tempo definido
      setTimeout(() => {
        if (scanIntervalRef.current) setScanResult(null);
      }, RESULT_DISPLAY_TIME);
    },
  });

  const runFacialScan = useCallback(() => {
    if (
      !webcamRef.current ||
      !isFacialScanning ||
      isProcessingFacialRef.current
    ) {
      return; // Sai se a câmera não está pronta, scan inativo ou já processando
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      // Envia para a API sem esperar confirmação manual
      facialCheckinMutation.mutate(imageSrc);
    }
  }, [isFacialScanning, facialCheckinMutation]);

  useEffect(() => {
    if (isFacialScanning) {
      // Limpa qualquer intervalo anterior
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      // Inicia um novo intervalo que chama runFacialScan
      scanIntervalRef.current = setInterval(runFacialScan, SCAN_INTERVAL);
    } else {
      // Se parou de escanear, limpa o intervalo
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    }

    // Função de limpeza ao desmontar o componente
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isFacialScanning, runFacialScan]);

  const handleStartQrScanner = () => {
    if (!selectedEvent) return toast.error("Selecione um evento primeiro");
    setScanError(null);
    setScanResult(null);
    setIsQrScanning(true);
  };

  const handleStopQrScanner = () => setIsQrScanning(false);

  const handleManualCheckIn = () => {
    if (!selectedEvent) {
      toast.error("Selecione um evento primeiro");
      return;
    }
    if (!manualInput.trim()) {
      toast.error("Por favor, insira o código do crachá");
      return;
    }

    checkInMutation.mutate({
      badgeCode: manualInput.trim().toUpperCase(),
      eventId: selectedEvent,
    });
  };

  const handleUserSelect = (user) => {
    if (!selectedEvent) {
      toast.error("Selecione um evento primeiro");
      return;
    }
    if (!user.badgeCode) {
      toast.error("Usuário não possui crachá");
      return;
    }

    checkInMutation.mutate({
      badgeCode: user.badgeCode,
      eventId: selectedEvent,
    });
  };

  // --- NOVOS HANDLERS PARA FACIAL ---
  const handleStartFacialScanner = () => {
    if (!selectedEvent) return toast.error("Selecione um evento primeiro");
    setScanResult(null);
    setIsFacialScanning(true);
  };

  const handleStopFacialScanner = () => {
    setIsFacialScanning(false);
    setScanResult(null);
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current); // Garante limpeza
  };

  // Limpa o resultado ao mudar de evento
  useEffect(() => {
    setScanResult(null);
    setIsQrScanning(false);
    setIsFacialScanning(false);
  }, [selectedEvent]);

  // Configurações da Webcam
  const videoConstraints = {
    width: 480,
    height: 480,
    facingMode: "user", // Ou "environment" para câmera traseira
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Check-in de Participantes</h1>
        <p className="text-gray-600">
          Realize check-in usando QR code, código do crachá ou nome do
          participante
        </p>
      </div>

      {/* Seleção de Evento */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Selecionar Evento
          </CardTitle>
          <CardDescription>
            Escolha o evento para realizar o check-in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Prepara as opções para o Combobox */}
          {(() => {
            const eventOptions =
              ongoingEvents?.map((event) => {
                const now = new Date();
                const start = new Date(event.startDate);
                const status = now >= start ? "(Em Andamento)" : "(Próximo)";

                return {
                  value: event.id,
                  label: `${event.title} ${status} - ${new Date(
                    event.startDate
                  ).toLocaleDateString("pt-BR")}`,
                };
              }) || [];

            return (
              <Combobox
                options={eventOptions}
                value={selectedEvent}
                onSelect={setSelectedEvent}
                placeholder="Selecione um evento"
                searchPlaceholder="Buscar evento..."
                emptyText="Nenhum evento encontrado."
                className="w-full"
              />
            );
          })()}
        </CardContent>
      </Card>

      {selectedEvent && (
        <>
          {/* Resultado do Check-in */}
          {scanResult && !isFacialScanning && (
            <Alert
              className={`mb-6 ${scanResult.success
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
                }`}
            >
              <div className="flex items-center gap-2">
                {scanResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <AlertDescription
                  className={
                    scanResult.success ? "text-green-800" : "text-red-800"
                  }
                >
                  {scanResult.message}
                  {scanResult.data?.checkin?.userBadge?.user && (
                    <div className="mt-2 font-semibold">
                      Usuário: {scanResult.data.checkin.userBadge.user.name}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Métodos de Check-in */}
          <Tabs defaultValue="qr" className="w-full">
            <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
              <TabsList className="inline-flex w-auto space-x-2 sm:grid sm:w-full sm:grid-cols-4">
                <TabsTrigger value="qr">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </TabsTrigger>
                <TabsTrigger value="manual">
                  <Keyboard className="h-4 w-4 mr-2" />
                  Código Manual
                </TabsTrigger>
                <TabsTrigger value="search">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Buscar Nome
                </TabsTrigger>
                <TabsTrigger value="facial">
                  <Camera className="h-4 w-4 mr-2" />
                  Facial
                </TabsTrigger>
              </TabsList>
            </div>

            {/* --- Scanner --- */}
            <TabsContent value="qr">
              <Card>
                <CardHeader>
                  <CardTitle>Escanear QR Code</CardTitle>
                  <CardDescription>
                    Aponte a câmera para o QR code do crachá. A leitura é
                    automática.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isQrScanning ? (
                    <Button onClick={handleStartQrScanner} className="w-full">
                      <Camera className="h-4 w-4 mr-2" />
                      Ativar Câmera
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopQrScanner}
                      variant="destructive"
                      className="w-full"
                    >
                      Desativar Câmera
                    </Button>
                  )}

                  {isQrScanning && (
                    <div className="mt-4">
                      <Scanner
                        onScan={(detectedCodes) => {
                          if (!detectedCodes || detectedCodes.length === 0)
                            return;
                          const first = detectedCodes[0];
                          const text = first.rawValue || "";
                          if (text) {
                            console.log("✅ QR Code detectado:", text);
                            toast.success("QR Code lido com sucesso!");
                            setIsQrScanning(false);
                            setScanError(null);

                            checkInMutation.mutate({
                              qrCodeValue: text,
                              eventId: selectedEvent,
                            });
                          }
                        }}
                        onError={(err) => {
                          if (
                            err &&
                            typeof err.message === "string" &&
                            !err.message.includes("NotFoundException")
                          ) {
                            console.error("Erro de leitura:", err);
                            setScanError(err.message);
                          }
                        }}
                        constraints={{
                          facingMode: "environment",
                        }}
                        allowMultiple={false}
                        styles={{
                          container: { width: "100%" },
                          video: { borderRadius: "0.5rem" },
                        }}
                      />
                      {scanError && (
                        <div className="...">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Erro: {scanError}
                        </div>
                      )}
                      <div className="text-center text-sm text-gray-500 p-2 border rounded-lg mt-2">
                        <p>Aponte a câmera para o QR Code.</p>
                        <p>
                          Garanta boa iluminação e que o código esteja focado.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- Manual --- */}
            <TabsContent value="manual">
              <Card>
                <CardHeader>
                  <CardTitle>Entrada Manual do Código</CardTitle>
                  <CardDescription>
                    Digite o código do crachá (ex: JOAO-SILVA-1234)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="manual-badge">Código do Crachá</Label>
                    <Input
                      id="manual-badge"
                      placeholder="Ex: JOAO-SILVA-1234"
                      value={manualInput}
                      onChange={(e) =>
                        setManualInput(e.target.value.toUpperCase())
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleManualCheckIn();
                      }}
                      className="mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleManualCheckIn}
                    disabled={checkInMutation.isPending}
                    className="w-full"
                  >
                    {checkInMutation.isPending
                      ? "Realizando check-in..."
                      : "Realizar Check-in"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- Buscar por nome --- */}
            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle>Buscar por Nome</CardTitle>
                  <CardDescription>
                    Digite o nome do participante para realizar o check-in
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="search-name">Nome do Participante</Label>
                    <Input
                      id="search-name"
                      placeholder="Digite o nome..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  {usersData?.users && usersData.users.length > 0 && (
                    <div className="border rounded-lg divide-y">
                      {usersData.users.map((user) => (
                        <div
                          key={user.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium break-words">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {user.email}
                            </p>
                            {user.badgeCode && (
                              <p className="text-xs text-gray-500 font-mono mt-1">
                                {user.badgeCode}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-shrink-0"
                          >
                            Check-in
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery.length >= 2 &&
                    (!usersData?.users || usersData.users.length === 0) && (
                      <p className="text-center text-gray-500 py-4">
                        Nenhum participante encontrado
                      </p>
                    )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- NOVA ABA FACIAL --- */}
            <TabsContent value="facial">
              <Card>
                <CardHeader>
                  <CardTitle>Check-in Facial Contínuo</CardTitle>
                  <CardDescription>
                    A câmera buscará e processará rostos automaticamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex flex-col items-center">
                  {!isFacialScanning ? (
                    <Button
                      onClick={handleStartFacialScanner}
                      className="w-full max-w-sm"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Iniciar Scanner Facial
                    </Button>
                  ) : (
                    <>
                      {/* --- CONTAINER PARA WEBCAM E ALERTA --- */}
                      <div className="w-full max-w-sm border rounded-lg overflow-hidden relative">
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          width={480}
                          height={480}
                          videoConstraints={videoConstraints}
                          mirrored={videoConstraints.facingMode === "user"}
                        />

                        {/* --- ALERTA SOBREPOSTO --- */}
                        {scanResult && (
                          <div
                            className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-white text-center transition-opacity duration-300 ${scanResult.success
                              ? "bg-green-600/90"
                              : "bg-red-600/90"
                              }`}
                          >
                            {scanResult.success ? (
                              <CheckCircle className="h-16 w-16 mb-2" />
                            ) : (
                              <XCircle className="h-16 w-16 mb-2" />
                            )}
                            <p className="text-xl font-bold mb-1">
                              {scanResult.success
                                ? "Check-in Confirmado!"
                                : "Falha no Check-in"}
                            </p>
                            {scanResult.data?.checkin?.userBadge?.user
                              ?.name && (
                                <p className="text-lg">
                                  {scanResult.data.checkin.userBadge.user.name}
                                </p>
                              )}
                            {!scanResult.success && (
                              <p className="text-sm mt-1">
                                {scanResult.message}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Indicador de processamento (pode coexistir com o alerta ou não, ajuste a opacidade se necessário) */}
                        {(facialCheckinMutation.isPending ||
                          isProcessingFacialRef.current) &&
                          !scanResult && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 className="h-8 w-8 text-white animate-spin" />
                            </div>
                          )}
                      </div>
                      <Button
                        onClick={handleStopFacialScanner}
                        variant="destructive"
                        className="w-full max-w-sm"
                      >
                        Parar Scanner
                      </Button>
                    </>
                  )}

                  <Alert
                    variant="warning"
                    className="w-full max-w-sm text-yellow-800 border-yellow-300 bg-yellow-50"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Certifique-se de boa iluminação e que o rosto esteja bem
                      visível. Esta função não possui detecção de vivacidade
                      (anti-fraude). Utilize os métodos alternativos (QR
                      Code/Manual) se necessário.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default CheckIn;
