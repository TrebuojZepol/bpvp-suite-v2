/**
 * Entry point Electron (spec). Carga el proceso principal compilado en dist/main/.
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainPath = path.join(__dirname, "..", "dist", "main", "main.mjs");

await import(pathToFileURL(mainPath).href);
