

export const FilterObject= ({label, children})=>
    {
        return <div className="filter-group">
            <label className="filter-label">{label} </label>
            {children}
        </div>
    }