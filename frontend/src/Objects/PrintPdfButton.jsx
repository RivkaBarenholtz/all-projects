import React from "react";
import { fetchWithAuth } from "../Utilities";
const PrintPDFButton = ({transaction}) => {
  const handlePrint = async () => {
    try {
      const base64Pdf = await fetchWithAuth("generate-receipt", { transaction }, true);

    
      // Decode Base64 to bytes
      const byteCharacters = atob(base64Pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Create Blob and object URL
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // Print using iframe
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);

      iframe.onload = function () {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

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
