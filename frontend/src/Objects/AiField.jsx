import { Pencil } from "lucide-react";

export function AiField({ field, locked, onUnlock, onHighlight, children }) {
    if (!locked) return children;

    const value = children?.props?.value ?? "";

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
                onClick={() => onHighlight?.(value)}
                title="Click to highlight in document"
                style={{
                    flex: 1,
                    padding: "6px 8px",
                    background: "#f0f9ff",
                    border: "1px solid #cde8f5",
                    borderRadius: 4,
                    fontSize: 14,
                    color: "#148dc2",
                    fontWeight: 600,
                    textDecoration: "underline",
                    minHeight: 34,
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#ddf0fc"}
                onMouseLeave={e => e.currentTarget.style.background = "#f0f9ff"}
            >
                {value}
            </div>
            <button
                type="button"
                onClick={() => onUnlock(field)}
                title="Edit"
                style={{ border: "none", background: "none", cursor: "pointer", color: "#148dc2", padding: 2, flexShrink: 0 }}
            >
                <Pencil size={13} />
            </button>
        </div>
    );
}
