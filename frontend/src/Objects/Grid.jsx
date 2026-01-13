import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ColumnDropdown } from './ColumnDropdown';
import { FilterPopover } from './FilterPopover';
import { FormatCurrency } from '../Utilities';

export const Grid = (
  { JsonObjectList,
    headerList,
    edit,
    delete: deleteFn,
    add: addFn,
    isSelectable,
    showTotals, 
    title,
    numberOfItems,
    itemsPerPage,
    activePage,
    setActivePage,
    Sort,
    SetHeaderList,
    rowClick,
    footerObjects,
    hideColumnDropdown,
    filters,
    setFilters,
    enableFilters = true
  }) => {
  const [expandedRows, setExpandedRows] = useState([]);
  const [startPage, setStartPage] = useState(1);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
 
  const [activeFilter, setActiveFilter] = useState(null);
  const [filterPosition, setFilterPosition] = useState({ top: 0, left: 0 });

  const scrollContainerRef = useRef(null);
  const tableBodyRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const lastScrollTimeRef = useRef(0);
  const isScrollCooldownRef = useRef(false);
  const cooldownTimeoutRef = useRef(null);
  const [rowHeight, setRowHeight] = useState(50);
  const BUFFER_SIZE = 10; // Number of extra rows to render above and below visible area
  const SCROLL_THROTTLE = 50; // Milliseconds between scroll updates
  const SCROLL_COOLDOWN = 100; // Milliseconds to wait after scroll stops before allowing new updates


  // Determine if virtual scrolling should be enabled
  const useVirtualScrolling = itemsPerPage > 100;

  useEffect(() => {
    if (scrollContainerRef.current && useVirtualScrolling) {
      setContainerHeight(scrollContainerRef.current.clientHeight);
    }
  }, [useVirtualScrolling]);

  // Measure actual row height after first render
  useEffect(() => {
    if (tableBodyRef.current && useVirtualScrolling && JsonObjectList.length > 0) {
      const firstRow = tableBodyRef.current.querySelector('tr[data-row]');
      if (firstRow) {
        const measuredHeight = firstRow.getBoundingClientRect().height;
        if (measuredHeight > 0 && measuredHeight !== rowHeight) {
          setRowHeight(measuredHeight);
        }
      }
    }
  }, [useVirtualScrolling, JsonObjectList.length]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, []);

  const handleScroll = (e) => {
    if (useVirtualScrolling && !isScrollCooldownRef.current) {
      const container = e.target;
      const newScrollTop = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;

      // Clamp scroll position to prevent overscroll issues
      const clampedScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));

      const now = Date.now();

      // Throttle updates to prevent too frequent re-renders
      if (now - lastScrollTimeRef.current < SCROLL_THROTTLE) {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
          setScrollTop(clampedScrollTop);
          lastScrollTimeRef.current = Date.now();

          // Start cooldown period
          isScrollCooldownRef.current = true;
          if (cooldownTimeoutRef.current) {
            clearTimeout(cooldownTimeoutRef.current);
          }
          cooldownTimeoutRef.current = setTimeout(() => {
            isScrollCooldownRef.current = false;
          }, SCROLL_COOLDOWN);
        }, SCROLL_THROTTLE);
      } else {
        setScrollTop(clampedScrollTop);
        lastScrollTimeRef.current = now;

        // Start cooldown period
        isScrollCooldownRef.current = true;
        if (cooldownTimeoutRef.current) {
          clearTimeout(cooldownTimeoutRef.current);
        }
        cooldownTimeoutRef.current = setTimeout(() => {
          isScrollCooldownRef.current = false;
        }, SCROLL_COOLDOWN);
      }
    }
  };

  // Memoize the filter function
  const applyFilters = useCallback((data, filters) => {
    if (!enableFilters || !filters) return data;
    if (Object.keys(filters).length === 0) return data;

    return data.filter(item => {
      return Object.entries(filters).every(([columnValue, filterConfig]) => {
        const itemValue = item[columnValue];
        const { value: filterValue, type: filterType, from, to, min, max } = filterConfig;

        switch (filterType) {
          case 'text':
            if (!filterValue) return true;
            return String(itemValue || '').toLowerCase().includes(String(filterValue).toLowerCase());

          case 'checkbox':
            if (!filterValue || filterValue.length === 0) return true;
            return filterValue.includes(itemValue);

          case 'number':
            const numValue = parseFloat(itemValue);
            if (isNaN(numValue)) return false;
            const minimum = min && min != '' && min? parseFloat(min) : -Infinity;
            const maximum = max && max != '' ? parseFloat(max) : Infinity;
            return numValue >= minimum && numValue <= maximum;

          case 'date':
            if (!from && !to) return true;
            const itemDate = new Date(itemValue);
            if (isNaN(itemDate.getTime())) return false;

            const fromDate = from ? new Date(from) : new Date('1900-01-01');
            const toDate = to ? new Date(to) : new Date('2100-12-31');

            return itemDate >= fromDate && itemDate <= toDate;

          default:
            return true;
        }
      });
    });
  }, []);

  // Memoize filtered data to avoid recalculating on every render
  const filteredData = useMemo(() => {
    return applyFilters(JsonObjectList, filters);
  }, [JsonObjectList, filters]);

  // Memoize visible range calculation
  const { startIndex, endIndex } = useMemo(() => {
    if (!useVirtualScrolling) {
      return { startIndex: 0, endIndex: filteredData.length };
    }

    const totalItems = filteredData.length;
    const visibleRows = Math.ceil(containerHeight / rowHeight);

    // Calculate start index with buffer
    let startIndex = Math.floor(scrollTop / rowHeight) - BUFFER_SIZE;
    startIndex = Math.max(0, Math.min(startIndex, totalItems - 1));

    // Calculate end index with buffer
    let endIndex = startIndex + visibleRows + BUFFER_SIZE * 2;
    endIndex = Math.min(totalItems, endIndex);

    // Ensure we always have at least the visible rows if possible
    if (endIndex - startIndex < visibleRows && startIndex > 0) {
      startIndex = Math.max(0, endIndex - visibleRows - BUFFER_SIZE);
    }

    return { startIndex, endIndex };
  }, [useVirtualScrolling, filteredData.length, containerHeight, rowHeight, scrollTop]);

  // Memoize visible items
  const visibleItems = useMemo(() => {
    return useVirtualScrolling
      ? filteredData.slice(startIndex, endIndex)
      : filteredData;
  }, [useVirtualScrolling, filteredData, startIndex, endIndex]);

  // Memoize height calculations for virtual scrolling
  const totalHeight = useMemo(() => {
    return useVirtualScrolling ? filteredData.length * rowHeight : 'auto';
  }, [useVirtualScrolling, filteredData.length, rowHeight]);

  const offsetY = useMemo(() => {
    return useVirtualScrolling ? startIndex * rowHeight : 0;
  }, [useVirtualScrolling, startIndex, rowHeight]);

  const handlePrev = () => {
    setStartPage(Math.max(1, startPage - 10));
  };

  const handleNext = () => {
    const totalPages = Math.ceil(numberOfItems / itemsPerPage);
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

  const SortByColumn = async (sortBy, isAsc) => {
    const HeaderItem = headerList.find(h => h.Value == sortBy);
    Sort(HeaderItem.SortString, isAsc);
  };

  const handleFilterIconClick = (event, header) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();

    const POPUP_WIDTH = 250; // Estimated width of the popover
    let left = rect.left + window.scrollX;
    if (left + POPUP_WIDTH > window.innerWidth + window.scrollX) {
      // Adjust left position if popover would overflow
      left = window.innerWidth + window.scrollX - (POPUP_WIDTH + 10); // 10px padding
    }
    setFilterPosition({
      top: rect.top - 5 + window.scrollY,
      left: left
    });

    if (header.FilterType != 'text') {
      setActiveFilter(header.FilterValue ?? header.Value);
    }
  };

  useEffect(() => {
    console.log('Filters updated:', filters);
  }, [filters]);

  const handleFilterChange = (columnValue, filterValue, filterType) => {
    if (!filterValue ||
      (typeof filterValue === 'object' && Object.values(filterValue).every(v => !v || v.length === 0))) {
      // Remove filter if empty
      const newFilters = { ...filters };
      delete newFilters[columnValue];
      setFilters(newFilters);
    } else {
      // Add or update filter
      setFilters({
        ...filters,
        [columnValue]: { ...filterValue, type: filterType }
      });
    }
  };

  return (
    <div className="grid-container">
      

      {activeFilter && (
        <FilterPopover
          header={headerList.find(h => activeFilter === h.FilterValue)}
          data={JsonObjectList}
          filterValue={filters[activeFilter] ?? {}}
          onFilterChange={handleFilterChange}
          onClose={() => setActiveFilter(null)}
          position={filterPosition}
        />
      )}

      <div
        className='table-wrapper'
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        <table className='transactions-table'>
          <thead>
            <tr className="header-row">
         
              {isSelectable && <th className="select-col"></th>}
              {headerList.map((header) => {
                if (!header.Show) return null;
               
                return (
                  <th key={header.Value} className="">
                    <div className="header-cell-content">
                      <span>{header.DisplayValue}</span>
                      {header.SortString && (
                        <div className="sort-indicator">
                          <span 
                            className="arrow-up"
                            onClick={() => SortByColumn(header.Value, true)}
                          >
                            ▲
                          </span>
                          <span 
                            className="arrow-down"
                            onClick={() => SortByColumn(header.Value, false)}
                          >
                            ▼
                          </span>
                      </div>
                      )}
                    </div>
                  </th>
                );
              })}
              {(edit || deleteFn || addFn) && <th className="actions-col">Actions</th>}
            </tr>
            {enableFilters && (
              <tr className="filter-row">
                
                {isSelectable && <td className="select-col"></td>}
              {headerList.map((header) => {
                if (!header.Show) return null;
                return (
                    <td key={header.Value} className="filter-cell">
                    {header.FilterValue && header.FilterType !=='none' && (
                        <input 
                          type='text' 
                          className="filter-input"
                          placeholder="Filter..."
                          onChange={(e) => handleFilterChange(
                            header.FilterValue ?? header.Value, 
                            { value: e.target.value }, 
                            header.FilterType ?? 'text'
                          )}
                          onFocus={(e) => handleFilterIconClick(e, header)}
                        />
                    )}
                  </td>
                );  
              })}

               
            </tr>
            )}
          </thead>
          <tbody ref={tableBodyRef}>
            {useVirtualScrolling && offsetY > 0 && (
              <tr style={{ height: `${Math.floor(offsetY)}px`, lineHeight: 0 }}>
                <td 
                  colSpan={headerList.filter(h => h.Show).length + (isSelectable ? 2 : 1)} 
                  style={{ padding: 0, border: 'none', height: `${Math.floor(offsetY)}px` }} 
                />
              </tr>
            )}

            {visibleItems.map((item) => (
              <React.Fragment key={item.id || item.UniqueKey}>
                <tr
                  key={item.id || item.UniqueKey}
                  className={`data-row ${item.className || ''}`}
                  data-row
                  onClick={rowClick ? () => { rowClick(item); } : () => { }}
                >
                
                  {isSelectable && (item.subData || item.getSubData) && (
                      <button type="button" onClick={() => toggleRow(item)} className="expand-btn">
                        {expandedRows.includes(item.id) ? '▼' : '▶'}
                      </button>
                    )}
                    
                  {headerList.map((header) => {
                    if (!header.Show) return null;
                    return (
                      <td 
                        key={header.Value} 
                        className="data-cell"
                        >{item[header.Value] }
                        </td>
                    );
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
                    <td colSpan={headerList.length + 2}>
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

           
            {useVirtualScrolling && (() => {
              const renderedRowsHeight = (endIndex - startIndex) * rowHeight;
              const remainingHeight = totalHeight - offsetY - renderedRowsHeight;
              const bottomSpacerHeight = Math.max(0, Math.floor(remainingHeight));

              return bottomSpacerHeight > 5 ? (
                <tr style={{ height: `${bottomSpacerHeight}px`, lineHeight: 0 }}>
                  <td 
                    colSpan={headerList.filter(h => h.Show).length + (isSelectable ? 3 : 2)} 
                    style={{ padding: 0, border: 'none', backgroundColor:"white", height: `${bottomSpacerHeight}px` }} 
                  />
                </tr>
              ) : null;
            })()}
          </tbody>

           { showTotals && <tfoot>
              <tr>
                {isSelectable && (item.subData || item.getSubData) && (
                      <td >
                      </td>
                      
                    )}
                    
                  {headerList.map((header, index) => {
                    if (!header.Show) return null;
                    return (
                      <td 
                        key={header.Value} 
                        className="footer-cell"
                        >
                          {index === 0 ? 'Count: ' + filteredData.length : ''}
                          {index === 1 ? <span  style={{fontWeight:"bold"}}>Total:</span> : ''}
                          {index > 1 && header.FilterType === 'number' ?
                          <span className='amount positive'>
                           {FormatCurrency(filteredData.reduce((sum, item) => {
                              const value = parseFloat(item[header.FilterValue]);
                              return isNaN(value) ? sum : sum + value;
                              }, 0))
                            }
                            </span> : <></>}
                        </td>
                    );
                  })}
              
              </tr>
              </tfoot>
              }

        </table>
      </div>

      { footerObjects && (
        <div className="pagination">
          {itemsPerPage && numberOfItems && activePage && (
            <div className="pagination-info">
              Showing {numberOfItems} transactions
            </div>
          )}
          {footerObjects}
          {/* <div className="pagination-controls">
            {startPage > 1 && (
              <a onClick={handlePrev}>
                . . . . .
              </a>
            )}

            {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
              const pageNum = startPage + i;
              return (
                <button
                  className={`pagination-btn ${activePage == pageNum ? "active" : ""}`}
                  key={pageNum}
                  onClick={() => setActivePage(pageNum)}
                  type='button'
                >
                  {pageNum}
                </button>
              );
            })}

            {endPage < Math.ceil(numberOfItems / itemsPerPage) && (
              <a onClick={handleNext}>
                . . . . .
              </a>
            )}
          </div> */}
        </div>
      )}
    </div>
  );
};