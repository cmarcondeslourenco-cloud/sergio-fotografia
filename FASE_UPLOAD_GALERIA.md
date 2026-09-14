# Upload privado de galeria

Criada a rota `/admin/galerias/[slug]` e o componente de upload. O fluxo usa o bucket privado `photos-private`, grava o original em caminho privado e cria o registro correspondente em `public.photos` com status `pending`.

O processamento Sharp das variantes e as URLs assinadas serão conectados em seguida. O original não é exposto pelo navegador nem por URL pública.
