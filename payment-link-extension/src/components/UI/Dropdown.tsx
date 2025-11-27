import { useEffect, useRef, useState, ReactNode } from "react";

interface DropdownProps {
    classes?: string;
    buttonContent: ReactNode;
    children: ReactNode;
    buttonClasses?: string;
    show?: boolean;
    unclick?: () => void;
}

export const Dropdown = ({
    classes = "",
    buttonContent,
    children,
    buttonClasses = "",
    show,
    unclick
}: DropdownProps) => {
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const dropdownEl = dropdownRef.current;
        console.log("aaaaaaaaa");
    if (!dropdownEl) return;


    // Find the root for listening: shadowRoot or document
    const root = dropdownEl.getRootNode() as ShadowRoot | Document;

    const handleClickOutside = (event: any) => {
        // Use composedPath to handle shadow DOM
        const path = event.composedPath ? event.composedPath() : [event.target];
        if (!path.includes(dropdownEl)) {
            setShowDropdown(false);
            if (unclick) unclick();
        }
    };

    root.addEventListener("click", handleClickOutside);

    return () => {
        root.removeEventListener("click", handleClickOutside);
    };
    }, [show, unclick]);

    return (
        <div className="dropdown-container" ref={dropdownRef}>
            <button
                className={buttonClasses}
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
            >
                {buttonContent}
            </button>

            {showDropdown && (
                <div className={`dropdown-list ${classes}`}>
                    {children}
                </div>
            )}
        </div>
    );
};
