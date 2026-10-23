'use client';

import React from 'react';

interface QrCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * High-contrast, scalable SVG QR Code representation.
 * Renders standard finder patterns (3 corner squares) and deterministically distributed
 * data modules derived from the input value.
 */
export function QrCodeDisplay({
  value,
  size = 180,
  className = '',
  ariaLabel = 'Mã QR vé điện tử',
}: QrCodeDisplayProps) {
  // Deterministic 21x21 grid representation (QR Version 1 standard)
  const gridSize = 21;

  // Simple deterministic hash to populate modules
  const modules = React.useMemo(() => {
    const grid: boolean[][] = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => false),
    );

    // 1. Finder patterns at (0,0), (14,0), (0,14) - 7x7 outer, 3x3 inner
    const drawFinderPattern = (startRow: number, startCol: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isOuterBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInnerSquare = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[startRow + r][startCol + c] = isOuterBorder || isInnerSquare;
        }
      }
    };

    drawFinderPattern(0, 0); // Top-left
    drawFinderPattern(0, 14); // Top-right
    drawFinderPattern(14, 0); // Bottom-left

    // 2. Timing patterns
    for (let i = 8; i < 13; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // 3. Fill remaining data modules with deterministic pseudo-random bits based on input
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        // Skip finder areas (including 1px quiet zone separator)
        const inTopLeft = r < 8 && c < 8;
        const inTopRight = r < 8 && c >= 13;
        const inBottomLeft = r >= 13 && c < 8;
        const inTiming = (r === 6 && c >= 8 && c < 13) || (c === 6 && r >= 8 && r < 13);

        if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
          hash = (hash * 1103515245 + 12345) >>> 0;
          grid[r][c] = (hash & 1) === 1;
        }
      }
    }

    return grid;
  }, [value]);

  return (
    <div
      className={`inline-block rounded-2xl bg-white p-3 shadow-inner border border-slate-200 ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        viewBox={`0 0 ${gridSize} ${gridSize}`}
        width={size}
        height={size}
        className="block shape-rendering-crisp"
        style={{ shapeRendering: 'crispEdges' }}
      >
        <rect width={gridSize} height={gridSize} fill="#ffffff" />
        {modules.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width={1}
                height={1}
                fill="#00152a"
              />
            ) : null,
          ),
        )}
      </svg>
    </div>
  );
}
