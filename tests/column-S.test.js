import { jest } from '@jest/globals';

await jest.unstable_mockModule('../src/js/column-modules/column-helpers.js', () => ({
  __esModule: true,
  default: {
    hasBlackFill: jest.fn(),
  },
  hasBlackFill: jest.fn(),
}));

const { default: ColumnHelpers } = await import('../src/js/column-modules/column-helpers.js');
const { default: ColumnS } = await import('../src/js/column-modules/S.js');

describe('ColumnS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('run always returns requiresUserConfirmation true', async () => {
    const context = { record: { 'DN Matches Lease?': 'Yes' }, result: {} };
    const result = await ColumnS.run({}, 'S', context);
    expect(result).toMatchObject({ success: true, requiresUserConfirmation: true });
  });

  it('isApplicable returns false if hasBlackFill is true', () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(true);
    const record = { 'DN Matches Lease?': 'Yes' };
    expect(ColumnS.isApplicable(record)).toBe(false);
  });

  it('isApplicable returns true if hasBlackFill is false', () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(false);
    const record = { 'DN Matches Lease?': 'Yes' };
    expect(ColumnS.isApplicable(record)).toBe(true);
  });

  it('displayData returns correct message', () => {
    const context = { result: {} };
    const data = ColumnS.displayData({}, 'S', context);
    expect(data).toMatchObject({
      fieldName: 'DN Matches Lease?',
      message: 'Please verify DN Matches Lease?.',
      requiresUserConfirmation: true
    });
  });
});
