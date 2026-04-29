export const ConfirmationModal = ({onClose , onConfirm , children, confirmButtonText, loading, showButton=true})=>{

return <div className="modal-overlay dark">
        <div className="modal confirm">
            
          <button onClick={onClose} type='button' className="modal-close">&times;</button>
            {children}
        <div className="modal-footer">
            {showButton && (
                <button className="btn btn-primary" type="button" onClick={onConfirm} disabled={loading}>
                    {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : confirmButtonText}
                </button>
            )}
        </div>
        </div>
    
      </div>
}