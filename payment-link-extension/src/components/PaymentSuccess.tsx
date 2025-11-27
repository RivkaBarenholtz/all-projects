import { useEffect } from 'react';


interface PaymentSuccessProps {
  amount: number;
}
export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ amount }) => {
  useEffect(() => {
    // Close window after 3 seconds (3000 milliseconds)
    const timer = setTimeout(() => {
      window.close();
    }, 3000);

    // Cleanup timer if component unmounts
    return () => clearTimeout(timer);
  }, []);

  return (
      <div className="success-overlay">
      <div className="success-card">
        <div className="checkmark">
         <i className="fa-solid fa-check"></i>
        </div>
        <div className="success-message">Payment Successful!</div>
        {amount && (
          <div className="success-details">
            Amount: ${amount.toFixed(2)}
          </div>
        )}
        <div className="success-details" style={{ marginTop: '10px', fontSize: '14px' }}>
          This window will close automatically...
        </div>
      </div>
    </div>
  );
};