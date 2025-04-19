import ColumnE from '../../src/js/column-modules/E.js';
import ColumnHelpers from '../../src/js/column-modules/column-helpers.js';

// Reset helpers before each test
beforeEach(() => {
  ColumnHelpers.hasBlackFill = jest.fn();
  ColumnHelpers.findTextInPdf = jest.fn();
});

describe('ColumnE (Last Name)', () => {
  const mockRecord = { 'Last Name': 'Smith' };
  const context = { record: mockRecord };

  it('should be applicable if no black fill', () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(false);
    expect(ColumnE.isApplicable(mockRecord)).toBe(true);
  });

  it('should NOT be applicable if black fill', () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(true);
    expect(ColumnE.isApplicable(mockRecord)).toBe(false);
  });

  it('should return success and match when last name is found in PDF', async () => {
    ColumnHelpers.findTextInPdf.mockResolvedValue(true);
    const result = await ColumnE.run(1, 'E', context);
    expect(result).toEqual({
      success: true,
      pdfValue: 'Smith',
      expectedValue: 'Smith',
      normalizedPdfValue: 'Smith',
      normalizedExpectedValue: 'Smith',
      match: true
    });
  });

  it('should return failure and no match when last name is NOT found in PDF', async () => {
    ColumnHelpers.findTextInPdf.mockResolvedValue(false);
    const result = await ColumnE.run(1, 'E', context);
    expect(result).toEqual({
      success: false,
      pdfValue: null,
      expectedValue: 'Smith',
      normalizedPdfValue: null,
      normalizedExpectedValue: 'Smith',
      match: false
    });
  });

  it('should display correct data', () => {
    const row = 1, col = 'E';
    const resultContext = { result: { pdfValue: 'Smith', expectedValue: 'Smith', match: true } };
    expect(ColumnE.displayData(row, col, resultContext)).toEqual({
      fieldName: 'Last Name',
      pdfValue: 'Smith',
      expectedValue: 'Smith',
      match: true
    });
  });
});
