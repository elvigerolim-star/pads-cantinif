import { AlertTriangle, Inbox, Loader2, ShieldX } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoadingState({
  titulo = "Carregando…",
  className,
}: {
  titulo?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm font-medium">{titulo}</p>
    </div>
  );
}

export function EmptyState({
  titulo,
  descricao,
  acao,
  icone,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  icone?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed bg-card/60 px-6 py-14 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
        {icone ?? <Inbox className="size-6" />}
      </div>
      <h2 className="text-lg font-bold">{titulo}</h2>
      {descricao && <p className="max-w-sm text-sm text-muted-foreground">{descricao}</p>}
      {acao}
    </div>
  );
}

export function ErrorState({
  titulo = "Algo deu errado",
  descricao,
  onRetry,
}: {
  titulo?: string;
  descricao?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
    >
      <div className="grid size-14 place-items-center rounded-2xl bg-destructive/15 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <h2 className="text-lg font-bold">{titulo}</h2>
      {descricao && <p className="max-w-sm text-sm text-muted-foreground">{descricao}</p>}
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function AccessDenied({
  codigo,
  titulo,
  descricao,
  acao,
}: {
  codigo: string;
  titulo: string;
  descricao: string;
  acao?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center"
    >
      <div className="grid size-16 place-items-center rounded-3xl bg-destructive/15 text-destructive">
        <ShieldX className="size-8" />
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{codigo}</p>
      <h1 className="text-2xl font-extrabold">{titulo}</h1>
      <p className="text-muted-foreground">{descricao}</p>
      {acao}
    </div>
  );
}
