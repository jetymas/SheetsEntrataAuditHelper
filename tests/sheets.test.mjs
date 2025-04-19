import fetchMock from "jest-fetch-mock";
import { fetchSheetData } from "../src/js/sheets";

describe('fetchSheetData', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    global.chrome = {
      identity: {
        getAuthToken: jest.fn((opts, cb) => cb('fake-token'))
      },
      runtime: { lastError: null }
    };
  });

  it('fetches headers and rows correctly', async () => {
    fetchMock.mockResponses(
      [JSON.stringify({ values: [['col1', 'col2']] }), { status: 200 }],
      [JSON.stringify({ values: [['val1', 'val2'], ['val3']] }), { status: 200 }]
    );

    const { headers, records } = await fetchSheetData('sheet123', 'Sheet1', 1);
    expect(headers).toEqual(['col1', 'col2']);
    expect(records).toEqual([
      { _row: '2', col1: 'val1', col2: 'val2' },
      { _row: '3', col1: 'val3', col2: '' }
    ]);
    expect(fetchMock.mock.calls.length).toBe(2);
  });
});
