import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { SignatureCanvas } from "../Objects/SignatureCanvas";
import { BaseUrl } from "../Utilities";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

const COLORS = { signature: "rgba(20,141,194,0.18)", date: "rgba(34,197,94,0.18)" };
const BORDER = { signature: "#148dc2", date: "#16a34a" };

export function PolicySigner({ pdfUrl, policy, signerName, signerEmail, onReady, onClose, submitPressed }) {
  const containerRef = useRef(null);
  const fieldRefs    = useRef({});
  const [pages, setPages] = useState([]);
  const [pageRects, setPageRects] = useState([]);
  const [capturedSignature, setCapturedSignature] = useState(null); // { data, type }
  const [fieldValues, setFieldValues] = useState({});              // fieldId → true
  const [showCanvas, setShowCanvas] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [agreedToSign, setAgreedToSign] = useState(false);
  const viewedAtRef      = useRef(new Date().toISOString());
  const consentShownRef  = useRef(new Date().toISOString());
  const consentTimestamp = useRef(null);

  const fields =
    (policy?.SignatureFields?.map(f => ({
      id:     f.id     ?? f.Id,
      type:   f.type   ?? f.Type,
      page:   f.page   ?? f.Page,
      x:      f.x      ?? f.X,
      y:      f.y      ?? f.Y,
      width:  f.width  ?? f.Width,
      height: f.height ?? f.Height,
    })) ?? []).sort((a, b) =>
      a.page !== b.page ? a.page - b.page : a.y !== b.y ? a.y - b.y : a.x - b.x
    );
  const today = new Date().toLocaleDateString("en-US");
  const allSigned = fields.length > 0 && fields.every(f => fieldValues[f.id]);

  const jumpToNext = (currentId) => {
    const currentIndex = fields.findIndex(f => f.id === currentId);
    for (let i = 1; i <= fields.length; i++) {
      const next = fields[(currentIndex + i) % fields.length];
      if (!fieldValues[next.id]) {
        fieldRefs.current[next.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
  };

  // Render PDF pages
  useEffect(() => {
    if (!pdfUrl) return;
    setPages([]);
    let cancelled = false;
    const load = async () => {
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      if (cancelled) return;
      const container = containerRef.current;
      if (!container) return;
      container.innerHTML = "";
      const dims = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        if (cancelled) return;
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const wrap = document.createElement("div");
        wrap.dataset.page = i;
        wrap.style.cssText = `position:relative;width:${viewport.width}px;height:${viewport.height}px;margin-bottom:12px;`;
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        wrap.appendChild(canvas);
        container.appendChild(wrap);
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        if (cancelled) return;
        dims.push({ width: viewport.width, height: viewport.height });
      }
      setPages(dims);
    };
    load();
    return () => { cancelled = true; };
  }, [pdfUrl]);

  // Track page positions for overlay rendering
  useEffect(() => {
    if (!pages.length) return;
    const update = () => {
      const wraps = containerRef.current?.querySelectorAll("[data-page]");
      if (!wraps) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      setPageRects(Array.from(wraps).map(w => {
        const r = w.getBoundingClientRect();
        return { left: r.left - containerRect.left, top: r.top - containerRect.top, width: r.width, height: r.height };
      }));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [pages]);

  const handleFieldClick = (field) => {
    if (field.type === "date") {
      setFieldValues(prev => ({ ...prev, [field.id]: new Date().toISOString() }));
      return;
    }
    if (capturedSignature) {
      setFieldValues(prev => ({ ...prev, [field.id]: new Date().toISOString() }));
    } else {
      setActiveFieldId(field.id);
      setShowCanvas(true);
    }
  };

  const handleSignatureSave = (dataUrl, type) => {
    setCapturedSignature({ data: dataUrl, type });
    setFieldValues(prev => ({ ...prev, [activeFieldId]: new Date().toISOString() }));
    setShowCanvas(false);
    setActiveFieldId(null);
  };

  useEffect(() => {
    if (!allSigned || !capturedSignature) return;
    const ua = navigator.userAgent;
    const makeEvent = (eventType, timestamp, metadata) => ({
      eventType, timestamp, metadata,
      signerName, signerEmail, userAgent: ua,
    });
    const auditTrail = [
      makeEvent("Viewed",        viewedAtRef.current,      "Signer opened document"),
      makeEvent("ConsentShown",  consentShownRef.current,  "Electronic signature consent dialog displayed"),
      makeEvent("ConsentAgreed", consentTimestamp.current, `${signerName} agreed to sign electronically`),
      ...fields.map(f => makeEvent(
        f.type === "signature" ? "FieldSigned" : "FieldDateConfirmed",
        fieldValues[f.id],
        `${f.type} field on page ${f.page} confirmed`
      )),
    ];
    onReady?.({ capturedSignature, signerName, signerEmail, auditTrail });
  }, [allSigned, capturedSignature]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "24px 16px" }}>
    <div style={{ background: "#fff", borderRadius: 8, width: "100%", maxWidth: 900, boxShadow: "0 8px 40px rgba(0,0,0,0.3)", marginBottom: 24 }}>
      {/* ESIGN consent overlay */}
      {!agreedToSign && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99998, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 32, maxWidth: 480, width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}>
            <h3 style={{ margin: "0 0 12px", color: "#148dc2", fontSize: 18 }}>Electronic Signature Consent</h3>
            <p style={{ fontSize: 14, color: "#444", lineHeight: 1.6, margin: "0 0 16px" }}>
              By clicking <strong>"I Agree"</strong> below, you consent to sign this document electronically. Your electronic signature is legally binding under the <strong>ESIGN Act</strong> and carries the same legal weight as a handwritten signature.
            </p>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.5, margin: "0 0 24px" }}>
              You may withdraw your consent at any time by closing this page.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => window.history.back()}
                style={{ padding: "10px 20px", background: "#f0f0f0", color: "#444", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 14 }}
              >Decline</button>
              <button
                onClick={() => { consentTimestamp.current = new Date().toISOString(); setAgreedToSign(true); }}
                style={{ padding: "10px 24px", background: "#148dc2", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 14, fontWeight: 600 }}
              >I Agree</button>
            </div>
          </div>
        </div>
      )}

      {showCanvas && (
        <SignatureCanvas
          onSave={handleSignatureSave}
          onCancel={() => { setShowCanvas(false); setActiveFieldId(null); }}
        />
      )}

      <div style={headerBar}>
        <span style={{ fontWeight: 600, color: "#fff" }}>Review &amp; Sign Policy</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
            {fields.filter(f => f.type === "signature").length} signature field(s) · click to sign
          </span>
          {!allSigned && (
            <button
              onClick={() => {
                const first = fields.find(f => !fieldValues[f.id]);
                if (first) fieldRefs.current[first.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              style={{ padding: "4px 12px", background: "#fff", color: "#148dc2", border: "1px solid #fff", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
            >
              ↓ Jump to Signature
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              style={{ padding: "4px 10px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 700, lineHeight: 1 }}
              title="Close"
            >✕</button>
          )}
        </div>
      </div>

      {/* PDF + field overlays */}
      <div style={{ position: "relative", overflowX: "auto", overflowY: "auto", maxHeight: "80vh", background: "#f5f5f5", padding: 16, borderRadius: "0 0 6px 6px" }}>
        <div ref={containerRef} style={{ display: "inline-block", position: "relative" }} />

        {/* Field overlays */}
        {pageRects.length > 0 && fields.map(f => {
          const pr = pageRects[f.page - 1];
          if (!pr) return null;
          const isFilled = fieldValues[f.id];

          return (
            <div
              key={f.id}
              ref={el => fieldRefs.current[f.id] = el}
              style={{
                position: "absolute",
                left:   pr.left + f.x * pr.width,
                top:    pr.top  + f.y * pr.height,
                width:  f.width  * pr.width,
                height: f.height * pr.height,
              }}
            >
              {/* Field content */}
              <div
                onClick={() => handleFieldClick(f)}
                style={{
                  width: "100%", height: "100%",
                  background: isFilled ? "transparent" : COLORS[f.type],
                  border: `2px ${isFilled ? "solid" : "dashed"} ${BORDER[f.type]}`,
                  borderRadius: 3,
                  cursor: "pointer",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                }}
              >
                {isFilled && f.type === "signature" ? (
                  <img src={capturedSignature.data} alt="signature" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                ) : isFilled && f.type === "date" ? (
                  <span style={{ fontSize: Math.min(f.height * pr.height * 0.5, 13), color: "#16a34a", fontWeight: 500 }}>{today}</span>
                ) : (
                  <span style={{ fontSize: 11, color: BORDER[f.type], fontWeight: 600 }}>
                    {f.type === "signature" ? "Click to sign" : "Click to confirm date"}
                  </span>
                )}
              </div>

              {/* Jump to next field button (hidden when no unfilled fields remain) */}
              {fields.some(other => other.id !== f.id && !fieldValues[other.id]) && (
                <button
                  onClick={e => { e.stopPropagation(); jumpToNext(f.id); }}
                  title="Jump to next field"
                  style={{
                    position: "absolute",
                    right: -26, top: "50%", transform: "translateY(-50%)",
                    width: 22, height: 22, borderRadius: "50%",
                    background: BORDER[f.type], color: "#fff",
                    border: "none", cursor: "pointer",
                    fontSize: 12, lineHeight: "22px", textAlign: "center",
                    padding: 0, zIndex: 5,
                  }}
                >↓</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Signing status */}
      <div style={{ padding: "16px 0 24px", textAlign: "center" }}>
        {allSigned ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <p style={{ color: "#16a34a", fontWeight: 600, margin: 0 }}>✓ All fields signed</p>
            {onClose && (
              <button
                onClick={onClose}
                style={{ padding: "12px 32px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}
              >
                Done — Close &amp; Pay
              </button>
            )}
          </div>
        ) : (
          <p style={{ color: "#888", fontSize: 13, margin: 0 }}>Please sign all fields above to continue</p>
        )}
      </div>
    </div>
    </div>
  );
}

const headerBar = { background: "#148dc2", color: "#fff", padding: "10px 16px", borderRadius: "6px 6px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" };
const signBtn   = { padding: "12px 28px", background: "#148dc2", color: "#fff", border: "none", borderRadius: 5, fontSize: 15, fontWeight: 600 };
