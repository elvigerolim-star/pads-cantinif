// Regras de pedido compartilhadas pela interface. O servidor (funções do banco) é a fonte de verdade:
// estas funções só servem para exibir e validar antes do envio — nunca para decidir preço ou status.

export type StatusPedido =
  "recebido" | "aguardando_pagamento" | "em_separacao" | "pronto" | "entregue" | "cancelado";
export type StatusPagamento = "pendente" | "confirmado" | "falhou";
export type MotivoCancelamento = "itens_indisponiveis" | "pagamento_falhou";
export type Categoria = "salgado" | "bebida" | "doce";

export const MAX_QUANTIDADE_POR_ITEM = 10;
export const MAX_ITENS_DISTINTOS = 20;

export const STATUS_LABEL: Record<StatusPedido, string> = {
  recebido: "Recebido",
  aguardando_pagamento: "Aguardando pagamento",
  em_separacao: "Em separação",
  pronto: "Pronto para retirada",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const MOTIVO_LABEL: Record<MotivoCancelamento, string> = {
  itens_indisponiveis: "Itens indisponíveis",
  pagamento_falhou: "Pagamento falhou",
};

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  salgado: "Salgados",
  bebida: "Bebidas",
  doce: "Doces",
};

/** Mesmo grafo de transições aplicado pelo gatilho do banco. */
export const TRANSICOES: Record<StatusPedido, StatusPedido[]> = {
  recebido: ["aguardando_pagamento", "cancelado"],
  aguardando_pagamento: ["em_separacao", "cancelado"],
  em_separacao: ["pronto"],
  pronto: ["entregue"],
  entregue: [],
  cancelado: [],
};

export function podeTransicionar(de: StatusPedido, para: StatusPedido): boolean {
  return TRANSICOES[de].includes(para);
}

export function pedidoFinalizado(status: StatusPedido): boolean {
  return status === "entregue" || status === "cancelado";
}

/** Total derivado da soma dos itens, calculado em centavos para evitar erro de ponto flutuante. */
export function calcularTotal(
  itens: ReadonlyArray<{ quantidade: number; preco_unitario: number | string }>,
): number {
  const centavos = itens.reduce(
    (soma, i) => soma + i.quantidade * Math.round(Number(i.preco_unitario) * 100),
    0,
  );
  return centavos / 100;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function formatarBRL(valor: number | string): string {
  return brl.format(Number(valor));
}

export function numeroPedido(n: number): string {
  return `#${String(n).padStart(4, "0")}`;
}

export type ItemCarrinho = { id_produto: string; quantidade: number };

/** Validação local (tela E04). O servidor repete todas estas verificações. */
export function validarCarrinho(itens: ReadonlyArray<ItemCarrinho>): string | null {
  if (itens.length === 0) return "Adicione pelo menos um item ao pedido.";
  if (itens.length > MAX_ITENS_DISTINTOS)
    return `Máximo de ${MAX_ITENS_DISTINTOS} produtos diferentes por pedido.`;
  const ids = new Set(itens.map((i) => i.id_produto));
  if (ids.size !== itens.length) return "Há itens duplicados no pedido.";
  for (const i of itens) {
    if (
      !Number.isInteger(i.quantidade) ||
      i.quantidade < 1 ||
      i.quantidade > MAX_QUANTIDADE_POR_ITEM
    ) {
      return `Cada item deve ter quantidade entre 1 e ${MAX_QUANTIDADE_POR_ITEM}.`;
    }
  }
  return null;
}

const MENSAGENS: Record<string, string> = {
  NAO_AUTENTICADO: "Sua sessão expirou. Entre novamente.",
  ACESSO_NEGADO: "Esta ação é exclusiva para contas de aluno.",
  OPERACAO_NAO_PERMITIDA: "Operação não permitida para o seu perfil.",
  ITENS_INVALIDOS: "Os itens do pedido são inválidos.",
  PEDIDO_VAZIO: "Adicione pelo menos um item ao pedido.",
  MUITOS_ITENS: "Pedido com itens demais.",
  QUANTIDADE_INVALIDA: `Cada item deve ter quantidade entre 1 e ${MAX_QUANTIDADE_POR_ITEM}.`,
  ITEM_DUPLICADO: "Há itens duplicados no pedido.",
  PRODUTO_INDISPONIVEL:
    "Um ou mais produtos ficaram indisponíveis. Atualize o cardápio e revise o pedido.",
  LIMITE_PEDIDOS_ATIVOS: "Você já tem 3 pedidos em andamento. Aguarde a retirada de algum deles.",
  SEM_SENHA_DISPONIVEL: "A cantina está com muitos pedidos agora. Tente novamente em instantes.",
  PEDIDO_NAO_ENCONTRADO: "Pedido não encontrado.",
  TRANSICAO_INVALIDA: "Esta ação não é válida para o status atual do pedido.",
  PEDIDO_FINALIZADO: "Pedido já finalizado: não pode ser alterado.",
  PAGAMENTO_FINALIZADO: "Este pagamento já foi processado.",
  CODIGO_INDISPONIVEL: "O código de retirada só aparece quando o pedido estiver pronto.",
  PRODUTO_NAO_ENCONTRADO: "Produto não encontrado.",
};

export function mensagemErro(erro: unknown): string {
  const msg =
    typeof erro === "object" && erro !== null && "message" in erro
      ? String((erro as { message: unknown }).message)
      : String(erro ?? "");
  if (MENSAGENS[msg]) return MENSAGENS[msg];
  if (/fetch|network/i.test(msg))
    return "Sem conexão com o servidor. Verifique a internet e tente de novo.";
  return "Não foi possível concluir a ação. Tente novamente.";
}

export const MOTIVO_RETIRADA: Record<string, string> = {
  CODIGO_INVALIDO: "Código incorreto ou expirado. Peça ao aluno o código atual da tela dele.",
  CODIGO_FORMATO: "Digite os 4 números do código.",
  STATUS_ENTREGUE: "Este pedido já foi entregue. A senha é de uso único.",
  STATUS_CANCELADO: "Pedido cancelado: retirada não permitida.",
  STATUS_EM_SEPARACAO: "O pedido ainda não foi marcado como pronto.",
  STATUS_AGUARDANDO_PAGAMENTO: "O pagamento ainda não foi confirmado.",
  STATUS_RECEBIDO: "O pedido ainda não foi conferido.",
};
