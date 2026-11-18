# Urban Risk Intelligence Platform

Plataforma que reúne dados de **sensores**, **bases públicas** e **registros da comunidade** sobre
alagamentos, ilhas de calor e interrupções de serviço. Para cada dado, calcula o **nível de risco** e
o **nível de confiança**, prioriza os alertas e avisa só quem tem área de interesse no local afetado,
sempre mostrando a **origem** da informação.

Global Solution 2026.2 · Engenharia de Software · FIAP

- **Autor:** _(a preencher: nome completo e RM)_
- **Protótipo publicado:** _(a preencher: link da Vercel)_
- **Vídeo:** _(a preencher: link do YouTube, não listado)_

## ⚠️ Dados simulados

**Todos os dados do protótipo são fictícios.** O Parque Viana e o Jardim Maria Helena (Barueri, SP)
são usados como **cenário ilustrativo**:

- O sensor de nível do rio Cotia, suas leituras e a cota de transbordamento são simulados; os valores
  **não** são as cotas oficiais do rio Cotia.
- Os eventos atuais e o histórico dos últimos 30 dias (`app/src/data/`) são inventados para a
  demonstração; não descrevem ocorrências reais.
- Ruas, registros de moradores e status de concessionárias são fictícios. As pessoas (Ana, Carlos e
  Juliana) são personas, com e-mails `@exemplo.com`.
- As coordenadas dos bairros vêm do OpenStreetMap e são aproximadas, não limites oficiais.

O contexto real que motivou o trabalho está descrito, com fontes, em
[docs/00-problema-personas.md](docs/00-problema-personas.md).

## Tecnologias

React · Vite · React Router · Leaflet (OpenStreetMap) · Vitest. Sem back-end: os dados ficam em JSON
e as regras de negócio rodam no navegador.

## Como rodar

```bash
cd app
npm install
npm run dev      # desenvolvimento
npm test         # testes das regras de negócio
npm run build    # versão de produção (deploy)
```

## Estrutura

| Pasta              | Conteúdo                                                                         |
| ------------------ | -------------------------------------------------------------------------------- |
| `app/src/pages`    | Telas (camada de apresentação)                                                   |
| `app/src/services` | Regras de negócio: confiança, risco, prioridade, estados, notificação, simulador |
| `app/src/data`     | Dados simulados (JSON)                                                           |
| `docs/`            | Problema e personas, requisitos, arquitetura e diagramas                         |

## Documentação

- [Problema, público-alvo e personas](docs/00-problema-personas.md)
- [Requisitos e regras de negócio](docs/01-requisitos.md)
- [Arquitetura em camadas](docs/02-arquitetura.md)
- Diagramas: [sequência](docs/diagramas/sequencia.puml), [estados](docs/diagramas/estados.puml),
  [arquitetura](docs/diagramas/arquitetura.drawio)
