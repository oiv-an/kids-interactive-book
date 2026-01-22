/* eslint-disable no-console */

// Simple image optimizer for this repo.
// Converts PNG scenes to WebP (quality 75 by default) and optionally downsizes.
// Keeps PNG as source; writes .webp next to it.
//
// Usage:
//   node scripts/optimize-images.js
//   node scripts/optimize-images.js --quality=80 --maxWidth=1400

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    const m = raw.match(/^--([^=]+)=(.*)$/);
    if (!m) continue;
    args[m[1]] = m[2];
  }
  return args;
}

function walkFiles(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "n/a";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function convertPngToWebp(filePath, { quality, maxWidth }) {
  const parsed = path.parse(filePath);
  const webpPath = path.join(parsed.dir, `${parsed.name}.webp`);

  const srcStat = fs.statSync(filePath);
  const existed = fs.existsSync(webpPath);
  const dstStat = existed ? fs.statSync(webpPath) : null;

  // If already converted and webp is newer than png, skip.
  if (existed && dstStat && dstStat.mtimeMs >= srcStat.mtimeMs) {
    return {
      filePath,
      webpPath,
      skipped: true,
      before: srcStat.size,
      after: dstStat.size,
    };
  }

  const img = sharp(filePath, { failOn: "none" });
  const meta = await img.metadata();

  let pipeline = img;

  if (typeof meta.width === "number" && meta.width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }

  await pipeline.webp({ quality, effort: 4 }).toFile(webpPath);

  const after = fs.statSync(webpPath).size;

  return { filePath, webpPath, skipped: false, before: srcStat.size, after };
}

async function main() {
  const args = parseArgs(process.argv);
  const quality = Math.max(1, Math.min(100, Number(args.quality || 75)));
  const maxWidth = Math.max(320, Number(args.maxWidth || 1900));

  const root = path.join(process.cwd(), "public", "assets", "images");
  if (!fs.existsSync(root)) {
    console.error(`❌ Folder not found: ${root}`);
    process.exit(1);
  }

  const all = walkFiles(root);
  const pngs = all.filter((p) => p.toLowerCase().endsWith(".png"));

  if (pngs.length === 0) {
    console.log("ℹ️ No PNG files found to convert.");
    return;
  }

  console.log(
    `🖼️ Converting ${pngs.length} PNG file(s) to WebP (quality=${quality}, maxWidth=${maxWidth})...`
  );

  let savedTotal = 0;

  for (const p of pngs) {
    try {
      const res = await convertPngToWebp(p, { quality, maxWidth });
      const saved = res.before - res.after;
      savedTotal += Math.max(0, saved);

      const relIn = path.relative(process.cwd(), res.filePath);
      const relOut = path.relative(process.cwd(), res.webpPath);

      if (res.skipped) {
        console.log(`- SKIP ${relIn} (already up to date)`);
      } else {
        console.log(
          `- OK   ${relIn} -> ${relOut} | ${formatBytes(
            res.before
          )} -> ${formatBytes(res.after)} (saved ${formatBytes(saved)})`
        );
      }
    } catch (e) {
      console.error(`❌ Failed: ${p}`);
      console.error(e);
      process.exitCode = 1;
    }
  }

  console.log(`✅ Done. Total saved: ~${formatBytes(savedTotal)}`);
}

main();
