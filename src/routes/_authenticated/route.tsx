import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  // A sessão fica no navegador; a verificação roda só no cliente.
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      const destino = location.pathname.startsWith("/cantina") ? "/atendente/entrar" : "/entrar";
      throw redirect({ to: destino, search: { redirect: location.href } });
    }
  },
  component: () => <Outlet />,
});
