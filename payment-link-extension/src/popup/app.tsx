import React, { useEffect } from "react";
import { CollectPaymentModal } from "../components/CollectPaymentModal";
import '../../styles/fonts.css';

const App: React.FC = () => {
    const params = new URLSearchParams(window.location.search);
    const subdomain = params.get('subdomain') || '';
    const lookupCode = params.get('customerid') || '';
    const clientName = params.get('clientName') || '';
    const amount = params.get('amount') || '';
  useEffect(() => {
    
  }, []);

  return <CollectPaymentModal 
    subdomain={subdomain} 
    lookupCode={lookupCode} 
    clientName={clientName} 
    amount={Number(amount)} />;
};

export default App;
