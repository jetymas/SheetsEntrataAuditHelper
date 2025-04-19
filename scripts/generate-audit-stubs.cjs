#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Generate JS stubs for audit-types
const auditModules = glob.sync('src/js/audit-types/*.mjs');
auditModules.forEach(file => {
  const jsFile = file.replace(/\.mjs$/, '.js');
  if (!fs.existsSync(jsFile)) {
    const base = path.basename(jsFile);
    const stubContent = `export * from './${base.replace('.js','.mjs')}';\n`;
    fs.writeFileSync(jsFile, stubContent, 'utf8');
    console.log(`Created stub ${jsFile}`);
  }
});
