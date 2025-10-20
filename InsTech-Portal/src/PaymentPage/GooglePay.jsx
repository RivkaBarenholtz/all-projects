// components/GooglePayButton.js
import React from "react";
import GooglePayButton from "@google-pay/button-react";
import {  BaseUrl } from '../Utilities';
import { useNavigate } from 'react-router-dom';


const GooglePay = ({amount, surcharge, AccountID, invoiceID , csrCode, csrEmail, captchaToken, cardHolderName, zip}) => {
    const navigate = useNavigate();
    
    
    const paymentRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: "CARD",
        parameters: {
          allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
          allowedCardNetworks: ["VISA", "MASTERCARD", "AMEX", "DISCOVER"],
        },
        tokenizationSpecification: {
          type: "PAYMENT_GATEWAY",
          parameters: {
            gateway: "cardknox", 
            gatewayMerchantId: "googletest", // cardknoxprod
          },
        },
      },
    ],
    merchantInfo: {
      merchantId: "BCR2DN7TZCVKN4RB", // Required for PRODUCTION
      merchantName: "Insure Tech",
    },
    transactionInfo: {
      totalPriceStatus: "FINAL",
      totalPrice: (parseFloat(amount) + (amount * surcharge)).toFixed(2),
      currencyCode: "USD",
    },
  };

  const handlePaymentData = async(paymentData) => {
    const token = paymentData.paymentMethodData.tokenizationData.token;
    console.log("Google Pay token:", token);

    let request = {
        Amount : paymentRequest.transactionInfo.totalPrice, 
        Subtotal: amount,
        Surcharge:surcharge, 
        CardNumber: token,
        AccountID: AccountID,
        FirstName: cardHolderName, 
        Zip:zip, 
        InvoiceNumber: invoiceID, 
        CSRCode:csrCode, 
        CSREmail:csrEmail, 
        CaptchaToken:captchaToken,
        isDevelopment:import.meta.env.DEV
      };

    // Send the token to your backend
    const response = await fetch(`${BaseUrl()}/pay/make-digital-payment`, {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json' }
    });
   const json = await response.json();
   if(json.xStatus == "Approved")
    {
        navigate("/thank-you")
    }
   
  };

  return (
    <GooglePayButton
      environment={import.meta.env.DEV?"TEST":"PRODUCTION" }
      buttonSizeMode="fill"
      paymentRequest={paymentRequest}
      onLoadPaymentData={handlePaymentData}
      onError={(err) => console.error("Google Pay error:", err)}
    />
  );
};

export default GooglePay;
