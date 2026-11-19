# Roteiro do vídeo (até 3 min)

Meta: **2:40 a 2:45**. Problema → solução → fluxo principal do protótipo, com as seis telas obrigatórias:
Painel, Lista de alertas, Detalhe do alerta, Central de notificações, Registro comunitário e Origem e confiança.
O cenário (Parque Viana e Jardim Maria Helena, Barueri) e todos os dados são simulados.

## Tempos do simulador com `?demo=1` (medidos no navegador)

O relógio começa **ao abrir a página** (já na tela de Login), não no login. O sensor do rio Cotia manda uma
leitura a cada 2 s e o nível sobe ~5 cm por leitura.

| Tempo depois de abrir | O que acontece                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------- |
| 0 s                   | Rio em **Moderado** (3,30 m; faltam 0,90 m para a cota de transbordamento fictícia de 4,20 m) |
| ~16 s                 | Rio em **Alto** e alerta para a Ana: aba "Notificações, 3 não lidas" (16–18 s)                |
| 16–36 s               | No Detalhe, "faltam 0,4x m" vai caindo 5 cm a cada 2 s                                        |
| ~36–38 s              | Rio transborda: **Crítico** e **novo alerta** para a Ana (escalada de risco)                  |
| depois                | O nível **não desce**: oscila entre 4,34 e 4,35 m (transbordou 0,15 m) até fechar a aba       |
| ~1h40                 | A RN03 descarta o evt-04 (2 h desde o registro): por isso o app tem de estar recém-aberto     |

Os dados ficam só em memória: **recarregar a página (F5) desfaz tudo** que a Ana e o Carlos fizeram.

## Preparação

1. **Link:** `https://<projeto>.vercel.app/?demo=1` (trocar pelo link da Vercel). Se a Vercel ainda não estiver
   pronta: `cd app && npm run dev` e usar `http://localhost:5173/?demo=1`.
2. **Navegador:** Microsoft Edge, janela **InPrivate** (Ctrl+Shift+N). Ela começa sem login e sem dados guardados,
   como um app recém-aberto. Todas as janelas InPrivate compartilham a sessão: **feche todas** antes de cada trecho.
3. **Tamanho de celular:** na aba nova (ainda em branco) abra o DevTools (F12) → modo dispositivo (Ctrl+Shift+M) →
   "Responsivo", **390 × 844**, zoom do dispositivo **100%** e zoom do Edge **100%** (Ctrl+0). Só então digite o link.
   Ligar o modo dispositivo depois de abrir o app pode recarregar a página.
4. **Deixar fechado:** outras abas e janelas, notificações do Windows (Configurações → Sistema → Notificações →
   **Não incomodar**), barra de favoritos (Ctrl+Shift+B) e a aba Console do DevTools.
5. **Gravar:** Ferramenta de Captura (**Win+Shift+R**) → selecione só o retângulo da tela do celular → ligue o
   **microfone** no botão de áudio → Iniciar. Parar salva um MP4 (pasta Vídeos → Gravações de Tela).
6. **Cortar e juntar:** Clipchamp (já vem no Windows 11). Importe os dois MP4, arraste para a linha do tempo,
   divida com **S** nos pontos de corte, apague os pedaços marcados como "corte" e exporte em 1080p.
7. Fale devagar: a narração tem ~2,4 palavras por segundo. Pausas curtas enquanto a tela muda são normais.

## Trecho 1: problema e solução (0:00–0:35), gravado numa janela separada

Janela InPrivate própria. O relógio deste trecho não importa: se o alerta do rio chegar no meio, siga em frente.
Abra o link, toque em **Ana** (Contas de demonstração) e só então comece a gravar. Ao terminar, **feche a janela**.

### Cena 1: Problema (0:00–0:20) · 49 palavras · ~20 s

| Tempo     | Tela   | Ação                                                                                                                                | Narração                                                                                                                                                                                                                                                                                                               | Visível na tela                                                                                                                           |
| --------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:20 | Painel | Parado no topo do Painel; aos ~0:10, arraste o mapa devagar até o rio Cotia (a faixa azul do rio, à direita do Jardim Maria Helena) | _Em Barueri, um temporal alagou o Alphaville Industrial, e em outubro de 2026 a Defesa Civil emitiu alerta severo para a cidade. No Jardim Maria Helena, na beira do rio Cotia, moradores relatam alagamentos. O problema: sensores, avisos oficiais e relatos ficam espalhados. Aqui, cenário e dados são simulados._ | "Painel · Parque Viana e Jardim Maria Helena, Barueri"; mapa com o rio Cotia e a região do Jardim Maria Helena; faixa "Modo demonstração" |

