import { useEffect } from "react";
import { BaseUrl } from "./Utilities";

export default function SSO() {
     const urlParams = new URLSearchParams(window.location.search);
    useEffect(() => {
       
    const code = urlParams.get("code")??"";

      if (code) {
        const response = fetch(`${BaseUrl()}/ins-dev/get-login-from-code`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
        });

        response.then(res => res.json()).then(data => {
            if (data.IdToken && data.RefreshToken) {
                localStorage.setItem("idToken", data.IdToken);
                localStorage.setItem("refreshToken", data.RefreshToken);
                if (data.VendorId) {
                    localStorage.setItem("currentVendor", data.VendorId);
                }
               const url = new URL(window.location.href);

                // Remove only "code"
                url.searchParams.delete('code');

                // Redirect to /transactions with remaining params
                window.location.href = `/transactions${url.search}`;
            } else {
                console.warn("No token found in URL for SSO.");
                window.location.href = "/login";
            }
            urlParams.delete("code");
        })
    }
    }, []);
}