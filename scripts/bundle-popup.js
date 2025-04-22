// scripts/bundle-popup.js
const esbuild = require("esbuild");

esbuild.buildSync({
  entryPoints: ["src/js/popup.mjs"],
  bundle: true,
  outfile: "dist/popup.bundle.js",
  format: "iife", // For direct browser use
  target: ["chrome58", "firefox57", "safari11"],
  sourcemap: true,
});

console.log("Popup script bundled for production.");