Fontes (para a descrição do vídeo, não para ler): temporal no Alphaville Industrial (IstoÉ) e alerta severo da
Defesa Civil em out/2026 (SBT News), links em `docs/00-problema-personas.md`. Os alagamentos do Jardim Maria Helena
são **relato de moradores**: não falar como fato.

### Cena 2: Solução (0:20–0:35) · 38 palavras · ~15 s

| Tempo     | Tela                                           | Ação                                                                                                                                                                                          | Narração                                                                                                                                                                                                            | Visível na tela                                                                                                                               |
| --------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:20–0:35 | Painel, lista "Eventos ativos, por prioridade" | Role até a lista abaixo do mapa. Passe o mouse (sem clicar) sobre os selos do card "Sensação térmica de 39 °C no Parque Viana" e depois do card "Rua alagada perto da escola do Parque Viana" | _Minha solução junta sensores, bases públicas e comunidade num lugar só. Todo card mostra a origem do dado e a confiança, de 0 a 100: esta base pública tem confiança Alta, 85; este relato de morador, Média, 65._ | Card 1: selo **Base pública**, **Alta • 85**. Card 2: **Risco Alto (relatado)** vazado, **Comunidade**, **Média • 65**, "atualizado há X min" |

## Trecho 2: fluxo principal (0:35–2:44), uma janela nova, sem recarregar

Feche todas as janelas InPrivate. Abra uma nova, prepare o modo dispositivo (passo 3), **comece a gravar**, digite o
link e Enter, e **toque em Ana em até 2 s**. Daqui até o fim, nada de F5 nem de digitar endereço: só toques no app.
O "Tempo do app" é contado desde o Enter.

### Cena 3: Ana recebe o alerta do rio antes de transbordar (0:35–1:05) · 57 palavras · ~30 s

| Tempo     | Tempo do app | Tela                    | Ação                                                                            | Narração                                                                                                                                 | Visível na tela                                                                                                                                                                             |
| --------- | ------------ | ----------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:35–0:42 | 0–8 s        | Login → Painel          | Toque em **Ana**. No Painel, aponte o marcador amarelo do rio                   | _Agora, ao vivo. Sou a Ana, moradora do Parque Viana. O sensor do rio Cotia está em risco Moderado._                                     | Painel da Ana; marcador amarelo (Moderado) do rio; aba "Notificações 2"                                                                                                                     |
| 0:42–0:53 | 8–19 s       | Central de notificações | Toque na aba **Notificações** e **espere** o card novo aparecer no topo (~16 s) | _Vou para a Central de notificações… e chegou: alerta de alagamento, risco Alto._                                                        | Primeiro "2 não lidas"; aos ~16 s, card novo "Alagamento – risco Alto · Rio Cotia subindo…" e aba "3"                                                                                       |
| 0:53–1:05 | 19–31 s      | Detalhe do alerta       | Toque no card novo                                                              | _No detalhe: faltam menos de meio metro para o rio transbordar. O aviso chega antes da água. A origem é Sensor, com confiança Alta, 90._ | **Risco Alto**, "faltam 0,4x m para a cota de transbordamento (4,20 m)" (cai 5 cm a cada 2 s; perto de 0,1x m no fim da cena), régua do rio, **Sensor**, **Alta • 90**, "atualizado há 1 s" |

> O rio transborda (Crítico) por volta de 36–38 s do app, já na cena 4. A Ana recebe um segundo alerta (escalada),
> e a aba Notificações volta a mostrar uma não lida. Não é preciso comentar.

### Cena 4: Ana registra uma ocorrência (1:05–1:22) · 40 palavras · ~17 s

Fazer o registro **antes** de confirmar o evt-02 (cena 5), como combinado.

| Tempo     | Tempo do app | Tela                                | Ação                                                                                                 | Narração                                                                                                                         | Visível na tela                                                                                                                                                                              |
| --------- | ------------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1:05–1:15 | 31–41 s      | Registro comunitário (passos 1 a 3) | Aba **Registrar** → **Alagamento** → **Continuar** (posição já marcada) → **Na canela** → **Enviar** | _Ela também registra o que vê em três passos: tipo, local já marcado e altura da água._                                          | "Passo 1 de 3", "Passo 2 de 3 · Sua posição atual já está marcada", "Passo 3 de 3 · Até onde a água chegou?"                                                                                 |
| 1:15–1:22 | 41–48 s      | Registro enviado                    | Aponte o aviso de privacidade no fim da tela                                                         | _O relato entra com confiança Baixa, 40. Pela LGPD, no mapa público a posição fica aproximada, uns 100 metros, sem o nome dela._ | "Registro enviado", **Risco Crítico (relatado)** vazado, Reportado, **Comunidade**, **Baixa • 40**, "No mapa público, a posição aparece aproximada (cerca de 100 m) e seu nome não aparece." |

