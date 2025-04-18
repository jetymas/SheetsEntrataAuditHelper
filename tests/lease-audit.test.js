const LeaseAudit = require('../src/js/audit-types/lease-audit');

describe('LeaseAudit', () => {
  it('has correct default properties', () => {
    const audit = new LeaseAudit('sheet123');
    expect(audit.spreadsheetId).toBe('sheet123');
    expect(audit.sheetName).toBe('Lease Audit');
    expect(Array.isArray(audit.columns)).toBe(true);
    expect(audit.columns.length).toBeGreaterThan(0);
  });

  it('columnResultMappings has expected mappings', () => {
    const audit = new LeaseAudit('sheet');
    expect(audit.columnResultMappings.J).toBe('K');
    expect(audit.columnResultMappings.T).toBe('U');
    expect(audit.columnResultMappings.G).toBeUndefined();
  });
});
