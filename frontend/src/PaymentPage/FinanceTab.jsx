import React, { useState, useEffect, forwardRef } from 'react';
import { fetchWithAuth, FormatCurrency } from '../Utilities';
import {SingleSelectDropdown}  from '../FilterObjects/SingleSelectDropdown';
import ReCAPTCHA from "react-google-recaptcha";

export const FinanceTab = ({ submitPressed, setSubmitPressed, 
    amount }) => {
        const [captchaToken, setCaptchaToken] = useState('');
        const [monthlyPayment, setMonthlyPayment] = useState(0);
        const [selectedOption   , setSelectedOption] = useState(null);
        const [financeAgreements , setFinanceAgreements] = useState([
            { 
                label: "18 Month Finance Agreement",
                InterestRate: 0.125,
                CompoundFrequency: "Monthly",
                TermMonths: 18, 
                MinimumAmount: 500, 
                DownpaymentPercentage: 0.3

            },
            { 
                label: "12 Month Finance Agreement",
                InterestRate: 0.12,
                CompoundFrequency: "Monthly",
                TermMonths: 12, 
                MinimumAmount: 500, 
                DownpaymentPercentage: 0.3

            },
            { 
                label: "6 Month Finance Agreement",
                InterestRate: 0.10,
                CompoundFrequency: "Monthly",
                TermMonths: 10, 
                MinimumAmount: 500, 
                DownpaymentPercentage: 0.3

            }
        ]);
         
        const calculateMonthlyPayment = (total, downPayment, annualInterestRate, termMonths, compoundFrequency) => {
            const monthlyInterestRate = annualInterestRate / 12;
            const numberOfPayments = termMonths;
            const principal = total - downPayment;
            const totalEndingBalance = principal * Math.pow(1 + monthlyInterestRate, numberOfPayments);
            const monthlyPayment = totalEndingBalance / numberOfPayments;
            return monthlyPayment.toFixed(2);
        }




    return <div style={{ textAlign: "left", fontSize: "12px" }}>
        <h3> Finance Options</h3>
        
        <SingleSelectDropdown defaultText={"Select Option"} label={ ""} options={ financeAgreements.map(x=> {return {label: x.label, value: x}})} selectedOption={selectedOption} onChange={(x) => setSelectedOption(x)} />
        {selectedOption && <>
        <div style={{marginTop: "15px"}}>
           Down Payment Amount: 
            {FormatCurrency(amount * selectedOption.DownpaymentPercentage)}
            </div>
            <div style={{marginTop: "15px"}}>
            Estimated Monthly Payment: 
            ${calculateMonthlyPayment(amount, amount * selectedOption.DownpaymentPercentage, selectedOption.InterestRate, selectedOption.TermMonths, selectedOption.CompoundFrequency)}
            </div>
            </>
        }
        
      

        <div style={{ padding: "25px" }} >
            <ReCAPTCHA
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
            />
            {(captchaToken == '' || captchaToken == null) && submitPressed ? <div className="toast show" id="toast-for-recap">Recaptcha check required.</div> : ''}

        </div>
        {/* 
            <div className="form-group">
                <label className="form-label-bold">Date Sent</label>
                <input
                    type="date"
                    id="date-sent"
                    name="date-sent"
                    className={`form-input`}
                    onChange={(e) => setDate(e.target.value)}
                />
              
            </div> */}


        <div className="button-spaced mt-3">
            {<button className="btn btn-primary" type="button"  >
                Request Finance Agreement 
            </button>}
        </div>
    </div>
}   
