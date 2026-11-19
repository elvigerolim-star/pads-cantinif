import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/components/pads/auth-layout";
import { RecoveryFlow } from "@/components/pads/recovery-flow";

export const Route = createFileRoute("/atendente/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha do atendente — PADS CantinIF" },
      { name: "description", content: "Redefinição de senha para atendentes da cantina." },
      { property: "og:title", content: "Recuperar senha — Cantina PADS" },
      { property: "og:description", content: "Redefinição de senha do atendente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AuthLayout perfil="cantina" titulo="Recuperar senha" subtitulo="Informe o e-mail da sua conta de atendente.">
      <RecoveryFlow perfil="cantina" />
    </AuthLayout>
  ),
});
