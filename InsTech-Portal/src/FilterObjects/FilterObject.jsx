import { X } from "lucide-react"

export const FilterObject= ({label, children, style, showClose , close})=>
    {
        return <div className="filter-group" style={style}>
            <label className="filter-label">{label} { showClose &&  <X size={14} onClick={close} />} </label>
            {children}
        </div>
    }