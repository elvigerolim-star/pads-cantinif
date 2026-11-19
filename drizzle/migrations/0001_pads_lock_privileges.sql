revoke all on public.pedido from anon, authenticated;
grant select (id, numero, id_aluno, id_atendente, criado_em, atualizado_em, status, senha_retirada,
  motivo_cancelamento, chamado_em, retirado_em) on public.pedido to authenticated;

revoke all on public.aluno, public.funcionario, public.item_pedido, public.pagamento, public.user_roles from anon, authenticated;
revoke all on public.produto from anon, authenticated;
grant select on public.aluno, public.funcionario, public.item_pedido, public.pagamento, public.user_roles to authenticated;
grant select on public.produto to anon, authenticated;
