import axios from "axios";
import Cookies from "js-cookie";

// Configuração base da API
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Verifica se o erro é 401 ou 403
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Pega a URL da requisição original que falhou
      // (Ex: "/auth/login" ou "/events")
      const originalRequestUrl = error.config.url;

      // Define as rotas que NÃO devem acionar um logout global
      const isAuthRoute =
        originalRequestUrl.includes("/auth/login") ||
        originalRequestUrl.includes("/auth/register") ||
        originalRequestUrl.includes("/auth/forgot-password") ||
        originalRequestUrl.includes("/auth/reset-password");

      // SE o erro 401/403 NÃO VEIO de uma rota de autenticação:
      // Isso significa que é um token expirado ou sem permissão em uma página protegida.
      if (!isAuthRoute) {
        // Este é o "logout" global para tokens expirados/inválidos
        console.log(
          "Interceptor: Token expirado ou inválido em rota protegida. Deslogando."
        );
        Cookies.remove("auth_token");
        Cookies.remove("user_data");
        window.location.href = "/login";
      }
    }
    // Sempre rejeita o erro para que o 'catch' local (no useAuth / Login.jsx)
    // possa lidar com ele (ex: mostrar "Credenciais inválidas")
    return Promise.reject(error);
  }
);

// Funções de autenticação
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/profile"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data) => api.post("/auth/reset-password", data),
};

// Funções de usuários
export const usersAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  uploadPhoto: (id, formData) =>
    api.post(`/users/${id}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// Funções de eventos
export const eventsAPI = {
  getAll: (params) => api.get("/events", { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post("/events", data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
};

// Funções de inscrições
export const enrollmentsAPI = {
  enroll: (eventId) => api.post(`/enrollments/events/${eventId}/enroll`),
  getUserEnrollments: (userId, params) =>
    api.get(`/enrollments/users/${userId}`, { params }),
  getEventEnrollments: (eventId, params) =>
    api.get(`/enrollments/events/${eventId}`, { params }),
  cancel: (enrollmentId) => api.patch(`/enrollments/${enrollmentId}/cancel`),
  updateStatus: (enrollmentId, status) =>
    api.patch(`/enrollments/${enrollmentId}/status`, { status }),
};

// Funções de crachás
export const badgesAPI = {
  getByEnrollment: (enrollmentId) =>
    api.get(`/badges/enrollment/${enrollmentId}`),
  getImage: (enrollmentId) =>
    api.get(`/badges/enrollment/${enrollmentId}/image`),
  getQRCode: (enrollmentId) =>
    api.get(`/badges/enrollment/${enrollmentId}/qrcode`, {
      responseType: "blob",
    }),
  validateQR: (qrData) =>
    api.post("/badges/validate-qr", { qrCodeValue: qrData }),
  getAll: (params) => api.get("/badges", { params }),
};

// Funções de check-ins
export const checkinsAPI = {
  perform: (data) => api.post("/checkins", data),
  getEventCheckins: (eventId, params) =>
    api.get(`/checkins/events/${eventId}`, { params }),
  getUserCheckins: (userId, params) =>
    api.get(`/checkins/users/${userId}`, { params }),
  getEventStats: (eventId) => api.get(`/checkins/events/${eventId}/stats`),
};

// Funções de premiações
export const awardsAPI = {
  getAll: (params) => api.get("/awards", { params }),
  create: (data) => api.post("/awards", data),
  getUserAwards: (userId, params) =>
    api.get(`/awards/users/${userId}`, { params }),
  grant: (data) => api.post("/awards/grant", data),
  getRanking: (params) => api.get("/awards/ranking", { params }),
};

// Funções de avaliações
export const evaluationsAPI = {
  create: (enrollmentId, data) =>
    api.post(`/evaluations/enrollments/${enrollmentId}`, data),
  getEventEvaluations: (eventId, params) =>
    api.get(`/evaluations/events/${eventId}`, { params }),
  getEventStats: (eventId) => api.get(`/evaluations/events/${eventId}/stats`),
  getUserEvaluations: (userId, params) =>
    api.get(`/evaluations/users/${userId}`, { params }),
  update: (evaluationId, data) => api.put(`/evaluations/${evaluationId}`, data),
};

// Funções de relatórios
export const reportsAPI = {
  getCheckinReport: (eventId, params) =>
    api.get(`/reports/checkins/${eventId}`, { params }),
  getFrequencyReport: (eventId) => api.get(`/reports/frequency/${eventId}`),
  getFrequencyRanking: (params) => api.get("/reports/ranking", { params }),
  getSystemReport: () => api.get("/reports/system"),
};

export default api;
