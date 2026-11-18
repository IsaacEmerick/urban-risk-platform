# Urban Risk Intelligence Platform — Global Solution 2026.2 (Engenharia de Software, FIAP)

Trabalho acadêmico feito por um único aluno. O enunciado completo está em `docs/enunciado.pdf`.
Uso de IA é permitido **como apoio**: o aluno precisa entender e conseguir explicar tudo o que for entregue.

Guia de referência (exemplos de personas, RF, RNF, regras, telas, diagramas e roteiro de sessões): `docs/guia-desenvolvimento.md`.
Consulte-o quando precisar de detalhes, mas não copie trechos inteiros sem adaptar ao projeto.
Depois que `docs/01-requisitos.md` existir, ele passa a ser a fonte da verdade; em caso de conflito, ele vence o guia.

## Como trabalhar comigo

- Responda e escreva sempre em português do Brasil.
- Antes de mudanças grandes, proponha um plano e espere minha aprovação.
- Explique em 2–3 frases o que mudou e por quê ao fim de cada tarefa, para que eu consiga defender o trabalho.
- Prefira código simples e legível a soluções sofisticadas. Comentários curtos em português nas regras de negócio.
- Não invente requisitos, telas, estados ou números novos: se algo faltar, pergunte ou proponha e espere meu ok.
- Ao mudar um requisito, regra, estado ou tela, aponte os outros artefatos que precisam mudar junto.

## O que precisa ser entregue (e o peso na nota)

| Artefato                                                       | Pontos | Arquivo                                                        |
| -------------------------------------------------------------- | ------ | -------------------------------------------------------------- |
| Protótipo funcional, mín. 8 telas                              | 4,0    | `app/`                                                         |
| Requisitos (≥10 RF, ≥6 RNF ISO 25010, regras de priorização)   | 2,0    | `docs/01-requisitos.md`                                        |
| Diagrama de Sequência (dado → validação → risco → notificação) | 1,0    | `docs/diagramas/sequencia.puml`                                |
| Diagrama de Estados (ciclo de vida do evento)                  | 1,0    | `docs/diagramas/estados.puml`                                  |
| Arquitetura em camadas                                         | 1,0    | `docs/diagramas/arquitetura.drawio` + `docs/02-arquitetura.md` |
| Vídeo de até 3 min                                             | 1,0    | `docs/roteiro-video.md`                                        |

Telas obrigatórias: painel (mapa/visão geral), lista e detalhe de alertas, central de notificações,
registro comunitário de ocorrência, tela de origem e nível de confiança do dado.
**Origem e nível de confiança do dado devem aparecer no protótipo** — é o requisito central do tema.

## Estrutura do repositório

- `app/` — React + Vite + Leaflet (OpenStreetMap). Dados simulados, sem back-end.
  - `src/pages/` telas · `src/components/` componentes · `src/services/` regras de negócio · `src/data/` dados simulados (JSON)
- `docs/` — documentação em Markdown + `diagramas/` (sequência e estados em `.puml`; arquitetura em `.drawio`, com posições fixas)
- `entrega/` — PDF final gerado com Pandoc

Comandos: `cd app && npm install && npm run dev` (desenvolvimento) · `npm run build` (antes do deploy na Vercel).

## Recorte

Parque Viana, Barueri (SP), como **cenário ilustrativo**: ruas, sensores e eventos são simulados.
Contexto real citado no problema: temporal que alagou o Alphaville Industrial e alerta severo da
Defesa Civil para Barueri em out/2026 (links das fontes no `docs/00-problema-personas.md`).
O Parque Viana é vizinho do Jardim Maria Helena, às margens do rio Cotia (divisa Barueri–Carapicuíba).
Os alagamentos ali são **relatos de moradores**: nunca escreva como fato. Também citados, com link:
convênio de desassoreamento do rio Cotia, ponte Jardim Maria Helena–Vila Lourdes e carta de suscetibilidade
a inundações do SGB (Barueri, 2017).

### Dados simulados (`app/src/data/`) — valores sempre fictícios

- Um sensor de nível do rio Cotia perto da ponte Jardim Maria Helena–Vila Lourdes: informa o nível em metros;
  a cota de transbordamento (fictícia) fica no cadastro do sensor. No simulador, o nível sobe aos poucos
  para demonstrar o alerta antecipado.
- Eventos de alagamento no Jardim Maria Helena.
- A área de interesse da Ana cobre o Parque Viana e o Jardim Maria Helena.

