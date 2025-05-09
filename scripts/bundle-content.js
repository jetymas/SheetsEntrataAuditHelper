// scripts/bundle-content.js
const esbuild = require("esbuild");

esbuild.buildSync({
  entryPoints: ["src/js/content.mjs"],
  bundle: true,
  outfile: "dist/content.bundle.js",
  format: "iife", // classic script for injection
  target: ["chrome58", "firefox57", "safari11"],
  sourcemap: true,
});

console.log("Content script bundled for testing.");
