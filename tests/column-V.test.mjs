import { jest } from "@jest/globals";

let ColumnHelpers, ColumnV;

beforeAll(async () => {
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
    })
  );
  ({ default: ColumnHelpers } = await import("../src/js/column-modules/column-helpers.mjs"));
  ({ default: ColumnV } = await import("../src/js/column-modules/V.mjs"));
});

describe("ColumnV", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns match=true when PDF value matches sheet", async () => {
    ColumnHelpers.extractFieldFromPdf.mockResolvedValue("$500");
    const context = { record: { "Security Deposit": "$500" }, result: {} };
    const result = await ColumnV.run({}, "V", context);
    expect(result).toMatchObject({
      pdfValue: "$500",
      expectedValue: "$500",
      match: true,
      requiresUserConfirmation: false,
    });
  });

  it("returns match=false and requiresUserConfirmation when PDF value does not match sheet", async () => {
    ColumnHelpers.extractFieldFromPdf.mockResolvedValue("$400");
    const context = { record: { "Security Deposit": "$500" }, result: {} };
    const result = await ColumnV.run({}, "V", context);
    expect(result).toMatchObject({
      pdfValue: "$400",
      expectedValue: "$500",
      match: false,
      requiresUserConfirmation: true,
    });
  });

  it("calls extractFieldFromPdf with correct label", async () => {
    ColumnHelpers.extractFieldFromPdf.mockResolvedValue("$500");
    const context = { record: { "Security Deposit": "$500" }, result: {} };
    await ColumnV.run({}, "V", context);
    expect(ColumnHelpers.extractFieldFromPdf).toHaveBeenCalledWith(
      "Security Deposit",
    );
  });

  it("isApplicable returns false if hasBlackFill is true", () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(true);
    const record = { "Security Deposit": "$500" };
    expect(ColumnV.isApplicable(record)).toBe(false);
  });

  it("isApplicable returns true if hasBlackFill is false", () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(false);
    const record = { "Security Deposit": "$500" };
    expect(ColumnV.isApplicable(record)).toBe(true);
  });
});
