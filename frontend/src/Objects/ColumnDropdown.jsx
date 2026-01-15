import { useState, useEffect, useRef } from "react"
import { Grip } from "lucide-react";
export const ColumnDropdown = (
    {
        headerList,
        setHeaderList
    }
) => {
    const dropdownRef = useRef(null);
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);
    const [showColumnDropdown, setShowColumnDropdown] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);




    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowColumnDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);




    const CheckColumn = (columnValue) => {
        const newHeaderList = headerList.map((hl) => {
           return hl.Value == columnValue
                ? { ...hl, Show: !hl.Show }
                : hl
        });
        setHeaderList(newHeaderList);

    }

    // const SetColumnsToDisplay = () => {
    //     const newHeaderList = headerList.map((hl) => {
    //         return { ...hl, Show: checkedItems.includes(hl.Value) }
    //     });
    //     setHeaderList(newHeaderList);
    // }

    // Apply changes immediately (used for both drag/drop and checkbox changes)
    // const applyHeaderChanges = (newHeaderList) => {
    //     // Update the Show property based on checked items
    //     const updatedHeaderList = newHeaderList.map((hl) => {
    //         return { ...hl, Show: checkedItems.includes(hl.Value) };
    //     });
    //     setHeaderList(updatedHeaderList);
    // };

    // Drag and Drop Handlers
    const handleDragStart = (e, index) => {
        const header = headerList[index];
        if (header.locked) {
            e.preventDefault();
            return;
        }

        dragItem.current = index;
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    };

    const handleDragEnter = (e, index) => {
        e.preventDefault();
        const targetHeader = headerList[index];

        // Don't allow dropping on locked columns
        if (targetHeader.locked) {
            return;
        }

        dragOverItem.current = index;
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    };

    const handleDragEnd = (e) => {
        setDraggedIndex(null);
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        e.stopPropagation();

        const draggedItemIndex = dragItem.current;

        if (draggedItemIndex === null || draggedItemIndex === dropIndex) {
            dragItem.current = null;
            dragOverItem.current = null;
            setDraggedIndex(null);
            return;
        }

        // Check if either item is locked
        const draggedHeader = headerList[draggedItemIndex];
        const targetHeader = headerList[dropIndex];

        if (draggedHeader?.locked || targetHeader?.locked) {
            dragItem.current = null;
            dragOverItem.current = null;
            setDraggedIndex(null);
            return;
        }

        // Create a copy of the header list
        const newHeaderList = [...headerList];

        // Remove the dragged item from its original position
        const [draggedItem] = newHeaderList.splice(draggedItemIndex, 1);

        // Insert it at the new position
        newHeaderList.splice(dropIndex, 0, draggedItem);

        // Apply changes immediately (this updates Show property and calls setHeaderList)
        setHeaderList(newHeaderList);

        // Reset refs
        dragItem.current = null;
        dragOverItem.current = null;
        setDraggedIndex(null);
    };

    return (
        <div className="dropdown-container">
            <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setShowColumnDropdown(true)}
            >
                Columns
            </button>

            {showColumnDropdown && (
                <div className="dropdown-list column column-manager" ref={dropdownRef}>
                    <div className="column-manager-header">
                        <h4>Manage Columns</h4>

                    </div>

                    <div className="column-list">
                        {headerList.map((header, index) => {
                            const isLocked = header.locked || false;
                            const isDragging = draggedIndex === index;

                            return (
                                <div
                                    key={`${index}-${header.Value}`}
                                    className={`col-list-item ${isLocked ? 'locked' : ''} ${isDragging ? 'dragging' : ''}`}
                                    draggable={!isLocked}
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                    onDragOver={handleDragOver}
                                    onDragEnd={handleDragEnd}
                                    onDrop={(e) => handleDrop(e, index)}
                                >
                                    {!isLocked && (
                                        <span className="col-drag-handle" title="Drag to reorder"> <Grip size={18}/> </span>
                                    )}
                                    {isLocked && (
                                        <span className="col-lock-icon" title="Locked column">🔒</span>
                                    )}
                                    <input
                                        type="checkbox"
                                        checked={header.Show}
                                        onChange={() => CheckColumn(header.Value)}
                                        disabled={isLocked}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="col-label">{header.DisplayValue}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="column-manager-footer">
                        <small>💡 Drag to reorder • Check/uncheck to show/hide</small>
                    </div>
                </div>
            )}
        </div>
    );
}