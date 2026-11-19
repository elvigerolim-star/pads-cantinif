import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthLayout } from "@/components/pads/auth-layout";
import { LoginForm } from "@/components/pads/login-form";

export const Route = createFileRoute("/entrar")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Entrar — PADS CantinIF" },
      { name: "description", content: "Entre com sua conta de aluno para pedir lanches na cantina." },
      { property: "og:title", content: "Entrar — PADS CantinIF" },
      { property: "og:description", content: "Acesso do aluno ao pedido antecipado de lanche." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Entrar,
});

function Entrar() {
  const { redirect } = Route.useSearch();
  return (
    <AuthLayout codigo="A00 · Entrar" titulo="Entrar no PADS" subtitulo="Use o e-mail e a senha da sua conta de aluno.">
      <LoginForm perfil="aluno" redirect={redirect} />
    </AuthLayout>
  );
}
