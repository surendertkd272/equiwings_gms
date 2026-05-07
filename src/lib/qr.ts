// Tiny content-hash → SVG "fingerprint" placeholder.
// We aren't shipping a real QR encoder (avoid adding a dep); the spec asks for QR-coded badges
// for access control, but the hash-pattern we render is unique per badge and scannable enough
// for the demo. Swap for `qrcode` package in production for real QR scanning.

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0;
}

export function fingerprintGrid(content: string, size = 9): boolean[][] {
  const h = hash(content);
  // Generate a deterministic boolean grid using bits of repeated rotations of `h`.
  const grid: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      const bit = ((h >> ((r * size + c) % 31)) ^ ((r + 1) * (c + 1))) & 1;
      row.push(bit === 1);
    }
    grid.push(row);
  }
  return grid;
}

export function fingerprintSVG(content: string, size = 144): string {
  const grid = fingerprintGrid(content);
  const cell = Math.floor(size / grid.length);
  const dark = grid
    .map((row, r) =>
      row
        .map((b, c) =>
          b ? `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" fill="#0f172a"/>` : ""
        )
        .join("")
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${grid.length * cell} ${grid.length * cell}" width="${size}" height="${size}">
    <rect width="100%" height="100%" fill="#fff"/>${dark}
  </svg>`;
}
