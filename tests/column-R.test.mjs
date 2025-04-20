// ESM-compatible mocking for Jest
import { jest } from "@jest/globals";

await jest.unstable_mockModule(
  "../src/js/column-modules/column-helpers.mjs",
  () => ({
    __esModule: true,
    default: {
      extractFieldFromPdf: jest.fn(),
      hasBlackFill: jest.fn(),
    },
    extractFieldFromPdf: jest.fn(),
    hasBlackFill: jest.fn(),
  }),
);

const { default: ColumnHelpers } = await import(
  "../src/js/column-modules/column-helpers.mjs"
);
const { default: ColumnR } = await import("../src/js/column-modules/R.mjs");

describe("ColumnR", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns match=true when PDF value matches sheet", async () => {
    ColumnHelpers.extractFieldFromPdf.mockResolvedValue("12000");
    const context = { record: { "Total Rate": "12000" }, result: {} };
    const result = await ColumnR.run({}, "R", context);
    expect(result).toMatchObject({
      pdfValue: "12000",
      expectedValue: "12000",
      match: true,
      requiresUserConfirmation: false,
    });
  });

  it("returns match=false and requiresUserConfirmation when PDF value does not match sheet", async () => {
    ColumnHelpers.extractFieldFromPdf.mockResolvedValue("11000");
    const context = { record: { "Total Rate": "12000" }, result: {} };
    const result = await ColumnR.run({}, "R", context);
    expect(result).toMatchObject({
      pdfValue: "11000",
      expectedValue: "12000",
      match: false,
      requiresUserConfirmation: true,
    });
  });

  it("isApplicable returns false if hasBlackFill is true", () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(true);
    const record = { "Total Rate": "12000" };
    expect(ColumnR.isApplicable(record)).toBe(false);
  });

  it("isApplicable returns true if hasBlackFill is false", () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(false);
    const record = { "Total Rate": "12000" };
    expect(ColumnR.isApplicable(record)).toBe(true);
  });
});
