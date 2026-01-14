import React from "react";
import { fetchWithAuth } from "../Utilities";
import printJS from 'print-js';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
//import { faEnvelope } from "@fortawesome/free-regular-svg-icons";
import { faPrint, faEnvelope, faDownload } from "@fortawesome/free-solid-svg-icons";
export const PrintPDFButton = ({ transaction }) => {
  const handlePrint = async () => {
    try {
      // Fetch Base64 PDF from API
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
    }

    // try {
    //   // Fetch Base64 PDF from API

    //   // Print using iframe

    // } catch (error) {
    //   console.error("Error printing PDF:", error);
    // }
  };


  return <ReceiptButton onClick={handlePrint} label={<><FontAwesomeIcon icon={faPrint} />Print Receipt</>}/>;;
};

export const DownloadPDFButton = ({ transaction }) => {
  const handleDownload = async () => {
    try {
      // Fetch Base64 PDF from API
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
    }
  };
  return <ReceiptButton onClick={handleDownload} label={<><FontAwesomeIcon icon={faDownload} />Download</>}/>;
}

export const ReceiptButton =({onClick, label})=>{
    return <button style={{flex:1, justifyContent: "center"}} className="btn btn-secondary" type="button" onClick={onClick}>{label}</button>;

}
