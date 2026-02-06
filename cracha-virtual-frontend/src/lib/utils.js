import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// O '.origin' de uma URL pega apenas o protocolo e o domínio (ex: https://api.checkin.simplisoft.com.br)
export const getApiBaseUrl = () => {
  try {
    const url = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    // Tenta construir a URL para validar e pegar a origem
    return new URL(url).origin;
  } catch (e) {
    console.warn("VITE_API_URL inválida, usando localhost:3000 como fallback", e);
    return "http://localhost:3000";
  }
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Monta a URL completa para um arquivo do backend.
 * @param {string} relativePath - O caminho relativo do arquivo (ex: /uploads/profiles/foto.png).
 * @returns {string} A URL completa e acessível.
 */
export const getAssetUrl = (relativePath) => {
  if (!relativePath) {
    return '';
  }
  
  if (relativePath.startsWith('http') || relativePath.startsWith('blob:')) {
    return relativePath;
  }
  
  // Garante que o caminho relativo comece com /
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  return `${API_BASE_URL}${cleanPath}`;
};
