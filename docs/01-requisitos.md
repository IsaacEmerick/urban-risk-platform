# Documento de requisitos

**Urban Risk Intelligence Platform** · Recorte: bairro **Parque Viana, Barueri (SP)**

Problema, público-alvo e personas estão em [00-problema-personas.md](00-problema-personas.md).
Este documento é a **fonte da verdade** das regras de negócio: as funções `calcularConfianca()`,
`classificarRisco()` e `calcularPrioridade()` do protótipo (`app/src/services/`) implementam
exatamente os números abaixo.

## 1. Glossário

| Termo               | Valores                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------- |
| Personas            | Ana (moradora), Carlos (agente da Defesa Civil), Juliana (operadora de serviço público)      |
| Tipos de risco      | Alagamento, Ilha de calor, Interrupção de serviço                                            |
| Origens do dado     | Sensor, Base pública, Comunidade                                                             |
| Níveis de risco     | Baixo, Moderado, Alto, Crítico                                                               |
| Faixas de confiança | Alta (≥ 75), Média (50–74), Baixa (< 50)                                                     |
| Estados do evento   | Reportado, Em validação, Confirmado, Alerta emitido, Em monitoramento, Encerrado, Descartado |

**Dado** é uma leitura ou registro individual (uma leitura de sensor, um boletim de base pública, um
registro de morador). **Evento** é o agrupamento de dados sobre a mesma situação (regra RN04); é o
evento que tem estado, risco, confiança e prioridade.

### Telas do protótipo citadas nos requisitos

Login / Cadastro · Preferências · Painel · Lista de alertas · Detalhe do alerta · Origem e confiança ·
Central de notificações · Registro comunitário · Meus registros · Fila de validação · Análises ·
Privacidade e meus dados · Publicar status.

## 2. Requisitos funcionais

**Escala de prioridade:**

- **Alta** — essencial para o fluxo principal ou para uma tela obrigatória do enunciado.
- **Média** — importante para a experiência completa; entra no protótipo.
- **Baixa** — desejável; melhora a qualidade dos dados, mas o fluxo principal funciona sem ela.

| ID   | Descrição                                                                                                                                               | Prioridade | Persona         | Tela                                               |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------- | -------------------------------------------------- |
| RF01 | O sistema deve receber leituras de sensores (nível de água, chuva, temperatura) com identificação do sensor, local e horário.                           | Alta       | —               | Painel, Origem e confiança (integração automática) |
| RF02 | O sistema deve importar periodicamente dados de bases públicas (CEMADEN, INMET, Defesa Civil e concessionárias).                                        | Alta       | —               | Painel, Origem e confiança (integração automática) |
| RF03 | O sistema deve permitir que o morador registre uma ocorrência com tipo, localização, descrição e foto opcional.                                         | Alta       | Ana             | Registro comunitário, Meus registros               |
| RF04 | O sistema deve validar cada dado recebido quanto a formato, faixa de valores e duplicidade.                                                             | Alta       | Carlos          | Fila de validação                                  |
| RF05 | O sistema deve calcular o nível de confiança de cada dado conforme a seção 4.1.                                                                         | Alta       | Todas           | Origem e confiança                                 |
| RF06 | O sistema deve classificar o nível de risco de cada evento em Baixo, Moderado, Alto ou Crítico, conforme a seção 4.2.                                   | Alta       | Todas           | Detalhe do alerta                                  |
| RF07 | O sistema deve exibir um painel com mapa dos eventos ativos, indicadores e filtros por tipo de risco e região.                                          | Alta       | Todas           | Painel                                             |
| RF08 | O sistema deve listar os alertas ordenados por prioridade (seção 4.3) e exibir o detalhe de cada um.                                                    | Alta       | Ana, Carlos     | Lista de alertas, Detalhe do alerta                |
| RF09 | O sistema deve mostrar, para cada dado, a origem (Sensor, Base pública ou Comunidade), o horário da última atualização e o nível de confiança.          | Alta       | Todas           | Origem e confiança                                 |
| RF10 | O sistema deve enviar notificações (push, SMS ou e-mail) aos usuários cuja área de interesse foi afetada, conforme a regra RN06.                        | Alta       | Ana             | Central de notificações                            |
| RF11 | O sistema deve manter uma central de notificações com histórico, status lida/não lida e filtros.                                                        | Média      | Ana             | Central de notificações                            |
| RF12 | O sistema deve permitir que o agente confirme, descarte ou encerre um evento.                                                                           | Alta       | Carlos          | Fila de validação                                  |
| RF13 | O sistema deve permitir que o usuário defina áreas de interesse, tipos de risco e canais de alerta.                                                     | Média      | Ana             | Preferências                                       |
| RF14 | O sistema deve gerar análises históricas de eventos por tipo de risco, região e período.                                                                | Média      | Carlos, Juliana | Análises                                           |
| RF15 | O sistema deve autenticar usuários e aplicar perfis de acesso (morador, agente, operador).                                                              | Alta       | Todas           | Login / Cadastro                                   |
| RF16 | O sistema deve permitir que o titular consulte, exporte e exclua seus dados pessoais e revogue consentimentos.                                          | Média      | Ana             | Privacidade e meus dados                           |
| RF17 | O sistema deve permitir que outros moradores confirmem uma ocorrência já registrada.                                                                    | Baixa      | Ana             | Detalhe do alerta                                  |
| RF18 | O sistema deve permitir que o operador publique o status de uma interrupção de serviço, com serviço afetado, área, situação e previsão de normalização. | Média      | Juliana         | Publicar status                                    |

