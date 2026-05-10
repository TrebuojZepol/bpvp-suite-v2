import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Native / runtime-provided only — rest is bundled for a single main entry. */
const external = ["electron", "argon2"];

await esbuild.build({
  entryPoints: [path.join(root, "src/main/main.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: path.join(root, "dist/main/main.mjs"),
  external,
  sourcemap: true,
});

await esbuild.build({
  entryPoints: [path.join(root, "src/main/preload.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: path.join(root, "dist/main/preload.cjs"),
  external: ["electron"],
  sourcemap: true,
});
