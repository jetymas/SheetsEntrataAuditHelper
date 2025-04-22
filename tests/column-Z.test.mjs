import { jest } from "@jest/globals";

let ColumnHelpers, ColumnZ;

beforeAll(async () => {
  await jest.unstable_mockModule(
    "../src/js/column-modules/column-helpers.mjs",
    () => ({
      __esModule: true,
      default: {
        hasBlackFill: jest.fn(),
      },
      hasBlackFill: jest.fn(),
    })
  );
  ({ default: ColumnHelpers } = await import("../src/js/column-modules/column-helpers.mjs"));
  ({ default: ColumnZ } = await import("../src/js/column-modules/Z.mjs"));
});

describe("ColumnZ", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("run returns correct values from sheet", async () => {
    const context = {
      record: { "One Time #2 Type": "Move-in Fee" },
      result: {},
    };
    const result = await ColumnZ.run({}, "Z", context);
    expect(result).toMatchObject({
      success: true,
      pdfValue: "Move-in Fee",
      expectedValue: "Move-in Fee",
      normalizedPdfValue: "Move-in Fee",
      normalizedExpectedValue: "Move-in Fee",
      match: true,
    });
  });

  it("isApplicable returns false if hasBlackFill is true", () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(true);
    const record = { "One Time #2 Type": "Move-in Fee" };
    expect(ColumnZ.isApplicable(record)).toBe(false);
  });

  it("isApplicable returns true if hasBlackFill is false", () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(false);
    const record = { "One Time #2 Type": "Move-in Fee" };
    expect(ColumnZ.isApplicable(record)).toBe(true);
  });

  it("displayData returns correct values", () => {
    const context = {
      result: { pdfValue: "Move-in Fee", expectedValue: "Move-in Fee" },
    };
    const data = ColumnZ.displayData({}, "Z", context);
    expect(data).toMatchObject({
      fieldName: "One Time #2 Type",
      pdfValue: "Move-in Fee",
      expectedValue: "Move-in Fee",
      match: true,
    });
  });
});
