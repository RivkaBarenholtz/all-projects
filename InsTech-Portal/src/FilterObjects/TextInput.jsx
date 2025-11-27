import { FilterObject } from "./FilterObject"


export const TextInput =({label, onChange, close , showClose})=>
{
    return   <FilterObject label={label}  close = {close} showClose={showClose}>
              <input className="filter-input" type='text' onChange={(e) => onChange(e.target.value)}/>
            </FilterObject>
}
