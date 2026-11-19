import {
  Beef, CakeSlice, Candy, Coffee, Cookie, Croissant, CupSoda, Drumstick, GlassWater, Milk, Pizza, Sandwich, Wheat, Dessert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Categoria } from "@/lib/pedido";

const POR_NOME: [RegExp, LucideIcon][] = [
  [/coxinha/i, Drumstick], [/esfirra/i, Pizza], [/torta/i, CakeSlice], [/enroladinho/i, Sandwich],
  [/kibe/i, Beef], [/pão de queijo/i, Wheat], [/empada/i, Croissant], [/café/i, Coffee],
  [/água/i, GlassWater], [/1,5l/i, Milk], [/paçoca|pé de moleque/i, Cookie], [/bolo/i, Dessert],
];
const POR_CATEGORIA: Record<Categoria, LucideIcon> = { salgado: Croissant, bebida: CupSoda, doce: Candy };
const FUNDO: Record<Categoria, string> = {
  salgado: "bg-cat-salgado/25 text-foreground",
  bebida: "bg-cat-bebida/20 text-foreground",
  doce: "bg-cat-doce/20 text-foreground",
};

/** Placeholder ilustrativo (sem fotos reais com permissão de uso disponíveis). */
export function ProductArt({ nome, categoria, className, size = "md" }: { nome: string; categoria: Categoria; className?: string; size?: "sm" | "md" }) {
  const Icone = POR_NOME.find(([r]) => r.test(nome))?.[1] ?? POR_CATEGORIA[categoria];
  return (
    <div className={cn("relative grid place-items-center overflow-hidden", FUNDO[categoria], className)} aria-hidden="true">
      <div className="pattern-dots absolute inset-0 opacity-60" />
      <Icone className={cn("relative", size === "md" ? "size-12" : "size-6")} strokeWidth={1.6} />
    </div>
  );
}
