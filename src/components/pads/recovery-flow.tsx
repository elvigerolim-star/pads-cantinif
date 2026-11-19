import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

function Alerta({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div role="alert" className="flex gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
      <div><p className="font-semibold">{titulo}</p><p className="text-muted-foreground">{texto}</p></div>
    </div>
  );
}

export function NovaSenhaForm({ onDone }: { onDone: () => void }) {
  const [senha, setSenha] = useState("");
  const [conf, setConf] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    if (senha !== conf) return setErro("As senhas não coincidem.");
    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);
    if (error) return setErro("Não foi possível salvar a nova senha. Escolha outra senha e tente de novo.");
    onDone();
  }
  return (
    <form onSubmit={salvar} className="space-y-5" noValidate>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">A16 · Nova senha</p>
      {erro && <Alerta titulo="Senha não alterada" texto={erro} />}
      <div className="space-y-2"><Label htmlFor="nova">Nova senha</Label><Input id="nova" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} className="h-12 rounded-xl" /></div>
      <div className="space-y-2"><Label htmlFor="conf">Confirmar nova senha</Label><Input id="conf" type="password" autoComplete="new-password" value={conf} onChange={(e) => setConf(e.target.value)} className="h-12 rounded-xl" /></div>
      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={enviando}>{enviando && <Loader2 className="animate-spin" />}Salvar nova senha</Button>
    </form>
  );
}

export function SenhaRedefinida({ perfil }: { perfil: "aluno" | "cantina" }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-5 text-center" role="status">
      <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-success/15 text-success"><CheckCircle2 className="size-8" /></div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">A17 · Senha redefinida</p>
      <h2 className="text-2xl font-extrabold">Senha alterada com sucesso</h2>
      <p className="text-muted-foreground">Você já está conectado com a nova senha.</p>
      <Button variant="hero" size="lg" className="w-full" onClick={() => navigate({ to: perfil === "aluno" ? "/cardapio" : "/cantina" })}>Continuar</Button>
    </div>
  );
}

export function RecoveryFlow({ perfil }: { perfil: "aluno" | "cantina" }) {
  const [etapa, setEtapa] = useState<"email" | "codigo" | "nova" | "ok">("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviarEmail(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErro("Informe um e-mail válido.");
    setEnviando(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/redefinir-senha` });
    setEnviando(false);
    // Mesma resposta exista ou não a conta, para não revelar quais e-mails estão cadastrados.
    setEtapa("codigo");
  }

  async function verificar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!/^[0-9]{6,8}$/.test(codigo.trim())) return setErro("O código tem de 6 a 8 números.");
    setEnviando(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: codigo.trim(), type: "recovery" });
    setEnviando(false);
    if (error) return setErro("Código inválido ou expirado. Confira o e-mail mais recente ou peça um novo código.");
    setEtapa("nova");
  }

  if (etapa === "ok") return <SenhaRedefinida perfil={perfil} />;
  if (etapa === "nova") return <NovaSenhaForm onDone={() => setEtapa("ok")} />;

  if (etapa === "codigo")
    return (
      <form onSubmit={verificar} className="space-y-5" noValidate>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">A15 · Verificar código</p>
        <div className="flex gap-3 rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
          <MailCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>Se houver uma conta para <strong>{email}</strong>, enviamos um e-mail de recuperação. Digite o código recebido ou clique no link do e-mail.</p>
        </div>
        {erro && <Alerta titulo="E10 · Código inválido" texto={erro} />}
        <div className="space-y-2">
          <Label htmlFor="codigo">Código de verificação</Label>
          <Input id="codigo" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} className="h-14 rounded-xl text-center font-mono text-2xl tracking-[0.4em]" />
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={enviando}>{enviando && <Loader2 className="animate-spin" />}Verificar código</Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => { setEtapa("email"); setCodigo(""); setErro(null); }}>Usar outro e-mail</Button>
        <p className="text-center text-xs text-muted-foreground">Contas de demonstração usam e-mails fictícios e não recebem mensagens.</p>
      </form>
    );

  return (
    <form onSubmit={enviarEmail} className="space-y-5" noValidate>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{perfil === "aluno" ? "A14" : "O12"} · Recuperar senha</p>
      {erro && <Alerta titulo="Verifique o e-mail" texto={erro} />}
      <div className="space-y-2"><Label htmlFor="email-rec">E-mail da conta</Label><Input id="email-rec" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" /></div>
      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={enviando}>{enviando && <Loader2 className="animate-spin" />}Enviar código</Button>
      <p className="text-center text-sm"><Link to={perfil === "aluno" ? "/entrar" : "/atendente/entrar"} className="font-semibold text-primary hover:underline">Voltar para o login</Link></p>
    </form>
  );
}
