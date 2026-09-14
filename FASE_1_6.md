# FASE 1.6 — Pipeline de imagens

Preparado o contrato de processamento com Sharp. O fluxo recebe o original, gira conforme EXIF, não amplia imagens pequenas e gera WebP nas variantes thumbnail (400 px/75), preview (1200 px/82), web (2000 px/88) e watermark (2000 px/88 com overlay opcional).

O módulo de validação aceita JPEG, PNG e WEBP, com limite de 150 MB por arquivo. RAW continua reservado para conversão explícita futura. O original não é sobrescrito, não é retornado pelo pipeline e não deve ser servido publicamente.

Ainda não há worker assíncrono, fila, upload real ou bucket remoto. Esses componentes dependem da configuração Supabase/Storage e serão implementados após a validação do contrato local.
