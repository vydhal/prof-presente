import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { toast } from "sonner";
import api from "../lib/api";
// NOVO: Importa os ícones para as estatísticas
import {
  CheckCircle,
  Download,
  AlertTriangle,
  Trash2,
  Award,
  Calendar,
  Camera,
  LockKeyhole,
} from "lucide-react";
// Importa o novo componente de crachá
import UniversalBadge from "../components/UniversalBadge";
import { useAuth } from "../hooks/useAuth"; // NOVO: Para deslogar o usuário após exclusão
import { getAssetUrl } from "../lib/utils"; // NOVO: Para resolver a URL da imagem
import { Switch } from "../components/ui/switch";
import { Alert, AlertDescription } from "../components/ui/alert";

const Profile = () => {
  const queryClient = useQueryClient();
  const { user, logout, updateAuthUser } = useAuth(); // Pega a nova função 'updateAuthUser'
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [consentFacial, setConsentFacial] = useState(false); // 2. Estado para o consentimento
  const [isExporting, setIsExporting] = useState(false);
  // NOVO: Estados para o upload da foto
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Busca os dados do perfil do usuário
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      // Ajuste para buscar o perfil logado, que já inclui 'hasConsentFacialRecognition'
      const response = await api.get(`/auth/profile`);
      return response.data;
    },
    enabled: !!user?.id,
    onSuccess: (data) => {
      // Popula o formulário E o estado de consentimento quando os dados chegam
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
      });
      setPhotoPreview(getAssetUrl(data.photoUrl));
      setConsentFacial(data.hasConsentFacialRecognition || false); // 3. Atualiza estado do consentimento
    },
  });

  // NOVO: Query para buscar as premiações (insígnias) do usuário
  const { data: userAwards, isLoading: areAwardsLoading } = useQuery({
    queryKey: ["user-awards", userData?.id],
    queryFn: async () => {
      const response = await api.get(`/awards/users/${userData.id}`);
      // A API retorna o objeto userAwards, que tem a premiação dentro de `award`
      return response.data.userAwards;
    },
    enabled: !!userData?.id, // A query só roda quando o ID do usuário estiver disponível
  });

  // Busca o crachá universal do usuário
  const { data: userBadge, isLoading: isBadgeLoading } = useQuery({
    queryKey: ["my-badge"],
    queryFn: async () => {
      const response = await api.get("/badges/my-badge");
      return response.data;
    },
  });

  const { data: enrollmentsData } = useQuery({
    queryKey: ["my-enrollments-stats", user?.id],
    queryFn: () =>
      api.get("/enrollments/my-enrollments?limit=1").then((res) => res.data),
    enabled: !!user?.id,
  });

  const { data: checkinsData } = useQuery({
    queryKey: ["my-checkins-stats", user?.id],
    queryFn: () => api.get("/checkins/my?limit=1").then((res) => res.data),
    enabled: !!user?.id,
  });

  const { data: evaluationsData } = useQuery({
    queryKey: ["my-evaluations-stats"],
    queryFn: () => api.get("/evaluations/my"),
    enabled: !!userData,
  });

  const { data: awardsData } = useQuery({
    queryKey: ["my-awards-stats", user?.id],
    queryFn: () =>
      api.get(`/awards/users/${user.id}?limit=1`).then((res) => res.data),
    enabled: !!user?.id,
  });

  // Popula o formulário quando os dados do usuário são carregados
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || "",
      });
      setPhotoPreview(getAssetUrl(userData.photoUrl));
      setConsentFacial(userData.hasConsentFacialRecognition || false);
    }
  }, [userData]);

  const updateUserMutation = useMutation({
    mutationFn: (updatedData) => api.put(`/users/${userData.id}`, updatedData),
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      queryClient.invalidateQueries(["profile"]);
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao atualizar perfil");
    },
  });

  const handleUpdate = (e) => {
    e.preventDefault();
    updateUserMutation.mutate(formData);
  };

  const updatePhotoMutation = useMutation({
    mutationFn: (photoFormData) =>
      api.post(`/users/${user.id}/photo`, photoFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: (data) => {
      toast.success("Foto de perfil atualizada com sucesso!");
      const updatedUser = data.data.user;

      // ATUALIZAÇÃO GLOBAL: Notifica o useAuth sobre a nova foto
      if (updatedUser?.photoUrl) {
        updateAuthUser({ photoUrl: updatedUser.photoUrl });
      }

      // Invalida a query para recarregar os dados apenas nesta página
      queryClient.invalidateQueries({ queryKey: ["user-profile", user.id] });

      setPhotoFile(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao atualizar a foto.");
      setPhotoPreview(getAssetUrl(userData.photoUrl));
      setPhotoFile(null);
    },
  });

  const updateConsentMutation = useMutation({
    mutationFn: (newConsentValue) =>
      api.put("/users/me/consent-facial", { consent: newConsentValue }),
    onSuccess: (data) => {
      toast.success(data.data.message || "Consentimento atualizado.");

      // 1. Pega o novo valor booleano retornado pela API
      const newConsent = data.data.hasConsentFacialRecognition;

      // 2. (Opcional, mas recomendado) Atualiza o contexto de autenticação global
      updateAuthUser({ hasConsentFacialRecognition: newConsent });

      // 3. ATUALIZA O CACHE DO REACT-QUERY DIRETAMENTE
      // Isso evita a "race condition" da invalidação
      queryClient.setQueryData(["user-profile", user.id], (oldData) => {
        // oldData é o valor atual em cache para a query "user-profile"
        if (oldData) {
          return {
            ...oldData,
            hasConsentFacialRecognition: newConsent, // Atualiza o campo específico
          };
        }
        return oldData;
      });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error || "Erro ao atualizar consentimento."
      );
      setConsentFacial((prev) => !prev); // Reverte o switch visualmente
    },
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSavePhoto = () => {
    if (photoFile) {
      const formData = new FormData();
      formData.append("profilePhoto", photoFile); // 'profilePhoto' é o nome que o middleware espera
      updatePhotoMutation.mutate(formData);
    }
  };

  const handleCancelPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(getAssetUrl(userData.photoUrl));
  };

  const handleConsentChange = (checked) => {
    setConsentFacial(checked); // Atualiza visualmente primeiro (otimista)
    updateConsentMutation.mutate(checked); // Envia para a API
  };

  const exportUserData = async () => {
    setIsExporting(true);
    toast.info("Exportando seus dados...");
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          cpf: userData.cpf,
          phone: userData.phone,
          address: userData.address,
          createdAt: userData.createdAt,
        },
        statistics: {
          totalEnrollments: enrollmentsData?.pagination?.total || 0,
          totalCheckins: checkinsData?.pagination?.total || 0,
          totalEvaluations: evaluationsData?.length || 0,
        },
        userBadge: userBadge || null,
        enrollments: enrollmentsData?.enrollments || [],
        evaluations: evaluationsData || [],
        checkins: checkinsData?.checkins || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dados_usuario_${userData.name.replace(
        /\s+/g,
        "_"
      )}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      toast.error("Ocorreu um erro ao exportar seus dados.");
    } finally {
      setIsExporting(false);
    }
  };

  // NOVO: Mutação para deletar a conta do usuário
  const deleteUserMutation = useMutation({
    mutationFn: () => api.delete(`/users/${userData.id}`),
    onSuccess: () => {
      toast.success("Sua conta foi excluída com sucesso.");
      logout(); // Desloga o usuário e redireciona para a home/login
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Erro ao excluir a conta.");
    },
  });

  // NOVO: Função para confirmar e deletar a conta
  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "ATENÇÃO: Esta ação é irreversível. Você tem certeza que deseja excluir sua conta e todos os seus dados?"
      )
    ) {
      deleteUserMutation.mutate();
    }
  };

  if (isUserLoading) {
    return <div className="p-6">Carregando perfil...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="relative group flex-shrink-0">
            <Avatar className="h-24 w-24">
              <AvatarImage src={photoPreview || ""} alt={userData.name} />
              <AvatarFallback className="text-3xl">
                {userData.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current.click()}
              className={`absolute inset-0 bg-black/50 flex items-center justify-center rounded-full transition-opacity
                         ${
                           isEditing
                             ? "opacity-100"
                             : "opacity-0 group-hover:opacity-100"
                         }`}
              title="Alterar foto"
            >
              <Camera className="h-8 w-8 text-white" />
            </button>
            <Input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handlePhotoChange}
              accept="image/png, image/jpeg"
            />
          </div>
          <div className="flex-grow text-center sm:text-left">
            <CardTitle className="text-3xl">{userData.name}</CardTitle>
            <CardDescription>{userData.email}</CardDescription>
            {/* NOVO: Botões para salvar ou cancelar a edição da foto */}
            {photoFile && (
              <div className="flex justify-center sm:justify-start gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={handleSavePhoto}
                  disabled={updatePhotoMutation.isPending}
                >
                  {updatePhotoMutation.isPending
                    ? "Salvando..."
                    : "Salvar Foto"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelPhoto}>
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" id="profile-info-tab">
            Perfil
          </TabsTrigger>
          <TabsTrigger value="badge" id="my-badge-tab">
            Meu Crachá
          </TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>
                Visualize ou edite suas informações pessoais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        let value = e.target.value;
                        value = value
                          .replace(/\D/g, "")
                          .replace(/(\d{2})(\d)/, "($1) $2")
                          .replace(/(\d{5})(\d)/, "$1-$2");
                        setFormData({ ...formData, phone: value });
                      }}
                      maxLength={15}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateUserMutation.isPending}
                      >
                        {updateUserMutation.isPending
                          ? "Salvando..."
                          : "Salvar Alterações"}
                      </Button>
                    </>
                  ) : (
                    <Button type="button" onClick={() => setIsEditing(true)}>
                      Editar Perfil
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Minhas Insígnias
              </CardTitle>
              <CardDescription>
                Suas conquistas e premiações por participação nos eventos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {areAwardsLoading ? (
                <p className="text-sm text-gray-500">Carregando insígnias...</p>
              ) : userAwards && userAwards.length > 0 ? (
                <TooltipProvider delayDuration={100}>
                  <div className="flex flex-wrap gap-4">
                    {userAwards.map(({ award, awardedAt }) => (
                      <Tooltip key={award.id}>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-2 cursor-pointer transition-transform hover:scale-110">
                            <Avatar className="h-16 w-16 border-2 border-yellow-400">
                              <AvatarImage
                                src={getAssetUrl(award.imageUrl)}
                                alt={award.name}
                                className="object-contain "
                              />
                              <AvatarFallback>
                                <Award />
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-center w-20">
                              {award.name}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs p-1">
                            <p className="font-bold text-base">{award.name}</p>
                            <p className="text-sm text-gray-600 mb-2">
                              {award.description}
                            </p>
                            <p className="text-xs text-gray-400">
                              Conquistada em:{" "}
                              {new Date(awardedAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              ) : (
                <p className="text-sm text-gray-500">
                  Você ainda não conquistou nenhuma insígnia. Participe dos
                  eventos para ganhar!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="badge">
          <Card>
            <CardHeader>
              <CardTitle>Meu Crachá Universal</CardTitle>
              <CardDescription>
                Use este crachá para fazer check-in em todos os eventos. Você
                pode salvá-lo como PDF para impressão.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-8 p-6">
              {isBadgeLoading ? (
                <div className="text-center text-gray-500">
                  Carregando crachá...
                </div>
              ) : userBadge && userData ? (
                <UniversalBadge
                  user={userData}
                  badge={userBadge}
                  awards={userAwards}
                />
              ) : (
                <div className="text-center text-red-500">
                  Não foi possível carregar os dados do crachá.
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Resumo da sua Atividade</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-4 border rounded-lg text-center">
                <Calendar className="h-8 w-8 mb-2 text-blue-500" />
                <p className="text-2xl font-bold">
                  {enrollmentsData?.pagination?.total || 0}
                </p>
                <p className="text-sm text-gray-600">Inscrições</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 border rounded-lg text-center">
                <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
                <p className="text-2xl font-bold">
                  {checkinsData?.pagination?.total || 0}
                </p>
                <p className="text-sm text-gray-600">Check-ins</p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 border rounded-lg text-center">
                <Award className="h-8 w-8 mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">
                  {awardsData?.pagination?.total || 0}
                </p>
                <p className="text-sm text-gray-600">Insígnias</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações e Dados</CardTitle>
              <CardDescription>
                Gerencie seus dados e preferências da conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* --- NOVA SEÇÃO: RECONHECIMENTO FACIAL --- */}
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <LockKeyhole className="h-5 w-5 mr-2 text-blue-600" />
                  Reconhecimento Facial para Check-in
                </h3>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label
                      htmlFor="facial-consent-switch"
                      className="font-semibold cursor-pointer"
                    >
                      Habilitar check-in por reconhecimento facial
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Permitir que o sistema utilize sua foto de perfil para
                      identificá-lo(a) nos pontos de check-in dos eventos. Seus
                      dados biométricos serão processados apenas para esta
                      finalidade.
                    </p>
                    {!userData?.photoUrl && consentFacial && (
                      <Alert
                        variant="warning"
                        className="mt-2 text-yellow-800 border-yellow-300 bg-yellow-50"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Você habilitou o reconhecimento facial, mas ainda não
                          enviou uma foto de perfil. Adicione uma foto para que
                          a função possa ser utilizada.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <Switch
                    id="facial-consent-switch"
                    checked={consentFacial}
                    onCheckedChange={handleConsentChange}
                    disabled={updateConsentMutation.isPending}
                  />
                </div>
              </div>

              {/* Seção de Direitos do Usuário */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Seus Direitos</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Você tem controle total sobre suas informações em nossa
                  plataforma. De acordo com a Lei Geral de Proteção de Dados
                  (LGPD), garantimos os seguintes direitos:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>
                    <strong>Acesso e Retificação:</strong> Você pode visualizar
                    e editar suas informações pessoais a qualquer momento na aba
                    "Perfil".
                  </li>
                  <li>
                    <strong>Portabilidade de Dados:</strong> Você pode baixar um
                    arquivo JSON com todos os seus dados, incluindo inscrições,
                    check-ins e avaliações.
                  </li>
                  <li>
                    <strong>Exclusão (Direito ao Esquecimento):</strong> Você
                    pode solicitar a exclusão permanente da sua conta e de todos
                    os dados associados.
                  </li>
                </ul>
              </div>

              {/* Seção de Exportação de Dados */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">Exportar Meus Dados</h4>
                  <p className="text-sm text-gray-500">
                    Baixe um arquivo JSON com todas as suas informações.
                  </p>
                </div>
                <Button onClick={exportUserData} disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exportando..." : "Exportar"}
                </Button>
              </div>

              {/* Seção de Exclusão de Conta */}
              <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                <h4 className="flex items-center font-semibold text-destructive">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Zona de Perigo
                </h4>
                <p className="text-sm text-gray-600 mt-2 mb-4">
                  A exclusão da sua conta é uma ação permanente e não pode ser
                  desfeita. Todos os seus dados, incluindo histórico de eventos
                  e certificados, serão removidos.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteUserMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteUserMutation.isPending
                    ? "Excluindo..."
                    : "Excluir minha conta permanentemente"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
