const fetchMock = require('jest-fetch-mock');
const { updateSheetCell } = require('../src/js/sheets');

describe('updateSheetCell error scenarios', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    global.chrome = { identity: { getAuthToken: jest.fn((opts, cb) => cb('t')) }, runtime: { lastError: null } };
  });

  test('throws on PUT non-OK', async () => {
    fetchMock.mockResponseOnce('', { status: 401, statusText: 'Unauthorized' });
    await expect(updateSheetCell('sid', 'Sheet', 'A1', 'val')).rejects.toThrow('Failed to update cell: Unauthorized');
  });
});
