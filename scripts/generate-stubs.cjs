#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Generate JS stubs for column-modules
const columnModules = glob.sync('src/js/column-modules/*.mjs');
columnModules.forEach(file => {
  const jsFile = file.replace(/\.mjs$/, '.js');
  if (!fs.existsSync(jsFile)) {
    const base = path.basename(jsFile);
    const stubContent = `export { default } from './${base.replace('.js','.mjs')}';
export * from './${base.replace('.js','.mjs')}';
`;
    fs.writeFileSync(jsFile, stubContent, 'utf8');
    console.log(`Created stub ${jsFile}`);
  }
});

// Generate JS stubs for sheets and updateStatus
['sheets', 'updateStatus'].forEach(name => {
  const mjs = `src/js/${name}.mjs`;
  const js = `src/js/${name}.js`;
  if (fs.existsSync(mjs) && !fs.existsSync(js)) {
    const stubContent = `export * from './${name}.mjs';
`;
    fs.writeFileSync(js, stubContent, 'utf8');
    console.log(`Created stub ${js}`);
  }
});
