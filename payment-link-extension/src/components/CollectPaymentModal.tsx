import React from "react"
import PaymentTabs from "./PaymentTabs"
import { useState, useEffect } from "react"
import { CreditCardInfo, OptionType } from "./CreditcardInfo"
import { CheckingInfo } from "./CheckingInfo"
import { ApiService, createTransaction } from "../utils/api"
import { Dropdown } from "./UI/Dropdown"
import { SingleValue, } from "react-select"
import { PaymentSuccess } from "./PaymentSuccess"
import { ConfirmationModal } from "./ConfimationModal"
import { Trash } from 'lucide-react';



interface CollectPaymentModalProps {
    subdomain: string;
    lookupCode: string;
    clientName?: string;
    amount: number,
    surchargePercent?: number;
    isDev: boolean
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({ isDev, subdomain, lookupCode, clientName, amount, surchargePercent }) => {


    const [activeTab, setActiveTab] = useState("Credit Card")
    const [cvvToken, setCvvToken] = useState("")
    const [cardToken, setCardToken] = useState("")
    const [expMonth, setExpMonth] = useState<SingleValue<OptionType>>(null);
    const [expYear, setExpYear] = useState<SingleValue<OptionType>>(null);
    const [ccValid, setCcValid] = useState(true)
    const [cvvValid, setCvvValid] = useState(true)

    const [deleteMethod, setDeleteMethod] = useState<any | null>(null);

    const [paymentMethod, setPaymentMethod] = useState<any>(null);
    const [selectedMethod, setSelectedMethod] = useState<any>({});

    const [paymentAmount, setPaymentAmount] = useState<number>(amount);
    const [transferFee, setTransferFee] = useState<number>(surchargePercent? surchargePercent * 100 : 3.5);


    const [accountName, setAccountName] = useState("")
    const [accountNumber, setAccountNumber] = useState("")
    const [accountType, setAccountType] = useState("")
    const [routingNumber, setRoutingNumber] = useState("")

    const [submitPressed, setSubmitPressed] = useState(false)

    const [saveMethod, setSaveMethod] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);


    const service = new ApiService(isDev,subdomain);

    async function getPaymentMethods(accountCode: string) {
        const methods = await service.listPaymentMethods(accountCode, subdomain);
        setPaymentMethod(methods);
        if (methods.length > 0) {
            setSelectedMethod(methods[0])
        }
        else setSelectedMethod({ value: "new", MaskedAccountNumber: " + New" })
    }


    useEffect(() => {



        getPaymentMethods(lookupCode)



    }, [])

    useEffect(() => {
        if (paymentMethod && paymentMethod.length > 0) {
            let method = paymentMethod.find((m: any) => m.IsDefault);
            setSelectedMethod(method);
        }
        else setSelectedMethod({ value: "new", MaskedAccountNumber: " + New" })
    }, [paymentMethod]);

    const SubmitPayment = async () => {
        setSubmitPressed(true);
        const paymentInfo = getPaymentInfo();
        console.log("Payment Info: ", paymentInfo);
        const response = await createTransaction(paymentInfo, subdomain, (activeTab == "eCheck" && selectedMethod.value == "new") || selectedMethod.CardType == "ACH");

        if (response) {
            if (response.xStatus != "E")
                setPaymentSuccess(true);
            else {
                alert("Payment Failed")
            }
        }
    }

    const isCheck: () => boolean = () => {
        return ((activeTab == "eCheck" && selectedMethod?.value == "new") || selectedMethod?.CardType == "ACH")
    }

    const getPaymentInfo = () => {
        if (selectedMethod?.value === "new") {
            if (activeTab === "Credit Card") {
                return {
                    CardNumber: cardToken,
                    Cvv: cvvToken,
                    ExpDate: expMonth && expYear ? `${expMonth.value}${expYear.value}` : undefined,
                    AccountId: lookupCode,
                    Subtotal: paymentAmount,
                    Surcharge: paymentAmount * transferFee / 100,
                    SavePaymentMethod: saveMethod
                }
            }
            else if (activeTab === "eCheck") {

                return {
                    AccountName: accountName,
                    AccountNumber: accountNumber,
                    RoutingNumber: routingNumber,
                    AccountId: lookupCode,
                    Amount: paymentAmount,
                    AccountType: accountType,
                    SavePaymentMethod: saveMethod
                }
            }
        } else {
            return {
                Token: selectedMethod?.Token,
                Amount: paymentAmount,
                AccountId: lookupCode,
                Subtotal: paymentAmount,
                Surcharge: paymentAmount * transferFee / 100,
            }
        }
    }