O status publicado pelo operador (RF18) entra na plataforma como dado de origem **Base pública
(concessionária)**, com base de confiança 80 (seção 4.1).

RF01 e RF02 não têm tela própria porque são integrações automáticas. O resultado delas aparece no
Painel e na tela Origem e confiança, como origem dos dados.

## 3. Requisitos não funcionais (ISO/IEC 25010:2011)

A classificação usa a **ISO/IEC 25010:2011**. Essa versão não tem "escalabilidade" como
subcaracterística; por isso, o requisito de escalabilidade (RNF05) é classificado em
**Eficiência de desempenho → Capacidade**, que trata dos limites máximos que o sistema suporta.

| ID    | Característica (subcaracterística)                     | Requisito                                                                                                                                             | Meta mensurável                                                                                                  |
| ----- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| RNF01 | Eficiência de desempenho (Comportamento temporal)      | **Tempo de atualização:** leituras de sensores devem aparecer no painel rapidamente, e bases públicas devem ser sincronizadas periodicamente.         | Sensor: ≤ 60 s entre a leitura e a exibição. Base pública: sincronização a cada ≤ 15 min.                        |
| RNF02 | Eficiência de desempenho (Comportamento temporal)      | Notificações de risco Alto ou Crítico devem ser disparadas logo após a classificação.                                                                 | ≤ 30 s entre a classificação e o envio.                                                                          |
| RNF03 | Confiabilidade (Disponibilidade)                       | **Disponibilidade:** a plataforma deve permanecer no ar, inclusive durante chuvas fortes (pico de uso).                                               | ≥ 99,5% de disponibilidade mensal.                                                                               |
| RNF04 | Confiabilidade (Tolerância a falhas, Recuperabilidade) | Nenhum dado recebido pode ser perdido se um serviço cair; o Broker de Eventos guarda e reprocessa os dados quando o serviço volta.                    | 0 dados perdidos; recuperação em ≤ 5 min.                                                                        |
| RNF05 | Eficiência de desempenho (Capacidade)                  | **Escalabilidade:** o sistema deve escalar horizontalmente em picos de carga.                                                                         | Suportar 10× a carga média (5.000 eventos/min) sem descumprir as metas do RNF01.                                 |
| RNF06 | Usabilidade (Operabilidade, Apreensibilidade)          | **Usabilidade:** registrar uma ocorrência deve ser simples para qualquer morador.                                                                     | ≤ 3 passos e ≤ 60 s; nota SUS ≥ 75 em teste com 5 usuários.                                                      |
| RNF07 | Usabilidade (Acessibilidade)                           | O risco deve ser indicado por cor, ícone e texto (nunca só cor), com contraste adequado e suporte a leitor de tela.                                   | Conformidade com WCAG 2.1 nível AA.                                                                              |
| RNF08 | Segurança (Confidencialidade)                          | **LGPD:** dados pessoais devem ser criptografados, e a localização de quem registra uma ocorrência não pode ser exibida com precisão no mapa público. | TLS 1.2+ em trânsito; AES-256 em repouso; localização pública arredondada para ~100 m.                           |
| RNF09 | Segurança (Responsabilização, Autenticidade)           | Todo acesso a dados pessoais deve ser registrado, e todo consentimento deve ser guardado com data e finalidade.                                       | 100% dos acessos em log de auditoria; retenção dos logs por 12 meses.                                            |
| RNF10 | Portabilidade (Adaptabilidade)                         | A interface deve ser responsiva e funcionar em navegadores de celular e de desktop.                                                                   | Funciona nas 2 últimas versões de Chrome, Safari e Firefox, em telas de 360 px a 1920 px de largura.             |
| RNF11 | Adequação funcional (Correção funcional)               | **Qualidade dos alertas:** os alertas emitidos devem ser corretos e baseados em dados confiáveis.                                                     | Falsos alertas ≤ 10% dos alertas emitidos; ≥ 90% dos alertas de risco Alto ou Crítico com confiança Alta (≥ 75). |

