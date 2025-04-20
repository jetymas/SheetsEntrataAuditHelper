import { jest } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import { fetchSheetData } from "../src/js/sheets";

describe("fetchSheetData error scenarios", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    global.chrome = {
      identity: { getAuthToken: jest.fn((opts, cb) => cb("token")) },
      runtime: { lastError: null },
    };
  });

  test("throws on header fetch failure", async () => {
    fetchMock.mockResponseOnce("", { status: 400, statusText: "BadHeader" });
    await expect(fetchSheetData("sid", "Sheet", 5)).rejects.toThrow(
      "Failed to fetch headers: BadHeader",
    );
  });

  test("throws when no header values", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({}), { status: 200 });
    await expect(fetchSheetData("sid", "Sheet", 8)).rejects.toThrow(
      "No header values found",
    );
  });

  test("throws on data fetch failure", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ values: [["A", "B"]] }), {
      status: 200,
    });
    fetchMock.mockResponseOnce("", { status: 500, statusText: "BadData" });
    await expect(fetchSheetData("sid", "Sheet", 8)).rejects.toThrow(
      "Failed to fetch data: BadData",
    );
  });

  test("returns empty records when data values missing", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ values: [["H1", "H2"]] }), {
      status: 200,
    });
    fetchMock.mockResponseOnce(JSON.stringify({}), { status: 200 });
    const { headers, records } = await fetchSheetData("sid", "Sheet", 8);
    expect(headers).toEqual(["H1", "H2"]);
    expect(records).toEqual([]);
  });
});
