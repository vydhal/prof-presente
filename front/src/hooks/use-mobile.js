import { useState, useEffect } from "react";

export function useMediaQuery(query) {
  // Inicializamos o estado lendo o valor atual, evitando um piscar de tela
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);

    // O listener agora é mais simples, apenas atualiza o estado com o valor do evento
    const listener = (event) => setMatches(event.matches);

    // Usamos 'addEventListener', que é o padrão mais moderno
    mediaQueryList.addEventListener("change", listener);

    // Função de limpeza para remover o listener quando o componente desmontar
    return () => {
      mediaQueryList.removeEventListener("change", listener);
    };
  }, [query]); // O efeito será re-executado se a query mudar

  return matches;
}
