import React, { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";


pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

export function PdfViewer({ fileUrl }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;

      const container = containerRef.current;
      container.innerHTML = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        container.appendChild(canvas);

        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport
        }).promise;
      }
    };

    load();
  }, [fileUrl]);

  return (
    <div
      ref={containerRef}
      id="jfjdlfjdlaj"
      style={{
            width: "800px",
            height: "100%",
            position: "fixed",
            zIndex: 1000,
            right: 0,
            top: 0, 
            overflowY: "scroll"
          }}
      
    />
  );
}