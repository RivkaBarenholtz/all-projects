export const ConfirmationModal = ({onClose , onConfirm , children, confirmButtonText, loading, showButton=true})=>{

return <div className="modal-overlay dark">
        <div className="modal confirm">
            
          <button onClick={onClose} type='button' className="modal-close">&times;</button>
            {children}
        <div className="modal-footer">
            {showButton && <button className="btn btn-primary" type="button" onClick={onConfirm}> {confirmButtonText}</button>}
        </div>
        </div>
    
      </div>
}