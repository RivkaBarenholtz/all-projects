import { useEffect, useState } from "react";

export function GlobalLoader() {
    const [active, setActive] = useState(false);

    useEffect(() => {
          setActive(window.__instechLoadingActive ?? false);

        const handler = (e) => setActive(e.detail.active);
        
        window.addEventListener("instech:loading", handler);
        return () => window.removeEventListener("instech:loading", handler);
    }, []);

    if (!active) return null;

    return (
        <div className="loader-overlay">
            <div className="spinner" />
        </div>
    );
}
