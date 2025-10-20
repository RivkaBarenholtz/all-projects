import { useEffect, useState } from "react";
import NewSchedule from "./NewSchedule";

export default function Schedules ()
{
   const [showNewSchedule, setShowNewSchedule ] = useState(false); 

   useEffect(()=>{}
        
    , [])

   return <>
   {
    showNewSchedule && <NewSchedule CloseNewSchedule={()=> setShowNewSchedule(false)}/>

   }
   </>
}