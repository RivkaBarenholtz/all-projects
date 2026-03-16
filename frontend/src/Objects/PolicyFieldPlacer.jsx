import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import * as pdfjsLib from "pdfjs-dist";
import { fetchWithAuth } from "../Utilities";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

const FIELD_COLORS = {
  signature: { bg: "rgba(20,141,194,0.15)", border: "#148dc2", label: "Signature" },
  date:      { bg: "rgba(34,197,94,0.15)",  border: "#16a34a", label: "Date" },
};

// ── Single draggable / resizable field rendered inside its page div ──────────
function FieldBox({ field, pageWidth, pageHeight, onUpdate, onRemove }) {
  const [dragging,  setDragging]  = useState(false);
  const [resizing,  setResizing]  = useState(false);
  const startMouse = useRef(null);
  const startField = useRef(null);

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const beginDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    startMouse.current = { x: e.clientX, y: e.clientY };
    startField.current = { ...field };
    setDragging(true);
  };

  const beginResize = (e) => {
    e.preventDefault(); e.stopPropagation();
    startMouse.current = { x: e.clientX, y: e.clientY };
    startField.current = { ...field };
    setResizing(true);
  };

  useEffect(() => {
    if (!dragging && !resizing) return;

    const onMove = (e) => {
      const dx = (e.clientX - startMouse.current.x) / pageWidth;
      const dy = (e.clientY - startMouse.current.y) / pageHeight;
      const sf = startField.current;
      if (dragging) {
        onUpdate(field.id, {
          x: clamp(sf.x + dx, 0, 1 - sf.width),
          y: clamp(sf.y + dy, 0, 1 - sf.height),
        });
      } else {
        onUpdate(field.id, {
          width:  clamp(sf.width  + dx, 0.06, 1 - sf.x),
          height: clamp(sf.height + dy, 0.02, 1 - sf.y),
        });
      }
    };
    const onUp = () => { setDragging(false); setResizing(false); };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [dragging, resizing]);

  const c = FIELD_COLORS[field.type];
  const px = field.x * pageWidth;
  const py = field.y * pageHeight;
  const pw = field.width  * pageWidth;
  const ph = field.height * pageHeight;

  return (
    <div
      onMouseDown={beginDrag}
      style={{
        position: "absolute",
        left: px, top: py, width: pw, height: ph,
        background: c.bg,
        border: `2px dashed ${c.border}`,
        borderRadius: 3,
        cursor: dragging ? "grabbing" : "grab",
        boxSizing: "border-box",
        userSelect: "none",
        zIndex: 10,
      }}
    >
      {/* Label */}
      <span style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.min(ph * 0.38, 13), fontWeight: 600, color: c.border,
        pointerEvents: "none",
      }}>
        {c.label}
      </span>

      {/* Delete button */}
      <button
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onRemove(field.id); }}
        style={{
          position: "absolute", top: -10, right: -10,
          width: 20, height: 20, borderRadius: "50%",
          background: "#ef4444", color: "#fff",
          border: "none", cursor: "pointer",
          fontSize: 12, lineHeight: "20px", textAlign: "center",
          padding: 0, zIndex: 11,
        }}
      >×</button>

      {/* Resize handle (bottom-right) */}
      <div
        onMouseDown={beginResize}
        style={{
          position: "absolute", bottom: -4, right: -4,
          width: 12, height: 12,
          background: c.border, borderRadius: 2,
          cursor: "se-resize", zIndex: 11,
        }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function PolicyFieldPlacer({ pdfUrl, policyId, initialFields = [], onClose, onSaved }) {
  const containerRef  = useRef(null);
  const loadIdRef     = useRef(0);
  const [pages,       setPages]   = useState([]);   // { width, height, div }
  const [fields,      setFields]  = useState(
    initialFields.map(f => ({
      id:     f.id     ?? f.Id,
      type:   f.type   ?? f.Type,
      page:   f.page   ?? f.Page,
      x:      f.x      ?? f.X,
      y:      f.y      ?? f.Y,
      width:  f.width  ?? f.Width,
      height: f.height ?? f.Height,
    }))
  );
  const [activeType,  setActiveType]  = useState("signature");
  const [saving,      setSaving]  = useState(false);

  const hasSignatureField = fields.some(f => f.type === "signature");

  // Render PDF pages
  useEffect(() => {
    if (!pdfUrl) return;
    const loadId = ++loadIdRef.current;
    setPages([]);
    const load = async () => {
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      if (loadId !== loadIdRef.current) return;
      const container = containerRef.current;
      container.innerHTML = "";
      const pageDims = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        if (loadId !== loadIdRef.current) return;
        const page = await pdf.getPage(i);
        const vp   = page.getViewport({ scale: 1.5 });

        const wrap = document.createElement("div");
        wrap.dataset.page = i;
        wrap.style.cssText = [
          `position:relative`,
          `width:${vp.width}px`,
          `height:${vp.height}px`,
          `margin:0 auto 20px`,
          `box-shadow:0 2px 12px rgba(0,0,0,0.18)`,
          `background:#fff`,
          `cursor:crosshair`,
        ].join(";");

        const canvas = document.createElement("canvas");
        canvas.width  = vp.width;
        canvas.height = vp.height;
        canvas.style.display = "block";
        wrap.appendChild(canvas);
        container.appendChild(wrap);

        await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
        if (loadId !== loadIdRef.current) return;
        pageDims.push({ width: vp.width, height: vp.height, div: wrap });
      }
      setPages(pageDims);
    };
    load();
  }, [pdfUrl]);

  // useEffect (()=> 
  // {
  //   if(pages.length> 0 ) setFields(initialFields)
  // }, [pages]
  // )

  // Place a new field on click
  const handleContainerClick = useCallback((e) => {
    const wrap = e.target.closest("[data-page]");
    if (!wrap) return;
    const pageNum = parseInt(wrap.dataset.page);
    const pg = pages[pageNum - 1];
    if (!pg) return;

    const rect = wrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / pg.width;
    const y = (e.clientY - rect.top)  / pg.height;

    setFields(prev => [...prev, {
      id:     crypto.randomUUID(),
      type:   activeType,
      page:   pageNum,
      x:      Math.max(0, Math.min(x - 0.125, 1 - 0.25)),
      y:      Math.max(0, Math.min(y - 0.03,  1 - 0.06)),
      width:  0.25,
      height: 0.06,
    }]);
  }, [pages, activeType]);

  const updateField = useCallback((id, patch) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  }, []);

  const removeField = useCallback((id) => {
    setFields(prev => prev.filter(f => f.id !== id));
  }, []);

  const save = async () => {
    if (!hasSignatureField) return;
    setSaving(true);
    try {
      await fetchWithAuth("save-policy-fields", { policyId, fields });
      onSaved(fields);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>

        {/* ── Toolbar ── */}
        <div style={styles.toolbar}>
          <span style={{ fontWeight: 600, fontSize: 15, color: "#148dc2" }}>
            Place Signature Fields
          </span>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["signature", "date"].map(t => (
              <button key={t} onClick={() => setActiveType(t)} style={{
                ...styles.typeBtn,
                background: activeType === t ? FIELD_COLORS[t].border : "#f0f0f0",
                color:      activeType === t ? "#fff" : "#444",
              }}>
                {t === "signature" ? "✍ Signature" : "📅 Date"}
              </button>
            ))}

            <button
              onClick={save}
              disabled={saving || !hasSignatureField}
              title={!hasSignatureField ? "Add at least one signature field first" : ""}
              style={{
                ...styles.saveBtn,
                opacity: hasSignatureField ? 1 : 0.4,
                cursor:  hasSignatureField ? "pointer" : "not-allowed",
              }}
            >
              {saving ? "Saving…" : "Save & Copy Link"}
            </button>

            <button onClick={onClose} style={styles.closeBtn}>✕ Close</button>
          </div>
        </div>

        {/* ── Hint bar ── */}
        <div style={styles.hint}>
          Click on the document to drop a <strong style={{ color: FIELD_COLORS[activeType].border }}>
            {FIELD_COLORS[activeType].label}
          </strong> field. Drag to move · drag the corner handle to resize · × to delete.
          {!hasSignatureField &&
            <span style={{ color: "#ef4444", marginLeft: 10 }}>
              ⚠ At least one signature field is required before saving.
            </span>
          }
        </div>

        {/* ── Scrollable document area ── */}
        <div style={styles.docArea} onClick={handleContainerClick}>
          <div ref={containerRef} style={styles.docInner} />
        </div>

      </div>

      {/* ── React portals: render field boxes inside each page div ── */}
      {pages.map((pg, i) =>
        createPortal(
          fields
            .filter(f => f.page === i + 1)
            .map(f => (
              <FieldBox
                key={f.id}
                field={f}
                pageWidth={pg.width}
                pageHeight={pg.height}
                onUpdate={updateField}
                onRemove={removeField}
              />
            )),
          pg.div
        )
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.65)",
    zIndex: 9999,
    display: "flex", alignItems: "stretch",
  },
  panel: {
    display: "flex", flexDirection: "column",
    width: "100%", background: "rgb(243, 244, 246, .49)",
    overflow: "hidden",
  },
  toolbar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 20px",
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
    flexShrink: 0,
  },
  hint: {
    padding: "7px 20px",
    fontSize: 12, color: "#555",
    background: "#fffbeb",
    borderBottom: "1px solid #fde68a",
    flexShrink: 0,
  },
  docArea: {
    flex: 1, overflowY: "auto",
    padding: "32px 20px",
  },
  docInner: {
    maxWidth: 900, margin: "0 auto",
  },
  typeBtn: {
    padding: "6px 14px", border: "none",
    borderRadius: 4, cursor: "pointer", fontSize: 12,
  },
  saveBtn: {
    padding: "7px 18px",
    background: "#148dc2", color: "#fff",
    border: "none", borderRadius: 4, fontSize: 13,
  },
  closeBtn: {
    padding: "7px 14px",
    background: "#f0f0f0", color: "#444",
    border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13,
  },
};
