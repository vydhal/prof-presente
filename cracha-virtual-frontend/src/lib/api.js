import axios from "axios";
import { API_BASE_URL } from "./utils";

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
    // const token = Cookies.get("auth_token");
    const token = localStorage.getItem("token");
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
    // Verificação para APIs que retornam 200 OK mas com erro no corpo
    if (response.data && (response.data.code === 401 || response.data.code === 403)) {
      // Simula um erro para cair no catch do interceptor ou do componente
      const error = {
        config: response.config,
        response: response,
        isCustomError: true // Flag para identificar que foi gerado manualmente
      };
      return Promise.reject(error);
    }
    return response;
  },
  (error) => {
    // Verifica se o erro é 401 ou 403 (HTTP status ou código no corpo da resposta verificado acima)
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (status === 401 || status === 403 || code === 401 || code === 403) {
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
        // Cookies.remove("auth_token"); // Removido para usar localStorage e manter consistência
        // Cookies.remove("user_data");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Dispara evento para o useAuth lidar com a atualização de estado
        window.dispatchEvent(new Event("auth:logout"));
        // window.location.href = "/login"; // Desativado reload forçado
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
  getQuestions: (id) => api.get(`/events/${id}/questions`),
};

// Funções de inscrições
export const enrollmentsAPI = {
  enroll: (eventId) => api.post(`/enrollments/events/${eventId}/enroll`),
  getUserEnrollments: (userId, params) =>
    api.get(`/enrollments/users/${userId}`, { params }),
  getEventEnrollments: (eventId, params) =>
    api.get(`/enrollments/events/${eventId}`, { params }),
  getByEventStatus: (eventId) =>
    api.get(`/enrollments/event/${eventId}/status`),
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

// Funções de trilhas de formação
export const tracksAPI = {
  getAll: () => api.get("/tracks"),
  getById: (id) => api.get(`/tracks/${id}`),
  create: (data) => api.post("/tracks", data),
  update: (id, data) => api.put(`/tracks/${id}`, data),
  delete: (id) => api.delete(`/tracks/${id}`),
  enroll: (trackId) => api.post(`/tracks/${trackId}/enroll`),
  getMy: () => api.get("/tracks/my"),
};

// Funções de banners
export const bannersAPI = {
  getAll: () => api.get("/banners"),
  getActive: () => api.get("/banners/active"),
  create: (formData) => api.post("/banners", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  update: (id, formData) => api.put(`/banners/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  delete: (id) => api.delete(`/banners/${id}`),
};

// Funções de configurações (Whitelabel)
export const settingsAPI = {
  get: () => api.get("/settings"),
  update: (formData) => api.put("/settings", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
};

export default api;
