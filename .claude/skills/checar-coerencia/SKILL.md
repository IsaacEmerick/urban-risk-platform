---
name: checar-coerencia
description: Confere se requisitos, regras, diagramas, arquitetura e telas do protótipo contam a mesma história. Use antes de cada entrega parcial e antes de gerar o PDF.
---

Faça uma auditoria de coerência do trabalho, **sem editar nenhum arquivo**. Só relate.

Leia: `CLAUDE.md`, `docs/01-requisitos.md`, `docs/diagramas/*.puml` e as telas em `app/src/pages/`.

Verifique e relate em tabelas curtas:

1. **RF ↔ tela:** cada RF tem pelo menos uma tela (ou justificativa, como integração automática)? Cada tela atende a pelo menos um RF?
2. **Telas obrigatórias:** painel, lista e detalhe de alertas, central de notificações, registro comunitário, tela de origem e confiança. Total de telas ≥ 8?
3. **Origem e confiança:** aparecem em todos os cards e detalhes de alerta?
4. **RNF:** são ≥ 6, cada um com característica ISO 25010 e meta mensurável, cobrindo tempo de atualização, disponibilidade, escalabilidade, usabilidade e segurança/LGPD?
5. **Regras ↔ código:** `calcularConfianca`, `classificarRisco` e `calcularPrioridade` usam os mesmos números do documento?
6. **Diagrama de Estados ↔ protótipo:** os estados e guardas batem com RN01–RN06 e com os status exibidos nas telas?
7. **Sequência ↔ arquitetura:** todo participante do diagrama de sequência existe no diagrama de arquitetura, com o mesmo nome?
8. **Glossário:** algum nome aparece com variação (ex.: "Validando" em vez de "Em validação")?

Termine com uma lista priorizada do que corrigir, do maior para o menor impacto na nota.
