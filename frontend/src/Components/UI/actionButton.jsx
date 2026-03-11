export const ActionButton = ({style, onClick, children })=>
{
   return  <button style={{...style, justifyContent:"center", padding: ".25rem" }} type="button" className="btn btn-secondary" onClick={onClick}>
                    {children}
                </button>
}