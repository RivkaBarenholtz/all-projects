import React, { useState } from 'react';
import { ColumnDropdown } from './ColumnDropdown';

export const Grid = (
  { JsonObjectList, 
    headerList, 
    edit, 
    delete: deleteFn, 
    add: addFn, 
    isSelectable , 
    title, 
    numberOfItems , 
    itemsPerPage,  
    activePage, 
    setActivePage, 
    Sort, 
    SetHeaderList, 
    rowClick, 
    footerObjects 
  }) => {
  const [expandedRows, setExpandedRows] = useState([]);
  const [startPage, setStartPage ]= useState(1);
  
  const endPage = Math.min(startPage + 9, Math.ceil(numberOfItems/itemsPerPage));
   
  const handlePrev = () => {
    setStartPage(Math.max(1, startPage - 10));
  };

  const handleNext = () => {
    const totalPages = Math.ceil(numberOfItems/ itemsPerPage)

    setStartPage(Math.min(totalPages - 10 + 1, startPage + 10));
  };


  const toggleRow = async (item) => {
    if (expandedRows.includes(item.id)) {
      setExpandedRows(expandedRows.filter((id) => id !== item.id));
    } else {
      if (!item.subData && item.getSubData) {
        await item.getSubData();
      }
      setExpandedRows([...expandedRows, item.id]);
    }
  };

  const SortByColumn = async (sortBy) =>
  {
    const HeaderItem = headerList.find(h=> h.Value == sortBy)
    Sort(HeaderItem.SortString,HeaderItem.SortAsc );
    const  newHeaderList = headerList.map(item => item === HeaderItem? { ...HeaderItem, SortAsc: !HeaderItem.SortAsc }: item );
    SetHeaderList( newHeaderList)
  }

  return (
    <div className='table-container' >
      <div className="table-header">
          <div className="table-title">{title}</div>
          
          <ColumnDropdown headerList={ headerList} setHeaderList={SetHeaderList}/>
      </div>
      <div className='table-scroller'>
      <table className='table'>
        <thead>
          <tr >
            <th></th>
            {isSelectable && <th></th>}
            {headerList.map((header) => {
              if (!header.Show) return null;
              return <th key={header.Value}>
                <a onClick={()=>{SortByColumn(header.Value)}}>{header.DisplayValue}</a>
                </th>;
            })}
            {(edit || deleteFn || addFn) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody className='table-scroller-vertical'>
          {JsonObjectList.map((item) => (
            <React.Fragment key={item.id || item.UniqueKey}>
              <tr onClick={(rowClick?()=>{rowClick(item)} : ()=>{})}>
                {isSelectable && (
                  <td className='grid'>
                    <input type="checkbox" checked={item.Selected} />
                  </td>
                )}
                <td>
                  {(item.subData || item.getSubData) && (
                    <button type="button" onClick={() => toggleRow(item)}>
                      {expandedRows.includes(item.id) ? '▼' : '▶'}
                    </button>
                  )}
                </td>
                {headerList.map((header) => {
                  if (!header.Show) return null;
                  return <td key={header.Value} >{item[header.Value]}</td>;
                })}
                {/* Uncomment if needed */}
                {/* {(edit || deleteFn || addFn) && (
                  <td>
                    {edit && <button onClick={() => edit(item)}>Edit</button>}
                    {deleteFn && <button onClick={() => deleteFn(item)}>Delete</button>}
                    {addFn && <button onClick={() => addFn(item)}>Add</button>}
                  </td>
                )} */}
              </tr>

              {expandedRows.includes(item.id) && item.subData && (
                <tr key={`sub-${item.id}`}>
                  <td colSpan={headerList.length + 2} >
                    <table className="subgrid">
                      <thead>
                        <tr>
                          {Object.keys(item.subData[0]).map((key) => (
                            <th key={key}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {item.subData.map((subItem, subIndex) => (
                          <tr key={subItem.id || subIndex}>
                            {Object.keys(subItem).map((key) => (
                              <td key={key}>{subItem[key]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      </div>
      <div className="pagination">
        {itemsPerPage && numberOfItems && activePage && <div className="pagination-info">
             Showing {(activePage-1) * itemsPerPage +1}-{Math.min((activePage-1) * itemsPerPage + itemsPerPage, numberOfItems)} of {numberOfItems} transactions
        </div>}
         {footerObjects}
        <div className="pagination-controls">

            {startPage > 1 && (
              <a onClick={handlePrev}>
                 . . . . .
              </a>
            )}

            {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
              const pageNum = startPage + i;
              return (
                <button 
                  className={`pagination-btn ${activePage==pageNum?"active":""}`} 
                  key={pageNum} 
                  onClick={()=>setActivePage(pageNum)}
                  type='button'>
                
                  {pageNum}
                </button>
              );
            })}

            {endPage < Math.ceil(numberOfItems/ itemsPerPage) && (
              <a  onClick={handleNext}>
                . . . . .
              </a>
            )}       
            
        </div>
       
    </div>
    </div>
  );
};
