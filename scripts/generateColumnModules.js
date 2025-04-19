const fs = require('fs');
const path = require('path');

// Paths
const specFile = path.resolve(__dirname, '../reference/column_implementation.txt');
const modulesDir = path.resolve(__dirname, '../src/js/column-modules');

// Read spec
const lines = fs.readFileSync(specFile, 'utf8')
  .split(/\r?\n/)
  .slice(1) // skip header
  .filter(Boolean);

for (const line of lines) {
  const parts = line.split(',').map(s => s.trim());
  const letter = parts[0];
  const name = parts[1];
  const type = parts[2];
  const instructions = parts[3] || '';

  const filename = path.join(modulesDir, `${letter}.js`);

  let content;
  if (type === 'read-only' && !instructions.includes('{')) {
    // Default read-only implementation
    content = `import ColumnHelpers from './column-helpers.js';

const Column${letter} = {
  id: '${name.replace(/\s+/g, '')}',
  name: '${name}',
  sheetColumn: '${name}',
  resultColumn: '${letter}',

  isApplicable(record) {
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },

  async run(row, col, context) {
    const value = context.record[this.sheetColumn];
    return { success: true, pdfValue: value, expectedValue: value, normalizedPdfValue: value, normalizedExpectedValue: value, match: true };
  },

  displayData(row, col, context) {
    return { fieldName: this.name, pdfValue: context.result.pdfValue, expectedValue: context.result.expectedValue, match: true };
  }
};

export default Column${letter};`;
  } else if (type === 'input') {
    // Default input-based interactive module
    content = `import ColumnHelpers from './column-helpers.js';

const Column${letter} = {
  id: '${name.replace(/\s+/g, '')}',
  name: '${name}',
  sheetColumn: '${name}',
  resultColumn: '${letter}',

  isApplicable(record) {
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },

  async run(row, col, context) {
    // User confirmation required
    return { success: true, requiresUserConfirmation: true };
  },

  displayData(row, col, context) {
    return {
      fieldName: this.name,
      message: 'Please verify ${name}.',
      requiresUserConfirmation: true
    };
  }
};

export default Column${letter};`;
  } else {
    // Custom type stub
    content = `/**
 * Column ${letter}: ${name}\n * Type: ${type}\n * Instructions: ${instructions}
 */

/**
 * Process row data for column ${letter}
 * @param {object} rowData - data of current row
 * @returns {*} - value for column ${letter}
 */
function process${letter}(rowData) {
  // TODO: implement based on spec
  return null;
}

module.exports = { process${letter} };`;
  }

  fs.writeFileSync(filename, content, 'utf8');
  console.log(`Created module: ${letter}.js`);
}
