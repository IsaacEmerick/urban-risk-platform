# Memória da revisão — Urban Risk Intelligence Platform

> Arquivo do **revisor** (Claude no claude.ai). Serve para retomar o trabalho numa conversa nova.
> **Claude Code: não edite este arquivo.** Ele não faz parte da entrega e não entra no PDF.
> Última atualização: 19/11/2026, 00h50.

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

## Estado atual (18/11, noite)

- **Documentação fechada:** `00-problema-personas.md`, `01-requisitos.md` (18 RF, 11 RNF pela ISO 25010:2011, RN01–RN07 e o bloco
  "Interpretações adotadas"), `02-arquitetura.md`. Diagramas: `estados.puml/png`, `sequencia.puml/png`, `arquitetura.drawio/png`
  (draw.io, com cores por grupo: processamento de eventos, notificação, proteção de dados).
- **App** (`app/`): React + Vite + React Router + Leaflet + Vitest, ~186 testes. Regras em `src/services/` (números em `parametros.js`),
  dados simulados (Parque Viana, Jardim Maria Helena, rio Cotia, 20 eventos históricos), simulador do rio (15 s; `?demo=1` → 2 s),
  14 rotas, 3 perfis (Ana moradora, Carlos agente, Juliana operadora). Dados em memória: recarregar reinicia.
- **Sessão 4 (fluxo 1) pronta:** `tokens.css` (fonte Atkinson Hyperlegible Next; selo de confiança em barrinhas), Painel, Central de
  notificações, Detalhe do alerta, Origem e confiança. Capturas em `docs/prints/`.
- **Correções da revisão visual da Sessão 4 feitas** (commit `dee5554`, 188 testes): notificações com risco/confiança/origem do
  envio, "Risco Alto (cancelado)" em cinza, círculo de 100 m com o ícone de risco no centro (RNF07), plural, aba "Fila".
  As capturas antigas de `docs/prints/` ficaram desatualizadas: refazer junto com as da Sessão 5.
- **Sessão 5 (fluxo 2) pronta** (commits `fc5cf4c` e `c8aacdb`, 209 testes): Lista de alertas, Registro comunitário em 3 passos
  (5 toques no mínimo), confirmação de envio, Meus registros, "Também vejo isso". Demonstração: Ana confirma o evt-02 (65 → 75) →
  Confirmado → Alerta emitido. 13 capturas em `docs/prints/`.
- **Correções da Sessão 5 feitas** (`18b0892`) e notificação **"Alerta confirmado"** (`18060e5`): quando a marca "não confirmado"
  cai (agente ou confiança 75), quem recebeu o preliminar ganha um aviso novo; o antigo não muda.
- **Sessão 6a pronta** (`afb19fe` + `5455928`, 276 testes): Fila de validação (evt-02 58,8 → evt-10 45,0 → evt-09 45,0 → evt-11 13,8),
  Publicar status (abas Novo status / Meus status; serviço fixo "Energia elétrica" do perfil), Análises (seletor 7/30 dias, metas do
  RNF11 ao vivo, preliminares à parte, barras SVG com tabela sr-only). `receberDado`: leitura nova da mesma fonte vai para o evento
  ativo que já tem essa fonte. `reavaliarPorTempo()` a cada tique (RN03 2 h, RN05 30 min).
- **Ajustes da revisão da 6a feitos** (`9c58ed0`, 280 testes): metas do RNF11 sempre nos últimos 30 dias (seletor só nos gráficos),
  hist-05 em 7 d + 3 h, fonteId por status no hist-04/hist-15, "Confirmado pela Defesa Civil" / "Confirmado: a confiança chegou a
  Alta" na notificação. Capturas analises, painel, lista-alertas e central-notificacoes refeitas e revisadas.
  Metas no fluxo do vídeo: 9,1/95,5 → 8,7/95,7 → 8,3/91,7 → (descarta evt-11) igual → (rio) 8,0/92,0. Teste em `analises.test.js`.
- **Em andamento:** Sessão 6b (ver "Próximo passo").

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
- **RNF08:** a posição pública dos eventos só com registros da Comunidade é um **círculo de 100 m** (opacidade 60%), com o ícone de
  risco no centro, sem disco, para não parecer pino e para cumprir o RNF07.
- **Bônus V** (+10) aplicado uma vez; inclui área suscetível a inundação na carta do SGB.
- **Perfil:** Privacidade e meus dados vale para todos (todos são titulares na LGPD); Meus registros só para o morador.
- **Painel do morador mostra eventos Reportado e Em validação** com o selo de confiança: transparência; alerta público só pela RN01.
- **Notificações** são registro do passado: mostram risco, confiança e origem do momento do envio.
- **evt-02 é de uma vizinha** (`p-2b9e`) e o **evt-04 é da Ana** (`p-7f3a`): a Ana não pode confirmar o próprio registro (RF17:
  uma confirmação por pessoa; quem tem registro no evento não confirma).
- **Altura da água** (só Alagamento): abaixo do meio-fio ≈ 5 cm (Baixo), meio-fio ≈ 15 cm (Alto), canela ≈ 35 cm (Crítico),
  acima do joelho ≈ 50 cm (Crítico). Descrição opcional com sugestões; título gerado (tipo + altura + bairro).
