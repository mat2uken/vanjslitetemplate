import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const packagesDir = path.resolve(rootDir, "packages/create-van-app");
const templatesDir = path.resolve(packagesDir, "templates");
const fullDir = path.resolve(templatesDir, "template-full");
const minimalDir = path.resolve(templatesDir, "template-minimal");

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest, filter = () => true) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (!filter(entry.name, srcPath)) continue;

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, filter);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

async function syncTemplates() {
  console.log("Synchronizing templates from root repository...");

  // 1. Prepare directories
  cleanDir(fullDir);
  cleanDir(minimalDir);

  // 2. Build template-full
  console.log("-> Generating template-full...");
  const fullIgnore = [
    "node_modules",
    "dist",
    ".git",
    "packages",
    "test-results",
    "package-lock.json",
    ".DS_Store",
  ];
  copyDir(rootDir, fullDir, (name) => !fullIgnore.includes(name));

  // Rename .gitignore to _gitignore for npm package compatibility
  const fullGitignore = path.join(fullDir, ".gitignore");
  if (fs.existsSync(fullGitignore)) {
    fs.renameSync(fullGitignore, path.join(fullDir, "_gitignore"));
  }

  // Adjust package.json for template-full
  const fullPkgPath = path.join(fullDir, "package.json");
  const fullPkg = JSON.parse(fs.readFileSync(fullPkgPath, "utf8"));
  fullPkg.name = "my-van-app";
  fullPkg.version = "0.1.0";
  delete fullPkg.scripts.create;
  delete fullPkg.scripts["sync:templates"];
  fs.writeFileSync(fullPkgPath, JSON.stringify(fullPkg, null, 2) + "\n");

  // 3. Build template-minimal
  console.log("-> Generating template-minimal...");
  // Core files
  copyFile(path.join(rootDir, "src/core/van.js"), path.join(minimalDir, "src/core/van.js"));
  copyFile(path.join(rootDir, "src/core/router.js"), path.join(minimalDir, "src/core/router.js"));
  copyFile(
    path.join(rootDir, "src/components/stack.js"),
    path.join(minimalDir, "src/components/stack.js"),
  );
  copyFile(
    path.join(rootDir, "src/styles/subset.css"),
    path.join(minimalDir, "src/styles/subset.css"),
  );
  copyFile(
    path.join(rootDir, "scripts/build-standalone.js"),
    path.join(minimalDir, "scripts/build-standalone.js"),
  );
  copyFile(
    path.join(rootDir, "scripts/open-safari.js"),
    path.join(minimalDir, "scripts/open-safari.js"),
  );
  copyFile(path.join(rootDir, "vite.config.js"), path.join(minimalDir, "vite.config.js"));
  copyFile(path.join(rootDir, "oxlint.config.js"), path.join(minimalDir, "oxlint.config.js"));
  copyFile(path.join(rootDir, "index.html"), path.join(minimalDir, "index.html"));

  // Minimal main.js
  const minimalMain = `import van from "./core/van.js";
import { RouterView, navigate } from "./core/router.js";
import { HStack, VStack } from "./components/stack.js";
import "./styles/subset.css";

const { a, button, div, h1, header, main, nav, p, span, strong } = van.tags;

function HomePage() {
  const count = van.state(0);

  return div(
    { class: "c-container u-space-y-lg" },
    div(
      { class: "c-card u-space-y" },
      div({ class: "c-card-header" }, "Minimal VanJS Application"),
      p(
        { class: "c-card-description" },
        "Ultra-lightweight, zero-dependency SPA template targeting Mobile Safari and Embedded Engines (Cobalt, Webf, Lynx, Servo).",
      ),
      HStack(
        { spacing: 12 },
        button(
          {
            class: "c-btn c-btn-primary",
            onclick: () => count.val++,
          },
          "カウントアップ: ",
          () => count.val,
        ),
        button(
          {
            class: "c-btn",
            onclick: () => (count.val = 0),
          },
          "リセット",
        ),
      ),
    ),
  );
}

const routes = {
  "/": HomePage,
};

function App() {
  return div(
    { id: "app-root" },
    header(
      { class: "c-header" },
      div(
        { class: "c-header-title" },
        "My VanJS App",
        span({ class: "c-header-badge" }, "Minimal"),
      ),
      div({ style: "font-size: 12px; color: #94a3b8;" }, "Embedded-Safe Runtime"),
    ),
    main({ class: "c-main-scroll" }, RouterView(routes)),
  );
}

const mountPoint = document.getElementById("app") || document.body;
van.add(mountPoint, App());
`;
  fs.writeFileSync(path.join(minimalDir, "src/main.js"), minimalMain);

  // Minimal package.json
  const minimalPkg = {
    name: "my-van-minimal-app",
    version: "0.1.0",
    description: "Minimal ultra-lightweight VanJS WebApp",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build && node scripts/build-standalone.js",
      preview: "vite preview",
      lint: "oxlint --config oxlint.config.js src/",
      format: "oxfmt --write src/ scripts/",
      standalone: "node scripts/build-standalone.js",
      safari: "node scripts/open-safari.js",
      "safari:standalone": "npm run standalone && open -a Safari dist/standalone.html",
    },
    dependencies: {
      "@nkzw/core": "^1.3.1",
      "@nkzw/stack": "^2.3.2",
      "vanjs-core": "^1.6.1",
    },
    devDependencies: {
      "@nkzw/oxlint-config": "^2.0.1",
      esbuild: "^0.28.2",
      oxfmt: "^0.67.0",
      oxlint: "^1.82.0",
      vite: "^8.3.0",
    },
  };
  fs.writeFileSync(
    path.join(minimalDir, "package.json"),
    JSON.stringify(minimalPkg, null, 2) + "\n",
  );

  // Minimal _gitignore
  fs.writeFileSync(path.join(minimalDir, "_gitignore"), `node_modules\ndist\n.DS_Store\n*.local\n`);

  console.log("Template synchronization completed successfully.");
}

syncTemplates().catch((err) => {
  console.error(err);
  process.exit(1);
});
