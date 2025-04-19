import RenewalAudit from "../src/js/audit-types/renewal-audit";

describe('RenewalAudit', () => {
  it('sets default spreadsheetId and sheetName', () => {
    const audit = new RenewalAudit('sheet123');
    expect(audit.spreadsheetId).toBe('sheet123');
    expect(audit.sheetName).toBe('Lease Audit');
  });

  it('accepts custom sheetName', () => {
    const audit = new RenewalAudit('sheet123', 'CustomSheet');
    expect(audit.sheetName).toBe('CustomSheet');
  });

  it('defines correct columns and mappings', () => {
    const audit = new RenewalAudit('sheet123');
    expect(audit.columns).toEqual(expect.arrayContaining([
      'G','J','L','N','R','T','AB','AD','AE','AI','AJ'
    ]));
    expect(audit.columnResultMappings).toMatchObject({
      J: 'K', L: 'M', N: 'O', R: 'S', T: 'U'
    });
  });

  it('filterRecords filters only Renewals and sorts by full name', () => {
    const audit = new RenewalAudit('id');
    const records = [
      { 'Lease Type': 'Renewals', 'First Name': 'Bob', 'Last Name': 'Smith' },
      { 'Lease Type': 'Renewals', 'First Name': 'Alice', 'Last Name': 'Jones' },
      { 'Lease Type': 'New', 'First Name': 'Carl', 'Last Name': 'Brown' }
    ];
    const result = audit.filterRecords(records);
    expect(result).toHaveLength(2);
    expect(result[0]['First Name']).toBe('Alice');
    expect(result[1]['First Name']).toBe('Bob');
  });

  it('getCheckboxColumn returns mapping or falls back to dataColumn', () => {
    const audit = new RenewalAudit('id');
    expect(audit.getCheckboxColumn('J')).toBe('K');
    expect(audit.getCheckboxColumn('G')).toBe('G');
  });
});
