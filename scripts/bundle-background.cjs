// scripts/bundle-background.cjs
const esbuild = require("esbuild");

esbuild.buildSync({
  entryPoints: ["src/js/background.mjs"],
  bundle: true,
  outfile: "dist/background.bundle.js",
  format: "esm", // ESM for Chrome MV3 service worker
  target: ["chrome58", "firefox57", "safari11"],
  sourcemap: true,
});

console.log("Background script bundled for production.");
