import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { AlertCircle, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLayout } from "@/components/pads/auth-layout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/criar-conta")({
  head: () => ({
    meta: [
      { title: "Criar conta — PADS CantinIF" },
      {
        name: "description",
        content: "Crie sua conta de aluno com nome, matrícula e e-mail para pedir lanches.",
      },
      { property: "og:title", content: "Criar conta — PADS CantinIF" },
      { property: "og:description", content: "Cadastro de aluno no pedido antecipado de lanche." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CriarConta,
});

const schema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(3, "Informe o nome (mínimo 3 letras).")
      .max(80, "Nome muito longo."),
    matricula: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9]{4,20}$/, "Matrícula deve ter de 4 a 20 letras ou números, sem espaços."),
    email: z.string().trim().email("Informe um e-mail válido.").max(255),
    senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72),
    confirmar: z.string(),
    ciente: z.literal(true, { error: "Confirme que entende que este é um protótipo escolar." }),
  })
  .refine((d) => d.senha === d.confirmar, {
    message: "As senhas não coincidem.",
    path: ["confirmar"],
  });

type Campos = "nome" | "matricula" | "email" | "senha" | "confirmar" | "ciente";

function CriarConta() {
  const navigate = useNavigate();
  const [dados, setDados] = useState({
    nome: "",
    matricula: "",
    email: "",
    senha: "",
    confirmar: "",
  });
  const [ciente, setCiente] = useState(false);
  const [erros, setErros] = useState<Partial<Record<Campos, string>>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [criadaPara, setCriadaPara] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErroGeral(null);
    const r = schema.safeParse({ ...dados, ciente });
    if (!r.success) {
      const f: Partial<Record<Campos, string>> = {};
      for (const issue of r.error.issues) f[issue.path[0] as Campos] ??= issue.message;
      setErros(f);
      return;
    }
    setErros({});
    setEnviando(true);
    const { data, error } = await supabase.auth.signUp({
      email: r.data.email,
      password: r.data.senha,
      options: {
        emailRedirectTo: `${window.location.origin}/cardapio`,
        data: { nome: r.data.nome, matricula: r.data.matricula.toUpperCase() },
      },
    });
    setEnviando(false);
    if (error) {
      setErroGeral(
        /registered|exists/i.test(error.message)
          ? "Este e-mail já está cadastrado. Tente entrar ou recuperar a senha."
          : /password/i.test(error.message)
            ? "Senha fraca ou inválida. Use pelo menos 8 caracteres, misturando letras e números."
            : "Não foi possível criar a conta. A matrícula pode já estar cadastrada ou algum dado é inválido.",
      );
      return;
    }
    if (data.user && data.user.identities?.length === 0) {
      setErroGeral("Este e-mail já está cadastrado. Tente entrar ou recuperar a senha.");
      return;
    }
    if (data.session) {
      navigate({ to: "/cardapio" });
      return;
    }
    setCriadaPara(r.data.email);
  }

  if (criadaPara) {
    return (
      <AuthLayout codigo="A13 · Conta criada" titulo="Conta criada!">
        <div className="space-y-5" role="status">
          <div className="grid size-16 place-items-center rounded-3xl bg-success/15 text-success">
            <MailCheck className="size-8" />
          </div>
          <p className="text-muted-foreground">
            Enviamos um link de confirmação para{" "}
            <strong className="text-foreground">{criadaPara}</strong>. Abra o e-mail e confirme para
            poder entrar.
          </p>
          <Button asChild variant="hero" size="lg" className="w-full">
            <Link to="/entrar" search={{}}>
              Ir para o login
            </Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const campo = (
    id: keyof typeof dados,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={dados[id]}
        onChange={(e) => setDados((d) => ({ ...d, [id]: e.target.value }))}
        className="h-12 rounded-xl"
        aria-invalid={!!erros[id]}
        aria-describedby={erros[id] ? `${id}-erro` : undefined}
        {...props}
      />
      {erros[id] && (
        <p id={`${id}-erro`} className="text-sm font-medium text-destructive">
          {erros[id]}
        </p>
      )}
    </div>
  );

  return (
    <AuthLayout
      codigo="A12 · Criar conta"
      titulo="Criar conta de aluno"
      subtitulo="Use dados fictícios: este é um protótipo escolar."
    >
      <form onSubmit={enviar} className="space-y-4" noValidate>
        {erroGeral && (
          <div
            role="alert"
            className="flex gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            <div>
              <p className="font-semibold">E09 · Erro no cadastro</p>
              <p className="text-muted-foreground">{erroGeral}</p>
            </div>
          </div>
        )}
        {campo("nome", "Nome completo", { autoComplete: "name" })}
        {campo("matricula", "Matrícula", { autoComplete: "off", inputMode: "text" })}
        {campo("email", "E-mail", { type: "email", autoComplete: "email" })}
        <div className="grid gap-4 sm:grid-cols-2">
          {campo("senha", "Senha", { type: "password", autoComplete: "new-password" })}
          {campo("confirmar", "Confirmar senha", {
            type: "password",
            autoComplete: "new-password",
          })}
        </div>
        <div className="space-y-1">
          <div className="flex items-start gap-3 rounded-2xl bg-muted p-3">
            <Checkbox
              id="ciente"
              checked={ciente}
              onCheckedChange={(v) => setCiente(v === true)}
              aria-invalid={!!erros.ciente}
              className="mt-0.5"
            />
            <Label htmlFor="ciente" className="text-sm font-normal leading-snug">
              Entendo que o PADS é um protótipo escolar, sem cobranças reais, e não vou usar dados
              pessoais sensíveis.
            </Label>
          </div>
          {erros.ciente && <p className="text-sm font-medium text-destructive">{erros.ciente}</p>}
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={enviando}>
          {enviando && <Loader2 className="animate-spin" />}Criar conta
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/entrar" search={{}} className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
