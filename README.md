# PADS — Pedido Antecipado de Lanche na Cantina

O PADS é um projeto acadêmico, sem finalidade comercial, sobre o pedido antecipado de lanches na cantina. A demonstração usa dados fictícios, conforme o [Documento de Requisitos de Software](https://cantinif-team-alt-f4.atlassian.net/wiki/spaces/PADS/pages/458753).

## Referências do projeto

- [Repositório GitHub](https://github.com/elvigerolim-star/pads-cantinif)
- [Código de origem no Lovable](https://lovable.dev/projects/226a5eab-f77d-49f3-a301-20af42567d06)
- [Protótipo no Figma](https://www.figma.com/design/8HzYSc7sKht2RkiajODm5U)
- [Documentação no espaço PADS do Confluence](https://cantinif-team-alt-f4.atlassian.net/wiki/spaces/PADS/overview)
- [Backlog do Jira SCRUM filtrado pelo rótulo PADS](https://cantinif-team-alt-f4.atlassian.net/issues/?jql=project%20%3D%20SCRUM%20AND%20labels%20%3D%20PADS)

## Estado do código

O aplicativo foi desenvolvido no Lovable e usa React 19, TypeScript, TanStack Start, Vite, Tailwind CSS, Supabase e Drizzle. As rotas e componentes ficam em `src/`, a integração Supabase em `src/integrations/supabase/` e o esquema e as migrações em `drizzle/`.

## Desenvolvimento local

Use Node.js 22.12 ou superior, conforme o requisito do TanStack Start, e o Bun para instalar pelo lockfile existente. Execute na raiz do projeto.

```sh
bun install --frozen-lockfile
bun run dev
```

```sh
bun run lint
bun run test
bun run build
bun run tsc --noEmit
```

O último comando executa o TypeScript diretamente, pois o manifesto de origem não define um script de checagem de tipos.

## Conexão com o Supabase

1. Confirme qual projeto Supabase atende o ambiente de desenvolvimento e verifique o estado do banco antes de aplicar qualquer migração. Crie o arquivo de ambiente local com as variáveis abaixo e guarde os valores fora do Git.
2. Use a URL e a chave publicável do mesmo projeto. O cliente da aplicação lê `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. O middleware de autenticação lê `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` no servidor.
3. Mantenha `SUPABASE_SERVICE_ROLE_KEY` exclusiva do servidor. A configuração Drizzle usa `LOVABLE_DB_MIGRATION_URL` para a conexão PostgreSQL de migração. Guarde ambos os valores fora do Git e do bundle do navegador.
4. Compare as migrações de `drizzle/migrations/` com o esquema já aplicado. Valide as migrações e as permissões em um banco de desenvolvimento, conforme a documentação do PADS e as instruções de `AGENTS.md` da origem.
5. Configure as URLs de redirecionamento do Auth para o ambiente de desenvolvimento. Com dados fictícios, verifique login, recuperação de senha e as permissões de acesso de aluno e atendente.

Referências do Supabase para [chaves de API](https://supabase.com/docs/guides/getting-started/api-keys), [conexão PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres) e [URLs de redirecionamento](https://supabase.com/docs/guides/auth/redirect-urls).
