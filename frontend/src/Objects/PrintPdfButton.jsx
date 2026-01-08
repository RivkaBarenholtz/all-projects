import React from "react";
import { fetchWithAuth } from "../Utilities";
const PrintPDFButton = ({transaction}) => {
const handlePrint = async () => {
  try {
    // Fetch Base64 PDF from API
    let base64Pdf = await fetchWithAuth("generate-receipt", transaction, true);

    // Clean Base64 string: remove whitespace and handle URL-safe variants
    base64Pdf = base64Pdf.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');

    // Convert Base64 to Uint8Array
    const base64ToUint8Array = (base64) => {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    };

    const byteArray = base64ToUint8Array(base64Pdf);

    // Create Blob and object URL
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    // Print using iframe
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(iframe);
      }, 1000);
    };
  } catch (error) {
    console.error("Error printing PDF:", error);
  }
};


  return <button className="btn btn-secondary" type="button" onClick={handlePrint}>Print Receipt</button>;
};

export default PrintPDFButton;
