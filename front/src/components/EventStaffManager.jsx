import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "../lib/api";
import api from "../lib/api";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, UserPlus, Search, CheckCircle2 } from "lucide-react";
import { Input } from "./ui/input";

export default function EventStaffManager({ eventId }) {
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState(null);
    const [role, setRole] = useState("CHECKIN_COORDINATOR");

    const [userSearch, setUserSearch] = useState("");
    const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedUserSearch(userSearch);
        }, 500);
        return () => clearTimeout(timer);
    }, [userSearch]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    // Busca a equipe atual
    const { data: staff, isLoading } = useQuery({
        queryKey: ["event-staff", eventId],
        queryFn: async () => {
            const response = await api.get(`/events/${eventId}/staff`);
            return response.data;
        },
    });

    // Busca lista de usuários para busca
    const { data: usersData, isLoading: isLoadingUsers } = useQuery({
        queryKey: ["users-list-simple", debouncedUserSearch],
        queryFn: async () => {
            const response = await usersAPI.getAll({ search: debouncedUserSearch, limit: 15 });
            return response.data;
        },
        enabled: isDropdownOpen // Otimização: Só busca se estiver aberto
    });

    const userOptions = usersData?.users || [];

    // Mutação para adicionar membro
    const addStaffMutation = useMutation({
        mutationFn: async (data) => {
            await api.post(`/events/${eventId}/staff`, data);
        },
        onSuccess: () => {
            toast.success("Membro adicionado com sucesso!");
            setSelectedUser(null);
            setUserSearch("");
            queryClient.invalidateQueries(["event-staff", eventId]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Erro ao adicionar membro.");
        },
    });

    // Mutação para remover membro
    const removeStaffMutation = useMutation({
        mutationFn: async (userId) => {
            await api.delete(`/events/${eventId}/staff/${userId}`);
        },
        onSuccess: () => {
            toast.success("Membro removido com sucesso!");
            queryClient.invalidateQueries(["event-staff", eventId]);
        },
        onError: (error) => {
            toast.error("Erro ao remover membro.");
        },
    });

    const handleAddStaff = (e) => {
        e.preventDefault();

        if (!selectedUser) {
            toast.error("Selecione um usuário.");
            return;
        }

        addStaffMutation.mutate({ email: selectedUser.email, role });
    };

    const getRoleLabel = (r) => {
        switch (r) {
            case "CHECKIN_COORDINATOR":
                return "Coordenador de Check-in";
            case "SPEAKER":
                return "Palestrante";
            default:
                return r;
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-6 rounded-lg shadow-sm border border-border bg-card text-card-foreground">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserPlus className="h-5 w-5" /> Adicionar Membro
                </h3>
                <form onSubmit={handleAddStaff} className="flex gap-4 items-end flex-wrap sm:flex-nowrap">
                    <div className="flex-1 min-w-[200px] relative" ref={dropdownRef}>
                        <label className="block text-sm font-medium mb-1 text-muted-foreground">
                            Pesquisar Usuário
                        </label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Nome ou e-mail..."
                                className="pl-8"
                                value={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : userSearch}
                                onChange={(e) => {
                                    setSelectedUser(null);
                                    setUserSearch(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onClick={() => setIsDropdownOpen(true)}
                            />
                        </div>

                        {/* Dropdown customizado estilo Combobox */}
                        {isDropdownOpen && (
                            <div className="absolute z-10 top-[calc(100%+4px)] left-0 w-full bg-popover text-popover-foreground border rounded-md shadow-md max-h-[250px] overflow-y-auto">
                                {isLoadingUsers ? (
                                    <div className="p-3 text-center text-sm text-muted-foreground">Buscando...</div>
                                ) : userOptions.length === 0 ? (
                                    <div className="p-3 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</div>
                                ) : (
                                    userOptions.map((user) => (
                                        <div
                                            key={user.id}
                                            className={`flex items-center justify-between p-2 cursor-pointer hover:bg-muted text-sm ${selectedUser?.id === user.id ? 'bg-muted' : ''}`}
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setIsDropdownOpen(false);
                                                setUserSearch("");
                                            }}
                                        >
                                            <div className="truncate pr-4">
                                                <span className="font-medium mr-1">{user.name}</span>
                                                <span className="text-muted-foreground text-xs">({user.email})</span>
                                            </div>
                                            {selectedUser?.id === user.id && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    <div className="w-full sm:w-1/3">
                        <label className="block text-sm font-medium mb-1 text-muted-foreground">
                            Função
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        >
                            <option value="CHECKIN_COORDINATOR">Coordenador de Check-in</option>
                            <option value="SPEAKER">Palestrante</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={addStaffMutation.isPending}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                        {addStaffMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        Adicionar
                    </button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                    * Busque por nome ou e-mail do usuário cadastrado.
                </p>
            </div>

            <div className="rounded-lg shadow-sm border border-border bg-card text-card-foreground overflow-hidden">
                <div className="p-4 bg-muted/50 border-b border-border">
                    <h3 className="font-semibold">Equipe Atual ({staff?.all?.length || 0})</h3>
                </div>

                {staff?.all?.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        Nenhum membro vinculado a este evento.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {staff?.all?.map((member) => (
                            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    {member.user.photoUrl ? (
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}${member.user.photoUrl}`}
                                            alt={member.user.name}
                                            className="w-10 h-10 rounded-full object-cover border border-border"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {member.user.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-medium text-foreground">{member.user.name}</h4>
                                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${member.role === 'CHECKIN_COORDINATOR'
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                        : 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                        }`}>
                                        {getRoleLabel(member.role)}
                                    </span>

                                    <button
                                        onClick={() => removeStaffMutation.mutate(member.userId)}
                                        disabled={removeStaffMutation.isPending}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                        title="Remover da equipe"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
