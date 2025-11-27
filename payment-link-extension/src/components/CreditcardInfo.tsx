import { useRef, useState, useEffect, Dispatch, SetStateAction } from "react"

import { CARD_TYPE, CVV_TYPE } from "@cardknox/react-ifields"

import Select, { SingleValue } from "react-select";
import CardnoxField from "./CardnoxField";

export interface OptionType {
    value: string;
    label: string;
}

interface Vendor {
    CardknoxIFeildsKey?: string;
}

interface TokenData {
    xToken: string;
}

interface IfieldKeyPressData {
    lastIfieldChanged: string;
    cardNumberIsValid?: boolean;
    cvvIsValid?: boolean;
}

interface CreditCardInfoProps {
    setCvvToken: Dispatch<SetStateAction<string>>;
    setCardToken: Dispatch<SetStateAction<string>>;
    ccValid: boolean;
    setCcValid: Dispatch<SetStateAction<boolean>>;
    cvvValid: boolean;
    setCvvValid: Dispatch<SetStateAction<boolean>>;
    expMonth: SingleValue<OptionType>;
    setExpMonth: Dispatch<SetStateAction<SingleValue<OptionType>>>;
    expYear: SingleValue<OptionType>;
    setExpYear: Dispatch<SetStateAction<SingleValue<OptionType>>>;
    submitPressed: boolean;
    subdomain?: string;
}

// Extend Window interface for global functions
declare global {
    interface Window {
        ck3DS: {
            verifyTrans: (verifyData: any) => void;
        };
    }
    function addIfieldKeyPressCallback(callback: (data: IfieldKeyPressData) => void): void;
}

export const CreditCardInfo = ({
    setCvvToken,
    setCardToken,
    ccValid,
    setCcValid,
    cvvValid,
    setCvvValid,
    expMonth,
    setExpMonth,
    expYear,
    setExpYear,
    submitPressed,
    subdomain
}: CreditCardInfoProps) => {
    const [vendor, setVendor] = useState<Vendor>({});
    const [issuer, setIssuer] = useState<string>('');

    const cardRef = useRef<any>();
    const cvvRef = useRef<any>();

    useEffect(() => {
        // Function to fetch data from your API
          const fetchData = async () => {
            try {
                const response = await fetch(`https://${subdomain}.instechpay.co/pay/get-vendor`);
                const data = await response.json();
                setVendor(data);
            } catch (err) {
                console.error("Vendor fetch failed:", err);
            }
        };
        fetchData();
    }, []);

    const onCardToken = (data: TokenData) => {
        setCardToken(data.xToken);
    };

    const onCvvToken = (data: TokenData) => {
        setCvvToken(data.xToken);
    };

    addIfieldKeyPressCallback(function (data: IfieldKeyPressData) {
        if (data.lastIfieldChanged === 'card-number' && data.cardNumberIsValid !== undefined) {
            setCcValid(data.cardNumberIsValid);
            if (!data.cardNumberIsValid)
                setCardToken('');
        }
        if (data.lastIfieldChanged === 'cvv' && data.cvvIsValid !== undefined) {
            setCvvValid(data.cvvIsValid);
            if (!data.cvvIsValid)
                setCvvToken('');
        }
    });

    const verify3DS = (verifyData: any) => {
        window.ck3DS.verifyTrans(verifyData);
    }

    const customStyles = {
        menuList: (provided: any) => ({
            ...provided,
            maxHeight: '150px',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
        }),
        menu: (provided: any) => ({
            ...provided,
            overflow: 'hidden',
            maxWidth: '5ch'
        }),
        control: (provided: any) => ({
            ...provided,
            maxWidth: '12ch',
            minWidth: '90px',
            padding: '4px 0px'
        }),
    };

    const months: OptionType[] = [
        { value: "01", label: "01" },
        { value: "02", label: "02" },
        { value: "03", label: "03" },
        { value: "04", label: "04" },
        { value: "05", label: "05" },
        { value: "06", label: "06" },
        { value: "07", label: "07" },
        { value: "08", label: "08" },
        { value: "09", label: "09" },
        { value: "10", label: "10" },
        { value: "11", label: "11" },
        { value: "12", label: "12" },
    ];

    const currentYear = new Date().getFullYear();

    const years: OptionType[] = Array.from({ length: 11 }, (_, i) => {
        const fullYear = currentYear + i;
        const twoDigitYear = (fullYear % 100).toString().padStart(2, '0');
        return { value: twoDigitYear, label: fullYear.toString() };
    });

    return <>
        {vendor.CardknoxIFeildsKey &&
            <>
                <div className="form-group">
                    <label className="form-label">Card Number:</label>
                    <CardnoxField
                        ifieldType={CARD_TYPE}
                        onToken={onCardToken}
                        onIssuer={setIssuer}
                        handle3DSResults={verify3DS}
                        onFocusedChanged={() => { }}
                        ref={cardRef}
                        className={` ${!ccValid ? 'invalid' : ''} ifields`}
                        ifieldsKey={vendor.CardknoxIFeildsKey}
                    />
                    {!ccValid && <div className="toast show" id="toast-for-cardnumber">Valid card number required.</div>}
                </div>

                <div className="form-row">
                    <div className="form-group form-col">
                        <label className="form-label">MM:</label>
                        <Select
                            inputId="month"
                            options={months}
                            value={expMonth}
                            onChange={setExpMonth}
                            isClearable={false}
                            placeholder=""
                            styles={customStyles}
                            components={{
                                IndicatorSeparator: () => null
                            }}
                            className={`${expMonth === null ? "invalid" : ""} select-input`}
                        />
                        {expMonth === null && submitPressed ? <div className="toast show" id="toast-for-expMonth">Exp month required.</div> : ''}
                    </div>

                    <div className="form-group ">
                        <label className="form-label">YY:</label>
                        <Select
                            inputId="year"
                            options={years}
                            value={expYear}
                            onChange={setExpYear}
                            isClearable={false}
                            placeholder=""
                            styles={{
                                ...customStyles,
                                control: (provided: any, state: any) => ({
                                    ...customStyles.control(provided),
                                    minWidth: '100px'
                                }),
                                menu: (provided: any, state: any) => ({
                                    ...customStyles.menu(provided),
                                    minWidth: '8ch'
                                })
                            }}
                            className={`${expYear === null ? "invalid" : ""} select-input`}
                            classNamePrefix="Select"
                            components={{
                                IndicatorSeparator: () => null
                            }}
                        />
                        {expYear === null && submitPressed ? <div className="toast show" id="toast-for-expYear">Exp year required.</div> : ''}
                    </div>

                    <div className="form-group form-col">
                        <label className="form-label">CVV:</label>
                        <CardnoxField
                            ifieldType={CVV_TYPE}
                            issuer={issuer}
                            onToken={onCvvToken}
                            ref={cvvRef}
                            className={`${!cvvValid ? 'invalid' : ''}  ifields`}
                            ifieldsKey={vendor.CardknoxIFeildsKey}
                            onFocusedChanged={() => { }}
                        />
                        {!cvvValid && <div className="toast show" id="toast-for-cvv">Valid CVV required.</div>}
                    </div>
                </div>
            </>
        }
    </>
}