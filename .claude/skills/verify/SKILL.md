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
- **Carlos:** `/alertas/evt-03` (Confirmar alerta, Encerrar, Cancelar alerta), `/alertas/evt-06` (Encerrar,
  Descartar evento), `/alertas/evt-02` (aviso da Fila de validação).

## Pegadinhas
- **Os dados ficam em memória:** `page.goto()` recarrega e reinicia tudo (ações do agente somem). Depois de uma
  ação, navegue pelos links/abas do app.
- O `title` do marcador do Leaflet só muda porque a `key` do marcador inclui o risco; procure por
  `.leaflet-marker-icon[title*="Crítico"]`.
- Na confirmação de uma ação do agente, os botões são "Sim, <ação>" e "Não, manter".
- O favicon é `app/public/favicon.svg`; um 404 de `/favicon.ico` no console indica que o `<link rel="icon">` sumiu do `index.html`.
- No Git Bash, `vitest` falha com "reading 'config'" por causa da letra do drive (D: vs d:); rode os testes pelo PowerShell.
