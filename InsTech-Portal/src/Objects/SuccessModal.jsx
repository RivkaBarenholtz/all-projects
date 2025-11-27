import { useState } from "react";

export  function useSuccessModal() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  function showSuccess(msg) {
    setMessage(msg);
    setVisible(true);

    // Hide after 10 seconds
    setTimeout(() => setVisible(false), 10000);
  }

  const SuccessModal = () => (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-20px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
        backgroundColor: "#ffffff", // green
        color: "#22c55e",
        padding: "12px 24px",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      ✅ {message}
    </div>
  );

  return { showSuccess, SuccessModal };
}
