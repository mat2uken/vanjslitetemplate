# create-van-app

> Ultra-lightweight VanJS WebApp Scaffolding CLI targeting Mobile Safari and Embedded Engines (Google Cobalt, Webf, Lynx, Servo, miniblink).

## Quick Start

Create a new VanJS project in seconds:

```bash
# npm
npm create van-app my-app

# npx
npx create-van-app my-app

# pnpm
pnpm create van-app my-app

# bun
bun create van-app my-app
```

## Options & Flags

```bash
npx create-van-app [project-name] [options]
```

| Flag | Description | Default |
| :--- | :--- | :--- |
| `-t, --template <name>` | Template preset: `full` or `minimal` | `full` |
| `--pm <manager>` | Package manager: `npm`, `pnpm`, `bun`, `yarn` | auto-detected |
| `--git / --no-git` | Initialize a Git repository | Prompt (`true` with `-y`) |
| `--install / --no-install` | Automatically install dependencies | Prompt (`false` with `-y`) |
| `-y, --yes` | Skip interactive prompts and accept all defaults | `false` |
| `--remote` | Clone directly from GitHub repository | `false` |
| `-h, --help` | Display help message | |
| `-v, --version` | Display version number | |

## Available Templates

### 1. `full` (Default)
The complete production-ready Model-C WebApp PoC:
- **Core Runtime**: VanJS + Custom Reactive Hash Router (~3.75 KB gzip).
- **CSS Engine**: [Every Layout](https://every-layout.dev/rudiments/boxes/) Primitives (The Box, The Stack, The Center, The Cluster, The Switcher, The Imposter).
- **Embedded-Safe UI Components**: Portal Engine, Accessible Modal Dialog, Safe Popover (Flip & Clamp), Tabs & Accordion, Toast Notifications.
- **Testing**: Vitest unit tests + Playwright E2E tests for WebKit & Mobile Safari.
- **Standalone Builder**: Generates single-file self-contained `dist/standalone.html` for direct `file://` or STB memory injection.
- **Toolchain**: Vite 8, Rolldown, Oxlint (`@nkzw/oxlint-config`), Oxfmt.

### 2. `minimal`
Ultra-lean blank canvas starter:
- VanJS Core (`vanjs-core`)
- Every Layout subset CSS (`subset.css`)
- Type-safe Flexbox Stack component (`@nkzw/stack` model)
- Reactive Hash Router
- Standalone HTML builder & Safari quick launcher

## Alternative: Direct GitHub Cloning

If you do not wish to use npm, you can scaffold directly from GitHub:

```bash
# Using degit
npx degit mat2uken/vanjslitetemplate my-app

# Or git clone shallow
git clone --depth=1 https://github.com/mat2uken/vanjslitetemplate.git my-app
cd my-app
rm -rf .git && git init
```
