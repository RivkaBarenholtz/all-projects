export const ConfirmationModal = ({onClose, rightOffset ,  maxWidth , onConfirm , children, confirmButtonText, loading, showButton=true})=>{

return <div className="modal-overlay dark" style={{right: rightOffset??0 }}>
        <div style={{maxWidth: maxWidth??"430px"}} className="modal">
            
          <button onClick={onClose} type='button' className="modal-close">&times;</button>
            {children}
        <div className="modal-footer">
            {showButton && <button className="btn btn-primary" type="button" onClick={onConfirm}> {confirmButtonText}</button>}
        </div>
        </div>
    
      </div>
}