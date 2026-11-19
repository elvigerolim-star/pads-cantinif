import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CantinaShell } from "@/components/pads/cantina-shell";

export const Route = createFileRoute("/_authenticated/cantina")({
  head: () => ({
    meta: [
      { title: "Cantina — PADS CantinIF" },
      { name: "description", content: "Painel do atendente: conferência, pagamento simulado, separação e entrega." },
      { property: "og:title", content: "Cantina — PADS" },
      { property: "og:description", content: "Painel do atendente da cantina." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <CantinaShell>
      <Outlet />
    </CantinaShell>
  ),
});