## Glossário — use exatamente estes nomes em todos os artefatos

- Personas: Ana (moradora), Carlos (agente da Defesa Civil), Juliana (operadora de serviço público).
- Tipos de risco: Alagamento, Ilha de calor, Interrupção de serviço.
- Origens: Sensor, Base pública, Comunidade. Concessionária é a variante "Base pública (concessionária)".
- Níveis de risco: Baixo, Moderado, Alto, Crítico.
- Faixas de confiança: Alta (≥ 75), Média (50–74), Baixa (< 50).
- Estados do evento: Reportado, Em validação, Confirmado, Alerta emitido, Em monitoramento, Encerrado, Descartado.
  "Em validação" = aguardando o agente.
- Situações da interrupção (RF18): Interrupção identificada, Em atendimento, Normalização parcial, Normalizado.
- Tipos de notificação especiais: Alerta confirmado, Alerta cancelado.
- Diagramas PlantUML em UTF-8, com acentos (renderizados localmente com `-charset UTF-8`).
  A arquitetura fica em `docs/diagramas/arquitetura.drawio`; o PNG é exportado pelo draw.io desktop.
  Cores da arquitetura: azul = processamento de eventos, laranja = notificação, roxo = proteção de dados pessoais.
- Componentes da arquitetura: API Gateway, Serviço de Ingestão, Broker de Eventos, Serviço de Validação,
  Motor de Confiança, Motor de Classificação de Risco, Gerenciador de Eventos, Serviço de Notificação,
  Serviço de Análises, Identidade e Consentimento (LGPD).

## Regras de negócio (fonte da verdade: `docs/01-requisitos.md`)

- Confiança = base por origem (Sensor 90, Base pública 85, Base pública (concessionária) 80, Comunidade 40),
  mais os ajustes: +10 por confirmação de morador (máx. 3), +15 se corroborado por sensor/base (500 m, 30 min),
  +5 foto geolocalizada, −20 dado desatualizado, −30 sensor com falha. Limitar a 0–100.
- Desatualizado = sem atualização por mais de 2× o intervalo esperado: Sensor 5 min, Base pública 15 min,
  Base pública (concessionária) 15 min. Comunidade: não se aplica.
- Status publicado pelo operador (RF18, tela "Publicar status") entra como Base pública (concessionária), base 80.
  O formulário pede situação, início, previsão de normalização, nº estimado de afetados e
  "atinge hospital, escola ou abastecimento crítico?" (entradas do `classificarRisco()`).
  Duração = previsão − início; se a previsão já passou, vale o tempo decorrido desde o início.
  "Normalizado" leva o risco a Baixo, e a RN05 encerra o evento em 30 min.
- Cancelar alerta (agente, RF12): Alerta emitido ou Em monitoramento → Descartado, com notificação "Alerta cancelado".
  Falso alerta (RNF11) = eventos que passaram por Alerta emitido e foram para Descartado ÷ alertas emitidos; meta ≤ 10%.
  Ao emitir alerta (comum, preliminar ou escalada) o evento guarda `riscoAlertado` e `confiancaAlertada`; a 2ª meta
  do RNF11 (≥ 90% dos alertas Alto/Crítico com confiança Alta) usa `confiancaAlertada`.
- Fila de validação lista só eventos Em validação (Confirmar, Descartar). Confirmar alerta (tira a marca
  "não confirmado" do alerta preliminar), Encerrar, Cancelar alerta e Descartar evento ficam no Detalhe do alerta.
  Em monitoramento: se o evento já passou por Alerta emitido o botão é "Cancelar alerta" (com notificação
  "Alerta cancelado"); se nunca alertou, é "Descartar evento" (mesmo `agenteRejeita`, sem notificação).
- Alagamento por nível do rio (falta = cota de transbordamento − nível; parâmetros fictícios, não cotas oficiais):
  Moderado falta ≤ 1,0 m; Alto falta ≤ 0,5 m; Crítico transbordou (falta < 0). Vale o maior entre nível do rio,
  lâmina d'água em via e chuva.
- Áreas de interesse (RF13): por bairro ou por ponto no mapa com raio (ex.: 1 km). Cada bairro tem centro e
  raio aproximados (`app/src/data/bairros.json`, a partir do OpenStreetMap), então bairro e ponto viram círculos.
