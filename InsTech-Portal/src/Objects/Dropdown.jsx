import { useEffect, useRef, useState } from "react";


export const Dropdown =({classes, buttonContent, children, buttonClasses, show, unclick})=>{
    const dropdownRef = useRef(null);
    const [showDropdown, setShowDropdown] = useState(false);
        useEffect(() => {
                setShowDropdown(false);
                function handleClickOutside(event) {
                    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                        setShowDropdown(false);
                        if(unclick) unclick();
                    }
                }
                document.addEventListener("mousedown", handleClickOutside);
                return () => document.removeEventListener("mousedown", handleClickOutside);
            }, [show]);
        
    return <div className="dropdown-container">
        <button 
            className={buttonClasses} 
            type="button" 
            onClick={()=>setShowDropdown(!showDropdown)}
        > {buttonContent}▼
        </button>

        { showDropdown && (<div className= {`dropdown-list ${classes}`} ref={dropdownRef}>
            {children}

        </div>
        )
        }
    </div>
} 