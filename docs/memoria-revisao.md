# Memória da revisão — Urban Risk Intelligence Platform

> Arquivo do **revisor** (Claude no claude.ai). Serve para retomar o trabalho numa conversa nova.
> **Claude Code: não edite este arquivo.** Ele não faz parte da entrega e não entra no PDF.
> Última atualização: 18/11/2026, 10h45.

## Como retomar numa conversa nova

1. Pedir acesso à pasta `D:\www\urban-risk-platform` (device_request_folder_access).
2. Ler, nesta ordem: este arquivo → `CLAUDE.md` → `docs/01-requisitos.md` (fonte da verdade) → `git log --oneline -15`.
3. Seguir do item **"Próximo passo"** no fim deste arquivo.
4. Ao terminar uma etapa importante, atualizar este arquivo (seções "Estado atual", "Decisões" e "Próximo passo").

## O projeto

- Global Solution 2026.2, Engenharia de Software (FIAP). Aluno: **Isaac**, fazendo **sozinho**. Respostas sempre em português do Brasil.
- Enunciado: `docs/enunciado.pdf`. IA é permitida **como apoio**; o aluno precisa entender e conseguir explicar tudo.
- Pesos: protótipo 4,0 · requisitos 2,0 · sequência 1,0 · estados 1,0 · arquitetura 1,0 · vídeo 1,0.
- Guia original (escrito no início): `docs/guia-desenvolvimento.md`, cópia do doc do Claude Docs
  "Guia de Desenvolvimento – Urban Risk Intelligence Platform (GS 2026.2)" (https://claude.ai/artifact/SBzxWEBiBgYyoKGg2pnVE1).
  Está desatualizado em vários pontos; **o `01-requisitos.md` sempre vence**.

## Como trabalhamos

- **Claude Code** (extensão do VS Code) constrói, testa e faz commit.
- **Revisor** (claude.ai): revisa relatórios, planos, código e capturas; escreve os prompts para o Claude Code.
  Não edita código; só altera `docs/` quando o Isaac pede.
- Ciclo: revisor escreve o prompt → Claude Code mostra o plano (`/plan`) → se o Isaac quiser revisão, ele copia o plano para
  a raiz como `plano-sessao-N.md` (o revisor lê; o Isaac apaga depois, sem commit) → Claude Code executa →
  Isaac cola o relatório aqui → revisor revisa → correções.
- Cada sessão grande no Claude Code começa numa conversa nova (`/clear`). Commit ao fim de cada pedido.
- Para poupar contexto: nas revisões visuais, ver só as capturas novas ou alteradas.
- Tom das respostas do revisor: direto, com a recomendação primeiro e um prompt pronto para colar.

## Limitações técnicas do revisor

- `.claude/` (do repositório e do usuário) é **protegida**: não leio nem escrevo. As skills do repositório ficam em
  `.claude/skills/` (`checar-coerencia` e `verify`); o Isaac ou o Claude Code mexem nelas.
- **Não posso apagar arquivos** no computador do Isaac. Peço para ele apagar.
- **Não acesso o localhost**: a revisão visual é feita pelas capturas em `docs/prints/` (o Claude Code gera a 390 px, escala 2×).
- `device_bash` é um Linux com a pasta montada em `$HOME/mnt/urban-risk-platform`. Serve para ler arquivos e o git;
  não rodar `npm test` lá (o `node_modules` é do Windows).
- Para ver imagens: `device_stage_files` e depois `Read` no caminho em `/mnt/user-data/uploads/...`.

## Ambiente do Isaac

- Windows, VS Code com a extensão do Claude Code. Java (Temurin 21) e draw.io desktop instalados (renderização local).
- Plugin `frontend-design` instalado no Claude Code (direção estética: serviço público, sóbrio, WCAG AA).
- Prettier: **adiado**. Atenção: o formatador do VS Code já transformou "+ 10" em "- 10" no CLAUDE.md uma vez; conferir sinais em regras.

## Estado atual (18/11, manhã)

- **Documentação fechada:** `00-problema-personas.md`, `01-requisitos.md` (18 RF, 11 RNF pela ISO 25010:2011, RN01–RN07 e o bloco
  "Interpretações adotadas"), `02-arquitetura.md`. Diagramas: `estados.puml/png`, `sequencia.puml/png`, `arquitetura.drawio/png`
  (draw.io, com cores por grupo: processamento de eventos, notificação, proteção de dados).
- **App** (`app/`): React + Vite + React Router + Leaflet + Vitest, ~186 testes. Regras em `src/services/` (números em `parametros.js`),
  dados simulados (Parque Viana, Jardim Maria Helena, rio Cotia, 20 eventos históricos), simulador do rio (15 s; `?demo=1` → 2 s),
  14 rotas, 3 perfis (Ana moradora, Carlos agente, Juliana operadora). Dados em memória: recarregar reinicia.
- **Sessão 4 (fluxo 1) pronta:** `tokens.css` (fonte Atkinson Hyperlegible Next; selo de confiança em barrinhas), Painel, Central de
  notificações, Detalhe do alerta, Origem e confiança. Capturas em `docs/prints/`.
- **Enviado ao Claude Code e em andamento:** correções da revisão visual da Sessão 4 e o `/plan` da Sessão 5 (ver "Próximo passo").

## Decisões que não são óbvias (e o porquê)

- **Recorte:** Parque Viana é cenário ilustrativo. Os alagamentos no Jardim Maria Helena (às margens do rio Cotia, divisa com
  Carapicuíba) entram como **relato de moradores**, porque não há fonte publicada que os confirme. As fontes reais citadas estão no
  `00-problema-personas.md` (temporal em Alphaville Industrial, alerta severo de out/2026, convênio de desassoreamento, carta do SGB).
- **Origens:** 3 (Sensor, Base pública, Comunidade), com a variante "Base pública (concessionária)", base 80.
- **Nível do rio:** falta ≤ 1,0 m = Moderado; ≤ 0,5 m = Alto; transbordou = Crítico (valores fictícios). Permite alerta **antes** do
  transbordamento; é a cena principal do vídeo.
- **"Em validação"** = aguardando o agente. A validação automática acontece antes de o evento existir.
- **Falso alerta (RNF11)** = evento que passou por Alerta emitido e foi Descartado. Há cancelamento a partir de Alerta emitido e de
  Em monitoramento. Sem alerta anterior, o botão é "Descartar evento"; com alerta, "Cancelar alerta".
- **`confiancaAlertada`:** guarda a confiança do momento do alerta. Confirmar um alerta preliminar **não** muda esse valor (indicador
  honesto). Na tela Análises, mostrar os preliminares separados (quantos houve, quantos foram confirmados).
- **Escalada:** depois de confirmado, o evento alerta de novo sem rechecar a confiança. Duas transições com guarda no diagrama:
  `[nunca alertou] / notificarUsuarios` e `[já alertou] / reenviarAlerta`.
- **Área de interesse por bairro:** centro + raio de 500 m; alcança se a distância ≤ raio da área + raio afetado.
- **RNF08:** a posição pública dos registros da Comunidade é aproximada (~100 m). Mudando de pino arredondado para **círculo de ~100 m**.
- **Bônus V** (+10) aplicado uma vez; inclui área suscetível a inundação na carta do SGB.
- **Perfil:** Privacidade e meus dados vale para todos (todos são titulares na LGPD); Meus registros só para o morador.
- **Painel do morador mostra eventos Reportado e Em validação** com o selo de confiança: transparência; alerta público só pela RN01.
- **Notificações** são registro do passado: devem mostrar risco e confiança do momento do envio (correção em andamento).

## Perguntas prováveis da banca (preparar o Isaac)

- Como a confiança é calculada? (mostrar a tela Origem e confiança e o teste 40 + 20 + 5 = 65)
- E se a confiança for exatamente 75? E 74? (testes de fronteira em `confianca.test.js` e `estados.test.js`)
- Mostrar registros não confirmados no Painel não espalha boato? (selo de confiança + RN01)
- Por que o RNF05 é Capacidade, e não Escalabilidade? (ISO 25010:2011)
- O indicador de falso alerta não está maquiado? (`confiancaAlertada` + preliminares separados)
- Onde ficam notificação, processamento de eventos e proteção de dados? (cores no `arquitetura.png`)
- Como a LGPD aparece no protótipo? (posição aproximada, pseudônimo, Privacidade e meus dados, cofre separado)
- Os dados são reais? (não: simulados, com geografia real; dito no README)

## Pendências

1. **Sessão 5:** Lista de alertas, Registro comunitário (≤ 3 passos, ≤ 60 s), confirmação de envio, Meus registros e
   "Também vejo isso" (RF17: uma confirmação por usuário por evento; quem registrou não confirma o próprio). Demonstração:
   Ana confirma o evt-02 (65 → 75) → Confirmado → Alerta emitido.
2. **Sessão 6:** Fila de validação, Publicar status (Juliana), Login, Preferências, Análises (as duas metas do RNF11), Privacidade, Perfil.
3. Deploy na Vercel; README com nome completo, RM e links (o Isaac preenche).
4. Prettier (adiado) e alinhamento de tabelas Markdown (aviso MD060).
5. Revisão final de coerência (juntar os achados pequenos das auditorias e resolver de uma vez).
6. PDF com Pandoc: capa (nome, RM, links), sequência numa página em paisagem, capturas de `docs/prints/`, linha de declaração de uso de IA.
7. Roteiro do vídeo (~2:45, gravado com `?demo=1`, sem recarregar no meio do fluxo do Carlos) → YouTube não listado → entrega no Teams.
8. Baixa prioridade: o guia do Claude Docs tem erros antigos (concessionária com base própria, RN05 "abaixo do limiar").

## Próximo passo

Aguardar o relatório do Claude Code com: (a) as correções da revisão visual da Sessão 4 (notificações com risco e confiança do envio,
círculo de ~100 m, plural correto, aba "Fila", posição do carimbo no card) e (b) o plano ou o resultado da Sessão 5, com as capturas
novas em `docs/prints/` (lista-alertas, registro-passo-1 a 3, registro-enviado, meus-registros, detalhe-tambem-vejo).
Revisar o relatório e as capturas novas e, depois, escrever o prompt da Sessão 6.
