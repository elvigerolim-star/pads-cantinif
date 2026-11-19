import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Categoria, MotivoCancelamento, StatusPagamento, StatusPedido } from "./pedido";

export type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  preco_atual: number;
  disponivel: boolean;
  categoria: Categoria;
  preco_demonstrativo: boolean;
  ordem: number;
};

export type PedidoCompleto = {
  id: string;
  numero: number;
  id_aluno: string;
  criado_em: string;
  atualizado_em: string;
  status: StatusPedido;
  senha_retirada: string;
  motivo_cancelamento: MotivoCancelamento | null;
  chamado_em: string | null;
  retirado_em: string | null;
  item_pedido: {
    quantidade: number;
    preco_unitario: number;
    produto: { id: string; nome: string; categoria: Categoria } | null;
  }[];
  pagamento: {
    valor: number;
    status: StatusPagamento;
    referencia_pix: string;
    solicitado_em: string;
    confirmado_em: string | null;
  } | null;
  aluno?: { nome: string; matricula: string } | null;
};

// Colunas explícitas: a chave de conferência não é legível pelo app (permissão por coluna).
const PEDIDO_COLS =
  "id,numero,id_aluno,criado_em,atualizado_em,status,senha_retirada,motivo_cancelamento,chamado_em,retirado_em," +
  "item_pedido(quantidade,preco_unitario,produto(id,nome,categoria))," +
  "pagamento(valor,status,referencia_pix,solicitado_em,confirmado_em)";
const PEDIDO_COLS_CANTINA = PEDIDO_COLS + ",aluno(nome,matricula)";

export type Perfil = {
  userId: string;
  email: string;
  roles: ("aluno" | "atendente")[];
  aluno: { nome: string; matricula: string; email: string } | null;
  funcionario: { nome: string; usuario: string; email: string } | null;
};

export const perfilQuery = queryOptions({
  queryKey: ["perfil"],
  queryFn: async (): Promise<Perfil | null> => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    const [roles, aluno, funcionario] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("aluno").select("nome,matricula,email").eq("id", user.id).maybeSingle(),
      supabase.from("funcionario").select("nome,usuario,email").eq("id", user.id).maybeSingle(),
    ]);
    if (roles.error) throw roles.error;
    return {
      userId: user.id,
      email: user.email ?? "",
      roles: (roles.data ?? []).map((r) => r.role),
      aluno: aluno.data ?? null,
      funcionario: funcionario.data ?? null,
    };
  },
  staleTime: 60_000,
});

export const produtosQuery = queryOptions({
  queryKey: ["produtos"],
  queryFn: async (): Promise<Produto[]> => {
    const { data, error } = await supabase
      .from("produto")
      .select("id,nome,descricao,preco_atual,disponivel,categoria,preco_demonstrativo,ordem")
      .order("ordem");
    if (error) throw error;
    return data as Produto[];
  },
});

export const meusPedidosQuery = (userId: string) =>
  queryOptions({
    queryKey: ["meus-pedidos", userId],
    queryFn: async (): Promise<PedidoCompleto[]> => {
      const { data, error } = await supabase
        .from("pedido")
        .select(PEDIDO_COLS)
        .eq("id_aluno", userId)
        .order("criado_em", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as PedidoCompleto[];
    },
    refetchInterval: 8000,
  });

export const pedidoQuery = (id: string, cantina = false) =>
  queryOptions({
    queryKey: ["pedido", id, cantina],
    queryFn: async (): Promise<PedidoCompleto | null> => {
      const { data, error } = await supabase
        .from("pedido")
        .select(cantina ? PEDIDO_COLS_CANTINA : PEDIDO_COLS)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as PedidoCompleto | null;
    },
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "entregue" || s === "cancelado" ? false : 4000;
    },
  });

export const painelQuery = queryOptions({
  queryKey: ["painel"],
  queryFn: async (): Promise<PedidoCompleto[]> => {
    const desde = new Date();
    desde.setHours(desde.getHours() - 24);
    const { data, error } = await supabase
      .from("pedido")
      .select(PEDIDO_COLS_CANTINA)
      .or(
        `status.in.(recebido,aguardando_pagamento,em_separacao,pronto),criado_em.gte.${desde.toISOString()}`,
      )
      .order("criado_em", { ascending: true })
      .limit(300);
    if (error) throw error;
    return data as unknown as PedidoCompleto[];
  },
  refetchInterval: 5000,
});

export function formatarHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function redirectSeguro(valor: string | undefined, padrao: string): string {
  if (!valor) return padrao;
  try {
    const url = new URL(valor, "http://x");
    if (url.origin !== "http://x") return padrao;
    const path = url.pathname + url.search;
    return path.startsWith("/") && !path.startsWith("//") ? path : padrao;
  } catch {
    return padrao;
  }
}
