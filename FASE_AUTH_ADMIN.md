# Auth administrativo

Criada a rota `/login` com `signInWithPassword` usando a chave publicável. O middleware protege `/admin/:path*` e redireciona visitantes sem sessão para `/login`.

O perfil `public.profiles` continua sendo a fonte de autorização por função. A criação de galerias e uploads deverá repetir a validação de role no servidor; login por si só não concede privilégios administrativos.
