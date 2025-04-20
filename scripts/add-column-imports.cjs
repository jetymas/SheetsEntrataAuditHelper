#!/usr/bin/env node
const fs = require("fs");
const glob = require("glob");

const testFiles = glob.sync("tests/unit/column-modules/*.test.mjs");

testFiles.forEach((file) => {
  const basename = file.match(/([^\\/]+)\.test\.mjs$/)[1];

  let content = fs.readFileSync(file, "utf8");
  const importStatement = `import Column${basename} from '../../../src/js/column-modules/${basename}.js';`;
  if (!content.includes(importStatement)) {
    content = importStatement + "\n" + content;
    fs.writeFileSync(file, content, "utf8");
    console.log(`Prepended import to ${file}`);
  }
});
