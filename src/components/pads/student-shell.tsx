import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, LifeBuoy, LogOut, Menu, UserRound, UtensilsCrossed } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { AccessDenied, LoadingState } from "./states";
import { perfilQuery } from "@/lib/queries";
import { useSair } from "@/hooks/use-sair";

const NAV = [
  { to: "/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { to: "/pedidos", label: "Meus pedidos", icon: ClipboardList },
  { to: "/conta", label: "Minha conta", icon: UserRound },
] as const;

export function StudentShell({ children }: { children: ReactNode }) {
  const perfil = useQuery(perfilQuery);
  const sair = useSair("/entrar");
  const isAluno = perfil.data?.roles.includes("aluno") && perfil.data.aluno;

  return (
    <div className="min-h-screen">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">Pular para o conteúdo</a>
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Logo to="/cardapio" />
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Principal">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-accent !text-accent-foreground" }}>
                <n.icon className="size-4" aria-hidden="true" />{n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {perfil.data?.aluno && <span className="hidden text-sm text-muted-foreground lg:inline">Olá, <strong className="text-foreground">{perfil.data.aluno.nome.split(" ")[0]}</strong></span>}
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="hidden rounded-full md:inline-flex" onClick={sair} aria-label="Sair"><LogOut /></Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full md:hidden" aria-label="Abrir menu"><Menu /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader><SheetTitle className="text-left"><Logo to="/cardapio" /></SheetTitle></SheetHeader>
                <nav className="mt-4 grid gap-1 px-2" aria-label="Menu">
                  {NAV.map((n) => (
                    <Link key={n.to} to={n.to} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-muted" activeProps={{ className: "bg-accent text-accent-foreground" }}>
                      <n.icon className="size-5" aria-hidden="true" />{n.label}
                    </Link>
                  ))}
                  <Link to="/ajuda" className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-muted"><LifeBuoy className="size-5" />Ajuda</Link>
                  <button type="button" onClick={sair} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-destructive hover:bg-destructive/10"><LogOut className="size-5" />Sair</button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main id="conteudo" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {perfil.isPending ? (
          <LoadingState titulo="Carregando sua conta…" />
        ) : !isAluno ? (
          <AccessDenied
            codigo="E05 · Acesso negado"
            titulo="Esta área é exclusiva para alunos"
            descricao="Sua conta não tem perfil de aluno. Atendentes usam o painel da cantina."
            acao={<Button asChild><Link to="/cantina">Ir para o painel da cantina</Link></Button>}
          />
        ) : (
          children
        )}
      </main>
    </div>
  );
}
