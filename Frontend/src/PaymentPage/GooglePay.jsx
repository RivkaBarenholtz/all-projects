// components/GooglePayButton.js
import React from "react";
import GooglePayButton from "@google-pay/button-react";
import {  BaseUrl } from '../Utilities';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';



const GooglePay = ({amount, surcharge, AccountID, invoiceID , csrCode, csrEmail, captchaToken, cardHolderName, zip}) => {
    const navigate = useNavigate();
     const { context } = useParams();
    
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
            gatewayMerchantId: import.meta.env.DEV?"googletest":"cardknoxprod"  ,
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
     const clientid =
  (context ?? "app") === "app"
    ? BaseUrl().split('.')[0].split('//')[1]
    : (context ?? "ins-dev");
    const response = await fetch(`${BaseUrl()}/pay/${clientid}/make-digital-payment`, {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json' }
    });
   const json = await response.json();
   if(json.xStatus == "Approved")
    {
        window.location.href = `https://ins-dev.instechpay.co/app/thank-you?amount=${request.Amount}`;
    }
   
  };

  return (<div style={{padding: '10px'}} >
    
    <GooglePayButton
      environment={import.meta.env.DEV?"TEST":"PRODUCTION" }
      buttonSizeMode="fill"
      paymentRequest={paymentRequest}
      onLoadPaymentData={handlePaymentData}
      onError={(err) => console.error("Google Pay error:", err)}
    />
    </div>
  );
};

export default GooglePay;
