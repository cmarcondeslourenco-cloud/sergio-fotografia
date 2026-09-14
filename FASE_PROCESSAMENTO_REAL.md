# Processamento real de galeria

Criado o endpoint protegido `/api/process-gallery`. Ele exige sessão, valida `admin/editor`, baixa originais pelo Storage privado, gera quatro variantes com Sharp, envia os WebP derivados e atualiza `public.photos` com os caminhos e status `done`.

O endpoint processa somente registros `pending` e nunca altera o original. Para lotes muito grandes, deverá ser migrado posteriormente para uma fila assíncrona.
