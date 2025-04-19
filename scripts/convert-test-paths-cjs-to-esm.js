#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Update ESM test imports and mocks
const testFiles = glob.sync('tests/**/*.test.mjs', { nodir: true });

testFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Replace unstable_mockModule path to .mjs
  content = content.replace(/jest\.unstable_mockModule\('(.+?)\.js'/g, "jest.unstable_mockModule('$1.mjs'");
  // Replace dynamic import paths of column-modules to .mjs
  content = content.replace(/import\((['\"])\.{2}\/src\/js\/column-modules\/(.+?)\.js\1\)/g, "import($1../src/js/column-modules/$2.mjs$1)");
  // Replace static import specifiers in tests (e.g. import X from '../src/js/...js')
  content = content.replace(/from (['\"])\.\.\/src\/js\/(.+?)\.js\1/g, "from $1../src/js/$2.mjs$1");
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Patched ${file}`);
});
// Add fs import to integration test if missing
const integration = 'tests/integration/content-script.integration.test.mjs';
let integ = fs.readFileSync(integration, 'utf8');
if (!/import fs from 'fs'/g.test(integ)) {
  integ = integ.replace(/(import path.*?;)/, `$1\nimport fs from 'fs';`);
  fs.writeFileSync(integration, integ, 'utf8');
  console.log(`Patched fs import in ${integration}`);
}
