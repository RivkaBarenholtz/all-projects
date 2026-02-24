export const ActionButton = ({ onClick, children })=>
{
   return  <button style={{justifyContent:"center", padding: ".25rem" }} type="button" className="btn btn-secondary" onClick={onClick}>
                    {children}
                </button>
}