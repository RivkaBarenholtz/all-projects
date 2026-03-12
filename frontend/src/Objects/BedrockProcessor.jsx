import { useState, useEffect } from "react";
import { fetchWithAuth } from "../Utilities";
import   Loader from "../PaymentPage/Loader"

export function TextractBedrockProcessor({ jobId , bedrockResult, setBedrockResult}) {
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState(null);

  function extractJsonArray(text) {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array found");

    return JSON.parse(match[0]);
    }

  useEffect(() => {
    if (!jobId) return;

    
    const pollTextract = async () => {
      try {
        const res = await fetchWithAuth("get-textract-result", { jobId });
        const jobStatus = res.status; // "SUCCEEDED", "IN_PROGRESS", "FAILED"
        setStatus(jobStatus);

        if (jobStatus === "SUCCEEDED") {
          
          // Call backend to analyze with Bedrock
          const bedrockRes = await fetchWithAuth("get-bedrock-result", { jobId });
          const rawText = bedrockRes.content[0]?.text    ?? "";
          const bedrockResJson = extractJsonArray(rawText);
          const result = Array.isArray(bedrockResJson) ? bedrockResJson[0] : bedrockResJson;
          setBedrockResult(result); // JSON returned from Bedrock's response
          console.log("Bedrock Result:", result);
        } else if (jobStatus === "FAILED") {
          setError("Textract job failed");
        }
        else {
             setTimeout(pollTextract, 1000);
        }
        // else still in progress, wait for next poll
      } catch (err) {
        
        setError(err.message || "Error polling Textract");
      }
    };

    

    // Call immediately on mount
    pollTextract();

   
  }, [jobId]);

  if (error) return <div>Error: {error}</div>;
  if (!bedrockResult && !error)
    return <div style={{ display: 'flex',justifyContent:"center", overflow:"hidden", alignItems: 'center', gap: '0.5rem' , zIndex: 100000, background: "#ffffff", position: "absolute", width: "100%", height:"100%" }}>
        <Loader/>

         Analyzing document... 
         
         </div>;
  
  return null;
}