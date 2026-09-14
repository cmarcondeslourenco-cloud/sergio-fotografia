# FOTOGRAFIA_AMIGO

Plataforma Next.js para portfólio fotográfico, administração de galerias e entrega privada de imagens. A interface segue um princípio simples: a fotografia é protagonista e a experiência deve permanecer elegante, rápida e acessível.

## O que está implementado

- Home editorial responsiva com categorias e chamadas para ação.
- Portfólio filtrável com imagens conceituais identificadas como demonstração.
- Páginas de Casamentos, Ensaios, Eventos, Astrofotografia, Sobre e Contato.
- Lightbox acessível com navegação por teclado, foco controlado e retorno ao elemento de origem.
- Formulário de contato com validação Zod, honeypot e limite básico de envios.
- Autenticação administrativa Supabase protegida por middleware.
- Dashboard com contagens reais e acesso às galerias recentes.
- Criação de galerias, upload validado, processamento Sharp e escolha de capa.
- Link privado de cliente, seleção de fotos e downloads autorizados.
- SEO base, sitemap, robots, Open Graph, PWA manifest, 404 e página de erro.
- RLS inicial em 0001_initial_schema.sql e políticas administrativas complementares em 0002_admin_policies.sql.

## Desenvolvimento local

Requisitos: Node.js 20 ou superior e as variáveis descritas em .env.example.

1. Execute npm install.
2. Execute npm run dev.
3. Abra http://localhost:3000.

## Validação

Execute, em ordem:

1. npm run lint
2. npm run typecheck
3. npm test
4. npm run build

Para recriar os WebPs editoriais a partir dos PNGs preservados, execute npm run assets:optimize.

## Variáveis de ambiente

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_SITE_URL

Nunca envie .env.local para repositórios ou mensagens. A URL pública correta deve ser configurada antes da hospedagem para gerar canonical, sitemap e Open Graph coerentes.

## Privacidade e arquivos

- Originais ficam no bucket privado photos-private.
- A galeria privada é consultada no servidor com token válido e expiração.
- Tokens usados em registros de download são armazenados como hash SHA-256.
- URLs de preview assinadas expiram em uma hora.
- O original nunca é usado como imagem de listagem.
- Registros antigos de equipamento foram retirados de public/demo e preservados em projetos/arquivo-demo-antigo.
- PNGs gerados para a direção visual foram preservados em projetos/fontes-editoriais-geradas; somente WebPs otimizados ficam públicos.

## Implantação pendente

1. Revisar e aplicar supabase/migrations/0002_admin_policies.sql no projeto Supabase correto.
2. Confirmar NEXT_PUBLIC_SITE_URL com o domínio final.
3. Validar upload, processamento e download com uma galeria de homologação, sem expor tokens ou conteúdo dos ZIPs.
4. Planejar a atualização principal do Next.js 14 para 16. A auditoria atual do npm exige essa mudança incompatível para eliminar os avisos restantes; o Image Optimizer foi desativado como mitigação temporária.

Não execute npm audit fix --force sem uma atualização controlada, pois isso troca a versão principal do framework.
