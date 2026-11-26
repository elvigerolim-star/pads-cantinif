import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/pads/auth-layout";
import { NovaSenhaForm, SenhaRedefinida } from "@/components/pads/recovery-flow";
import { LoadingState } from "@/components/pads/states";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Nova senha — PADS CantinIF" },
      { name: "description", content: "Defina uma nova senha a partir do link de recuperação." },
      { property: "og:title", content: "Nova senha — PADS" },
      { property: "og:description", content: "Definição de nova senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RedefinirSenha,
});

function RedefinirSenha() {
  const [estado, setEstado] = useState<"verificando" | "pronto" | "invalido" | "ok">("verificando");
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) setEstado("pronto");
    });
    const t = setTimeout(async () => {
      const { data: s } = await supabase.auth.getSession();
      setEstado((e) => (e === "verificando" ? (s.session ? "pronto" : "invalido") : e));
    }, 1500);
    return () => {
      data.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  return (
    <AuthLayout titulo="Definir nova senha">
      {estado === "verificando" && <LoadingState titulo="Validando o link…" />}
      {estado === "pronto" && <NovaSenhaForm onDone={() => setEstado("ok")} />}
      {estado === "ok" && <SenhaRedefinida perfil="aluno" />}
      {estado === "invalido" && (
        <div role="alert" className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            E10 · Link inválido
          </p>
          <p className="text-muted-foreground">
            Este link de recuperação é inválido ou expirou. Peça um novo código.
          </p>
          <Button asChild variant="hero" className="w-full">
            <Link to="/recuperar-senha">Pedir novo código</Link>
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
