// Gera o PDF da entrega: docs/*.md → HTML com CSS de impressão → PDF pelo Microsoft Edge.
// Uso: node gerar-pdf.mjs   (ou ./gerar-pdf.ps1, que instala as dependências se faltarem)
// 1) prepara as capturas do protótipo (recorte + JPEG) em entrega/imagens/, sem mexer em docs/prints;
// 2) monta entrega/documento.html; 3) imprime o PDF em A4 com numeração no rodapé.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { marked } from 'marked'
import { chromium } from 'playwright-core'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.resolve(AQUI, '..')
const DOCS = path.join(RAIZ, 'docs')
const IMAGENS = path.join(AQUI, 'imagens')
const HTML = path.join(AQUI, 'documento.html')
const PDF = path.join(AQUI, 'GS2026-2_Engenharia-de-Software_Isaac-Vieira-Emerick_RM87081.pdf')

const PROTOTIPO = 'https://urban-risk-platform.vercel.app'
const REPOSITORIO = 'https://github.com/IsaacEmerick/urban-risk-platform'

// ---------------------------------------------------------------------------------------------
// Capturas do protótipo: arquivo em docs/prints, recorte em px CSS (as capturas têm 390 px de
// largura, escala 2×) e legenda "Tela · perfil · RF". Sem recorte = captura inteira.
// "partes" junta dois trechos da mesma captura, com uma faixa de corte visível entre eles.
// ---------------------------------------------------------------------------------------------
const TELAS = [
  { grupo: 'Login / Cadastro', figuras: [
    { id: 'login', arquivo: 'login', legenda: 'Login / Cadastro (Entrar) · Todos · RF15, RF16' },
    { id: 'cadastro', arquivo: 'cadastro', partes: [[0, 975]], legenda: 'Login / Cadastro (Criar conta, recorte) · Morador · RF15, RF16' },
  ] },
  { grupo: 'Preferências', figuras: [
    { id: 'preferencias-areas', arquivo: 'preferencias', partes: [[0, 948]], legenda: 'Preferências (áreas de interesse, recorte) · Todos · RF13' },
    { id: 'preferencias-tipos', arquivo: 'preferencias', partes: [[955, 1425]], legenda: 'Preferências (tipos e canais, recorte) · Todos · RF13' },
  ] },
  { grupo: 'Painel e Lista de alertas', figuras: [
    { id: 'painel', arquivo: 'painel-topo', legenda: 'Painel · Todos · RF01, RF02, RF07' },

    { id: 'lista', arquivo: 'lista-alertas', partes: [[0, 1072]], legenda: 'Lista de alertas (recorte) · Todos · RF08' },
  ] },
  { grupo: 'Detalhe do alerta', figuras: [
    { id: 'detalhe-ana', arquivo: 'detalhe-alerta-ana', legenda: 'Detalhe do alerta (moradora) · Todos · RF06, RF08, RF17' },
    { id: 'detalhe-carlos', arquivo: 'detalhe-alerta-carlos', partes: [[0, 545], [1355, 1530]], legenda: 'Detalhe do alerta (agente, recorte) · Agente · RF06, RF12' },
  ] },
  { grupo: 'Origem e confiança e Central de notificações', figuras: [
    { id: 'origem', arquivo: 'origem-confianca-comunidade', legenda: 'Origem e confiança · Todos · RF01, RF02, RF05, RF09' },

    { id: 'central', arquivo: 'central-notificacoes', partes: [[0, 1085]], legenda: 'Central de notificações (recorte) · Morador · RF10, RF11' },
  ] },
  { grupo: 'Registro comunitário', pequenas: true, figuras: [
    { id: 'registro-1', arquivo: 'registro-passo-1', legenda: 'Registro comunitário (passo 1) · Morador · RF03, RF04' },
    { id: 'registro-2', arquivo: 'registro-passo-2', legenda: 'Registro comunitário (passo 2) · Morador · RF03, RF04' },
    { id: 'registro-3', arquivo: 'registro-passo-3', legenda: 'Registro comunitário (passo 3) · Morador · RF03, RF04' },
  ] },
  { grupo: 'Registro enviado e Meus registros', figuras: [
    { id: 'registro-enviado', arquivo: 'registro-enviado', legenda: 'Registro comunitário (enviado) · Morador · RF03, RF04' },
    { id: 'meus-registros', arquivo: 'meus-registros', legenda: 'Meus registros · Morador · RF03, RF17' },
  ] },
  { grupo: 'Fila de validação e Análises', figuras: [
    { id: 'fila', arquivo: 'fila-validacao', partes: [[0, 890]], legenda: 'Fila de validação (recorte) · Agente · RF12' },

    { id: 'analises', arquivo: 'analises', legenda: 'Análises · Agente, operador · RF14' },
  ] },
  { grupo: 'Privacidade e meus dados', figuras: [
    { id: 'privacidade-dados', arquivo: 'privacidade', partes: [[0, 1095]], legenda: 'Privacidade e meus dados (dados e consentimentos, recorte) · Todos · RF16' },
    { id: 'privacidade-direitos', arquivo: 'privacidade', partes: [[1363, 2118]], legenda: 'Privacidade e meus dados (exportar, histórico e excluir, recorte) · Todos · RF16' },
  ] },
  { grupo: 'Publicar status e Perfil', figuras: [
    { id: 'publicar-status', arquivo: 'publicar-status', legenda: 'Publicar status · Operador · RF04, RF18' },

    { id: 'perfil', arquivo: 'perfil', legenda: 'Perfil · Todos · RF15' },
  ] },
]

