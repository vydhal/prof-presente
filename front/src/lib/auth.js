import Cookies from 'js-cookie';

// Configurações dos cookies
const COOKIE_OPTIONS = {
  expires: 7, // 7 dias
  secure: import.meta.env.PROD, // HTTPS apenas em produção
  sameSite: 'strict',
};

// Salvar dados de autenticação
export const saveAuthData = (token, user) => {
  Cookies.set('auth_token', token, COOKIE_OPTIONS);
  Cookies.set('user_data', JSON.stringify(user), COOKIE_OPTIONS);
};

// Obter token de autenticação
export const getAuthToken = () => {
  return Cookies.get('auth_token');
};

// Obter dados do usuário
export const getUserData = () => {
  const userData = Cookies.get('user_data');
  return userData ? JSON.parse(userData) : null;
};

// Verificar se está autenticado
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Verificar se é administrador
export const isAdmin = () => {
  const user = getUserData();
  return user && user.role === 'ADMIN';
};

// Limpar dados de autenticação
export const clearAuthData = () => {
  Cookies.remove('auth_token');
  Cookies.remove('user_data');
};

// Logout
export const logout = () => {
  clearAuthData();
  window.location.href = '/login';
};

