import { jest } from "@jest/globals";

let ColumnHelpers, ColumnAY;

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
  ({ default: ColumnAY } = await import("../src/js/column-modules/AY.mjs"));
});

describe("ColumnAY", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("run returns correct values from sheet", async () => {
    const context = {
      record: { "Audit Comments": "Lease missing signature" },
      result: {},
    };
    const result = await ColumnAY.run({}, "AY", context);
    expect(result).toMatchObject({
      success: true,
      pdfValue: "Lease missing signature",
      expectedValue: "Lease missing signature",
      normalizedPdfValue: "Lease missing signature",
      normalizedExpectedValue: "Lease missing signature",
      match: true,
    });
  });

  it("isApplicable returns false if hasBlackFill is true", () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(true);
    const record = { "Audit Comments": "Lease missing signature" };
    expect(ColumnAY.isApplicable(record)).toBe(false);
  });

  it("isApplicable returns true if hasBlackFill is false", () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(false);
    const record = { "Audit Comments": "Lease missing signature" };
    expect(ColumnAY.isApplicable(record)).toBe(true);
  });

  it("displayData returns correct values", () => {
    const context = {
      result: {
        pdfValue: "Lease missing signature",
        expectedValue: "Lease missing signature",
      },
    };
    const data = ColumnAY.displayData({}, "AY", context);
    expect(data).toMatchObject({
      fieldName: "Audit Comments",
      pdfValue: "Lease missing signature",
      expectedValue: "Lease missing signature",
      match: true,
    });
  });
});
