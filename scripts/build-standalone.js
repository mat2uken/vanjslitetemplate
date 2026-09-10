import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.resolve(rootDir, "dist");

async function buildStandalone() {
  console.log("Building standalone single-file HTML for embedded device direct injection...");

  // 1. Bundle JS
  const jsResult = await esbuild.build({
    entryPoints: [path.resolve(rootDir, "src/main.js")],
    bundle: true,
    minify: true,
    format: "iife",
    target: "es2018",
    loader: { ".css": "empty" },
    write: false,
  });
  const jsCode = jsResult.outputFiles[0].text;

  // 2. Bundle CSS
  const cssPath = path.resolve(rootDir, "src/styles/subset.css");
  const rawCss = fs.readFileSync(cssPath, "utf8");
  const minCss = (await esbuild.transform(rawCss, { loader: "css", minify: true })).code;

  // 3. Assemble Standalone HTML
  const standaloneHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>VanJS Light WebApp (Standalone Embedded PoC)</title>
  <style>${minCss}</style>
</head>
<body>
  <div id="app"></div>
  <script>${jsCode}</script>
</body>
</html>`;

  const outputPath = path.resolve(distDir, "standalone.html");
  fs.writeFileSync(outputPath, standaloneHtml, "utf8");

  const buf = Buffer.from(standaloneHtml);
  const rawKb = (buf.length / 1024).toFixed(2);
  const gzipKb = (zlib.gzipSync(buf, { level: 9 }).length / 1024).toFixed(2);
  const brotliKb = (zlib.brotliCompressSync(buf).length / 1024).toFixed(2);

  console.log(`Standalone HTML created at: dist/standalone.html`);
  console.log(`Size: ${rawKb} KB (Gzip: ${gzipKb} KB, Brotli: ${brotliKb} KB)`);
  console.log(
    "Zero external requests. Can be directly loaded into Cobalt / Webf / Lynx file:// or STB memory.",
  );
}

buildStandalone().catch((err) => {
  console.error(err);
  process.exit(1);
});
