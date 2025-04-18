const fetchMock = require('jest-fetch-mock');
const { getAuthToken, updateSheetCell, addSheetComment } = require('../src/js/sheets');

describe('Sheets Helper Functions', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    global.chrome = {
      identity: { getAuthToken: jest.fn((opts, cb) => cb('token')) },
      runtime: { lastError: null }
    };
  });

  test('getAuthToken resolves token', async () => {
    const token = await getAuthToken();
    expect(token).toBe('token');
    expect(chrome.identity.getAuthToken).toHaveBeenCalled();
  });

  test('getAuthToken rejects on chrome.runtime.lastError', async () => {
    chrome.runtime.lastError = new Error('fail');
    await expect(getAuthToken()).rejects.toThrow('fail');
  });

  test('getAuthToken rejects when no token returned', async () => {
    chrome.identity.getAuthToken.mockImplementation((opts, cb) => cb(null));
    await expect(getAuthToken()).rejects.toThrow('Failed to obtain authentication token');
  });

  test('updateSheetCell sends correct request and returns json', async () => {
    const mockResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse), { status: 200 });
    const res = await updateSheetCell('sid', 'Sheet', 'A1', 'val');
    expect(res).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe('PUT');
    expect(options.body).toContain('"val"');
  });

  test('updateSheetCell throws on non-OK status', async () => {
    fetchMock.mockResponseOnce('', { status: 400, statusText: 'Bad' });
    await expect(updateSheetCell('sid', 'Sheet', 'A1', 'val')).rejects.toThrow('Failed to update cell');
  });

  test('addSheetComment posts metadata and returns json', async () => {
    const meta = { sheets: { properties: [{ title: 'Sheet', sheetId: 2 }] } };
    fetchMock.mockResponseOnce(JSON.stringify(meta), { status: 200 });
    fetchMock.mockResponseOnce(JSON.stringify({ result: true }), { status: 200 });
    const res = await addSheetComment('sid', 'Sheet', 'A1', 'comment');
    expect(res).toEqual({ result: true });
    expect(fetchMock.mock.calls.length).toBe(2);
  });

  test('addSheetComment throws if sheet not found', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ sheets: { properties: [] } }), { status: 200 });
    await expect(addSheetComment('sid', 'SheetX', 'A1', 'c')).rejects.toThrow('Sheet SheetX not found');
  });

  test('addSheetComment throws on metadata fetch error', async () => {
    fetchMock.mockResponseOnce('', { status: 404, statusText: 'Not Found' });
    await expect(addSheetComment('sid', 'Sheet', 'A1', 'comment')).rejects.toThrow('Failed to get sheet metadata: Not Found');
  });

  test('addSheetComment throws on batch update error', async () => {
    // First response: metadata OK with sheet
    fetchMock.mockResponseOnce(JSON.stringify({ sheets: { properties: [{ title: 'Sheet', sheetId: 2 }] } }), { status: 200 });
    // Second response: batch update fails
    fetchMock.mockResponseOnce('', { status: 500, statusText: 'BatchFail' });
    await expect(addSheetComment('sid', 'Sheet', 'A1', 'comment')).rejects.toThrow('Failed to add comment: BatchFail');
  });
});
