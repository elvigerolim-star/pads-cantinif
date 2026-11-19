import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, LifeBuoy, LogOut, Menu, ToggleRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { AccessDenied, LoadingState } from "./states";
import { perfilQuery } from "@/lib/queries";
import { useSair } from "@/hooks/use-sair";

const NAV = [
  { to: "/cantina", label: "Painel de pedidos", icon: LayoutDashboard, exact: true },
  { to: "/cantina/disponibilidade", label: "Disponibilidade", icon: ToggleRight, exact: false },
] as const;

function NavLinks() {
  return (
    <>
      {NAV.map((n) => (
        <Link key={n.to} to={n.to} activeOptions={{ exact: n.exact }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/75 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "!bg-sidebar-primary !text-sidebar-primary-foreground" }}>
          <n.icon className="size-5" aria-hidden="true" />{n.label}
        </Link>
      ))}
      <Link to="/ajuda" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
        <LifeBuoy className="size-5" aria-hidden="true" />Ajuda
      </Link>
    </>
  );
}

export function CantinaShell({ children }: { children: ReactNode }) {
  const perfil = useQuery(perfilQuery);
  const sair = useSair("/atendente/entrar");
  const isAtendente = perfil.data?.roles.includes("atendente");
  const nome = perfil.data?.funcionario?.nome ?? perfil.data?.email;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">Pular para o conteúdo</a>
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 bg-sidebar p-5 text-sidebar-foreground lg:flex" aria-label="Menu da cantina">
        <div className="[&_span]:!text-sidebar-foreground [&_.text-muted-foreground]:!text-sidebar-foreground/60"><Logo to="/cantina" /></div>
        <p className="rounded-xl bg-sidebar-accent px-3 py-2 text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/70">Cantina · Atendente</p>
        <nav className="grid gap-1"><NavLinks /></nav>
        <div className="mt-auto space-y-3 border-t border-sidebar-border pt-4">
          {nome && <p className="truncate text-sm"><span className="text-sidebar-foreground/60">Conectado como</span><br /><strong>{nome}</strong></p>}
          <div className="flex items-center gap-2">
            <ThemeToggle className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
            <Button variant="ghost" className="flex-1 justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={sair}><LogOut />Sair</Button>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur lg:hidden">
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Abrir menu"><Menu /></Button></SheetTrigger>
            <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar text-sidebar-foreground">
              <SheetHeader><SheetTitle className="text-left text-sidebar-foreground">Cantina · Atendente</SheetTitle></SheetHeader>
              <nav className="mt-4 grid gap-1 px-2"><NavLinks /></nav>
              <div className="mt-6 px-2"><Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={sair}><LogOut />Sair</Button></div>
            </SheetContent>
          </Sheet>
          <Logo to="/cantina" />
          <ThemeToggle className="ml-auto" />
        </header>
        <main id="conteudo" className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
          {perfil.isPending ? (
            <LoadingState titulo="Verificando permissões…" />
          ) : !isAtendente ? (
            <AccessDenied
              codigo="E06 · Operação não permitida"
              titulo="Somente atendentes acessam a cantina"
              descricao="Sua conta é de aluno. As ações da cantina são bloqueadas no servidor para outros perfis."
              acao={<Button asChild><Link to="/cardapio">Voltar ao cardápio</Link></Button>}
            />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
