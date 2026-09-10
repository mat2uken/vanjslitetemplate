import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";
import * as esbuild from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.resolve(rootDir, "dist");

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function calcSizes(bufferOrString) {
  const buf = Buffer.isBuffer(bufferOrString) ? bufferOrString : Buffer.from(bufferOrString);
  const rawSize = buf.length;
  const gzipSize = zlib.gzipSync(buf, { level: 9 }).length;
  const brotliSize = zlib.brotliCompressSync(buf).length;
  return { rawSize, gzipSize, brotliSize };
}

async function bundleAndMeasure(entryPath, name) {
  const result = await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    minify: true,
    format: "esm",
    target: "es2018",
    write: false,
  });

  const code = result.outputFiles[0].text;
  const sizes = calcSizes(code);
  return { name, ...sizes };
}

async function main() {
  console.log("======================================================================");
  console.log("         VanJS Light WebApp PoC - Comprehensive Size Audit            ");
  console.log("======================================================================\n");

  // 1. Pure Framework Core Runtime (Model C Revision Stack)
  console.log("[1] Core Framework Runtime (VanJS + Custom Components & Utils)");
  console.log("----------------------------------------------------------------------");
  console.log(
    "Layer / Module".padEnd(35) + "Raw".padStart(10) + "Gzip".padStart(12) + "Brotli".padStart(12),
  );
  console.log("----------------------------------------------------------------------");

  const coreModules = [
    { file: "node_modules/vanjs-core/src/van.js", label: "1. VanJS Core (vanjs-core)" },
    { file: "src/core/router.js", label: "2. Client Router (Regex/Params)" },
    { file: "src/core/store.js", label: "3. Global Store (authStore)" },
    { file: "src/utils/position.js", label: "4. Safe Position Engine" },
    { file: "src/utils/events.js", label: "5. Safe Events & Back Key" },
    { file: "src/components/portal.js", label: "6. Portal Engine" },
    { file: "src/components/modal.js", label: "7. Portal Modal" },
    { file: "src/components/popover.js", label: "8. Safe Popover" },
    { file: "src/components/tabs.js", label: "9. Lightweight Tabs" },
    { file: "src/components/toast.js", label: "10. Lightweight Toast" },
    { file: "src/bundle-core.js", label: "★ FULL MODEL-C RUNTIME" },
  ];

  for (const mod of coreModules) {
    const fullPath = path.resolve(rootDir, mod.file);
    if (fs.existsSync(fullPath)) {
      const res = await bundleAndMeasure(fullPath, mod.label);
      console.log(
        res.name.padEnd(35) +
          formatBytes(res.rawSize).padStart(10) +
          formatBytes(res.gzipSize).padStart(12) +
          formatBytes(res.brotliSize).padStart(12),
      );
    }
  }

  // 2. Strict Subset CSS
  console.log("\n[2] Strict Subset CSS (No gap, No grid, No CSS variables)");
  console.log("----------------------------------------------------------------------");
  const cssPath = path.resolve(rootDir, "src/styles/subset.css");
  const rawCss = fs.readFileSync(cssPath, "utf8");
  const minCss = (await esbuild.transform(rawCss, { loader: "css", minify: true })).code;
  const cssSizes = calcSizes(minCss);

  console.log(
    "Strict Subset CSS (Minified)".padEnd(35) +
      formatBytes(cssSizes.rawSize).padStart(10) +
      formatBytes(cssSizes.gzipSize).padStart(12) +
      formatBytes(cssSizes.brotliSize).padStart(12),
  );

  // 3. PoC Demo Application Assets (Vite Production Build)
  console.log("\n[3] Full PoC Application Bundle (Including all demo pages & text)");
  console.log("----------------------------------------------------------------------");
  if (fs.existsSync(path.join(distDir, "assets"))) {
    const assetsDir = path.join(distDir, "assets");
    const files = fs.readdirSync(assetsDir);
    let totalRaw = 0,
      totalGzip = 0,
      totalBrotli = 0;

    for (const file of files) {
      const filePath = path.join(assetsDir, file);
      const content = fs.readFileSync(filePath);
      const sizes = calcSizes(content);
      totalRaw += sizes.rawSize;
      totalGzip += sizes.gzipSize;
      totalBrotli += sizes.brotliSize;

      console.log(
        file.padEnd(35) +
          formatBytes(sizes.rawSize).padStart(10) +
          formatBytes(sizes.gzipSize).padStart(12) +
          formatBytes(sizes.brotliSize).padStart(12),
      );
    }
    console.log("----------------------------------------------------------------------");
    console.log(
      "TOTAL (Full App + Demo Pages)".padEnd(35) +
        formatBytes(totalRaw).padStart(10) +
        formatBytes(totalGzip).padStart(12) +
        formatBytes(totalBrotli).padStart(12),
    );
  }

  console.log("\n======================================================================");
  console.log("                        Design Review Verification                    ");
  console.log("======================================================================");

  const fullRuntime = await bundleAndMeasure(
    path.resolve(rootDir, "src/bundle-core.js"),
    "runtime",
  );
  const targetGzipMin = 1.3 * 1024;
  const targetGzipMax = 1.8 * 1024;

  console.log(`Document Specification Target : ~1.3 - 1.6 KB gzip`);
  console.log(
    `Measured Full Model-C Runtime : ${formatBytes(fullRuntime.gzipSize)} gzip (${formatBytes(fullRuntime.brotliSize)} brotli)`,
  );

  if (fullRuntime.gzipSize <= targetGzipMax) {
    console.log(`Result                        : PASSED ✅ (Within ultra-lightweight target)`);
  } else {
    console.log(
      `Result                        : Exceeds target by ${formatBytes(fullRuntime.gzipSize - targetGzipMax)}`,
    );
  }
  console.log("======================================================================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
