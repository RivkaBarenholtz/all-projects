import { useState, useEffect, useRef } from "react"

export const ColumnDropdown = (
    {
        headerList,
        setHeaderList
    }
) => {
    const dropdownRef = useRef(null);
    useEffect(() => {
        if (headerList?.length) {
            setCheckedItems(
                headerList
                    .filter(hi => hi.Show)
                    .map(obj => obj.Value)
            );
        }
    }, [headerList]);

    useEffect(() => {
        function handleClickOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowColumnDropdown(false);
        }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const [checkedItems, setCheckedItems] = useState([])
    const [showColumnDropdown, setShowColumnDropdown] = useState(false);


    const CheckColumn = (columnValue) => {
        checkedItems.includes(columnValue) ?
            setCheckedItems(checkedItems.filter(a => a != columnValue)) :
            setCheckedItems([...checkedItems, columnValue]);
    }

    const SetColumnsToDisplay = () => {
        const newHeaderList = headerList.map((hl) => { return { ...hl, Show: checkedItems.includes(hl.Value) } });
        setHeaderList(newHeaderList);
    }
    return <div className="dropdown-container">
        <button 
            className="btn btn-secondary" 
            type="button" 
            onClick={()=>setShowColumnDropdown(!showColumnDropdown)}
        >Columns
        </button>

        { showColumnDropdown && (<div className="dropdown-list column" ref={dropdownRef}>
            <div>
                <button type='button' className="btn btn-apply" onClick={SetColumnsToDisplay}>
                    Reset Columns
                </button>
            </div>
            <ul>
                {
                    headerList.map((header, index) => {
                        return <li key={`${index}-${header.Value}`}>
                            <input className="" type="checkbox" checked={checkedItems.includes ? checkedItems.includes(header.Value) : true} onChange={() => CheckColumn(header.Value)} />
                            {header.DisplayValue}
                        </li>
                    })
                }
            </ul>

        </div>)
        }
    </div>
}