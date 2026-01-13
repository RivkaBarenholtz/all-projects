import React from "react";
import { fetchWithAuth } from "../Utilities";
import printJS from 'print-js';
export const PrintPDFButton = ({transaction}) => {
const handlePrint = async () => {
  try {
    // Fetch Base64 PDF from API
    let blob = await fetchWithAuth("generate-receipt", transaction,false, true);

   
    // Create download link
    const url = window.URL.createObjectURL(blob);
       printJS({
        printable: url,
        type: 'pdf',
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


  return <button className="btn btn-secondary" type="button" onClick={handlePrint}>Print Receipt</button>;
};

export const DownloadPDFButton = ({transaction}) => {
const handleDownload = async () => {
  try {
    // Fetch Base64 PDF from API
    let blob = await fetchWithAuth("generate-receipt", transaction,false, true);

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
  return <button className="btn btn-secondary" type="button" onClick={handleDownload}>Download Receipt</button>;
}
