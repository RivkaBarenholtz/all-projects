import React from "react";
import { fetchWithAuth } from "../Utilities";
import printJS from 'print-js';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
//import { faEnvelope } from "@fortawesome/free-regular-svg-icons";
import { faPrint, faEnvelope, faDownload } from "@fortawesome/free-solid-svg-icons";
export const PrintPDFButton = ({ transaction }) => {
  const [loading, setLoading] = React.useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      let blob = await fetchWithAuth("generate-receipt", transaction, false, true);


      // Create download link
      const url = window.URL.createObjectURL(blob);
      printJS({
        printable: url,
        type: 'pdf',
        showModal: true,
        onPrintDialogClose: () => {
          window.URL.revokeObjectURL(url);
        }
      });

      console.log('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return <ReceiptButton onClick={handlePrint} disabled={loading} label={loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><FontAwesomeIcon icon={faPrint} />Print</>} />;
};

export const DownloadPDFButton = ({ transaction }) => {
  const [loading, setLoading] = React.useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      let blob = await fetchWithAuth("generate-receipt", transaction, false, true);

      // Create download link       
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `Receipt_${transaction.xRefNum}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      console.log('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return <ReceiptButton onClick={handleDownload} disabled={loading} label={loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><FontAwesomeIcon icon={faDownload} />Download</>} />;
}

export const ReceiptButton =({onClick, label, disabled})=>{
    return <button disabled={disabled} style={{...{flex:1, justifyContent: "center"}, ... {
  background: '#148DC2',
  color: '#fff',
  padding: '10px',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '15px',
  fontWeight: 200,
  width: '20px',
  borderRadius: '7px',
  height: 'fit-content',
}}}  type="button" onClick={onClick}>{label}</button>;

}
