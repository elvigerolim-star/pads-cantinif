create extension if not exists pgcrypto with schema extensions;

-- ===== Enums =====
create type public.app_role as enum ('aluno', 'atendente');
create type public.categoria_produto as enum ('salgado', 'bebida', 'doce');
create type public.status_pedido as enum ('recebido', 'aguardando_pagamento', 'em_separacao', 'pronto', 'entregue', 'cancelado');
create type public.status_pagamento as enum ('pendente', 'confirmado', 'falhou');
create type public.motivo_cancelamento as enum ('itens_indisponiveis', 'pagamento_falhou');
create type public.funcao_funcionario as enum ('atendente');

-- ===== user_roles =====
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Usuário vê os próprios papéis" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ===== ALUNO =====
create table public.aluno (
  id uuid primary key,
  nome text not null check (char_length(nome) between 3 and 80),
  matricula text not null unique check (matricula ~ '^[A-Z0-9]{4,20}$'),
  email text not null unique,
  criado_em timestamptz not null default now()
);
grant select on public.aluno to authenticated;
grant all on public.aluno to service_role;
alter table public.aluno enable row level security;
create policy "Aluno vê o próprio cadastro" on public.aluno
  for select to authenticated using (id = auth.uid());
create policy "Atendente vê alunos" on public.aluno
  for select to authenticated using (public.has_role(auth.uid(), 'atendente'));

-- ===== FUNCIONARIO =====
create table public.funcionario (
  id uuid primary key,
  nome text not null check (char_length(nome) between 3 and 80),
  funcao public.funcao_funcionario not null default 'atendente',
  usuario text not null unique check (usuario ~ '^[a-z0-9._]{3,30}$'),
  email text not null unique,
  criado_em timestamptz not null default now()
);
grant select on public.funcionario to authenticated;
grant all on public.funcionario to service_role;
alter table public.funcionario enable row level security;
create policy "Funcionário vê o próprio cadastro" on public.funcionario
  for select to authenticated using (id = auth.uid());

-- ===== PRODUTO =====
create table public.produto (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  preco_atual numeric(10,2) not null check (preco_atual >= 0),
  disponivel boolean not null default true,
  categoria public.categoria_produto not null,
  preco_demonstrativo boolean not null default false,
  ordem int not null default 0
);
grant select on public.produto to anon, authenticated;
grant all on public.produto to service_role;
alter table public.produto enable row level security;
create policy "Cardápio é público" on public.produto for select to anon, authenticated using (true);

