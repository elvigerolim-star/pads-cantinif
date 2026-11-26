import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/components/pads/auth-layout";
import { RecoveryFlow } from "@/components/pads/recovery-flow";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — PADS CantinIF" },
      {
        name: "description",
        content: "Receba um código por e-mail para redefinir a senha da sua conta.",
      },
      { property: "og:title", content: "Recuperar senha — PADS" },
      { property: "og:description", content: "Redefinição de senha da conta de aluno." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AuthLayout
      titulo="Recuperar senha"
      subtitulo="Vamos enviar um código para o e-mail da sua conta."
    >
      <RecoveryFlow perfil="aluno" />
    </AuthLayout>
  ),
});