- Faixas de risco usam ≥ e < (sem lacunas); se dois critérios se aplicam, vale o nível mais alto.
- Prioridade P = R × 25 × (C/100) + V, com R = 1..4 (Baixo..Crítico), C = confiança, V = +10 área vulnerável
  (hospital, escola, comunidade vulnerável ou área suscetível a inundação na carta do SGB, Barueri 2017; aplicado uma vez só).
- RN01 alerta automático só com risco ≥ Alto e confiança ≥ 75. Depois de confirmado (por confiança ou pelo agente),
  o evento emite novos alertas por escalada de risco sem nova checagem de confiança.
- RN02 confiança 50–74 → Em validação (fila do agente); se Crítico, alerta preliminar "não confirmado",
  que perde a marca quando o agente confirma ou quando a confiança chega a 75 (transições internas em
  Em monitoramento, ambas com atualizarAlerta; `confiancaAlertada` não muda). A notificação é do
  tipo Alerta com a marca `naoConfirmado` (etiqueta "não confirmado" no card), não um tipo próprio.
  Quando a marca cai, quem recebeu o preliminar ganha uma notificação nova "Alerta confirmado"
  ("O alerta X foi confirmado"), com risco e confiança do momento; a notificação antiga não muda.
- RN03 confiança < 50 → fica Reportado; descartado sem confirmação em 2 h. Se a confiança subir, valem RN01/RN02.
- RN04 mesmo tipo a ≤ 300 m e ≤ 60 min → mesmo evento.
- RN05 encerra com risco Baixo por 30 min ou por ação do agente.
- RN06 notifica só quem tem área de interesse no raio afetado (Alagamento 500 m, Ilha de calor 1 km,
  Interrupção = área informada pelo operador); alcança se distância(centro da área, evento) ≤ raio da área + raio
  afetado; sem renotificar em < 15 min, salvo escalada.
- RN07 risco e confiança do evento = maior valor entre os dados agrupados.
- Interpretações (escritas no 01-requisitos.md): corroboração exige mesmo tipo e outra fonte; leitura nova da
  mesma fonte substitui a anterior no evento; escalada = risco sobe e chega a ≥ Alto. Prioridade com 1 casa decimal.
- RNF08: no mapa público, a localização de registros da Comunidade passa por `localizacaoPublica()` (~100 m).

As funções `calcularConfianca()`, `classificarRisco()` e `calcularPrioridade()` em `app/src/services/`
devem implementar exatamente essas regras. Se uma regra mudar, mude o documento e o código juntos.

## Padrões do protótipo

- Telas e componentes usam **apenas os tokens** de `app/src/styles/tokens.css` (cores, tipografia, espaçamentos,
  raios, sombras): nenhuma cor, tamanho ou sombra solta fora desse arquivo.
- Risco sempre com cor + ícone + texto (acessibilidade, WCAG AA). Baixo verde, Moderado amarelo, Alto laranja, Crítico vermelho.
- Risco relatado (RF06, RF07): em eventos Reportado e Em validação, o selo e a tarja de risco são vazados (só
  contorno, mesma cor e ícone) com o texto "Risco Crítico (relatado)"; no mapa, marcador vazado e tracejado.
  Selo e tarja cheios só para eventos confirmados ou alertados. Regra em `riscoRelatado()`.
- Todo card e detalhe mostra: selo de origem, selo de confiança ("Alta • 82") e "atualizado há X s".
  Evento Encerrado ou Descartado não mostra "atualizado há X" em lugar nenhum: só a data em que terminou.
- Navegação inferior por perfil:
  - Morador: Painel, Alertas, Registrar, Notificações, Perfil.
  - Agente: Painel, Fila, Alertas, Análises, Perfil. ("Fila" é o rótulo curto da aba; a tela se chama Fila de validação.)
  - Operador: Painel, Publicar status, Alertas, Análises, Perfil.
- Perfil (RF15), para todos: dados do usuário, Preferências, Privacidade e meus dados (todos são titulares na LGPD)
  e sair. O morador também tem Meus registros.
- Dados realistas (bairros, horários, mm/h, °C). Nada de lorem ipsum.

## Antes de dizer que uma tarefa terminou

- Rode `npm run build` sem erros.
- Para telas: abra no navegador e confira o fluxo de ponta a ponta.
- Para diagramas: confirme que participantes e estados batem com o glossário.
- Ao fim de cada sessão de telas, rode a skill verify e o /checar-coerencia.
