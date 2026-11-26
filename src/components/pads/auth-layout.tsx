import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./brand";
import { ThemeToggle } from "./theme-toggle";

export function AuthLayout({
  children,
  perfil = "aluno",
  titulo,
  subtitulo,
  codigo,
}: {
  children: ReactNode;
  perfil?: "aluno" | "cantina";
  titulo: string;
  subtitulo?: string;
  codigo?: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-hero p-10 text-primary-foreground lg:flex lg:flex-col dark:text-foreground">
        <div className="pattern-dots absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative [&_span]:!text-current">
          <Logo />
        </div>
        <div className="relative mt-auto max-w-md space-y-4">
          <p className="inline-flex rounded-full bg-card/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]">
            {perfil === "aluno" ? "Área do aluno" : "Área da cantina"}
          </p>
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            {perfil === "aluno"
              ? "Peça antes, retire sem fila."
              : "Pedidos conferidos, chamados pela senha."}
          </h2>
          <p className="text-base opacity-90">
            {perfil === "aluno"
              ? "Escolha seu lanche no intervalo, acompanhe o status e retire com uma senha de uso único."
              : "Confira disponibilidade, acompanhe o PIX simulado, separe e registre a entrega com segurança."}
          </p>
        </div>
      </aside>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Início
          </Link>
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <ThemeToggle />
        </div>
        <main className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-8">
          <div className="w-full max-w-md">
            {codigo && (
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {codigo}
              </p>
            )}
            <h1 className="font-display text-3xl font-extrabold">{titulo}</h1>
            {subtitulo && <p className="mt-2 text-muted-foreground">{subtitulo}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
