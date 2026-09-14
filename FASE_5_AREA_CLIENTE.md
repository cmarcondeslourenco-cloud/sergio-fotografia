# Área do cliente — preparação

Criada a primeira estrutura visual de galeria privada em `/c/[token]`. A área separa entrega ao cliente do portfólio público, permite seleção de fotos e prepara ações de baixar selecionadas ou a galeria completa.

## Qualidade e segurança

O download de alta resolução deverá usar o arquivo original privado ou uma variante full, entregue por URL assinada gerada no servidor. A opção web deverá usar `path_web`. Nenhum download deve expor URL permanente, permitir acesso sem token válido ou recomprimir a imagem no navegador.

O endpoint `/api/client-download` existe como contrato, mas retorna `501` até Supabase, validação de token, checagem de permissões e geração de URL assinada estarem implementados. A simulação local usa WebP derivados apenas para visualização.
