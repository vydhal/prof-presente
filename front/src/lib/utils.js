import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Função para descobrir a URL da API automaticamente.
export const getApiBaseUrl = () => {
  const defaultSuffix = "/api";
  try {
    const envUrl = import.meta.env.VITE_API_URL;

    // 1. Se a variável de ambiente existe e NÃO é o localhost padrão
    if (envUrl && !envUrl.includes('localhost:3000')) {
      return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    }

    // 2. Fallback dinâmico para produção: usa o domínio atual do navegador
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      return `${window.location.origin}${defaultSuffix}`;
    }

    // 3. Fallback para desenvolvimento local
    return `http://localhost:3000${defaultSuffix}`;
  } catch (e) {
    console.warn("Falha ao detectar API URL, usando fallback de origem", e);
    if (typeof window !== 'undefined') return `${window.location.origin}${defaultSuffix}`;
    return `http://localhost:3000${defaultSuffix}`;
  }
};

export const API_BASE_URL = getApiBaseUrl();

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
