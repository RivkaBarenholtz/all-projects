import React, { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

export function PdfViewer({ fileUrl, searchText }) {
  const containerRef = useRef(null);
  const textLayersRef = useRef([]); // store references to text layers for highlighting

  useEffect(() => {
    const load = async () => {
      const pdf = await pdfjsLib.getDocument(fileUrl).promise;

      const container = containerRef.current;
      container.innerHTML = "";
      textLayersRef.current = []; // reset text layers

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        const pageDiv = document.createElement("div");
        pageDiv.style.position = "relative";
        pageDiv.style.width = viewport.width + "px";
        pageDiv.style.height = viewport.height + "px";
        pageDiv.style.marginBottom = "10px";

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        pageDiv.appendChild(canvas);
        container.appendChild(pageDiv);

        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport
        }).promise;

        // TEXT LAYER (just empty container for highlights)
        const textLayerDiv = document.createElement("div");
        textLayerDiv.style.position = "absolute";
        textLayerDiv.style.left = "0";
        textLayerDiv.style.top = "0";
        textLayerDiv.style.width = canvas.width + "px";
        textLayerDiv.style.height = canvas.height + "px";
        textLayerDiv.style.pointerEvents = "none";

        pageDiv.appendChild(textLayerDiv);

        const textContent = await page.getTextContent();

        // store data for later highlighting
        textLayersRef.current.push({ textLayerDiv, textContent, viewport });
      }
    };

    load();
  }, [fileUrl]);

  // ----------------------------
  // 2️⃣ Highlight searchText whenever it changes
  // ----------------------------
  useEffect(() => {
    textLayersRef.current.forEach(({ textLayerDiv, textContent, viewport }) => {
      // clear old highlights
      textLayerDiv.innerHTML = "";

      if (!searchText) return;

      const search = searchText.toLowerCase();

      textContent.items.forEach(item => {
        const text = item.str.toLowerCase();

        let index = text.indexOf(search);
        while (index !== -1) {
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);

          const ratioStart = index / item.str.length;
          const ratioWidth = search.length / item.str.length;

          const highlight = document.createElement("div");
          highlight.style.position = "absolute";
          highlight.style.left = `${tx[4] + item.width * viewport.scale * ratioStart}px`;
          highlight.style.top = `${tx[5] - item.height}px`;
          highlight.style.width = `${item.width * viewport.scale * ratioWidth}px`;
          highlight.style.height = `${item.height}px`;
          highlight.style.background = "rgba(255,255,0,0.4)";
          highlight.style.pointerEvents = "none";

          textLayerDiv.appendChild(highlight);

          // look for next occurrence in same text item
          index = text.indexOf(search, index + search.length);
        }
      });
    });
  }, [searchText]);
  
  return (
    <div
      ref={containerRef}
      style={{
        width: "800px",
        height: "100%",
        position: "fixed",
        right: 0,
        top: 0,
        overflowY: "scroll",
        zIndex:10000
      }}
    />
  );
}