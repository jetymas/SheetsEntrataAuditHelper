import { jest } from '@jest/globals';

await jest.unstable_mockModule('../src/js/column-modules/column-helpers.mjs', () => ({
  __esModule: true,
  default: {
    hasBlackFill: jest.fn(),
  },
  hasBlackFill: jest.fn(),
}));

const { default: ColumnHelpers } = await import('../src/js/column-modules/column-helpers.mjs');
const { default: ColumnU } = await import('../src/js/column-modules/U.mjs');

describe('ColumnU', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('run always returns requiresUserConfirmation true', async () => {
    const context = { record: { 'DN Matches Lease?': 'Yes' }, result: {} };
    const result = await ColumnU.run({}, 'U', context);
    expect(result).toMatchObject({ success: true, requiresUserConfirmation: true });
  });

  it('isApplicable returns false if hasBlackFill is true', () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(true);
    const record = { 'DN Matches Lease?': 'Yes' };
    expect(ColumnU.isApplicable(record)).toBe(false);
  });

  it('isApplicable returns true if hasBlackFill is false', () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(false);
    const record = { 'DN Matches Lease?': 'Yes' };
    expect(ColumnU.isApplicable(record)).toBe(true);
  });

  it('displayData returns correct message', () => {
    const context = { result: {} };
    const data = ColumnU.displayData({}, 'U', context);
    expect(data).toMatchObject({
      fieldName: 'DN Matches Lease?',
      message: 'Please verify DN Matches Lease?.',
      requiresUserConfirmation: true
    });
  });
});
