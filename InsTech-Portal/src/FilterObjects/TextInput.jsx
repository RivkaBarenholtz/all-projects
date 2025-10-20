import { FilterObject } from "./FilterObject"


export const TextInput =({label, onChange})=>
{
    return   <FilterObject label={label}>
              <input className="filter-input" type='text' onChange={(e) => onChange(e.target.value)}/>
            </FilterObject>
}