- **Posição atual simulada** da Ana: rua Jatobá, Parque Viana, a mais de 300 m do evt-02. **No vídeo: registrar ANTES de
  confirmar o evt-02**, para o registro não ser agrupado a ele.
- Proposta da revisão da Sessão 5: risco de evento não confirmado (Reportado, Em validação) exibido como **"relatado"**
  (selo vazado, sem preenchimento), para não alarmar com um único relato.

- **Desempate da prioridade** (seção 4.3): Fila = há mais tempo Em validação (justiça na fila); Lista/Painel = atualizado mais recente.
- **evt-09** = Ilha de calor de Sensor com falha (90 − 30 = 60). Não pode ser Base pública "desatualizada": com 85 teria alertado na
  hora (RN01). O simulador manda leituras de 38,5–39,5 °C com `falhaSensor: true` para não cair para 40.
- **evt-10** (Comunidade, 60, Alto) a ~670 m do sensor do rio (sem +15). **evt-11** (Baixo, 55) existe para o Carlos demonstrar Descartar.
- **No vídeo:** a Ana confirma o evt-02; o Carlos confirma o **evt-10** e descarta o **evt-11**; **não cancelar alerta** (falso alerta
  de 30 dias passa de 10%). Descartar da Fila não conta como falso alerta (nunca alertou): bom ponto para a narração.
  Abrir o app recém-carregado antes de gravar (a RN03 descarta o evt-04 ~1h40 depois de abrir).
- **hist-09** (falta de água) é boletim de concessionária de água importado pelo RF02, não status da Juliana: fica.
- **Metas do RNF11 sempre nos últimos 30 dias** (com 7 dias há só 8 alertas e cada um vale 12,5 p.p.); o seletor vale só para
  os gráficos. A notificação "Alerta confirmado" diz quem confirmou.

- **6b (plano aprovado em 19/11):** cadastro só de morador (contas de agente/operador criadas pelo órgão); Carlos e Juliana com
  base legal "execução de políticas públicas" (art. 7º, III; Juliana via convênio da concessionária), sem consentimento de cadastro;
  sem "Excluir conta" para eles, e sim "Solicitar exclusão ao órgão" (registrado no histórico); "Autorizar" para conceder de novo o
  consentimento opcional; sem esse consentimento ativo, nenhuma notificação, nem "Alerta cancelado"/"Alerta confirmado";
  sequência com `buscarUsuarios(..., consentimento ativo)`.

## Perguntas prováveis da banca (preparar o Isaac)

- Como a confiança é calculada? (mostrar a tela Origem e confiança e o teste 40 + 20 + 5 = 65)
- E se a confiança for exatamente 75? E 74? (testes de fronteira em `confianca.test.js` e `estados.test.js`)
- Mostrar registros não confirmados no Painel não espalha boato? (selo de confiança + RN01)
- Por que o RNF05 é Capacidade, e não Escalabilidade? (ISO 25010:2011)
- O indicador de falso alerta não está maquiado? (`confiancaAlertada` + preliminares separados; confirmação do agente com
  confiança Média puxa a 2ª meta para baixo)
- Por que o alagamento do evt-01, na margem do rio, não tem bônus V da carta do SGB? (achado aberto, pendência 5)
- Onde ficam notificação, processamento de eventos e proteção de dados? (cores no `arquitetura.png`)
- Como a LGPD aparece no protótipo? (posição aproximada, pseudônimo, Privacidade e meus dados, cofre separado)
- Os dados são reais? (não: simulados, com geografia real; dito no README)

## Pendências

1. **Sessão 6b:** Login (com consentimento LGPD), Preferências, Privacidade e meus dados, Perfil.
3. Deploy na Vercel; README com nome completo, RM e links (o Isaac preenche).
4. Prettier (adiado) e alinhamento de tabelas Markdown (aviso MD060).
5. Revisão final de coerência (juntar os achados pequenos das auditorias e resolver de uma vez).
6. PDF com Pandoc: capa (nome, RM, links), sequência numa página em paisagem, capturas de `docs/prints/`, linha de declaração de uso de IA.
7. Roteiro do vídeo (~2:45, gravado com `?demo=1`, sem recarregar no meio do fluxo do Carlos) → YouTube não listado → entrega no Teams.
8. Baixa prioridade: o guia do Claude Docs tem erros antigos (concessionária com base própria, RN05 "abaixo do limiar").

## Próximo passo

Prompt da Sessão 6b entregue (Login com contas de demonstração e cadastro do morador com consentimento granular, Preferências,
Privacidade e meus dados com exportação/revogação/exclusão e histórico de acesso do RNF09, Perfil). Aguardar o plano
(`plano-sessao-6b.md` na raiz, se o Isaac quiser revisão) e depois o relatório. Atenção na revisão: consentimento desmarcado por
padrão, revogar "notificações" para de notificar (RN06), sair e entrar não reinicia os dados, Ana padrão intacta para o vídeo.
Também é preciso cortar a captura `painel.png` (6.846 px) para o PDF, ou fazer uma versão só com o topo.