### Cena 5: "Também vejo isso" e o cálculo da confiança (1:22–1:52) · 61 palavras · ~30 s

| Tempo     | Tempo do app | Tela                       | Ação                                                                                                | Narração                                                                                                                                                                                | Visível na tela                                                                                                                                 |
| --------- | ------------ | -------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1:22–1:30 | 48–56 s      | Lista de alertas → Detalhe | Aba **Alertas** (mostre a lista por 2 s) → toque em **Rua alagada perto da escola do Parque Viana** | _Na lista de alertas, este alagamento perto da escola espera validação, com confiança Média, 65._                                                                                       | "Lista de alertas · 10 eventos"; no Detalhe: **Risco Alto (relatado)**, Em validação, **Comunidade**, **Média • 65**, "2 moradores confirmaram" |
| 1:30–1:37 | 56–63 s      | Detalhe do alerta          | Toque em **Também vejo isso**                                                                       | _A Ana confirma: também vê isso. A confiança sobe para Alta, 75._                                                                                                                       | **Média • 65 → Alta • 75**; selo cheio **Risco Alto**; "Em monitoramento"; "3 moradores confirmaram"; "o alerta foi enviado"                    |
| 1:37–1:52 | 63–78 s      | Origem e confiança         | Toque em **Ver de onde vêm os dados e como a confiança é calculada**                                | _Aqui está o cálculo: 40 do relato, mais 30 de três confirmações, mais 5 da foto: 75. Pela regra RN01, risco Alto com confiança 75 já emite alerta automático. Por isso o alerta saiu._ | "Base da origem Comunidade 40 · 3 confirmações de moradores +30 · Foto geolocalizada +5 · Confiança Alta 75"; "Morador (pseudônimo …)"          |

**Corte** (apagar na edição): aba **Perfil** → **Sair** → **Carlos**.

### Cena 6: Carlos valida e confere as metas (1:52–2:22) · 62 palavras · ~30 s

| Tempo     | Tela              | Ação                                                                                                                    | Narração                                                                                                                                            | Visível na tela                                                                                                                 |
| --------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1:52–2:02 | Fila de validação | Aba **Fila** → no card **Água na altura do meio-fio em rua do Jardim Maria Helena**: **Confirmar** → **Sim, confirmar** | _Agora sou o Carlos, da Defesa Civil. Na Fila de validação, confirmo este alagamento no Jardim Maria Helena, e o alerta é emitido._                 | "3 eventos aguardando"; card com "Média • 60 · Prioridade 45,0"; depois "Evento confirmado… Alerta emitido (risco Alto)"        |
| 2:02–2:10 | Fila de validação | No card **Alagamento abaixo do meio-fio – Parque Viana**: **Descartar** → **Sim, descartar**                            | _Este outro eu descarto. Como nunca virou alerta, não conta como falso alerta._                                                                     | "Evento descartado… Ninguém foi notificado."; "1 evento aguardando"                                                             |
| 2:10–2:22 | Análises          | Aba **Análises** (sem rolar)                                                                                            | _Em Análises, a qualidade dos alertas nos últimos 30 dias: 8% de falso alerta e 92% dos alertas com confiança Alta. As duas metas estão cumpridas._ | **Falso alerta 8,0%** (2 de 25) "Dentro da meta"; **Alertas Alto/Crítico com confiança Alta 92,0%** (23 de 25) "Dentro da meta" |

**Corte**: aba **Perfil** → **Sair** → **Juliana**.

### Cena 7: Juliana publica o status de uma interrupção (2:22–2:34) · 28 palavras · ~12 s

| Tempo     | Tela            | Ação                                                                                                                                                                                                            | Narração                                                                                                                                                                           | Visível na tela                                                                                 |
| --------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 2:22–2:34 | Publicar status | Aba **Publicar status** → Bairro **Jardim Maria Helena** → (**corte**: Previsão de normalização daqui a 3 h, afetados **2500**) → **Sim** em "Atinge hospital, escola…" → mostre a prévia → **Publicar status** | _A Juliana, da concessionária de energia, publica uma interrupção: área, previsão e quantas pessoas são afetadas. O sistema mostra o risco, Crítico, e avisa quem mora na região._ | "Serviço: Energia elétrica (do seu perfil)"; prévia **Risco Crítico**; depois "Meus status (2)" |

