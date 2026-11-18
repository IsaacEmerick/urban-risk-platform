import TelaPlaceholder from '../components/TelaPlaceholder.jsx'

export default function ListaAlertas() {
  // Atalho provisório para um evento simulado, só para navegar até o detalhe
  return <TelaPlaceholder tela="alertas" atalhos={[{ rotulo: 'Exemplo: detalhe do evento evt-02', para: '/alertas/evt-02' }]} />
}
