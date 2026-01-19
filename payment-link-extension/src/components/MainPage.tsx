import { useState, useEffect } from "react";
import { PaymentModal } from "./PaymentModal";
import { Login } from "./Login";
import { cognitoService } from "../services/cognitoService";

interface MainPageProps {
    onClose: () => void;
    subdomain: string;
    isDev: boolean
}

export const MainPage: React.FC<MainPageProps> = ({isDev,  onClose, subdomain }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const authenticated = await cognitoService.isAuthenticated();
        setIsAuthenticated(authenticated);
        setLoading(false);
    };

    const handleSignOut = async () => {
        console.log("Sign out button clicked");
        await cognitoService.signOut();
        setIsAuthenticated(false);
    };

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="body-class">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-lg">Loading...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="body-class">
                <div className="header">
                    <div className="logo">
                        <img src="https://insure-tech-vendor-data.s3.us-east-1.amazonaws.com/logos/InsTechLogo.png" style={{ height: '100px' }} alt="Logo" />
                    </div>
                    <div className="flex gap-2 items-center">
                        {isAuthenticated && (
                            <button
                                className="cancel-out"
                                onClick={handleSignOut}
                                style={{
                                    fontSize: "14px",
                                    right: "40px",
                                    width: "100px",
                                    textDecoration: "underline"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d1d5db'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                            >
                                Sign Out
                            </button>
                        )}
                        <button onClick={onClose} className="cancel-out">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Show Login or PaymentModal based on auth status */}
                {isAuthenticated ? (
                    <PaymentModal subdomain={subdomain} isDev={isDev} setIsAuthenticated={setIsAuthenticated}/>
                ) : (
                    <Login onLoginSuccess={checkAuth} />
                )}
            </div>
        </div>
    );
};