import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { perfilQuery, redirectSeguro } from "@/lib/queries";

export function LoginForm({ perfil, redirect }: { perfil: "aluno" | "cantina"; redirect?: string | undefined }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!email.trim() || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) {
      setEnviando(false);
      setErro(
        /confirm/i.test(error.message)
          ? "Seu e-mail ainda não foi confirmado. Abra o link enviado para sua caixa de entrada."
          : "E-mail ou senha inválidos. Confira os dados e tente novamente.",
      );
      return;
    }
    const p = await queryClient.fetchQuery({ ...perfilQuery, staleTime: 0 });
    const atendente = p?.roles.includes("atendente");
    const padrao = atendente ? "/cantina" : "/cardapio";
    navigate({ to: redirectSeguro(redirect, padrao), replace: true });
  }

  return (
    <form onSubmit={entrar} className="space-y-5" noValidate>
      {erro && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          <div><p className="font-semibold">E08 · Não foi possível entrar</p><p className="text-muted-foreground">{erro}</p></div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" aria-invalid={!!erro} required />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="senha">Senha</Label>
          <Link to={perfil === "aluno" ? "/recuperar-senha" : "/atendente/recuperar-senha"} className="text-sm font-semibold text-primary hover:underline">Esqueci a senha</Link>
        </div>
        <div className="relative">
          <Input id="senha" type={mostrar ? "text" : "password"} autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} className="h-12 rounded-xl pr-12" aria-invalid={!!erro} required />
          <button type="button" onClick={() => setMostrar((m) => !m)} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}>
            {mostrar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={enviando}>
        {enviando && <Loader2 className="animate-spin" />}Entrar
      </Button>
      {perfil === "aluno" ? (
        <p className="text-center text-sm text-muted-foreground">Ainda não tem conta? <Link to="/criar-conta" className="font-semibold text-primary hover:underline">Criar conta</Link></p>
      ) : (
        <p className="text-center text-sm text-muted-foreground">Contas de atendente são criadas pela administração da cantina.</p>
      )}
      <p className="text-center text-xs text-muted-foreground">Testando o protótipo? Veja as <Link to="/ajuda" className="font-semibold underline">contas de demonstração</Link>.</p>
    </form>
  );
}
