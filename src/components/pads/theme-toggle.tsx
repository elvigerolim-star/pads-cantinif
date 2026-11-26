import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { tema, alternar } = useTheme();
  const escuro = tema === "escuro";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={alternar}
      className={cn("rounded-full", className)}
      aria-label={escuro ? "Ativar tema claro" : "Ativar tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
    >
      {escuro ? <Sun /> : <Moon />}
    </Button>
  );
}
