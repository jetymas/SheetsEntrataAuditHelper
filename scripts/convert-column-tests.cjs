#!/usr/bin/env node
const fs = require('fs');
const glob = require('glob');

// Convert jest.mock to ESM unstable_mockModule in column-modules tests
const testFiles = glob.sync('tests/column-modules/*.test.mjs');

testFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const mockRegex = /import ColumnHelpers from '(.+?)';\s*jest\.mock\('(.+?)'\);/;
  if (mockRegex.test(content)) {
    content = content.replace(mockRegex, `let ColumnHelpers;
beforeAll(async () => {
  ColumnHelpers = await jest.unstable_mockModule('$2', () => ({
    __esModule: true,
    default: {
      hasBlackFill: jest.fn(),
      findTextInPdf: jest.fn()
    }
  }));
});`);
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Converted ESM mock in ${file}`);
  }
});