    const getCardIcon = (type: string) => {
        const cardType = (type || "").toLowerCase();


        switch (cardType) {
            case "visa":
                return (
                    <svg width="40" height="24" viewBox="0 0 40 24">
                        <rect width="40" height="24" rx="4" fill="#1a1f71" />
                        <text x="8" y="16" fill="white" fontFamily="Arial" fontWeight="bold">
                            VISA
                        </text>
                    </svg>
                );
            case "mastercard":
                return (
                    <svg width="40" height="24" viewBox="0 0 40 24">
                        <rect width="40" height="24" rx="4" fill="white" stroke="#ccc" />
                        <circle cx="16" cy="12" r="6" fill="#EB001B" />
                        <circle cx="24" cy="12" r="6" fill="#F79E1B" />
                    </svg>
                );
            case "discover":
                return (
                    <svg width="40" height="24" viewBox="0 0 40 24">
                        <rect width="40" height="24" rx="4" fill="white" stroke="#ccc" />
                        <text x="5" y="15" fill="#ff6000" fontFamily="Arial" fontWeight="bold" fontSize="10">
                            DISCOVER
                        </text>
                    </svg>
                );
            case "amex":
            case "american express":
                return (
                    <svg width="40" height="24" viewBox="0 0 40 24">
                        <rect width="40" height="24" rx="4" fill="#2e77bc" />
                        <text x="3" y="16" fill="white" fontFamily="Arial" fontWeight="bold" fontSize="9">
                            AMEX
                        </text>
                    </svg>
                );
            default:
                return <span style={{ fontSize: "1.5em" }}>💳</span>;
        }
    }


    const tabs = {

        "Credit Card":
            <CreditCardInfo
                setCvvToken={setCvvToken}

                setCardToken={setCardToken}
                ccValid={ccValid}
                setCcValid={setCcValid}
                cvvValid={cvvValid}
                setCvvValid={setCvvValid}
                expMonth={expMonth}
                setExpMonth={setExpMonth}
                expYear={expYear}
                setExpYear={setExpYear}
                submitPressed={submitPressed}
                subdomain={subdomain}
            />

        ,
        "eCheck":
            <CheckingInfo
                accountName={accountName}
                setAccountName={setAccountName}
                accountNumber={accountNumber}
                setAccountNumber={setAccountNumber}
                accountType={accountType}
                setAccountType={setAccountType}
                routingNumber={routingNumber}
                setRoutingNumber={setRoutingNumber}
                submitPressed={submitPressed}
            />
    }

    const confirmDelete = () => {

        if( !deleteMethod.isDefault )service.deletePaymentMethod(deleteMethod.Token || "");
        else (alert ("Cannot delete default payment method"));
        // Implement deletion logic here
        setShowConfirmDelete(false);
        getPaymentMethods(lookupCode);
    }
    return <>
        {paymentSuccess && <PaymentSuccess amount={paymentAmount + (paymentAmount * (transferFee / 100))} />}
        {showConfirmDelete && <ConfirmationModal onClose={() => { setShowConfirmDelete(false); setDeleteMethod(null) }} onConfirm={confirmDelete} confirmButtonText="Delete">
            <h3> Are you sure you want to delete {selectedMethod.MaskedAccountNumber}?</h3>
        </ConfirmationModal>}
        <div className="header-ins">
            <div className="logo">
                <img src="https://insure-tech-vendor-data.s3.us-east-1.amazonaws.com/logos/InsTechLogo.png" style={{ height: '100px' }} alt="Logo" />
            </div>

        </div>

        <div className="card-header">
            <h4>

                {clientName}
                <span className="client-badge">{lookupCode}</span>
            </h4>

        </div>





