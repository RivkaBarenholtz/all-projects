import { useState } from "react";
import { SchedulingInfo } from "./SchedulingInfo";

export const EditSchedule = ({
    formData , handleScheduleChange 
}) =>{

    const [submitPressed, setSubmitPressed] = useState(false);
    

    return <SchedulingInfo 
        formData={formData} 
        submitPressed={submitPressed}  
        handleChange={handleScheduleChange}
        mode={"edit"}/>
}