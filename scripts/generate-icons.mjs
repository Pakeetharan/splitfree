/**
 * scripts/generate-icons.mjs
 * Converts public/icon.svg → all required PWA / favicon bitmap assets.
 *
 * Usage:  node scripts/generate-icons.mjs
 * Deps:   sharp  to-ico  (dev, not committed)
 */

import sharp from "sharp";
import toIco from "to-ico";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const svgPath = resolve(root, "public", "icon.svg");
const svg = readFileSync(svgPath);

// Ensure output directories exist
mkdirSync(resolve(root, "public", "icons"), { recursive: true });

async function toPng(size) {
  return sharp(svg).resize(size, size).png().toBuffer();
}

async function main() {
  console.log("Generating icons from public/icon.svg …\n");

  // --- PWA icons ---
  for (const size of [192, 512]) {
    const buf = await toPng(size);
    const out = resolve(root, "public", "icons", `icon-${size}.png`);
    writeFileSync(out, buf);
    console.log(`  ✓  public/icons/icon-${size}.png`);
  }

  // --- Apple touch icon ---
  const apple = await toPng(180);
  writeFileSync(
    resolve(root, "public", "icons", "apple-touch-icon.png"),
    apple,
  );
  console.log("  ✓  public/icons/apple-touch-icon.png");

  // --- favicon.ico (16×16 + 32×32 embedded) ---
  const [px16, px32] = await Promise.all([toPng(16), toPng(32)]);
  const ico = await toIco([px16, px32]);
  writeFileSync(resolve(root, "public", "favicon.ico"), ico);
  console.log("  ✓  public/favicon.ico  (16×16 + 32×32)");

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
