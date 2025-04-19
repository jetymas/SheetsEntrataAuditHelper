import ColumnHelpers from '../src/js/column-modules/column-helpers.mjs';

// Mock DOM structure for PDF viewer
document.body.innerHTML = `
  <div class="pdf-viewer">
    <span>Start Date: 01/01/2025</span>
    <span>End Date: 12/31/2025</span>
    <span>TOTAL INSTALLMENT: $1200</span>
    <span>the sum of $ 14400</span>
    <span>Security Deposit: $500</span>
    <span>Monthly Concession: $100</span>
  </div>
`;

describe('ColumnHelpers.extractFieldFromPdf', () => {
  it('extracts date after "Start Date"', async () => {
    const value = await ColumnHelpers.extractFieldFromPdf('Start Date');
    expect(value).toBe('01/01/2025');
  });

  it('extracts date after "End Date"', async () => {
    const value = await ColumnHelpers.extractFieldFromPdf('End Date');
    expect(value).toBe('12/31/2025');
  });

  it('extracts currency after "TOTAL INSTALLMENT"', async () => {
    const value = await ColumnHelpers.extractFieldFromPdf('TOTAL INSTALLMENT');
    expect(value).toBe('$1200');
  });

  it('extracts value after "the sum of $"', async () => {
    const value = await ColumnHelpers.extractFieldFromPdf('the sum of $');
    expect(value).toBe('14400');
  });

  it('extracts value after "Security Deposit"', async () => {
    const value = await ColumnHelpers.extractFieldFromPdf('Security Deposit');
    expect(value).toBe('$500');
  });

  it('extracts value after "Monthly Concession"', async () => {
    const value = await ColumnHelpers.extractFieldFromPdf('Monthly Concession');
    expect(value).toBe('$100');
  });

  it('returns null if label not found', async () => {
    const value = await ColumnHelpers.extractFieldFromPdf('Nonexistent Label');
    expect(value).toBeNull();
  });
});
