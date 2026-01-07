import { useState } from "react";
import { Dropdown } from "../Objects/Dropdown";
import { FilterObject } from "./FilterObject";


export const SingleSelectDropdown = ({ options, selectedOption, onChange , label, additionalContent, style}) => {

    const [show, setShow ]= useState(false);
    return <FilterObject label={label} style={style}>


        <Dropdown show={show} buttonClasses={'btn btn-secondary'} classes={'multi'} buttonContent={ <div>{selectedOption?.label?? label}▼</div>} >

       
            <> {
            options.map(x=> {
                return < div 
                  key={x.value} 
                  className="dropdown-item"
                  style={{padding:"3px"}} 
                  value={x.value}   
                  onClick={() => {onChange(x.value); setShow(!show);}} > {x.label}</div>
             })   }
             </>
           </Dropdown>
        {additionalContent}
  </FilterObject>
}