**Cobertura dos temas obrigatórios:** tempo de atualização (RNF01, RNF02), disponibilidade (RNF03,
RNF04), escalabilidade (RNF05), usabilidade (RNF06, RNF07) e segurança/LGPD (RNF08, RNF09).

**Indicadores de sucesso do enunciado:** tempo de atualização dos dados → RNF01; qualidade dos
alertas → RNF11; facilidade de uso → RNF06.

### Tratamento de dados pessoais (LGPD)

- **Base legal (art. 7º):** consentimento do morador para cadastro, áreas de interesse e
  notificações; execução de políticas públicas para os dados tratados pela Defesa Civil.
- **Minimização:** o registro comunitário pede só tipo, localização, descrição e foto opcional.
- **Pseudonimização:** os eventos guardam apenas um ID pseudonimizado de quem registrou; os dados
  pessoais ficam separados, no cofre de dados pessoais (ver arquitetura).
- **Direitos do titular (art. 18):** consulta, exportação, exclusão e revogação de consentimento,
  atendidos pelo RF16.

## 4. Regras de negócio

Os números abaixo são **parâmetros configuráveis**, escolhidos para serem simples de explicar e de
mostrar nas telas. São os mesmos usados no Diagrama de Estados, no Diagrama de Sequência e no código.

### 4.1 Nível de confiança do dado (0 a 100) — `calcularConfianca()`

Cada dado começa com uma pontuação base, definida pela origem, e recebe ajustes.

| Origem                        | Exemplo                                                            | Base |
| ----------------------------- | ------------------------------------------------------------------ | ---- |
| Sensor                        | Pluviômetro, sensor de nível d'água ou de temperatura calibrado    | 90   |
| Base pública                  | Defesa Civil, CEMADEN, INMET                                       | 85   |
| Base pública (concessionária) | Boletim da concessionária ou status publicado pelo operador (RF18) | 80   |
| Comunidade                    | Registro de morador pelo app                                       | 40   |

| Ajuste                                                                           | Pontos |
| -------------------------------------------------------------------------------- | ------ |
| Cada confirmação de outro morador (máximo de 3)                                  | +10    |
| Corroborado por um dado de Sensor ou Base pública a até 500 m e até 30 min       | +15    |
| Registro com foto geolocalizada                                                  | +5     |
| Dado desatualizado (sem atualização há mais de 2× o intervalo esperado da fonte) | −20    |
| Sensor com leitura fora da faixa ou falha recente                                | −30    |

**Dado desatualizado:** quando a fonte fica sem enviar atualização por mais de **2× o seu
intervalo esperado**.

| Origem                        | Intervalo esperado | Desatualizado após |
| ----------------------------- | ------------------ | ------------------ |
| Sensor                        | 5 min              | 10 min             |
| Base pública                  | 15 min             | 30 min             |
| Base pública (concessionária) | 15 min             | 30 min             |
| Comunidade                    | Não se aplica      | Não se aplica      |

O resultado é limitado a **0–100** e convertido em faixa: **Alta ≥ 75**, **Média 50–74**, **Baixa < 50**.

