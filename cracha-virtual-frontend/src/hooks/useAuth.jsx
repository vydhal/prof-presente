import { useState, useEffect, createContext, useContext } from "react";
import api from "../lib/api"; // Simplificado, assumindo que authAPI é o mesmo que api

// Contexto de autenticação
const AuthContext = createContext();

// Provider de autenticação
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token && user) {
        // Define o header para requisições futuras
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } else if (token && !user) {
        // Se tem token mas não tem usuário, busca no perfil
        try {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const response = await api.get("/auth/profile");
          setUser(response.data);
          localStorage.setItem("user", JSON.stringify(response.data));
        } catch (error) {
          console.error("Token inválido, limpando autenticação:", error);
          // Limpa se o token for inválido
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          delete api.defaults.headers.common["Authorization"];
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []); // Roda apenas uma vez ao iniciar

  const login = async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const { user: loggedInUser, token } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Erro de login",
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      
      // Auto-login logic
      const { user: registeredUser, token } = response.data;
      
      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(registeredUser));
        setUser(registeredUser);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      
      return { success: true, user: registeredUser };
    } catch (error) {
      console.error("Erro no registro:", error.response?.data);
      return {
        success: false,
        error: error.response?.data?.error || "Erro ao registrar usuário",
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    window.location.href = "/login";
  };

  // --- FUNÇÃO DE ATUALIZAÇÃO UNIFICADA E APRIMORADA ---
  const updateAuthUser = (newUserData) => {
    // Mescla os dados do usuário atual com os novos dados recebidos
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    // A função 'updateUser' foi removida para evitar duplicidade
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    isGestor: user?.role === "GESTOR_ESCOLA",
    isOrg: user?.role === "ORGANIZER",
    updateAuthUser, // Exporta a função unificada
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
