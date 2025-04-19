import { jest } from '@jest/globals';

await jest.unstable_mockModule('../src/js/column-modules/column-helpers.js', () => ({
  __esModule: true,
  default: {
    hasBlackFill: jest.fn(),
  },
  hasBlackFill: jest.fn(),
}));

const { default: ColumnHelpers } = await import('../src/js/column-modules/column-helpers.js');
const { default: ColumnX } = await import('../src/js/column-modules/X.js');

describe('ColumnX', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('run returns correct values from sheet', async () => {
    const context = { record: { 'One Time #1 Type': 'Pet Fee' }, result: {} };
    const result = await ColumnX.run({}, 'X', context);
    expect(result).toMatchObject({
      success: true,
      pdfValue: 'Pet Fee',
      expectedValue: 'Pet Fee',
      normalizedPdfValue: 'Pet Fee',
      normalizedExpectedValue: 'Pet Fee',
      match: true
    });
  });

  it('isApplicable returns false if hasBlackFill is true', () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(true);
    const record = { 'One Time #1 Type': 'Pet Fee' };
    expect(ColumnX.isApplicable(record)).toBe(false);
  });

  it('isApplicable returns true if hasBlackFill is false', () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(false);
    const record = { 'One Time #1 Type': 'Pet Fee' };
    expect(ColumnX.isApplicable(record)).toBe(true);
  });

  it('displayData returns correct values', () => {
    const context = { result: { pdfValue: 'Pet Fee', expectedValue: 'Pet Fee' } };
    const data = ColumnX.displayData({}, 'X', context);
    expect(data).toMatchObject({
      fieldName: 'One Time #1 Type',
      pdfValue: 'Pet Fee',
      expectedValue: 'Pet Fee',
      match: true
    });
  });
});
