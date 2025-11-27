import { Copy } from "lucide-react"
import { useSuccessModal } from "../Objects/SuccessModal";


export const CopyIcon = ({copyText, title})=> 
{
    const {showSuccess, SuccessModal}= useSuccessModal();
    return <><span 
        title={title}
        onClick={()=>{ navigator.clipboard.writeText(copyText); showSuccess("...Coppied") }}
        style= {{    background: "rgb(233 233 235)",
        padding: "3px 3px 0px 3px",
        borderRadius: "3px",
        margin: "7px"
    }}>
        <Copy size={15}/>
        
        
    </span>
    <SuccessModal/>
    </>
}