---
name: verify
description: Como abrir e percorrer o protótipo (app/) no navegador para verificar uma mudança nas telas. Use ao verificar telas, fluxos de Ana/Carlos/Juliana ou o modo demonstração.
---

# Verificar o protótipo no navegador (Windows)

## Servidor
- Veja se já há um rodando: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/` (200 = use esse,
  não derrube; normalmente é o `npm run dev` do aluno).
- Se não houver: `cd app && npx vite --port 5173 --strictPort` em segundo plano.

## Driver
Não há `chromium-cli` nem Chrome; use o **Edge** com `playwright-core` instalado no scratchpad (fora do projeto):
```bash
mkdir -p "$SCRATCH/pw" && cd "$SCRATCH/pw" && npm init -y && npm install playwright-core@1.49.1
```
```js
import { chromium } from 'playwright-core'
const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' })
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage()
await p.goto('http://localhost:5173/?demo=1')
await p.getByRole('button', { name: /Entrar como Ana/ }).click()   // Login provisório: Ana, Carlos, Juliana
```

## Fluxos que valem a pena
- **Ana (fluxo 1):** Notificações (5 iniciais, 2 não lidas) → esperar a aba virar "Notificações, 3 não lidas"
  (~16 s com `?demo=1`) → abrir a `.notificacao--nova` → Detalhe → selo de confiança → Origem e confiança → Painel
  (marcador do rio vira Crítico em ~38 s).
- **Ana (fluxo 2):** aba Alertas (9 ativos; filtros de tipo, Risco e Estado) → aba Registrar: Alagamento →
  Continuar (posição já marcada na rua Jatobá, Parque Viana) → altura "Na canela" → Enviar = 5 toques contando a aba
  → "Registro enviado" (Crítico, Reportado, Baixa • 40; 45 com foto) → Ver meus registros (novo + evt-04 + evt-07)
  → Painel (círculo aproximado do novo evento) → Alertas → evt-04 ("Você registrou esta ocorrência") →
  evt-02 → **Também vejo isso** → "Alta • 75; estado: Em monitoramento" e aba "Notificações, 3 não lidas".
  Registrar perto do evt-02 (≤ 300 m) **antes** de confirmar junta o registro a ele (RN04) e tira o botão.
- **Carlos:** `/alertas/evt-03` (Confirmar alerta, Encerrar, Cancelar alerta), `/alertas/evt-06` (Encerrar,
  Descartar evento), `/alertas/evt-02` (aviso da Fila de validação). Confirmar alerta no evt-03 → a Ana recebe
  "Alerta confirmado" na Central (captura `central-notificacoes`).
- **Carlos (Fila e Análises):** aba Fila = evt-02 (58,8) → evt-10 (45,0) → evt-09 (45,0) → evt-11 (13,8). A Ana
  confirma o evt-02 antes (ele sai da Fila). Carlos: Confirmar no card do evt-10 → "Sim, confirmar" → "Alerta emitido
  (risco Alto)"; Descartar no evt-11 → "Sim, descartar". Análises: botões 7 dias / 30 dias; as metas mudam na hora.
  Cancelar alerta (Detalhe do evt-10) sobe o falso alerta.
- **Juliana:** aba Publicar status → Bairro Jardim Maria Helena, previsão +3 h, 2500 afetados, "Sim" → prévia "Risco
  Crítico" → Publicar status → "Meus status (2)" (novo + evt-06) → "Nova situação" Normalizado → Atualizar situação
  (risco Baixo) → dá para voltar a "Em atendimento" enquanto ativo. A Ana recebe "Interrupção de serviço – risco Crítico".

## Capturas (docs/prints, 390 px, escala 2×)
- `deviceScaleFactor: 2`; antes de capturar, aumente a janela até `document.documentElement.scrollHeight` e use
  `screenshot()` sem `fullPage` — com `fullPage` a barra inferior fixa cobre o conteúdo.
- Antes de ampliar a janela, fixe em px a altura dos `.mapa` (usam `vh`); senão o mapa estica e corta o fim da página.
- Antes de capturar, `p.mouse.move(0, 0)`: o mouse parado sobre um card deixa o título sublinhado (hover).
- Cada página de login precisa de um **contexto novo** (`b.newContext()`): o login fica no `localStorage`.

## Pegadinhas
- Para trocar de perfil sem perder os dados: Perfil → Sair → "Entrar como …" (nunca `goto`).
- Na Fila, cada card tem os próprios botões: filtre o card (`.card-alerta` com `hasText`) antes de clicar.
- As Análises de 7 dias perdem o hist-05 (criado há exatamente 7 dias) segundos depois de carregar; os números de
  7 dias na tela diferem de um cálculo com "agora" fixo. O simulador também muda as metas: o alerta do rio (evt-01,
  confiança 90) entra como alerta emitido ~2 min depois de abrir (~16 s com `?demo=1`).
- No campo datetime-local, `fill()` usa o formato `AAAA-MM-DDTHH:mm`.
- **Os dados ficam em memória:** `page.goto()` recarrega e reinicia tudo (ações do agente somem). Depois de uma
  ação, navegue pelos links/abas do app.
- O `title` do marcador do Leaflet só muda porque a `key` do marcador inclui o risco; procure por
  `.leaflet-marker-icon[title*="Crítico"]`.
- Os `<select>` da Lista de alertas têm `<label for>`: use `getByLabel('Risco', { exact: true })` (sem `exact`,
  o grupo "Filtrar por tipo de risco" também casa).
- Na confirmação de uma ação do agente, os botões são "Sim, <ação>" e "Não, manter".
- O favicon é `app/public/favicon.svg`; um 404 de `/favicon.ico` no console indica que o `<link rel="icon">` sumiu do `index.html`.
- No Git Bash, `vitest` falha com "reading 'config'" por causa da letra do drive (D: vs d:); rode os testes pelo PowerShell.
