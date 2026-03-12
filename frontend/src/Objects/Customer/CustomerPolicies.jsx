import { useEffect, useState } from "react";
import { fetchWithAuth, FormatCurrency } from "../../Utilities";
import { Policy } from "../NewPolicy";
import { useSuccessModal } from "../../Objects/SuccessModal";

export default function CustomerPolicies({ customer, customerId }) {


   const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPolicy, setShowNewPolicy] = useState(false);

   const {showSuccess, SuccessModal}= useSuccessModal();


   const loadPolicies = async () => {
      setLoading(true);

      try {
        const data = await fetchWithAuth(`get-customer-policies?customerid=${customerId}`);
        setPolicies(data);
      } catch (err) {
        console.error("Failed to load policies", err);
      }

      setLoading(false);
    };


  useEffect(() => {
    if (!customerId) return;
    console.log(customer)
   
    loadPolicies();
  }, [customerId]);

  function ShowSuccessfulNewPolicy() {
      setShowNewPolicy(false);
      showSuccess("Successfully created new policy"  )
      loadPolicies(); 
   }

  if (loading) return <div>Loading policies...</div>;
  if (!policies.length) return <div>No policies found.</div>;

  return (
    <>
    { showNewPolicy && <Policy Close={() => setShowNewPolicy(false)} policy={{Customer: customer}} OnSuccess={ShowSuccessfulNewPolicy} hideCustomer={true} />}
     <SuccessModal/>
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {policies.map((policy) => (
        <div
        key={policy.PolicyCode}
        style={{
            background: "white",
            borderRadius: "12px",
            padding: "18px 20px",
            boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
            maxWidth: "420px"
        }}
        >
          {/* Header */}
           <div
                style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px"
                }}
            >
                <div style={{ fontWeight: 600, fontSize: "16px", color: "#444" }}>
                    {policy.PolicyCode} — {policy.PolicyDescription}
                  </div>
                  <div
                    style={{
                        fontWeight: 700,
                        fontSize: "22px",
                        color: "#2563eb"
                    }}
                    >
                    {FormatCurrency(policy.Amount)}
                </div>

          </div>

          <div
            style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            rowGap: "10px",
            alignItems: "center"
            }}
        >
            <div style={{ color: "#777" }}>Carrier</div>
            <div style={{ fontWeight: 600 }}>{policy.CarrierName}</div>

            <div style={{ color: "#777" }}>Commission</div>
            <div style={{ fontWeight: 600 }}>{FormatCurrency(policy.CommissionAmount)}</div>
            

            <div style={{ color: "#777" }}>Balance</div>
            <div style={{ fontWeight: 600 }}>{FormatCurrency(policy.Amount - policy.PaidByCustomer??0)}</div>

        </div>
        </div>
      ))}
      <button className="btn btn-primary" type="button" onClick={()=> setShowNewPolicy(true)}>
        New Policy
      </button>
    </div>
    </>
  );
}