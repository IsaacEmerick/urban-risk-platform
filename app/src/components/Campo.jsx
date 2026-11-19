// Campo de formulário com rótulo e mensagem de erro ligada por aria-describedby (id do erro: "<id>-erro").
// Usado no Publicar status, no Cadastro e nas Preferências.
export default function Campo({ id, rotulo, erro, children }) {
  return (
    <div className={erro ? 'campo campo--erro' : 'campo'}>
      <label htmlFor={id} className="campo__rotulo">
        {rotulo}
      </label>
      {children}
      {erro && (
        <p id={`${id}-erro`} className="campo__erro">
          {erro}
        </p>
      )}
    </div>
  )
}