-- ===== PEDIDO =====
create table public.pedido (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity unique,
  id_aluno uuid not null references public.aluno(id),
  id_atendente uuid references public.funcionario(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  status public.status_pedido not null default 'recebido',
  senha_retirada text not null check (senha_retirada ~ '^[0-9]{3}$'),
  chave_conferencia text not null,
  motivo_cancelamento public.motivo_cancelamento,
  chamado_em timestamptz,
  retirado_em timestamptz
);
create index pedido_id_aluno_idx on public.pedido(id_aluno);
create index pedido_status_idx on public.pedido(status);
-- Column-level grant: chave_conferencia is never readable by app users.
grant select (id, numero, id_aluno, id_atendente, criado_em, atualizado_em, status, senha_retirada,
  motivo_cancelamento, chamado_em, retirado_em) on public.pedido to authenticated;
grant all on public.pedido to service_role;
alter table public.pedido enable row level security;
create policy "Aluno vê os próprios pedidos; atendente vê todos" on public.pedido
  for select to authenticated
  using (id_aluno = auth.uid() or public.has_role(auth.uid(), 'atendente'));

-- ===== ITEM_PEDIDO =====
create table public.item_pedido (
  id_pedido uuid not null references public.pedido(id) on delete cascade,
  id_produto uuid not null references public.produto(id),
  quantidade int not null check (quantidade > 0 and quantidade <= 10),
  preco_unitario numeric(10,2) not null check (preco_unitario >= 0),
  primary key (id_pedido, id_produto)
);
create index item_pedido_produto_idx on public.item_pedido(id_produto);
grant select on public.item_pedido to authenticated;
grant all on public.item_pedido to service_role;
alter table public.item_pedido enable row level security;
create policy "Itens visíveis com o pedido" on public.item_pedido
  for select to authenticated
  using (exists (select 1 from public.pedido p where p.id = id_pedido
    and (p.id_aluno = auth.uid() or public.has_role(auth.uid(), 'atendente'))));

-- ===== PAGAMENTO =====
create table public.pagamento (
  id uuid primary key default gen_random_uuid(),
  id_pedido uuid not null unique references public.pedido(id) on delete cascade,
  valor numeric(10,2) not null check (valor >= 0),
  status public.status_pagamento not null default 'pendente',
  referencia_pix text not null unique,
  solicitado_em timestamptz not null default now(),
  confirmado_em timestamptz
);
grant select on public.pagamento to authenticated;
grant all on public.pagamento to service_role;
alter table public.pagamento enable row level security;
create policy "Pagamento visível com o pedido" on public.pagamento
  for select to authenticated
  using (exists (select 1 from public.pedido p where p.id = id_pedido
    and (p.id_aluno = auth.uid() or public.has_role(auth.uid(), 'atendente'))));

-- ===== Integrity triggers =====
create or replace function public.validar_transicao_pedido()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status in ('entregue', 'cancelado') then
    raise exception 'PEDIDO_FINALIZADO';
  end if;
  if new.id_aluno <> old.id_aluno or new.criado_em <> old.criado_em
     or new.chave_conferencia <> old.chave_conferencia or new.senha_retirada <> old.senha_retirada
     or new.numero <> old.numero then
    raise exception 'CAMPO_IMUTAVEL';
  end if;
  if new.status <> old.status and not (
       (old.status = 'recebido' and new.status in ('aguardando_pagamento', 'cancelado'))
    or (old.status = 'aguardando_pagamento' and new.status in ('em_separacao', 'cancelado'))
    or (old.status = 'em_separacao' and new.status = 'pronto')
    or (old.status = 'pronto' and new.status = 'entregue')
  ) then
    raise exception 'TRANSICAO_INVALIDA';
  end if;
  if new.status = 'cancelado' and new.motivo_cancelamento is null then
    raise exception 'MOTIVO_OBRIGATORIO';
  end if;
  if new.status <> 'cancelado' and new.motivo_cancelamento is not null then
    raise exception 'MOTIVO_SO_EM_CANCELAMENTO';
  end if;
  if new.status = 'entregue' and new.retirado_em is null then
    raise exception 'RETIRADA_OBRIGATORIA';
  end if;
  new.atualizado_em := now();
  return new;
end $$;
create trigger pedido_validar_transicao before update on public.pedido
  for each row execute function public.validar_transicao_pedido();

create or replace function public.validar_item_pedido()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'ITEM_IMUTAVEL';
  end if;
  if not exists (select 1 from public.pedido where id = new.id_pedido and status = 'recebido') then
    raise exception 'PEDIDO_NAO_ACEITA_ITENS';
  end if;
  return new;
end $$;
create trigger item_pedido_validar before insert or update on public.item_pedido
  for each row execute function public.validar_item_pedido();

create or replace function public.validar_pagamento()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status <> 'pendente' then
    raise exception 'PAGAMENTO_FINALIZADO';
  end if;
  if new.valor <> old.valor or new.id_pedido <> old.id_pedido or new.referencia_pix <> old.referencia_pix then
    raise exception 'CAMPO_IMUTAVEL';
  end if;
  return new;
end $$;
create trigger pagamento_validar before update on public.pagamento
  for each row execute function public.validar_pagamento();

-- ===== Signup: creates ALUNO only from signup metadata; never grants atendente =====
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  if v_meta ? 'matricula' then
    insert into public.aluno (id, nome, matricula, email)
    values (new.id, trim(v_meta->>'nome'), upper(trim(v_meta->>'matricula')), lower(new.email));
    insert into public.user_roles (user_id, role) values (new.id, 'aluno');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== Private helper: TOTP-like 4-digit code from the private key =====
create or replace function public._codigo_janela(_chave text, _janela bigint)
returns text language plpgsql immutable set search_path = public as $$
declare
  v_mac bytea;
  v_num bigint;
begin
  v_mac := extensions.hmac(convert_to(_janela::text, 'UTF8'), decode(_chave, 'hex'), 'sha256');
  v_num := get_byte(v_mac, 0)::bigint * 16777216 + get_byte(v_mac, 1) * 65536
         + get_byte(v_mac, 2) * 256 + get_byte(v_mac, 3);
  return lpad((v_num % 10000)::text, 4, '0');
end $$;

-- ===== RPC: create order (aluno) =====
create or replace function public.criar_pedido(p_itens jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_total int;
  v_distintos int;
  v_invalidos int;
  v_indisponiveis int;
  v_ativos int;
  v_pedido uuid;
  v_senha text;
  v_tentativa int := 0;
begin
  if v_uid is null then raise exception 'NAO_AUTENTICADO'; end if;
  if not public.has_role(v_uid, 'aluno') or not exists (select 1 from public.aluno where id = v_uid) then
    raise exception 'ACESSO_NEGADO';
  end if;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' then raise exception 'ITENS_INVALIDOS'; end if;
  v_total := jsonb_array_length(p_itens);
  if v_total = 0 then raise exception 'PEDIDO_VAZIO'; end if;
  if v_total > 20 then raise exception 'MUITOS_ITENS'; end if;

  select count(*) into v_invalidos from jsonb_array_elements(p_itens) e
  where jsonb_typeof(e) <> 'object'
     or coalesce(e->>'id_produto', '') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
     or coalesce(e->>'quantidade', '') !~ '^[0-9]{1,2}$';
  if v_invalidos > 0 then raise exception 'ITENS_INVALIDOS'; end if;

  select count(*) into v_invalidos from jsonb_array_elements(p_itens) e
  where (e->>'quantidade')::int < 1 or (e->>'quantidade')::int > 10;
  if v_invalidos > 0 then raise exception 'QUANTIDADE_INVALIDA'; end if;

  select count(distinct (e->>'id_produto')::uuid) into v_distintos from jsonb_array_elements(p_itens) e;
  if v_distintos <> v_total then raise exception 'ITEM_DUPLICADO'; end if;

  -- lock referenced products and validate current availability
  perform 1 from public.produto pr
    where pr.id in (select (e->>'id_produto')::uuid from jsonb_array_elements(p_itens) e)
    for share;
  select count(*) into v_indisponiveis from jsonb_array_elements(p_itens) e
    left join public.produto pr on pr.id = (e->>'id_produto')::uuid
    where pr.id is null or pr.disponivel = false;
  if v_indisponiveis > 0 then raise exception 'PRODUTO_INDISPONIVEL'; end if;

  select count(*) into v_ativos from public.pedido
    where id_aluno = v_uid and status in ('recebido', 'aguardando_pagamento', 'em_separacao', 'pronto');
  if v_ativos >= 3 then raise exception 'LIMITE_PEDIDOS_ATIVOS'; end if;

  loop
    v_tentativa := v_tentativa + 1;
    v_senha := lpad((floor(random() * 1000))::int::text, 3, '0');
    exit when not exists (select 1 from public.pedido where senha_retirada = v_senha
      and status in ('recebido', 'aguardando_pagamento', 'em_separacao', 'pronto'));
    if v_tentativa > 200 then raise exception 'SEM_SENHA_DISPONIVEL'; end if;
  end loop;

  insert into public.pedido (id_aluno, status, senha_retirada, chave_conferencia)
  values (v_uid, 'recebido', v_senha, encode(extensions.gen_random_bytes(20), 'hex'))
  returning id into v_pedido;

  insert into public.item_pedido (id_pedido, id_produto, quantidade, preco_unitario)
  select v_pedido, pr.id, (e->>'quantidade')::int, pr.preco_atual
  from jsonb_array_elements(p_itens) e
  join public.produto pr on pr.id = (e->>'id_produto')::uuid;

  return v_pedido;
end $$;

-- ===== RPC: atendente checks availability =====
create or replace function public.conferir_pedido(p_pedido uuid, p_disponivel boolean)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_status public.status_pedido;
  v_valor numeric(10,2);
  v_indisp int;
begin
  if v_uid is null or not public.has_role(v_uid, 'atendente') then raise exception 'OPERACAO_NAO_PERMITIDA'; end if;
  select status into v_status from public.pedido where id = p_pedido for update;
  if v_status is null then raise exception 'PEDIDO_NAO_ENCONTRADO'; end if;
  if v_status <> 'recebido' then raise exception 'TRANSICAO_INVALIDA'; end if;

  if not p_disponivel then
    update public.pedido set status = 'cancelado', motivo_cancelamento = 'itens_indisponiveis', id_atendente = v_uid
      where id = p_pedido;
    return 'cancelado';
  end if;

  select count(*) into v_indisp from public.item_pedido i join public.produto pr on pr.id = i.id_produto
    where i.id_pedido = p_pedido and pr.disponivel = false;
  if v_indisp > 0 then raise exception 'PRODUTO_INDISPONIVEL'; end if;

  select coalesce(sum(quantidade * preco_unitario), 0) into v_valor from public.item_pedido where id_pedido = p_pedido;
  insert into public.pagamento (id_pedido, valor, status, referencia_pix)
  values (p_pedido, v_valor, 'pendente', 'PIXSIM-' || upper(encode(extensions.gen_random_bytes(8), 'hex')));
  update public.pedido set status = 'aguardando_pagamento', id_atendente = v_uid where id = p_pedido;
  return 'aguardando_pagamento';
end $$;

-- ===== RPC: controlled payment simulation (owner aluno only) =====
create or replace function public.simular_pagamento(p_pedido uuid, p_aprovado boolean)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_pedido record;
begin
  if v_uid is null then raise exception 'NAO_AUTENTICADO'; end if;
  select id, id_aluno, status into v_pedido from public.pedido where id = p_pedido for update;
  if v_pedido.id is null or v_pedido.id_aluno <> v_uid then raise exception 'PEDIDO_NAO_ENCONTRADO'; end if;
  if v_pedido.status <> 'aguardando_pagamento' then raise exception 'TRANSICAO_INVALIDA'; end if;
  if not exists (select 1 from public.pagamento where id_pedido = p_pedido and status = 'pendente') then
    raise exception 'PAGAMENTO_FINALIZADO';
  end if;

  if p_aprovado then
    update public.pagamento set status = 'confirmado', confirmado_em = now() where id_pedido = p_pedido;
    update public.pedido set status = 'em_separacao' where id = p_pedido;
    return 'em_separacao';
  else
    update public.pagamento set status = 'falhou' where id_pedido = p_pedido;
    update public.pedido set status = 'cancelado', motivo_cancelamento = 'pagamento_falhou' where id = p_pedido;
    return 'cancelado';
  end if;
end $$;

-- ===== RPC: separation done =====
create or replace function public.marcar_pronto(p_pedido uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_status public.status_pedido;
begin
  if v_uid is null or not public.has_role(v_uid, 'atendente') then raise exception 'OPERACAO_NAO_PERMITIDA'; end if;
  select status into v_status from public.pedido where id = p_pedido for update;
  if v_status is null then raise exception 'PEDIDO_NAO_ENCONTRADO'; end if;
  if v_status <> 'em_separacao' then raise exception 'TRANSICAO_INVALIDA'; end if;
  update public.pedido set status = 'pronto', id_atendente = v_uid where id = p_pedido;
  return 'pronto';
end $$;

-- ===== RPC: call by pickup number =====
create or replace function public.chamar_senha(p_pedido uuid)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_status public.status_pedido;
  v_agora timestamptz := now();
begin
  if v_uid is null or not public.has_role(v_uid, 'atendente') then raise exception 'OPERACAO_NAO_PERMITIDA'; end if;
  select status into v_status from public.pedido where id = p_pedido for update;
  if v_status is null then raise exception 'PEDIDO_NAO_ENCONTRADO'; end if;
  if v_status <> 'pronto' then raise exception 'TRANSICAO_INVALIDA'; end if;
  update public.pedido set chamado_em = v_agora where id = p_pedido;
  return v_agora;
end $$;

-- ===== RPC: aluno gets current rotating code (secret never leaves DB) =====
create or replace function public.codigo_retirada(p_pedido uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_pedido record;
  v_epoch numeric := extract(epoch from clock_timestamp());
  v_janela bigint := floor(v_epoch / 30)::bigint;
begin
  if v_uid is null then raise exception 'NAO_AUTENTICADO'; end if;
  select id, id_aluno, status, chave_conferencia into v_pedido from public.pedido where id = p_pedido;
  if v_pedido.id is null or v_pedido.id_aluno <> v_uid then raise exception 'PEDIDO_NAO_ENCONTRADO'; end if;
  if v_pedido.status <> 'pronto' then raise exception 'CODIGO_INDISPONIVEL'; end if;
  return jsonb_build_object(
    'codigo', public._codigo_janela(v_pedido.chave_conferencia, v_janela),
    'segundos_restantes', 30 - floor(v_epoch - v_janela * 30)::int
  );
end $$;

-- ===== RPC: atendente verifies pickup code and registers delivery =====
create or replace function public.conferir_retirada(p_pedido uuid, p_codigo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_pedido record;
  v_janela bigint := floor(extract(epoch from clock_timestamp()) / 30)::bigint;
  v_agora timestamptz := now();
begin
  if v_uid is null or not public.has_role(v_uid, 'atendente') then raise exception 'OPERACAO_NAO_PERMITIDA'; end if;
  select id, status, chave_conferencia into v_pedido from public.pedido where id = p_pedido for update;
  if v_pedido.id is null then raise exception 'PEDIDO_NAO_ENCONTRADO'; end if;
  if v_pedido.status <> 'pronto' then
    return jsonb_build_object('ok', false, 'motivo', 'STATUS_' || upper(v_pedido.status::text));
  end if;
  if coalesce(p_codigo, '') !~ '^[0-9]{4}$' then
    return jsonb_build_object('ok', false, 'motivo', 'CODIGO_FORMATO');
  end if;
  if p_codigo <> public._codigo_janela(v_pedido.chave_conferencia, v_janela)
     and p_codigo <> public._codigo_janela(v_pedido.chave_conferencia, v_janela - 1) then
    return jsonb_build_object('ok', false, 'motivo', 'CODIGO_INVALIDO');
  end if;
  update public.pedido set status = 'entregue', retirado_em = v_agora, id_atendente = v_uid where id = p_pedido;
  return jsonb_build_object('ok', true, 'retirado_em', v_agora);
end $$;

-- ===== RPC: product availability (atendente) =====
create or replace function public.definir_disponibilidade(p_produto uuid, p_disponivel boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.has_role(v_uid, 'atendente') then raise exception 'OPERACAO_NAO_PERMITIDA'; end if;
  update public.produto set disponivel = p_disponivel where id = p_produto;
  if not found then raise exception 'PRODUTO_NAO_ENCONTRADO'; end if;
  return p_disponivel;
end $$;

-- ===== Function privileges =====
revoke execute on function public._codigo_janela(text, bigint) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.validar_transicao_pedido() from public, anon, authenticated;
revoke execute on function public.validar_item_pedido() from public, anon, authenticated;
revoke execute on function public.validar_pagamento() from public, anon, authenticated;
revoke execute on function public.criar_pedido(jsonb) from public, anon;
revoke execute on function public.conferir_pedido(uuid, boolean) from public, anon;
revoke execute on function public.simular_pagamento(uuid, boolean) from public, anon;
revoke execute on function public.marcar_pronto(uuid) from public, anon;
revoke execute on function public.chamar_senha(uuid) from public, anon;
revoke execute on function public.codigo_retirada(uuid) from public, anon;
revoke execute on function public.conferir_retirada(uuid, text) from public, anon;
revoke execute on function public.definir_disponibilidade(uuid, boolean) from public, anon;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.criar_pedido(jsonb) to authenticated;
grant execute on function public.conferir_pedido(uuid, boolean) to authenticated;
grant execute on function public.simular_pagamento(uuid, boolean) to authenticated;
grant execute on function public.marcar_pronto(uuid) to authenticated;
grant execute on function public.chamar_senha(uuid) to authenticated;
grant execute on function public.codigo_retirada(uuid) to authenticated;
grant execute on function public.conferir_retirada(uuid, text) to authenticated;
grant execute on function public.definir_disponibilidade(uuid, boolean) to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- ===== Seed: cardápio =====
insert into public.produto (nome, descricao, preco_atual, disponivel, categoria, preco_demonstrativo, ordem) values
  ('Coxinha', 'Salgado assado ou frito, conforme a cantina.', 6.50, true, 'salgado', false, 1),
  ('Esfirra', 'Esfirra tradicional.', 6.50, true, 'salgado', false, 2),
  ('Torta', 'Fatia de torta salgada.', 6.50, true, 'salgado', false, 3),
  ('Enroladinho de salsicha', 'Massa assada com salsicha.', 6.50, true, 'salgado', false, 4),
  ('Kibe com queijo', 'Kibe recheado com queijo.', 6.50, true, 'salgado', false, 5),
  ('Pão de queijo', 'Item de demonstração.', 4.00, true, 'salgado', true, 6),
  ('Empada', 'Item de demonstração.', 6.00, false, 'salgado', true, 7),
  ('Refrigerante PET pequena', 'Garrafa PET pequena, sabores conforme estoque.', 2.50, true, 'bebida', false, 10),
  ('Coca-Cola Café', 'Coca-Cola com café.', 5.50, true, 'bebida', false, 11),
  ('Guaraná Mineiro 1,5L', 'Garrafa de 1,5 litro.', 9.00, true, 'bebida', true, 12),
  ('Guaravita 290ml', 'Copo de 290 ml.', 3.00, true, 'bebida', true, 13),
  ('Água mineral 500ml', 'Item de demonstração.', 3.00, true, 'bebida', true, 14),
  ('Paçoca', 'Paçoca de amendoim.', 2.00, true, 'doce', false, 20),
  ('Brigadeiro', 'Doce variado — item de demonstração.', 3.00, true, 'doce', true, 21),
  ('Bolo de pote', 'Doce variado — item de demonstração.', 7.00, true, 'doce', true, 22),
  ('Pé de moleque', 'Doce variado — item de demonstração.', 2.50, true, 'doce', true, 23),
  ('Chocolate em barra', 'Doce variado — item de demonstração.', 5.00, true, 'doce', true, 24),
  ('Bala de goma', 'Doce variado — item de demonstração.', 1.50, true, 'doce', true, 25);
