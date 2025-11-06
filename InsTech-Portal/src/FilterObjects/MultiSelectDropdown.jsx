import { useState, useEffect, useRef } from "react"
import { FilterObject } from "./FilterObject";

export const MultiSelectDropdown = (
  { 
      options,
      setOptions, 
      label
  }) => {
   
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);



  useEffect(() => {
      function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowDropdown(false);
      }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const OptionClick=( clickedValue)=>{
    const newOptions = options.map((a)=>{
     return ( a.value == clickedValue?  {...a, isSelected: !a.isSelected}:
      a)
    })
    setOptions(newOptions);

  } 


  
    return (
    <FilterObject label={label} >
        <div className="dropdown-container" ref={dropdownRef}>
        <button 
            className="btn btn-secondary" 
            type="button" 
            onClick={()=>setShowDropdown(!showDropdown)}
        >
          {
            options && options.length > 0
            ? `${options.filter((a) => a.isSelected).length === options.length 
                ? "All" 
                : options.filter((a) => a.isSelected).length} Statuses`
            : "0 Statuses"
            }
            
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="dropdown-arrow" 
            width="16" 
            height="16" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        { showDropdown && (<div className="dropdown-list multi" >
            
            <ul>
                {
                    options.map((option, index) => {
                        return <li key={`${index}-${option.Value}`}>
                            <input className="" type="checkbox" checked={option.isSelected} onChange={() => OptionClick(option.value)} />
                            {option.label}
                        </li>
                    })
                }
            </ul>

        </div>)
        }
    </div>
      </FilterObject>
    );
  };
  