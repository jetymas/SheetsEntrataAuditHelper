import { jest } from '@jest/globals';

await jest.unstable_mockModule('../src/js/column-modules/column-helpers.js', () => ({
  __esModule: true,
  default: {
    extractFieldFromPdf: jest.fn(),
    hasBlackFill: jest.fn(),
  },
  extractFieldFromPdf: jest.fn(),
  hasBlackFill: jest.fn(),
}));

const { default: ColumnHelpers } = await import('../src/js/column-modules/column-helpers.js');
const { default: ColumnT } = await import('../src/js/column-modules/T.js');

describe('ColumnT', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns match=true when PDF value matches sheet', async () => {
    ColumnHelpers.extractFieldFromPdf.mockResolvedValue('14400');
    const context = { record: { 'Total Contract Amount': '14400' }, result: {} };
    const result = await ColumnT.run({}, 'T', context);
    expect(result).toMatchObject({
      pdfValue: '14400',
      expectedValue: '14400',
      match: true,
      requiresUserConfirmation: false
    });
  });

  it('returns match=false and requiresUserConfirmation when PDF value does not match sheet', async () => {
    ColumnHelpers.extractFieldFromPdf.mockResolvedValue('13000');
    const context = { record: { 'Total Contract Amount': '14400' }, result: {} };
    const result = await ColumnT.run({}, 'T', context);
    expect(result).toMatchObject({
      pdfValue: '13000',
      expectedValue: '14400',
      match: false,
      requiresUserConfirmation: true
    });
  });

  it('calls extractFieldFromPdf with correct label and page', async () => {
    ColumnHelpers.extractFieldFromPdf.mockResolvedValue('14400');
    const context = { record: { 'Total Contract Amount': '14400' }, result: {} };
    await ColumnT.run({}, 'T', context);
    expect(ColumnHelpers.extractFieldFromPdf).toHaveBeenCalledWith('the sum of $', { page: 3 });
  });

  it('isApplicable returns false if hasBlackFill is true', () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(true);
    const record = { 'Total Contract Amount': '14400' };
    expect(ColumnT.isApplicable(record)).toBe(false);
  });

  it('isApplicable returns true if hasBlackFill is false', () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(false);
    const record = { 'Total Contract Amount': '14400' };
    expect(ColumnT.isApplicable(record)).toBe(true);
  });
});
