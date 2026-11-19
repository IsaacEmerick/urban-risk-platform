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
npm test         # testes das regras de negócio (304 testes em 20 arquivos)
npm run build    # versão de produção (deploy)
```

No Windows, rode `npm test` pelo PowerShell ou pelo Prompt de Comando. No Git Bash, a letra do drive
pode vir em maiúscula (`D:` em vez de `d:`), e o Vitest não encontra os testes.

## Perfis e telas

O protótipo tem **14 telas** e **3 perfis**. A tela de entrada (`/login`) mostra as **contas de
demonstração**: toque em uma para entrar, sem senha. "Criar conta" cadastra um morador novo; as contas
de agente e operador são criadas pelo órgão.

| Conta de demonstração           | Perfil                      | Navegação inferior                                 |
| ------------------------------- | --------------------------- | -------------------------------------------------- |
| Ana (`ana@exemplo.com`)         | Morador                     | Painel, Alertas, Registrar, Notificações, Perfil   |
| Carlos (`carlos@exemplo.com`)   | Agente da Defesa Civil      | Painel, Fila, Alertas, Análises, Perfil            |
| Juliana (`juliana@exemplo.com`) | Operador de serviço público | Painel, Publicar status, Alertas, Análises, Perfil |

Telas: Login / Cadastro, Painel, Lista de alertas, Detalhe do alerta, Origem e confiança, Central de
notificações, Registro comunitário, Meus registros, Fila de validação, Análises, Publicar status,
Perfil, Preferências e Privacidade e meus dados. Sair não reinicia os dados simulados (eles ficam em
memória); para voltar ao estado inicial, recarregue a página.

### Modo demonstração

Normalmente o sensor simulado do rio Cotia envia uma leitura a cada 15 s, e o alerta Alto chega em
cerca de 2 min. Para gravar o vídeo, abra o app com **`?demo=1`** no endereço
(ex.: `http://localhost:5173/?demo=1`): o sensor passa a enviar uma leitura a cada 2 s, o alerta
**Alto chega em ~16 s** e o **Crítico em ~38 s**. Um aviso "Modo demonstração" aparece no topo
enquanto o modo estiver ativo. Ele vale até fechar a aba; `?demo=0` desliga.

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
