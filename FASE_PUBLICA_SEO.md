# Rotas públicas e SEO — preparação

Foram preparadas as rotas públicas `/sobre`, `/contato`, `/politica-de-privacidade` e `/termos-de-uso`, além de `/admin` e `/c/[token]` como placeholders protegidos por futura autenticação. Também foram criados `robots.ts`, `sitemap.ts` e `manifest.ts`.

O sitemap ainda usa a URL local `http://localhost:3001`; deve ser alterado para o domínio real antes do deploy. Textos legais são modelos iniciais e precisam de revisão com dados reais.
