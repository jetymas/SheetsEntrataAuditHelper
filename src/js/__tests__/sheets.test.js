/**
 * @jest-environment jsdom
 */
import {
  getAuthToken,
  fetchSheetData,
  updateSheetCell,
  addSheetComment,
} from "../sheets.mjs";

import { jest } from "@jest/globals";

describe("sheets utilities", () => {
  beforeEach(() => {
    global.__E2E_TEST__ = false;
    global.chrome = {
      identity: { getAuthToken: jest.fn() },
      runtime: { lastError: undefined },
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.__E2E_TEST__;
    jest.resetAllMocks();
  });

  it("getAuthToken returns fake token in E2E mode", async () => {
    global.__E2E_TEST__ = true;
    const token = await getAuthToken();
    expect(token).toBe("fake-e2e-token");
  });

  it("getAuthToken calls chrome.identity.getAuthToken and resolves token", async () => {
    chrome.identity.getAuthToken.mockImplementation((opts, cb) =>
      cb("real-token"),
    );
    const token = await getAuthToken();
    expect(token).toBe("real-token");
  });

  it("fetchSheetData returns headers and records correctly", async () => {
    chrome.identity.getAuthToken.mockImplementation((opts, cb) => cb("tok"));
    // mock header fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ values: [["foo", "bar"]] }),
    });
    // mock data fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        values: [
          ["1", "2"],
          ["3", "4"],
        ],
      }),
    });

    const { headers, records } = await fetchSheetData("id", "Sheet1", 1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(headers).toEqual(["foo", "bar"]);
    expect(records).toEqual([
      { _row: "2", foo: "1", bar: "2" },
      { _row: "3", foo: "3", bar: "4" },
    ]);
  });

  it("updateSheetCell calls fetch with correct parameters and returns JSON", async () => {
    chrome.identity.getAuthToken.mockImplementation((opts, cb) => cb("tok"));
    const responseJson = { result: true };
    fetch.mockResolvedValueOnce({ ok: true, json: async () => responseJson });

    const result = await updateSheetCell("id", "Sheet1", "A1", "X");
    expect(fetch).toHaveBeenCalledWith(
      "https://sheets.googleapis.com/v4/spreadsheets/id/values/Sheet1!A1?valueInputOption=USER_ENTERED",
      {
        method: "PUT",
        headers: {
          Authorization: "Bearer tok",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [["X"]] }),
      },
    );
    expect(result).toBe(responseJson);
  });

  it("addSheetComment calls batchUpdate correctly and returns JSON", async () => {
    chrome.identity.getAuthToken.mockImplementation((opts, cb) => cb("tok"));
    // mock get metadata
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sheets: [{ properties: { sheetId: 42, title: "Sheet1" } }],
      }),
    });
    // mock batchUpdate
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ replies: [] }),
    });

    const result = await addSheetComment("id", "Sheet1", "B2", "note");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ replies: [] });
  });
});
