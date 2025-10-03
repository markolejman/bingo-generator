"use client";

import { useState } from "react";
import Image from "next/image";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { clsx } from "clsx";

type GridSize = 4 | 5 | 6;

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateCardNumbers(grid: GridSize): number[] {
  const total = grid * grid;
  return shuffle(range(total)).slice(0, total);
}

function generateUniqueCards(count: number, grid: GridSize): number[][] {
  const seen = new Set<string>();
  const cards: number[][] = [];
  while (cards.length < count) {
    const nums = generateCardNumbers(grid);
    const key = nums.join(",");
    if (!seen.has(key)) {
      seen.add(key);
      cards.push(nums);
    }
  }
  return cards;
}

export default function HomePage() {
  const [grid, setGrid] = useState<GridSize>(5);
  const [amount, setAmount] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // no-op

  // Renders a single printable card off-screen and returns the canvas
  async function renderCardToCanvas(nums: number[], gridSize: GridSize) {
    const A4_WIDTH = 794; // px @ 96 DPI
    const A4_HEIGHT = 1123; // px @ 96 DPI
    const PADDING = 64; // px around the content
    const GAP = 12; // px between cells

    const wrapper = document.createElement("div");
    Object.assign(
      wrapper.style as any,
      {
        position: "fixed",
        left: "-10000px",
        top: "0",
        width: `${A4_WIDTH}px`,
        height: `${A4_HEIGHT}px`,
        background: "#ffffff",
        color: "#000000",
        padding: `${PADDING}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      } as CSSStyleDeclaration
    );

    const gridEl = document.createElement("div");
    const contentWidth = A4_WIDTH - PADDING * 2;
    const contentHeight = A4_HEIGHT - PADDING * 2;
    const cellSize = Math.floor(
      Math.min(
        (contentWidth - GAP * (gridSize - 1)) / gridSize,
        (contentHeight - GAP * (gridSize - 1)) / gridSize
      )
    );
    const gridPixelSize = cellSize * gridSize + GAP * (gridSize - 1);
    Object.assign(
      gridEl.style as any,
      {
        width: `${gridPixelSize}px`,
        height: `${gridPixelSize}px`,
        display: "grid",
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gap: `${GAP}px`,
      } as CSSStyleDeclaration
    );

    const fontSize = Math.round(
      cellSize * (gridSize === 4 ? 0.45 : gridSize === 5 ? 0.4 : 0.35)
    );
    nums.forEach((n) => {
      const cell = document.createElement("div");
      cell.textContent = String(n);
      Object.assign(
        cell.style as any,
        {
          width: `${cellSize}px`,
          height: `${cellSize}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid #000",
          borderRadius: "8px",
          fontWeight: "700",
          fontSize: `${fontSize}px`,
          userSelect: "none",
        } as CSSStyleDeclaration
      );
      gridEl.appendChild(cell);
    });

    wrapper.appendChild(gridEl);
    document.body.appendChild(wrapper);

    // Give layout a tick
    await new Promise((r) => setTimeout(r, 0));

    const canvas = await html2canvas(wrapper, {
      scale: 1,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    document.body.removeChild(wrapper);
    return canvas;
  }

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const n = Math.max(1, Math.min(100, Math.floor(amount)));
      const generated = generateUniqueCards(n, grid);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
        // compressPdf is supported in newer jsPDF versions; harmless if ignored
        compress: true as unknown as boolean,
      } as any);
      for (let i = 0; i < generated.length; i++) {
        const canvas = await renderCardToCanvas(generated[i], grid);
        const imgData = canvas.toDataURL("image/jpeg", 0.6);

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 36; // 0.5in
        const maxW = pageWidth - margin * 2;
        const maxH = pageHeight - margin * 2;

        let w = canvas.width;
        let h = canvas.height;
        const ratio = Math.min(maxW / w, maxH / h);
        w = w * ratio;
        h = h * ratio;

        if (i > 0) pdf.addPage();
        pdf.addImage(
          imgData,
          "JPEG",
          (pageWidth - w) / 2,
          (pageHeight - h) / 2,
          w,
          h
        );
      }
      pdf.save("bingo-cards.pdf");
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <Image
        src="https://images-bonnier.imgix.net/files/ill/production/2019/01/08115054/nasa-andromeda-milky-way.jpg?auto=format,compress&crop=focalpoint&fp-x=0.5&fp-y=0.5&ar=1.7777777777777777:1&w=2560&q=80&fit=crop"
        alt="Background"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={clsx(
            "w-full max-w-4xl rounded-2xl border border-white/20",
            "bg-white/10 backdrop-blur-md shadow-glass",
            "text-white"
          )}
        >
          <div className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Markos bingo generator
            </h1>
            <p className="text-white/80 mt-1">
              Choose grid size and amount, then generate printable PDF.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">
                  Grid Size
                </label>
                <select
                  className="w-full appearance-none rounded-lg bg-white/90 text-black border border-white/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                  value={grid}
                  onChange={(e) => setGrid(Number(e.target.value) as GridSize)}
                >
                  <option value={4}>4 x 4 (1–16)</option>
                  <option value={5}>5 x 5 (1–25)</option>
                  <option value={6}>6 x 6 (1–36)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/80 mb-2">
                  Amount of Bingo Cards
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-lg bg-white/90 text-black border border-white/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="e.g. 10"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  aria-busy={isGenerating}
                  className={clsx(
                    "inline-flex h-10 items-center justify-center rounded-lg bg-white/90 text-black px-4 font-medium hover:bg-white",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      <span>Generating…</span>
                    </>
                  ) : (
                    <span>Generate</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
