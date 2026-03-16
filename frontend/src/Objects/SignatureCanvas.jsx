import { useRef, useState, useEffect } from "react";

export function SignatureCanvas({ onSave, onCancel }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState("draw"); // "draw" | "type"
  const [typedName, setTypedName] = useState("");
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    if (mode === "type") renderTyped();
  }, [typedName, mode]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(e, canvas);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  };

  const endDraw = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    setTypedName("");
  };

  const renderTyped = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!typedName) { setHasContent(false); return; }
    ctx.font = "italic 46px 'Brush Script MT', 'Segoe Script', cursive";
    ctx.fillStyle = "#111";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName, 20, canvas.height / 2);
    setHasContent(true);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    onSave(canvas.toDataURL("image/png"), mode === "type" ? "Typed" : "Drawn");
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3 style={{ margin: "0 0 16px", color: "#148dc2" }}>Sign Document</h3>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["draw", "type"].map(m => (
            <button key={m} onClick={() => { setMode(m); clear(); }}
              style={{ ...tabBtn, background: mode === m ? "#148dc2" : "#f0f0f0", color: mode === m ? "#fff" : "#333" }}>
              {m === "draw" ? "Draw" : "Type"}
            </button>
          ))}
        </div>

        {mode === "type" && (
          <input
            placeholder="Type your full name"
            value={typedName}
            onChange={e => setTypedName(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", fontSize: 14, marginBottom: 10, border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
          />
        )}

        <canvas
          ref={canvasRef}
          width={500} height={140}
          onMouseDown={mode === "draw" ? startDraw : undefined}
          onMouseMove={mode === "draw" ? draw : undefined}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={mode === "draw" ? startDraw : undefined}
          onTouchMove={mode === "draw" ? draw : undefined}
          onTouchEnd={endDraw}
          style={{ border: "1px solid #ddd", borderRadius: 4, cursor: mode === "draw" ? "crosshair" : "default", background: "#fafafa", display: "block" }}
        />
        <p style={{ fontSize: 11, color: "#aaa", margin: "4px 0 16px" }}>
          {mode === "draw" ? "Draw your signature above" : "Your typed name will appear as your signature"}
        </p>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={clear} style={secondaryBtn}>Clear</button>
          <button onClick={onCancel} style={secondaryBtn}>Cancel</button>
          <button onClick={handleSave} disabled={!hasContent} style={{ ...primaryBtn, opacity: hasContent ? 1 : 0.5 }}>
            Apply Signature
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 };
const modal = { background: "#fff", borderRadius: 8, padding: 24, width: 560, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" };
const tabBtn = { padding: "6px 18px", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13 };
const primaryBtn = { padding: "8px 20px", background: "#148dc2", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13 };
const secondaryBtn = { padding: "8px 20px", background: "#f0f0f0", color: "#333", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13 };
