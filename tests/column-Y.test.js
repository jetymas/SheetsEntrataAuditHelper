import { jest } from '@jest/globals';

await jest.unstable_mockModule('../src/js/column-modules/column-helpers.js', () => ({
  __esModule: true,
  default: {
    hasBlackFill: jest.fn(),
  },
  hasBlackFill: jest.fn(),
}));

const { default: ColumnHelpers } = await import('../src/js/column-modules/column-helpers.js');
const { default: ColumnY } = await import('../src/js/column-modules/Y.js');

describe('ColumnY', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('run returns correct values from sheet', async () => {
    const context = { record: { 'One Time #1 Value': '$100' }, result: {} };
    const result = await ColumnY.run({}, 'Y', context);
    expect(result).toMatchObject({
      success: true,
      pdfValue: '$100',
      expectedValue: '$100',
      normalizedPdfValue: '$100',
      normalizedExpectedValue: '$100',
      match: true
    });
  });

  it('isApplicable returns false if hasBlackFill is true', () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(true);
    const record = { 'One Time #1 Value': '$100' };
    expect(ColumnY.isApplicable(record)).toBe(false);
  });

  it('isApplicable returns true if hasBlackFill is false', () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(false);
    const record = { 'One Time #1 Value': '$100' };
    expect(ColumnY.isApplicable(record)).toBe(true);
  });

  it('displayData returns correct values', () => {
    const context = { result: { pdfValue: '$100', expectedValue: '$100' } };
    const data = ColumnY.displayData({}, 'Y', context);
    expect(data).toMatchObject({
      fieldName: 'One Time #1 Value',
      pdfValue: '$100',
      expectedValue: '$100',
      match: true
    });
  });
});
