// Generates branded SVG product images from data/products.json
// Run: node script/generate-images.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const products = JSON.parse(fs.readFileSync(path.join(root, "data/products.json"), "utf8"));
const outDir = path.join(root, "client/public/products");
fs.mkdirSync(outDir, { recursive: true });

function esc(s) {
  const AMP = String.fromCharCode(38);
  return String(s)
    .replace(/&/g, AMP + "amp;")
    .replace(/</g, AMP + "lt;")
    .replace(/>/g, AMP + "gt;")
    .replace(/"/g, AMP + "quot;");
}

// split long Arabic names into lines
function wrap(name, max = 22) {
  const words = name.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max && cur) {
      lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

function productSvg(p) {
  const sku = p.img.replace(/\.(webp|png|jpg|jpeg)$/i, "");
  // Arabic name only (strip trailing English parenthetical) — avoids bidi issues in SVG
  const arOnly = p.arName.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const lines = wrap(arOnly);
  const nameY = lines.length === 2 ? 492 : 508;
  const nameSize = lines.length === 2 ? 24 : 25;
  const enY = nameY + (lines.length === 2 ? 62 : 34);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6f4ec"/>
      <stop offset="1" stop-color="#e7efe6"/>
    </linearGradient>
    <linearGradient id="leaf" x1="0" y1="1" x2="0.6" y2="0">
      <stop offset="0" stop-color="#1d4a37"/>
      <stop offset="1" stop-color="#3f7d5b"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" rx="24" fill="url(#bg)"/>
  <circle cx="470" cy="120" r="90" fill="#3f7d5b" opacity="0.12"/>
  <circle cx="90" cy="480" r="120" fill="#b47d1f" opacity="0.08"/>
  <!-- aloe plant -->
  <g transform="translate(300 225)">
    <path d="M0 130 C -18 60 -16 -60 0 -170 C 10 -60 12 60 0 130 Z" fill="url(#leaf)"/>
    <path d="M0 130 C -60 110 -120 40 -150 -80 C -60 -40 -20 30 0 130 Z" fill="#2a5c45" opacity="0.92"/>
    <path d="M0 130 C 60 110 120 40 150 -80 C 60 -40 20 30 0 130 Z" fill="#356b4e" opacity="0.92"/>
    <path d="M0 130 C -40 150 -90 150 -130 120 C -80 128 -30 126 0 130 Z" fill="#1d4a37"/>
    <path d="M0 130 C 40 150 90 150 130 120 C 80 128 30 126 0 130 Z" fill="#24523f"/>
    <rect x="-70" y="128" width="140" height="46" rx="12" fill="#e8d9b5"/>
  </g>
  <!-- SKU badge -->
  <rect x="235" y="418" width="130" height="42" rx="21" fill="#24523f"/>
  <text x="300" y="446" text-anchor="middle" font-family="'IBM Plex Sans Arabic', sans-serif" font-size="22" font-weight="700" fill="#f2ead4">${esc(sku)}</text>
  <!-- name -->
  ${lines
    .map(
      (l, i) =>
        `<text x="300" y="${nameY + i * 36}" text-anchor="middle" font-family="'IBM Plex Sans Arabic', sans-serif" font-size="${nameSize}" font-weight="600" fill="#2b3a31">${esc(l)}</text>`,
    )
    .join("\n  ")}
  <text x="300" y="${enY}" text-anchor="middle" font-family="'IBM Plex Sans Arabic', sans-serif" font-size="17" font-weight="400" fill="#6b7a70">${esc(p.enName)}</text>
</svg>
`;
}

let count = 0;
for (const p of products) {
  const sku = p.img.replace(/\.(webp|png|jpg|jpeg)$/i, "");
  fs.writeFileSync(path.join(outDir, `${sku}.svg`), productSvg(p));
  count++;
}
console.log(`generated ${count} product images`);

// favicon — aloe leaf mark
fs.writeFileSync(
  path.join(root, "client/public/favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="#24523f"/>
  <g transform="translate(32 34)">
    <path d="M0 18 C -4 8 -3 -12 0 -26 C 2 -12 3 8 0 18 Z" fill="#f2ead4"/>
    <path d="M0 18 C -9 15 -17 5 -20 -12 C -9 -6 -3 4 0 18 Z" fill="#cfe3cf"/>
    <path d="M0 18 C 9 15 17 5 20 -12 C 9 -6 3 4 0 18 Z" fill="#cfe3cf"/>
  </g>
</svg>`,
);
console.log("generated favicon.svg");
