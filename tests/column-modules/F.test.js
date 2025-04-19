import ColumnF from '../../src/js/column-modules/F.js';
import ColumnHelpers from '../../src/js/column-modules/column-helpers.js';

jest.mock('../../src/js/column-modules/column-helpers.js');

describe('ColumnF (Agent)', () => {
  const mockRecord = { 'Agent': 'Taylor' };
  const context = { record: mockRecord };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be applicable if no black fill', () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(false);
    expect(ColumnF.isApplicable(mockRecord)).toBe(true);
  });

  it('should NOT be applicable if black fill', () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(true);
    expect(ColumnF.isApplicable(mockRecord)).toBe(false);
  });

  it('should return success and match when agent is found in PDF', async () => {
    ColumnHelpers.findTextInPdf.mockResolvedValue(true);
    const result = await ColumnF.run(1, 'F', context);
    expect(result).toEqual({
      success: true,
      pdfValue: 'Taylor',
      expectedValue: 'Taylor',
      normalizedPdfValue: 'Taylor',
      normalizedExpectedValue: 'Taylor',
      match: true
    });
  });

  it('should return failure and no match when agent is NOT found in PDF', async () => {
    ColumnHelpers.findTextInPdf.mockResolvedValue(false);
    const result = await ColumnF.run(1, 'F', context);
    expect(result).toEqual({
      success: false,
      pdfValue: null,
      expectedValue: 'Taylor',
      normalizedPdfValue: null,
      normalizedExpectedValue: 'Taylor',
      match: false
    });
  });

  it('should display correct data', () => {
    const row = 1, col = 'F';
    const resultContext = { result: { pdfValue: 'Taylor', expectedValue: 'Taylor', match: true } };
    expect(ColumnF.displayData(row, col, resultContext)).toEqual({
      fieldName: 'Agent',
      pdfValue: 'Taylor',
      expectedValue: 'Taylor',
      match: true
    });
  });
});
