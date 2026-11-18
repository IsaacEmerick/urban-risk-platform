# Arquitetura em camadas

**Urban Risk Intelligence Platform** · Diagrama-fonte: [diagramas/arquitetura.puml](diagramas/arquitetura.puml)

![Arquitetura em camadas](diagramas/arquitetura.png)

## Caminho de um alerta

1. O **Sensor** envia a leitura ao **API Gateway**, que autentica a origem no **Identidade e
   Consentimento (LGPD)**. Dados de **Base pública** são buscados pelo **Serviço de Ingestão**
   (coleta agendada); registros da **Comunidade** chegam pelo **App do Morador**.
2. O **Serviço de Ingestão** normaliza o dado, pseudonimiza os dados pessoais e publica
   `DadoRecebido` no **Broker de Eventos**.
3. O **Serviço de Validação** consome o dado, confere formato, faixa e duplicidade e chama o
   **Motor de Confiança**, que busca corroborações no banco, e o **Motor de Classificação de Risco**.
4. O **Gerenciador de Eventos** agrupa o dado no evento (RN04, RN07), salva e define o estado:
   **Confirmado** (confiança ≥ 75), **Em validação** (50–74, Carlos decide pelo **Painel do
   Agente / Operador**) ou **Reportado** (< 50).
5. Com o evento **Confirmado** e risco **≥ Alto**, o **Gerenciador de Eventos** passa o evento para
   **Alerta emitido** e publica `AlertaEmitido` no **Broker de Eventos**.
6. O **Serviço de Notificação** busca no banco quem tem área de interesse no raio afetado (RN06),
   envia o push ao **App do Morador** e registra a notificação na **Central de Notificações**.
7. O **Serviço de Notificação** publica `NotificacaoEnviada`, e o **Gerenciador de Eventos** passa
   o evento para **Em monitoramento**.