### Cena 8: Fechamento (2:34–2:44) · 23 palavras · ~10 s

| Tempo     | Tela   | Ação                                                    | Narração                                                                                                                                 | Visível na tela                                                         |
| --------- | ------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 2:34–2:44 | Painel | Aba **Painel** e pare a gravação depois da última frase | _Sensor, base pública ou morador: cada alerta mostra de onde veio e quanto dá para confiar. Esse é o Urban Risk Intelligence. Obrigado!_ | Painel com o rio em **Crítico** (marcador vermelho) e os demais eventos |

## Ensaio

Ensaiado em 19/11/2026 no Edge (390 × 844, `?demo=1`), seguindo as ações das tabelas, com cada linha durando o
maior entre as ações e a fala (2,4 palavras/s). Tudo o que está em "Visível na tela" apareceu. Tempos medidos (vídeo,
sem os cortes): cena 1 20,4 s · cena 2 15,8 s · cena 3 30,0 s (alerta aos 16 s; Detalhe aberto aos 18,5 s com
"faltam 0,42 m") · cena 4 17,0 s · cena 5 30,0 s · cena 6 30,0 s (8,0% e 92,0%) · cena 7 12,0 s · cena 8 10,0 s ·
**total 2:45**.

## Contagem

| Cena                         | Palavras | Tempo estimado |
| ---------------------------- | -------- | -------------- |
| 1. Problema                  | 49       | 20 s           |
| 2. Solução                   | 38       | 15 s           |
| 3. Alerta do rio             | 57       | 30 s           |
| 4. Registro comunitário      | 40       | 17 s           |
| 5. Também vejo isso + Origem | 61       | 30 s           |
| 6. Carlos: Fila e Análises   | 62       | 30 s           |
| 7. Juliana                   | 28       | 12 s           |
| 8. Fechamento                | 23       | 10 s           |
| **Total**                    | **358**  | **2:44**       |

## Checklist de ensaio

- [ ] Link certo, com `?demo=1`, e a faixa "Modo demonstração: … a cada 2 s" no topo.
- [ ] Todas as janelas InPrivate fechadas antes de cada trecho; modo dispositivo 390 × 844 ligado **antes** do link.
- [ ] Trecho 2: tocar em Ana até ~2 s e estar na Central **antes de 15 s** do app.
- [ ] Entrar no Detalhe do rio **antes de ~33 s**: tem de aparecer "faltam", não "transbordou".
- [ ] Registro feito **antes** do "Também vejo isso".
- [ ] No evt-02 aparecem "Média • 65" e depois "Alta • 75"; na Origem, "+30" e "+5".
- [ ] Carlos: confirmar o card do meio-fio (Jardim Maria Helena) e descartar o abaixo do meio-fio (Parque Viana).
      **Não** cancelar nenhum alerta.
- [ ] Análises: 8,0% e 92,0%, as duas "Dentro da meta".
- [ ] Nenhum F5 e nenhum endereço digitado no trecho 2.
- [ ] Cronometrar a narração em voz alta: cada cena dentro do tempo da tabela (±3 s).
- [ ] Vídeo final entre 2:40 e 2:45 depois dos cortes.

## Plano B

| Problema                                                          | O que fazer                                                                                                                               |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| O alerta chegou antes de eu abrir a Central (ainda < 33 s)        | Siga: na Central, o card já está no topo como não lido. Troque a fala por _"…e já chegou um alerta: alagamento, risco Alto."_             |
| Cheguei ao Detalhe depois de ~36 s ("transbordou", Risco Crítico) | A cena principal perdeu o "antes". Pare, feche todas as janelas InPrivate e regrave o **trecho 2** inteiro (~2 min). O trecho 1 não muda. |
| Toquei no card errado na Fila (ou cancelei um alerta)             | Os números das Análises mudam. Regrave o trecho 2 (não dá para desfazer sem recarregar).                                                  |
| O "Também vejo isso" não aparece no evt-02                        | O registro da cena 4 foi feito perto dele e foi agrupado (RN04). Não mova o pino no passo 2. Regrave o trecho 2.                          |
| Errei uma fala, mas a tela está certa                             | Continue gravando, repita a frase e corte a versão errada no Clipchamp.                                                                   |
| A Juliana não coube no tempo (vídeo > 2:45)                       | Corte a cena 7 inteira e diga no fechamento: _"A Juliana, da concessionária, publica status de interrupção."_                             |
| A Vercel caiu na hora de gravar                                   | `cd app && npm run dev` e grave com `http://localhost:5173/?demo=1`. O fluxo é o mesmo.                                                   |
