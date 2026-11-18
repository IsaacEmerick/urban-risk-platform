// Placeholder provisório: mostra o nome da tela e os RF que ela vai atender.
// Será substituído pela tela real nas sessões 4 a 6.
import { Link } from 'react-router-dom'
import { TELAS } from '../navegacao.js'

export default function TelaPlaceholder({ tela, atalhos = [], children }) {
  const { titulo, rfs } = TELAS[tela]
  return (
    <section className="placeholder">
      <h1>{titulo}</h1>
      <p className="placeholder-rfs">Tela em construção · {rfs.join(', ')}</p>
      {atalhos.length > 0 && (
        <ul className="placeholder-atalhos">
          {atalhos.map((atalho) => (
            <li key={atalho.para}>
              <Link to={atalho.para}>{atalho.rotulo}</Link>
            </li>
          ))}
        </ul>
      )}
      {children}
    </section>
  )
}
