import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/pads/auth-layout";
import { LoginForm } from "@/components/pads/login-form";

export const Route = createFileRoute("/atendente/entrar")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Entrar na cantina — PADS CantinIF" },
      { name: "description", content: "Acesso dos atendentes ao painel de pedidos da cantina." },
      { property: "og:title", content: "Entrar na cantina — PADS" },
      { property: "og:description", content: "Painel do atendente da cantina." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EntrarCantina,
});

function EntrarCantina() {
  const { redirect } = Route.useSearch();
  return (
    <AuthLayout perfil="cantina" codigo="O00 · Entrar" titulo="Painel da cantina" subtitulo="Acesso exclusivo para atendentes.">
      <LoginForm perfil="cantina" redirect={redirect} />
    </AuthLayout>
  );
}