**Exemplo:** registro de Ana sobre alagamento na sua rua no Parque Viana: base Comunidade 40
\+ 2 confirmações de vizinhos (+20) + foto geolocalizada (+5) = **65 (Média)**. Quando um sensor de
nível d'água a 300 m registra a mesma situação 10 min depois (+15), a confiança sobe para
**80 (Alta)**. A tela Origem e confiança mostra essa decomposição.

**Confiança do evento:** um evento agrupa vários dados (RN04); sua confiança segue a regra RN07.

### 4.2 Nível de risco do evento — `classificarRisco()`

| Tipo                   | Moderado                                                | Alto                                                    | Crítico                                          |
| ---------------------- | ------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------ |
| Alagamento             | Chuva ≥ 10 e < 25 mm/h                                  | Lâmina d'água ≥ 10 e ≤ 30 cm, ou chuva ≥ 25 e ≤ 50 mm/h | Lâmina d'água > 30 cm, ou chuva > 50 mm/h        |
| Ilha de calor          | Sensação térmica ≥ 32 e < 38 °C                         | ≥ 38 e < 42 °C                                          | ≥ 42 °C                                          |
| Interrupção de serviço | Duração ≥ 2 e ≤ 6 h, ou 1 mil a 10 mil pessoas afetadas | Duração > 6 h, ou mais de 10 mil pessoas afetadas       | Atinge hospital, escola ou abastecimento crítico |

- Abaixo do limiar de Moderado, o risco é **Baixo**.
- Quando mais de um critério se aplica (por exemplo, chuva e lâmina d'água), vale o **nível mais alto**.
- O risco do evento segue a regra RN07.

### 4.3 Prioridade do alerta — `calcularPrioridade()`

A prioridade ordena a Lista de alertas e a Fila de validação.

**_P = R × 25 × (C / 100) + V_**

| Variável | Significado              | Valores                                                                                                                                                                                                                                         |
| -------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R        | Peso do nível de risco   | Baixo = 1, Moderado = 2, Alto = 3, Crítico = 4                                                                                                                                                                                                  |
| C        | Confiança do evento      | 0 a 100                                                                                                                                                                                                                                         |
| V        | Bônus de área vulnerável | +10 se a área tiver hospital, escola ou comunidade vulnerável, ou se estiver marcada como suscetível a inundação na carta do SGB (Barueri, 2017); 0 caso contrário. O bônus é aplicado uma única vez, mesmo que mais de um critério se aplique. |

P varia de 0 a 110. **Exemplo:** alagamento Alto (R = 3) com confiança 80 perto de uma escola do
Parque Viana: P = 3 × 25 × 0,8 + 10 = **70**.

### 4.4 Regras RN01–RN07

| ID   | Regra                                                                                                                                                                     | Onde aparece                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| RN01 | O alerta público é emitido automaticamente apenas quando **risco ≥ Alto e confiança ≥ 75**.                                                                               | Estados: Confirmado → Alerta emitido                |
| RN02 | Com **confiança entre 50 e 74**, o evento vai para a Fila de validação do agente. Se o risco for **Crítico**, sai um alerta preliminar marcado como **"não confirmado"**. | Estados: Em validação; Fila de validação            |
| RN03 | Com **confiança < 50**, o evento fica **Reportado** aguardando confirmações e é **Descartado** se não houver nenhuma em **2 h**.                                          | Estados: Reportado → Descartado                     |
| RN04 | Dados do **mesmo tipo** a até **300 m** e **60 min** um do outro são agrupados no mesmo evento.                                                                           | Serviço de Validação                                |
| RN05 | O evento é **Encerrado** quando o risco fica abaixo do limiar de Moderado (Baixo) por **30 min** seguidos ou quando o agente o encerra.                                   | Estados: Em monitoramento → Encerrado               |
| RN06 | Só recebe notificação quem tem **área de interesse** no raio afetado. O mesmo evento não é renotificado em menos de **15 min**, salvo se o risco subir (escalada).        | Serviço de Notificação; Central de notificações     |
| RN07 | O **risco** e a **confiança** do evento são o **maior valor** entre os dados agrupados.                                                                                   | Motor de Confiança; Motor de Classificação de Risco |
