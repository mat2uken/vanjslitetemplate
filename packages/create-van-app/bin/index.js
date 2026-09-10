#!/usr/bin/env node

/**
 * create-van-app (and create-van)
 * Ultra-lightweight, zero-dependency scaffolding CLI for VanJS WebApps
 * Optimized for Mobile Safari and Embedded Engines (Cobalt, Webf, Lynx, Servo)
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRootDir = path.resolve(__dirname, "..");
const templatesDir = path.resolve(packageRootDir, "templates");

// ANSI color helpers (Zero dependencies)
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

// Auto-detect package manager from npm_config_user_agent
function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent || "";
  if (userAgent.startsWith("pnpm")) return "pnpm";
  if (userAgent.startsWith("bun")) return "bun";
  if (userAgent.startsWith("yarn")) return "yarn";
  return "npm";
}

function printHelp() {
  console.log(`
${c.bold}${c.cyan}create-van-app${c.reset} - Ultra-lightweight VanJS WebApp Scaffolding CLI

${c.bold}USAGE:${c.reset}
  $ npm create van-app [project-name] [options]
  $ npx create-van-app [project-name] [options]

${c.bold}OPTIONS:${c.reset}
  -t, --template <name>    Template preset: ${c.green}full${c.reset} | ${c.green}minimal${c.reset} (default: full)
  --pm <package-manager>   Package manager: npm | pnpm | bun | yarn (auto-detected)
  --git / --no-git         Initialize a git repository (default: prompt)
  --install / --no-install Automatically install dependencies (default: prompt)
  -y, --yes                Skip interactive prompts and use default settings
  --remote                 Clone directly from GitHub (mat2uken/vanjslitetemplate)
  -h, --help               Display this help message
  -v, --version            Display CLI version

${c.bold}EXAMPLES:${c.reset}
  $ npx create-van-app my-app
  $ npx create-van-app my-minimal-app -t minimal -y
  $ npx create-van-app my-app --remote --install
`);
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    let destName = entry.name;
    // Rename _gitignore back to .gitignore for npm package tarball compatibility
    if (destName === "_gitignore") {
      destName = ".gitignore";
    }
    const destPath = path.join(dest, destName);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function main() {
  const rawArgs = process.argv.slice(2);

  if (rawArgs.includes("-h") || rawArgs.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  if (rawArgs.includes("-v") || rawArgs.includes("--version")) {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(packageRootDir, "package.json"), "utf8"),
    );
    console.log(`create-van-app v${pkg.version}`);
    process.exit(0);
  }

  // Parse CLI flags
  let targetDir = "";
  let template = "full";
  let packageManager = detectPackageManager();
  let initGit = null;
  let runInstall = null;
  let useDefaults = false;
  let useRemote = false;

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === "-y" || arg === "--yes") {
      useDefaults = true;
    } else if (arg === "--remote") {
      useRemote = true;
    } else if (arg === "-t" || arg === "--template") {
      template = rawArgs[++i] || "full";
    } else if (arg === "--pm") {
      packageManager = rawArgs[++i] || "npm";
    } else if (arg === "--git") {
      initGit = true;
    } else if (arg === "--no-git") {
      initGit = false;
    } else if (arg === "--install") {
      runInstall = true;
    } else if (arg === "--no-install") {
      runInstall = false;
    } else if (!arg.startsWith("-") && !targetDir) {
      targetDir = arg;
    }
  }

  console.log(`
${c.bold}${c.cyan}┌─────────────────────────────────────────────────────────────┐${c.reset}
${c.bold}${c.cyan}│${c.reset}  ${c.bold}Create VanJS App${c.reset}                                           ${c.bold}${c.cyan}│${c.reset}
${c.bold}${c.cyan}│${c.reset}  ${c.dim}Ultra-lightweight template for Safari & Embedded Engines${c.reset}   ${c.bold}${c.cyan}│${c.reset}
${c.bold}${c.cyan}└─────────────────────────────────────────────────────────────┘${c.reset}
`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // 1. Project directory / name
    if (!targetDir && !useDefaults) {
      const answer = await rl.question(
        `${c.bold}◆ Project name:${c.reset} ${c.dim}(van-light-app)${c.reset} `,
      );
      targetDir = answer.trim() || "van-light-app";
    } else if (!targetDir) {
      targetDir = "van-light-app";
    }

    const destDir = path.resolve(process.cwd(), targetDir);
    const projectName = path.basename(destDir);

    // Validate directory
    if (fs.existsSync(destDir)) {
      const files = fs.readdirSync(destDir);
      if (files.length > 0) {
        if (!useDefaults) {
          const overwrite = await rl.question(
            `${c.yellow}⚠ Directory "${targetDir}" is not empty. Continue and overwrite? (y/N):${c.reset} `,
          );
          if (overwrite.trim().toLowerCase() !== "y") {
            console.log(`${c.red}Aborted.${c.reset}`);
            process.exit(1);
          }
        }
      }
    }

    // 2. Template selection
    if (!useDefaults && !rawArgs.includes("-t") && !rawArgs.includes("--template") && !useRemote) {
      console.log(`\n${c.bold}◆ Select a template:${c.reset}`);
      console.log(`  ${c.green}1) full${c.reset}     - Complete PoC (Every Layout, UI Components, Tests, Standalone build)`);
      console.log(`  ${c.cyan}2) minimal${c.reset}  - Lean Starter (VanJS Core, subset.css, Stack, Hash Router)`);
      const tAnswer = await rl.question(`${c.dim}Choice [1/2] (default: 1):${c.reset} `);
      if (tAnswer.trim() === "2" || tAnswer.trim().toLowerCase() === "minimal") {
        template = "minimal";
      } else {
        template = "full";
      }
    }

    // 3. Package Manager
    if (!useDefaults && !rawArgs.includes("--pm")) {
      const pmAnswer = await rl.question(
        `\n${c.bold}◆ Package manager:${c.reset} ${c.dim}(${packageManager})${c.reset} `,
      );
      if (pmAnswer.trim()) {
        packageManager = pmAnswer.trim().toLowerCase();
      }
    }

    // 4. Git Init
    if (initGit === null && !useDefaults) {
      const gitAnswer = await rl.question(
        `\n${c.bold}◆ Initialize git repository?${c.reset} ${c.dim}(Y/n)${c.reset} `,
      );
      initGit = gitAnswer.trim().toLowerCase() !== "n";
    } else if (initGit === null) {
      initGit = true;
    }

    // 5. Run install
    if (runInstall === null && !useDefaults) {
      const installAnswer = await rl.question(
        `\n${c.bold}◆ Install dependencies now with ${packageManager}?${c.reset} ${c.dim}(Y/n)${c.reset} `,
      );
      runInstall = installAnswer.trim().toLowerCase() !== "n";
    } else if (runInstall === null) {
      runInstall = false;
    }

    rl.close();

    console.log(`\n${c.cyan}⚙ Scaffolding project in ${c.bold}${destDir}${c.reset}...`);

    // Scaffolding step
    if (useRemote) {
      console.log(`  ${c.dim}Cloning latest template from GitHub (mat2uken/vanjslitetemplate)...${c.reset}`);
      execSync(`git clone --depth=1 https://github.com/mat2uken/vanjslitetemplate.git "${destDir}"`, {
        stdio: "ignore",
      });
      // Remove old .git
      fs.rmSync(path.join(destDir, ".git"), { recursive: true, force: true });
    } else {
      const templatePath = path.resolve(templatesDir, `template-${template}`);
      if (!fs.existsSync(templatePath)) {
        console.error(`${c.red}Error: Template "${template}" not found at ${templatePath}${c.reset}`);
        process.exit(1);
      }
      copyDirectory(templatePath, destDir);
    }

    // Update package.json name
    const pkgPath = path.join(destDir, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      pkg.name = projectName;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    }

    console.log(`  ${c.green}✔${c.reset} Files copied successfully (${template} template)`);

    // Git Init
    if (initGit) {
      try {
        execSync("git init", { cwd: destDir, stdio: "ignore" });
        execSync("git add -A", { cwd: destDir, stdio: "ignore" });
        execSync('git commit -m "feat: initial commit from create-van-app"', {
          cwd: destDir,
          stdio: "ignore",
        });
        console.log(`  ${c.green}✔${c.reset} Initialized Git repository`);
      } catch {
        console.warn(`  ${c.yellow}⚠ Could not initialize Git repository (git command unavailable?)${c.reset}`);
      }
    }

    // Install dependencies
    if (runInstall) {
      console.log(`\n${c.cyan}📦 Installing dependencies using ${packageManager}...${c.reset}`);
      const installRes = spawnSync(packageManager, ["install"], {
        cwd: destDir,
        stdio: "inherit",
      });
      if (installRes.status === 0) {
        console.log(`  ${c.green}✔${c.reset} Dependencies installed`);
      } else {
        console.warn(`  ${c.yellow}⚠ Failed to install dependencies automatically${c.reset}`);
      }
    }

    // Success summary
    console.log(`
${c.green}${c.bold}✨ Successfully created ${projectName}!${c.reset}

${c.bold}Next steps:${c.reset}
  ${c.cyan}cd ${targetDir}${c.reset}
${!runInstall ? `  ${c.cyan}${packageManager} install${c.reset}\n` : ""}\
  ${c.cyan}${packageManager} run safari${c.reset}          ${c.dim}# Starts dev server and opens in Safari${c.reset}
  ${c.cyan}${packageManager} run safari:standalone${c.reset} ${c.dim}# Directly opens single-file standalone HTML${c.reset}
  ${c.cyan}${packageManager} run test:all${c.reset}          ${c.dim}# Runs Vitest and Playwright WebKit tests${c.reset}
`);
  } catch (err) {
    rl.close();
    console.error(`\n${c.red}Error scaffolding project:${c.reset}`, err.message);
    process.exit(1);
  }
}

main();
