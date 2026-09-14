# Preparação para entrega do site

## O que já está pronto localmente

- Next.js 14 com build de produção aprovado.
- Login administrativo com Supabase Auth.
- Painel Admin protegido.
- Criação de galerias privadas.
- Upload de originais no bucket privado `photos-private`.
- Processamento de variantes com Sharp.
- Primeira foto definida automaticamente como capa quando a galeria ainda não possui capa.
- Token privado para acesso do cliente.
- Downloads individuais e em lote usando os arquivos originais.
- Controle de `download_enabled` e `download_resolution`.

## Informações para solicitar à hospedagem

- Hospedagem para aplicação Next.js com Node.js em produção.
- Suporte a rotas server-side/API.
- Variáveis de ambiente secretas.
- HTTPS e domínio personalizado.
- Build e start com `npm run build` e `npm start`.
- Memória suficiente para o Sharp processar imagens.
- Conexão de saída HTTPS para o projeto Supabase.

## Variáveis de produção

Configurar na hospedagem, sem publicar no repositório:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://dominio-do-site
```

## Teste final após publicar

1. Abrir o domínio com HTTPS.
2. Entrar no `/login`.
3. Acessar `/admin`.
4. Criar uma galeria privada.
5. Enviar fotos originais.
6. Confirmar a capa.
7. Processar as variantes.
8. Gerar o token.
9. Abrir `/c/{token}` em janela anônima.
10. Testar foto individual, selecionadas e galeria inteira.
11. Confirmar registros em `public.downloads`.
12. Desativar downloads e confirmar o bloqueio.

## Pendências que dependem apenas da hospedagem

- domínio público;
- HTTPS;
- variáveis de ambiente de produção;
- teste real fora do localhost;
- confirmação de conexão estável entre servidor e Supabase.

Não colocar a `SUPABASE_SERVICE_ROLE_KEY` em código, navegador, ZIP público ou mensagem para o presenteado.
