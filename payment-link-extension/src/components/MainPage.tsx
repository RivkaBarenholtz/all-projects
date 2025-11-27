import { useState } from "react";
import { PaymentModal } from "./PaymentModal";

interface MainPageProps {
    onClose: () => void;
    subdomain: string
}

export const MainPage: React.FC<MainPageProps> = ({ onClose, subdomain }) => {
    // const [activeTab, setActiveTab] = useState("payment")
    // const [lookupCode, setLookupCode] = useState("")

    return <div className="modal-overlay">
        <div className="body-class">
            <div className="header">
                <div className="logo">
                    <img src="https://www.instech360.com/InsureTech360.svg" style={{ height: '100px' }} alt="Logo" />
                </div>
                <button onClick={onClose} className="cancel-out">
                    <i className="fas fa-times"></i>
                </button>

                
            </div>
{/* 
            <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'payment' ? 'active' : ''}`}
                        onClick={() => setActiveTab('payment')}
                    >
                        Payment Link
                    </button>
                    <button
                        className={`tab ${activeTab === 'collect' ? 'active' : ''}`}
                        onClick={() => setActiveTab('collect')}
                    >
                        Collect Payment
                    </button>
                </div> */}

                {/* Tab Content */}
                {/* <div className="tab-content">
                    {activeTab === 'payment' && <PaymentModal subdomain={subdomain} setLookupCode={setLookupCode} />}
                    {activeTab === 'collect' && <CollectPaymentModal subdomain={subdomain} lookupCode={lookupCode} />}
                </div> */}

                 <PaymentModal subdomain={subdomain}  />
        </div>
    </div>
}