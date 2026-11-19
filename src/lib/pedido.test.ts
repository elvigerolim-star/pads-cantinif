import { describe, expect, it } from "vitest";
import { calcularTotal, podeTransicionar, validarCarrinho, formatarBRL } from "./pedido";

describe("regras do pedido", () => {
  it("total é a soma dos itens (2 coxinhas a R$ 6,50 + 1 paçoca a R$ 2,00 = R$ 15,00)", () => {
    expect(calcularTotal([
      { quantidade: 2, preco_unitario: 6.5 },
      { quantidade: 1, preco_unitario: "2.00" },
    ])).toBe(15);
  });

  it("formata em reais", () => {
    expect(formatarBRL(6.5).replace(/\s/g, " ")).toBe("R$ 6,50");
  });

  it("recebido só pode ir para aguardando pagamento ou cancelado", () => {
    expect(podeTransicionar("recebido", "aguardando_pagamento")).toBe(true);
    expect(podeTransicionar("recebido", "cancelado")).toBe(true);
    expect(podeTransicionar("recebido", "pronto")).toBe(false);
  });

  it("pedido entregue ou cancelado não muda mais", () => {
    expect(podeTransicionar("entregue", "cancelado")).toBe(false);
    expect(podeTransicionar("cancelado", "recebido")).toBe(false);
  });

  it("em separação não pode ser cancelado", () => {
    expect(podeTransicionar("em_separacao", "cancelado")).toBe(false);
  });

  it("carrinho vazio é inválido", () => {
    expect(validarCarrinho([])).not.toBeNull();
  });

  it("quantidade acima de 10 é inválida", () => {
    expect(validarCarrinho([{ id_produto: "a", quantidade: 11 }])).not.toBeNull();
    expect(validarCarrinho([{ id_produto: "a", quantidade: 10 }])).toBeNull();
  });

  it("item duplicado é inválido", () => {
    expect(validarCarrinho([
      { id_produto: "a", quantidade: 1 },
      { id_produto: "a", quantidade: 2 },
    ])).not.toBeNull();
  });
});