const LARGURA_JPEG = 600 // px
const QUALIDADE_JPEG = 0.85

// Recorta e comprime no próprio Edge (canvas), sem outra dependência
async function prepararImagens(pagina) {
  fs.mkdirSync(IMAGENS, { recursive: true })
  for (const { figuras } of TELAS) {
    for (const f of figuras) {
      const png = fs.readFileSync(path.join(DOCS, 'prints', `${f.arquivo}.png`)).toString('base64')
      const jpeg = await pagina.evaluate(async ({ png, partes, largura, qualidade }) => {
        const img = new Image()
        img.src = `data:image/png;base64,${png}`
        await img.decode()
        const escala = img.width / 390 // px da imagem por px CSS
        const trechos = (partes ?? [[0, img.height / escala]]).map(([a, b]) => [a * escala, Math.min(b * escala, img.height)])
        const fator = largura / img.width
        const faixa = trechos.length > 1 ? 18 : 0 // faixa de corte entre os trechos (px no destino)
        const altura = Math.round(trechos.reduce((t, [a, b]) => t + (b - a) * fator, 0) + faixa * (trechos.length - 1))
        const cv = document.createElement('canvas')
        cv.width = largura
        cv.height = altura
        const ctx = cv.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        let y = 0
        trechos.forEach(([a, b], i) => {
          if (i > 0) {
            // faixa cinza com linha tracejada: deixa claro que há um trecho omitido
            ctx.fillStyle = '#d9dee3'
            ctx.fillRect(0, y, largura, faixa)
            ctx.strokeStyle = '#7a8591'
            ctx.setLineDash([8, 6])
            ctx.beginPath()
            ctx.moveTo(0, y + faixa / 2)
            ctx.lineTo(largura, y + faixa / 2)
            ctx.stroke()
            y += faixa
          }
          const h = (b - a) * fator
          ctx.drawImage(img, 0, a, img.width, b - a, 0, y, largura, h)
          y += h
        })
        return cv.toDataURL('image/jpeg', qualidade).split(',')[1]
      }, { png, partes: f.partes, largura: LARGURA_JPEG, qualidade: QUALIDADE_JPEG })
      fs.writeFileSync(path.join(IMAGENS, `${f.id}.jpg`), Buffer.from(jpeg, 'base64'))
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Documentos em Markdown → HTML. O conteúdo não é reescrito; só os links entre arquivos viram
// links internos do PDF (ou para o GitHub) e a figura da arquitetura aponta para docs/diagramas.
// ---------------------------------------------------------------------------------------------
const slug = (texto) =>
  texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function documento(arquivo, prefixo) {
  let md = fs.readFileSync(path.join(DOCS, arquivo), 'utf8')
  md = md
    .replaceAll('](00-problema-personas.md)', '](#doc-00)')
    .replaceAll('](01-requisitos.md)', '](#doc-01)')
    .replaceAll('](02-arquitetura.md)', '](#doc-02)')
    .replaceAll('](diagramas/arquitetura.drawio)', `](${REPOSITORIO}/blob/main/docs/diagramas/arquitetura.drawio)`)
    .replaceAll('](diagramas/arquitetura.png)', '](../docs/diagramas/arquitetura.png)')
  const titulos = []
  const renderer = new marked.Renderer()
  renderer.heading = (texto, nivel) => {
    const id = nivel === 1 ? `doc-${prefixo}` : `${prefixo}-${slug(texto)}`
    if (nivel === 2) titulos.push({ id, texto })
    return `<h${nivel} id="${id}">${texto}</h${nivel}>\n`
  }
  // Tabelas com <thead>: o Chromium repete o cabeçalho quando a tabela quebra de página
  let html = marked.parse(md, { renderer, gfm: true })
  // Imagem sozinha num parágrafo vira figura com legenda (é o caso da arquitetura no 02)
  html = html.replace(/<p><img src="([^"]+)" alt="([^"]*)"><\/p>/g,
    '<figure class="diagrama"><img src="$1" alt="$2"><figcaption>Figura: $2</figcaption></figure>')
  return { html, titulos }
}

const escapar = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

function montarHtml() {
  const d00 = documento('00-problema-personas.md', '00')
  const d01 = documento('01-requisitos.md', '01')
  const d02 = documento('02-arquitetura.md', '02')

  const telasHtml = TELAS.map(({ grupo, figuras, pequenas }) => `
    <div class="grupo-telas${pequenas ? ' grupo-telas--pequenas' : ''}" aria-label="${escapar(grupo)}">
      ${figuras.map((f) => `
      <figure class="tela">
        <img src="imagens/${f.id}.jpg" alt="${escapar(f.legenda)}">
        <figcaption>${escapar(f.legenda)}</figcaption>
      </figure>`).join('')}
    </div>`).join('')

  // Partes sem numeração; os títulos internos dos documentos mantêm a numeração original
  const sumario = [
    { id: 'acesso', texto: 'Como acessar o protótipo' },
    { id: 'doc-00', texto: 'Problema, público-alvo e personas', filhos: d00.titulos },
    { id: 'doc-01', texto: 'Documento de requisitos', filhos: d01.titulos },
    { id: 'diagramas', texto: 'Diagramas', filhos: [{ id: 'diagrama-sequencia', texto: 'Diagrama de Sequência' }, { id: 'diagrama-estados', texto: 'Diagrama de Estados' }] },
    { id: 'doc-02', texto: 'Arquitetura em camadas', filhos: d02.titulos },
    { id: 'telas', texto: 'Protótipo: telas' },
    { id: 'uso-ia', texto: 'Declaração de uso de IA' },
  ]
  const sumarioHtml = sumario.map((p) => `
      <li><a href="#${p.id}">${p.texto}</a>${p.filhos?.length ? `
        <ul>${p.filhos.map((f) => `<li><a href="#${f.id}">${f.texto}</a></li>`).join('')}</ul>` : ''}</li>`).join('')

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Urban Risk Intelligence Platform – Isaac Vieira Emerick – RM 87081</title>
<style>${fs.readFileSync(path.join(AQUI, 'estilo-pdf.css'), 'utf8')}</style>
</head>
<body>

<section class="capa">
  <p class="capa__evento">Global Solution 2026.2 · Engenharia de Software · FIAP</p>
  <h1 class="capa__titulo">Urban Risk Intelligence Platform</h1>
  <p class="capa__sub">Plataforma de inteligência de riscos urbanos: sensores, bases públicas e registros da comunidade num lugar só, sempre com a origem e o nível de confiança de cada dado.</p>
  <dl class="capa__dados">
    <dt>Aluno</dt><dd>Isaac Vieira Emerick · RM 87081</dd>
    <dt>Protótipo publicado</dt><dd><a href="${PROTOTIPO}">${PROTOTIPO}</a></dd>
    <dt>Repositório</dt><dd><a href="${REPOSITORIO}">${REPOSITORIO}</a></dd>
    <dt>Data</dt><dd>Novembro de 2026</dd>
  </dl>
  <p class="capa__recorte">Recorte ilustrativo: Parque Viana e Jardim Maria Helena, Barueri (SP). Sensores, eventos e números do protótipo são simulados.</p>
</section>

<section class="parte" id="acesso">
  <h1>Como acessar o protótipo</h1>
  <ul>
    <li><strong>Endereço:</strong> <a href="${PROTOTIPO}">${PROTOTIPO}</a> (funciona no navegador do celular e do computador).</li>
    <li><strong>Contas de demonstração:</strong> na tela de entrada, toque em <strong>Ana</strong> (moradora), <strong>Carlos</strong> (agente da Defesa Civil) ou <strong>Juliana</strong> (operadora de serviço público). Basta um toque; não há senha.</li>
    <li><strong>Trocar de perfil:</strong> Perfil → Sair → toque em outra conta. Sair não apaga o que foi feito.</li>
    <li><strong>Modo demonstração:</strong> abra <a href="${PROTOTIPO}/?demo=1">${PROTOTIPO}/?demo=1</a>. O sensor simulado do rio Cotia passa a enviar uma leitura a cada 2 s (normalmente, a cada 15 s): o alerta antecipado do rio, risco Alto, chega em cerca de 16 s, e o Crítico, em cerca de 38 s.</li>
    <li><strong>Dados simulados:</strong> ficam só na memória do navegador. <strong>Recarregar a página reinicia os dados simulados</strong> (as ações de Ana, Carlos e Juliana são desfeitas).</li>
  </ul>
</section>

<section class="sumario">
  <h1>Sumário</h1>
  <ul>${sumarioHtml}
  </ul>
</section>

<section class="parte doc">${d00.html}</section>
<section class="parte doc">${d01.html}</section>

<section class="parte" id="diagramas">
  <section class="paisagem" id="diagrama-sequencia">
    <h1>Diagramas</h1>
    <h2>Diagrama de Sequência</h2>
    <figure class="diagrama diagrama--sequencia">
      <img src="../docs/diagramas/sequencia.png" alt="Diagrama de Sequência">
      <figcaption>Figura: fluxo de recebimento e disparo de um alerta (dado → validação → confiança e risco → evento → notificação), com os mesmos componentes da arquitetura. Fonte: <a href="${REPOSITORIO}/blob/main/docs/diagramas/sequencia.puml">docs/diagramas/sequencia.puml</a>.</figcaption>
    </figure>
  </section>
  <section id="diagrama-estados" class="estados">
    <h2>Diagrama de Estados</h2>
    <figure class="diagrama">
      <img src="../docs/diagramas/estados.png" alt="Diagrama de Estados">
      <figcaption>Figura: ciclo de vida de um evento de risco. Entre colchetes, as guardas (RN01–RN05); depois da barra, a ação. As duas transições internas em Em monitoramento tiram a marca "não confirmado" do alerta preliminar (RN02). Fonte: <a href="${REPOSITORIO}/blob/main/docs/diagramas/estados.puml">docs/diagramas/estados.puml</a>.</figcaption>
    </figure>
  </section>
</section>

<section class="parte doc">${d02.html}</section>

<section class="parte" id="telas">
  <h1>Protótipo: telas</h1>
  <p>As 14 telas do protótipo, capturadas a 390 px de largura (tela de celular) com os dados simulados. Cada legenda traz a tela, o perfil que a usa e os requisitos funcionais que ela atende (ver a tabela de rastreabilidade no Documento de requisitos). As capturas muito altas foram recortadas só para este documento; a faixa tracejada indica um trecho omitido.</p>
  ${telasHtml}
</section>

<section class="parte" id="uso-ia">
  <h1>Declaração de uso de IA</h1>
  <p>Este trabalho foi feito individualmente, com apoio de IA generativa (Claude, da Anthropic), como permite o enunciado. A IA foi usada para gerar o código do protótipo e os testes automatizados, para rascunhar e revisar textos e diagramas e para conferir a coerência entre os artefatos. O escopo, os requisitos, as regras de negócio, os parâmetros e as telas foram definidos ou aprovados por mim, e revisei o conteúdo entregue. Os dados do protótipo são simulados; as fontes reais citadas estão na seção de problema e personas.</p>
</section>

</body>
</html>`
}

// ---------------------------------------------------------------------------------------------
const navegador = await chromium.launch({ channel: 'msedge' })
const pagina = await navegador.newPage()
await prepararImagens(pagina)
fs.writeFileSync(HTML, montarHtml())
await pagina.goto(pathToFileURL(HTML).href, { waitUntil: 'load' })
await pagina.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))))
await pagina.pdf({
  path: PDF,
  preferCSSPageSize: true, // tamanho A4 e a página em paisagem vêm do CSS (@page)
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: '<div style="width:100%;font:8pt Segoe UI,Arial,sans-serif;color:#555;text-align:center">Urban Risk Intelligence Platform · Isaac Vieira Emerick · RM 87081 · <span class="pageNumber"></span>/<span class="totalPages"></span></div>',
})
await navegador.close()
console.log(`PDF gerado: ${path.relative(RAIZ, PDF)} (${(fs.statSync(PDF).size / 1024 / 1024).toFixed(2)} MB)`)
