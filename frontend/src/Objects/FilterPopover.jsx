import React, { useState, useEffect, useRef } from 'react';
import '../Styles/filterrow.css';

export const FilterPopover = ({ 
  header, 
  data, 
  filterValue, 
  onFilterChange, 
  onClose,
  position 
}) => {
  const popoverRef = useRef(null);
  const [localFilter, setLocalFilter] = useState(filterValue || {});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Get unique values for a column
  const getUniqueValues = () => {
    const values = data
      .map(item => item[header.FilterValue??header.Value])
      .filter(value => value !== null && value !== undefined && value !== '');
    return [...new Set(values)].sort();
  };

  // Determine filter type for a column
  const getFilterType = () => {
    if (header.FilterType) return header.FilterType;

    const uniqueValues = getUniqueValues();
    
    if (uniqueValues.length > 0 && uniqueValues.length <= 10) {
      return 'checkbox';
    }

    const field = header.FilterValue??header.Value;
    const sampleValue = data.find(item => item[field] !== null && item[field] !== undefined)?.[field];
    if (typeof sampleValue === 'number' || !isNaN(parseFloat(sampleValue))) {
      return 'number';
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{2,4}/;
    if (typeof sampleValue === 'string' && dateRegex.test(sampleValue)) {
      return 'date';
    }

    return 'text';
  };

  const filterType = getFilterType();

  useEffect(() => {
    handleApply();
  }, [localFilter]);

  const handleApply = () => {
    onFilterChange(header.FilterValue??header.Value, localFilter, filterType);
  };

  const handleClear = () => {
    setLocalFilter({});
    onFilterChange(header.FilterValue??header.Value, null, filterType);
    
  };

  const renderTextFilter = () => (
    <div className="filter-popover-content">
      <input
        type="text"
        placeholder="Search..."
        value={localFilter.value || ''}
        onChange={(e) => setLocalFilter({ value: e.target.value })}
        className="filter-popover-input"
        autoFocus
      />
    </div>
  );

  const renderCheckboxFilter = () => {
    const uniqueValues = getUniqueValues();
    const selectedValues = localFilter.value || [];

    return (
      <div className="filter-popover-content">
        <div className="filter-popover-checkbox-actions">
          <button
            type="button"
            onClick={() => setLocalFilter({ value: uniqueValues })}
            className="filter-action-btn"
          >
            Select All
          </button>
         
        </div>
        <div className="filter-popover-checkbox-list">
          {uniqueValues.map((value, index) => (
            <label key={index} className="filter-popover-checkbox-item">
              <input
                type="checkbox"
                checked={selectedValues.includes(value)}
                onChange={(e) => {
                  const newSelected = e.target.checked
                    ? [...selectedValues, value]
                    : selectedValues.filter(v => v !== value);
                  setLocalFilter({ value: newSelected });
                }}
              />
              <span>{value}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const renderNumberFilter = () => (
    <div className="filter-popover-content">
      <div className="filter-popover-number">
        <input
          type="number"
          placeholder="Min"
          value={localFilter.min || ''}
          onChange={(e) => setLocalFilter({ ...localFilter, min: e.target.value })}
          className="filter-popover-input"
        />
        <span className="filter-range-separator">to</span>
        <input
          type="number"
          placeholder="Max"
          value={localFilter.max || ''}
          onChange={(e) => setLocalFilter({ ...localFilter, max: e.target.value })}
          className="filter-popover-input"
        />
      </div>
    </div>
  );

  const renderDateFilter = () => (
    <div className="filter-popover-content">
      <div className="filter-popover-date">
        <label className="filter-date-label">From:</label>
        <input
          type="date"
          value={localFilter.from || ''}
          onChange={(e) => setLocalFilter({ ...localFilter, from: e.target.value })}
          className="filter-popover-input"
        />
        <label className="filter-date-label">To:</label>
        <input
          type="date"
          value={localFilter.to || ''}
          onChange={(e) => setLocalFilter({ ...localFilter, to: e.target.value })}
          className="filter-popover-input"
        />
      </div>
    </div>
  );

  const renderFilterContent = () => {
    switch (filterType) {
      case 'text':
        return renderTextFilter();
      case 'checkbox':
        return renderCheckboxFilter();
      case 'number':
        return renderNumberFilter();
      case 'date':
        return renderDateFilter();
      default:
        return renderTextFilter();
    }
  };

  return (
    <div 
      ref={popoverRef}
      className="filter-popover"
      style={{
        top: position.top,
        left: position.left,
        zIndex: 1000
      }}
    >
      <div className="filter-popover-header">
        <span>Filter: {header.DisplayValue}</span>
      </div>
      {renderFilterContent()}
      {/* <div className="filter-popover-footer">
        <button onClick={handleClear} className="filter-btn filter-btn-clear">
          Clear
        </button>
        <button onClick={handleApply} className="filter-btn filter-btn-apply">
          Apply
        </button>
      </div> */}
    </div>
  );
};