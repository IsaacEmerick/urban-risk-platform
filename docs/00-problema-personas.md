# Problema, público-alvo e personas

**Urban Risk Intelligence Platform** · Recorte: bairro **Parque Viana, Barueri (SP)**

## 1. Problema

Barueri convive com riscos urbanos cotidianos. Um temporal alagou o Alphaville Industrial
([fonte](https://istoe.com.br/temporal-causa-alagamentos-e-deixa-pessoas-ilhadas-na-grande-sao-paulo)),
e em outubro de 2026 a Defesa Civil emitiu alerta severo para o município
([fonte](https://sbtnews.sbt.com.br/noticia/brasil/defesa-civil-emite-alerta-severo-de-chuva-para-grande-sp)).

Neste trabalho, o **Parque Viana**, bairro de Barueri, é usado como **cenário ilustrativo**: ruas,
sensores, eventos e números do protótipo são simulados.

O Parque Viana é vizinho do **Jardim Maria Helena**, às margens do **rio Cotia**, na divisa entre
Barueri e Carapicuíba. Moradores relatam alagamentos frequentes no Jardim Maria Helena, que afetam
também o entorno. O rio Cotia é objeto de um convênio de desassoreamento
([fonte](https://carapicuiba.sp.gov.br/noticia/impressao?id=2625)), e a carta de suscetibilidade a
inundações do Serviço Geológico do Brasil (SGB) para Barueri, de 2017
([fonte](https://rigeo.sgb.gov.br/bitstream/doc/19016/1/mapa_barueri_sp_suscet.pdf)), mapeia as
áreas do município suscetíveis a inundação. No protótipo, um sensor simulado mede o nível do rio
Cotia perto da ponte Jardim Maria Helena–Vila Lourdes
([fonte](https://carapicuiba.sp.gov.br/noticia/impressao?id=4734)).

Por isso, os alertas não podem se limitar ao bairro onde a pessoa mora: um alagamento no Jardim
Maria Helena atinge quem mora ou circula pelo Parque Viana. O morador define áreas de interesse por
bairro ou por um ponto no mapa com raio, por exemplo 1 km (RF13), e é notificado sempre que o raio
afetado por um evento alcança essas áreas (RN06).

Em bairros como esse, moradores e agentes públicos recebem informações sobre **alagamentos**, **calor extremo** e
**interrupções de energia, água ou transporte** de forma fragmentada e atrasada. Elas chegam por
grupos de mensagens, redes sociais e sites oficiais diferentes, sem indicar **quem informou** nem
**quão confiável** é a informação.

Esse cenário atrasa decisões simples e urgentes: sair ou não de casa, mudar a rota até o trabalho,
buscar os filhos mais cedo na escola, deslocar uma equipe da Defesa Civil ou priorizar o reparo de
uma rede elétrica. Boatos e relatos duplicados competem com dados oficiais, e quem precisa agir
não sabe em que acreditar.

**Proposta:** uma plataforma que reúne dados de **sensores**, **bases públicas** e **registros da
comunidade**, calcula o **nível de risco** e o **nível de confiança** de cada dado, prioriza os
alertas e avisa só quem está na área afetada, sempre mostrando a **origem** da informação.

## 2. Público-alvo

| Grupo                                                         | Como usa a plataforma                                                                                          |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Moradores do Parque Viana e arredores                         | Recebem alertas da sua área, consultam origem e confiança, registram ocorrências                               |
| Agentes da Defesa Civil de Barueri                            | Acompanham eventos priorizados, validam, confirmam, descartam ou encerram eventos e cancelam alertas indevidos |
| Operadores de serviços essenciais (energia, água, transporte) | Publicam o status das interrupções, acompanham os riscos da área e analisam o histórico de eventos             |

## 3. Personas

### Ana — moradora

|                                |                                                                                                                                                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Perfil**                     | 34 anos, mãe de uma criança em idade escolar, mora no Parque Viana em uma rua que alaga com chuva forte e usa transporte público para ir ao trabalho.                                                           |
| **Objetivo**                   | Saber com antecedência se a rua, o ponto de ônibus ou a escola do filho estão em risco.                                                                                                                         |
| **Dores**                      | Descobre o alagamento quando já está na rua. Recebe áudios e prints em grupos de mensagens e não sabe em qual boato confiar.                                                                                    |
| **O que a plataforma entrega** | Alerta no celular só para as suas áreas de interesse (Parque Viana e Jardim Maria Helena), com origem e nível de confiança. Registro de ocorrência em até 3 passos e acompanhamento do status do que registrou. |
| **Fluxos no protótipo**        | Fluxo 1 (recebe alerta) e Fluxo 2 (registra ocorrência).                                                                                                                                                        |

### Carlos — agente da Defesa Civil

|                                |                                                                                                                                                                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Perfil**                     | 45 anos, agente da Defesa Civil de Barueri, coordena uma equipe de campo.                                                                                                                                                                                   |
| **Objetivo**                   | Saber rapidamente onde está o risco mais grave e mais confiável, para deslocar a equipe certa.                                                                                                                                                              |
| **Dores**                      | Recebe muitos relatos duplicados ou falsos. Os dados de sensores e os relatos de moradores ficam em lugares diferentes, e cruzá-los leva tempo.                                                                                                             |
| **O que a plataforma entrega** | Fila de validação ordenada por prioridade (risco × confiança), com a origem de cada dado. Confirma ou descarta eventos na fila com um toque; no detalhe do alerta, confirma um alerta preliminar, encerra o evento ou cancela um alerta emitido por engano. |
| **Fluxos no protótipo**        | Fluxo 3 (valida evento).                                                                                                                                                                                                                                    |

### Juliana — operadora de serviço público

|                                |                                                                                                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Perfil**                     | 29 anos, trabalha no centro de operações da concessionária de energia que atende a região.                                                                                                |
| **Objetivo**                   | Ver as interrupções de serviço junto com os outros riscos da área (por exemplo, alagamento que impede o acesso da equipe).                                                                |
| **Dores**                      | Fica sabendo tarde das interrupções relatadas pela população e não consegue cruzá-las com alagamentos ou calor extremo.                                                                   |
| **O que a plataforma entrega** | Publicação do status de cada interrupção (serviço, área, situação e previsão de normalização), painel com interrupções e riscos da área e análises históricas por tipo, região e período. |
| **Fluxos no protótipo**        | Publicar status, Painel e Análises.                                                                                                                                                       |

## 4. Indicadores de sucesso

O enunciado define três indicadores. Cada um está ligado a um requisito do documento
[01-requisitos.md](01-requisitos.md):

| Indicador                      | Como a plataforma mede                                                                                     | Requisito |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- | --------- |
| Tempo de atualização dos dados | Tempo entre a leitura do sensor e a exibição no painel; carimbo "atualizado há X s" em cada card           | RNF01     |
| Qualidade dos alertas          | Falsos alertas ≤ 10%; ≥ 90% dos alertas Alto/Crítico com confiança Alta (apoiado pelas regras RN01 e RN02) | RNF11     |
| Facilidade de uso              | Registro de ocorrência em até 3 passos e 60 s; nota SUS ≥ 75                                               | RNF06     |
