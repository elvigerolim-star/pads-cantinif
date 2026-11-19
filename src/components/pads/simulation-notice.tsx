import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export function SimulationNotice({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-highlight/50 bg-highlight/15 px-4 py-3 text-sm",
        className,
      )}
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden="true" />
      <p>
        <strong className="font-semibold">Ambiente de demonstração escolar.</strong>{" "}
        {children ??
          "Nenhuma cobrança real é feita: o pagamento PIX é apenas simulado e os dados são fictícios."}
      </p>
    </div>
  );
}