        <div style={{ display: isCheck() ? "flex" : "block", gap: "25px", padding: "10px" }}>
            <div style={{ display: "flex", gap: "25px" }}>
                <div className="form-group">
                    <label> Amount </label>
                    <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} />
                </div>

                {!((activeTab == "eCheck" && selectedMethod.value == "new") || selectedMethod?.CardType == "ACH") && <>



                    <div className="form-row">
                        <div className="form-group percent-input-wrapper">
                            <label >
                                Transfer Fee:
                            </label>

                            <input
                                type="number"
                                name="transferFee"
                                min="0"
                                max="3.5"
                                step="0.01"
                                value={transferFee}
                                onChange={(e) => setTransferFee(Number(e.target.value))}
                                placeholder="0"
                            />
                            <span className="percent-sign">%</span>

                        </div>


                    </div>
                </>
                }
            </div>
            <div className="form-group">


                <label> Saved Payment Methods </label>
                <Dropdown buttonClasses="btn-2 btn-secondary" buttonContent={<>

                    <div className="details">
                        <div style={{ paddingRight: "10px" }}>{selectedMethod?.MaskedAccountNumber}</div>

                        ▼
                    </div>
                </>
                }>
                    <>
                        {paymentMethod?.length > 0 && paymentMethod?.map((method: any) => (
                            <div onClick={() => setSelectedMethod(method)} className="payment-method-div" key={method.PaymentMethodId}>
                                <div className="icon">
                                    {method.CardType === "ACH"
                                        ? <span style={{ fontSize: "1.5em" }}>🏦</span>
                                        : getCardIcon(method.CardType)}


                                </div>



                                <div className="details">
                                    <div className="masked-number">{method.MaskedAccountNumber}</div>
                                    {method.Exp && (
                                        <div className="exp-date">Exp: {method.Exp.slice(0, 2)}/{method.Exp.slice(2)}</div>
                                    )}

                                    {!method.isDefault && <a className="link-btn-pymt" onClick={async () => {

                                        let methods = await service.setDefaultPaymentMethod(method.Token, lookupCode);

                                        setPaymentMethod(methods);

                                    }}> Make Default  </a>
                                    }

                                    {
                                        method.isDefault && <span className="default-badge">Default</span>
                                    }
                                    <a className="link-btn-pymt" onClick={() => { if(method.isDefault){ alert("Cannot delete default method"); return; } setShowConfirmDelete(true); setDeleteMethod(method) }}><Trash size={14} /> </a>
                                </div>






                            </div>
                        ))}

                        <div
                            onClick={(e) => {
                                setSelectedMethod({ value: "new", MaskedAccountNumber: "+ New" })
                            }}
                            className="payment-method-div"
                        >
                            <div className="icon" >
                                <span style={{ fontSize: "1.5em" }}>+</span>
                            </div>


                            <div className="details"  >
                                <div className="masked-number">New Payment Method</div>
                            </div>
                        </div>


                    </>
                </Dropdown>

            </div>
        </div>

        {!((activeTab == "eCheck" && selectedMethod.value == "new") || selectedMethod?.CardType == "ACH") &&
            <>
                <div style={{ display: "flex", fontSize: "13px", fontWeight: 400,  padding: "0 10px" }}>
                    <label> Subtotal : </label>
                    <div> ${(paymentAmount ).toFixed(2)} </div>
                </div>
                <div style={{ display: "flex", fontSize: "13px", fontWeight: 400, padding: "0 10px" }}>
                    <label> Transfer Fee : </label>
                    <div> ${ (paymentAmount * (transferFee / 100)).toFixed(2)} </div>
                </div>
                <div style={{ display: "flex", color: "#148dc2", fontSize: "15px", fontWeight: 600, marginBottom: "15px", padding: "0 10px" }}>
                    <label> Grand Total : </label>
                    <div> ${(paymentAmount + (paymentAmount * (transferFee / 100))).toFixed(2)} </div>
                </div>
            </>
        }



        {selectedMethod?.value == "new" && <div style={{ background: "white", padding: "17px" }}>
            <PaymentTabs activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />

            <input type="checkbox" checked={saveMethod} onChange={(e) => setSaveMethod(e.target.checked)}></input>
            <label>
                Save payment method on file
            </label>
        </div>}


        <div className="form-group">
            <button onClick={SubmitPayment} style={{ width: "100%" }} type="button" className="btn-2 btn-primary" >
                Submit Payment
            </button>
        </div>
    </>

}