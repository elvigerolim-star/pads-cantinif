import { useCallback, useEffect, useState } from "react";

export type Tema = "claro" | "escuro";
const CHAVE = "pads-tema";

export const scriptTemaInicial = `(function(){try{var t=localStorage.getItem('${CHAVE}');if(t==='escuro'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export function useTheme() {
  const [tema, setTema] = useState<Tema>("claro");
  useEffect(() => {
    setTema(document.documentElement.classList.contains("dark") ? "escuro" : "claro");
  }, []);
  const alternar = useCallback(() => {
    const proximo: Tema = document.documentElement.classList.contains("dark") ? "claro" : "escuro";
    document.documentElement.classList.toggle("dark", proximo === "escuro");
    try {
      localStorage.setItem(CHAVE, proximo);
    } catch {
      /* armazenamento indisponível */
    }
    setTema(proximo);
  }, []);
  return { tema, alternar };
}
