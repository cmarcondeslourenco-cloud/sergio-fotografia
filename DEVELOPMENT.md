# Desenvolvimento

## Requisitos

- Node.js 20 ou superior.
- Projeto Supabase configurado somente quando for validar integrações reais.
- Variáveis locais em `.env.local`, sem incluir chaves em commits ou mensagens.

## Início rápido

1. Instale as dependências com `npm install`.
2. Copie os nomes das variáveis documentados no `README.md` para `.env.local` e preencha-os apenas no ambiente local.
3. Inicie com `npm run dev`.
4. Acesse `http://localhost:3000`.

## Rotina de qualidade

Antes de propor uma versão, execute:

1. `npm run lint`
2. `npm run typecheck`
3. `npm test`
4. `npm run build`

Se uma validação depender de Supabase, Storage, autenticação ou dados reais, registre claramente que ela foi executada contra um ambiente de homologação. Um build local não comprova esses fluxos externos.

## Proteção de conteúdo

- Não versione `.env`, `.env.local`, fotos originais, arquivos de clientes ou backups compactados.
- Use o bucket privado `photos-private` para originais.
- Preserve os controles de token e permissões no endpoint de download; não mova originais para `public/`.

