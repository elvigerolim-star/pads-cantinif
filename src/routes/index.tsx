import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BellRing, ClipboardCheck, QrCode, Ticket, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/pads/brand";
import { ThemeToggle } from "@/components/pads/theme-toggle";
import { SimulationNotice } from "@/components/pads/simulation-notice";
import { ProductArt } from "@/components/pads/product-art";
import { perfilQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PADS — Pedido Antecipado de Lanche na Cantina | CantinIF" },
      { name: "description", content: "Peça o lanche da cantina antes do intervalo, acompanhe o status e retire com senha. Protótipo escolar de demonstração." },
      { property: "og:title", content: "PADS — Pedido Antecipado de Lanche na Cantina" },
      { property: "og:description", content: "Protótipo escolar: cardápio, pedido, PIX simulado e retirada com senha de uso único." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

const PASSOS = [
  { icon: UtensilsCrossed, titulo: "Escolha no cardápio", texto: "Salgados, bebidas e doces com preço atual." },
  { icon: ClipboardCheck, titulo: "A cantina confere", texto: "O atendente verifica a disponibilidade dos itens." },
  { icon: QrCode, titulo: "Pague com PIX simulado", texto: "Nenhuma cobrança real: é só demonstração." },
  { icon: BellRing, titulo: "Retire pela senha", texto: "Senha de uso único e código que muda a cada 30 s." },
];

function Inicio() {
  const perfil = useQuery(perfilQuery);
  const logado = !!perfil.data;
  const atendente = perfil.data?.roles.includes("atendente");

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-20 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Logo />
        <nav className="ml-auto flex items-center gap-1 sm:gap-2" aria-label="Acesso">
          <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to="/ajuda">Ajuda</Link></Button>
          <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to="/atendente/entrar">Sou atendente</Link></Button>
          <ThemeToggle />
          {logado ? (
            <Button asChild><Link to={atendente ? "/cantina" : "/cardapio"}>{atendente ? "Painel" : "Cardápio"}</Link></Button>
          ) : (
            <Button asChild><Link to="/entrar" search={{}}>Entrar</Link></Button>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-12">
          <div className="space-y-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">A19 · CantinIF</p>
            <h1 className="font-display text-5xl font-extrabold leading-[1.02] sm:text-6xl">
              Lanche pedido antes, <span className="text-gradient-brand">retirado sem fila.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              O PADS é o Pedido Antecipado de Lanche na Cantina: você monta o pedido, a cantina confere e chama pela sua senha.
            </p>
            <div className="flex flex-wrap gap-3">
              {logado ? (
                <Button asChild variant="hero" size="lg"><Link to={atendente ? "/cantina" : "/cardapio"}>Continuar<ArrowRight /></Link></Button>
              ) : (
                <>
                  <Button asChild variant="hero" size="lg"><Link to="/entrar" search={{}}>Entrar como aluno<ArrowRight /></Link></Button>
                  <Button asChild variant="outline" size="lg"><Link to="/criar-conta">Criar conta</Link></Button>
                </>
              )}
            </div>
            <SimulationNotice className="max-w-xl" />
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-hero p-6 shadow-pop sm:p-8">
              <div className="pattern-dots absolute inset-0 text-primary-foreground opacity-30" aria-hidden="true" />
              <div className="relative grid grid-cols-3 gap-3">
                {([["Coxinha", "salgado"], ["Coca-Cola Café", "bebida"], ["Paçoca", "doce"], ["Kibe com queijo", "salgado"], ["Guaravita 290ml", "bebida"], ["Bolo de pote", "doce"]] as const).map(([n, c]) => (
                  <div key={n} className="overflow-hidden rounded-2xl bg-card shadow-card">
                    <ProductArt nome={n} categoria={c} className="aspect-square" />
                    <p className="truncate px-2 py-1.5 text-xs font-semibold">{n}</p>
                  </div>
                ))}
              </div>
              <div className="relative mt-5 flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card">
                <div className="grid size-14 place-items-center rounded-2xl bg-highlight font-display text-2xl font-extrabold text-highlight-foreground animate-call">042</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Chamando a senha</p>
                  <p className="font-display text-lg font-bold">Seu pedido está pronto!</p>
                </div>
                <Ticket className="ml-auto size-6 text-primary" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-card/60 py-16" aria-labelledby="como-funciona">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 id="como-funciona" className="text-3xl font-extrabold">Como funciona</h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PASSOS.map((p, i) => (
                <li key={p.titulo} className="rounded-3xl border bg-card p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-2xl bg-accent text-accent-foreground"><p.icon className="size-5" aria-hidden="true" /></span>
                    <span className="font-display text-3xl font-extrabold text-muted-foreground/40">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{p.titulo}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p>PADS · CantinIF — projeto escolar sem uso comercial.</p>
        <Link to="/ajuda" className="font-semibold hover:text-foreground">Ajuda e contas de demonstração</Link>
      </footer>
    </div>
  );
}
