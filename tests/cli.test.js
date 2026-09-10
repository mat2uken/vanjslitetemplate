import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const cliPath = path.resolve(__dirname, "../packages/create-van-app/bin/index.js");

describe("create-van-app CLI Scaffolding", () => {
  it("displays help text via --help", () => {
    const output = execSync(`node "${cliPath}" --help`, { encoding: "utf8" });
    expect(output).toContain("create-van-app");
    expect(output).toContain("USAGE:");
    expect(output).toContain("--template");
  });

  it("displays version via --version", () => {
    const output = execSync(`node "${cliPath}" --version`, { encoding: "utf8" });
    expect(output).toContain("create-van-app v");
  });

  it("scaffolds a full template project non-interactively", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "van-test-full-"));
    const targetDir = path.join(tempDir, "my-full-app");

    try {
      const output = execSync(
        `node "${cliPath}" "${targetDir}" --template full --yes --no-git --no-install`,
        { encoding: "utf8" },
      );

      expect(output).toContain("Successfully created my-full-app");

      // Verify files
      expect(fs.existsSync(path.join(targetDir, ".gitignore"))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, "_gitignore"))).toBe(false);
      expect(fs.existsSync(path.join(targetDir, "index.html"))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, "src/main.js"))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, "src/styles/subset.css"))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, "e2e/layout.spec.js"))).toBe(true);

      // Verify package.json name
      const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
      expect(pkg.name).toBe("my-full-app");
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("scaffolds a minimal template project non-interactively", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "van-test-min-"));
    const targetDir = path.join(tempDir, "my-min-app");

    try {
      const output = execSync(
        `node "${cliPath}" "${targetDir}" --template minimal --yes --no-git --no-install`,
        { encoding: "utf8" },
      );

      expect(output).toContain("Successfully created my-min-app");

      // Verify files
      expect(fs.existsSync(path.join(targetDir, ".gitignore"))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, "src/main.js"))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, "src/styles/subset.css"))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, "e2e"))).toBe(false); // minimal has no e2e

      // Verify package.json name
      const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
      expect(pkg.name).toBe("my-min-app");
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
