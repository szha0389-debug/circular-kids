// Runs the API and the Vite dev server together, so `npm run dev` is one command.
// Vite proxies /api to the API server (see vite.config.js), which keeps the
// browser on a single origin and matches the production CSP.
//
// Both children are started as `node <script>` rather than through the `vite`
// shim. On Windows that shim is `vite.cmd`, and since the fix for CVE-2024-27980
// Node refuses to spawn a .cmd without `shell: true` — it fails with EINVAL.
// Resolving the real JS entry sidesteps the shell altogether, which also avoids
// the argument-quoting problems that come with it.

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let viteBin;
try {
  viteBin = path.join(path.dirname(require.resolve("vite/package.json")), "bin", "vite.js");
} catch {
  console.error("Vite is not installed. Run `npm install` first.");
  process.exit(1);
}

const children = [
  spawn(process.execPath, ["server.js"], { cwd: root, stdio: "inherit" }),
  spawn(process.execPath, [viteBin], { cwd: root, stdio: "inherit" })
];

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill();
  }
  process.exit(code);
}

for (const child of children) {
  child.on("error", error => {
    console.error(`Failed to start a dev process: ${error.message}`);
    shutdown(1);
  });
  // If either side dies, take the other down rather than leaving half a stack up.
  child.on("exit", code => shutdown(code ?? 0));
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
