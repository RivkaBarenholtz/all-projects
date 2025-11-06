

export const FilterObject= ({label, children, style})=>
    {
        return <div className="filter-group" style={style}>
            <label className="filter-label">{label} </label>
            {children}
        </div>
    }