// Packages the OpenAI Apps hosting bundle: the Vite client plus the worker shell.
// Run `npm run build` first — this script assembles, it does not compile.

import { cp, mkdir, rm, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const out = path.join(root, "dist-openai");

try {
  await access(dist);
} catch {
  console.error("dist/ not found. Run `npm run build` before `node scripts/build.mjs`.");
  process.exit(1);
}

await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, "server"), { recursive: true });
await mkdir(path.join(out, ".openai"), { recursive: true });

await cp(dist, path.join(out, "client"), { recursive: true });
await cp(path.join(root, "core"), path.join(out, "server", "core"), { recursive: true });
await cp(path.join(root, "worker.mjs"), path.join(out, "server", "index.js"));
await cp(path.join(root, ".openai", "hosting.json"), path.join(out, ".openai", "hosting.json"));

console.log(`Assembled ${path.relative(root, out)}/ (client + worker over shared core)`);
