import Select from "react-select";
import { FilterObject } from "./FilterObject";

export const SingleSelectDropdown = ({ options, selectedOption, onChange , label}) => (
    <FilterObject label={label}>
        <select
           // options={options}
            value={selectedOption?.value}
            onChange={(e)=>onChange(e.target.value) }
            className="filter-input"
           
        >
            {
             options.map(x=> {
                return < option key={x.value} value={x.value}> {x.label}</option>
             })   
            }
        </select>
  </FilterObject>
);