# Motor Manager

Sistema de gestao de motores eletricos em Next.js 16, agora preparado para rodar com Postgres em producao.

## Requisitos

- Node.js 20+
- Um banco Postgres acessivel por `DATABASE_URL`
- Opcional, mas recomendado na Vercel: `BLOB_READ_WRITE_TOKEN` para armazenar orcamentos enviados

## Variaveis de ambiente

Crie um arquivo `.env.local` com base em `.env.example`.

```bash
DATABASE_URL="postgres://usuario:senha@host:5432/database?sslmode=require"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

## Desenvolvimento local

```bash
npm install
npm run dev
```

Se `BLOB_READ_WRITE_TOKEN` nao estiver configurado, os arquivos de orcamento continuam sendo gravados localmente em `public/uploads/orcamentos`.

## Migrando os dados do SQLite atual

O projeto inclui uma rotina para importar os dados existentes de `motors.db` para o novo Postgres.

```bash
npm run db:import
```

Depois, valide a conexao e a tabela:

```bash
npm run db:verify
```

## Validacoes

```bash
npm run lint
npm run build
```

## Deploy na Vercel hoje

1. Suba o repositorio atualizado para o GitHub.
2. Na Vercel, crie/importe o projeto.
3. Adicione um banco Postgres pelo Marketplace da Vercel, normalmente via Neon, ou use um Postgres externo.
4. Configure `DATABASE_URL` nas variaveis de ambiente do projeto.
5. Se quiser manter upload de orcamentos em producao, configure `BLOB_READ_WRITE_TOKEN`.
6. Rode `npm run db:import` apontando para o banco novo para levar os dados atuais.
7. Rode `npm run db:verify`.
8. Faça o deploy.

## Observacoes

- O app nao depende mais do `motors.db` em producao.
- O campo de upload de orcamentos fica pronto para Vercel Blob em producao e continua funcionando localmente sem Blob.
- As paginas que leem o banco foram marcadas como dinamicas para evitar problemas de build com dados em tempo de execucao.
