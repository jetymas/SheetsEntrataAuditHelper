import { jest } from "@jest/globals";

let ColumnHelpers, ColumnW;

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
  ({ default: ColumnW } = await import("../src/js/column-modules/W.mjs"));
});

describe("ColumnW", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("run always returns requiresUserConfirmation true", async () => {
    const context = { record: { "DN Matches Lease?": "Yes" }, result: {} };
    const result = await ColumnW.run({}, "W", context);
    expect(result).toMatchObject({
      success: true,
      requiresUserConfirmation: true,
    });
  });

  it("isApplicable returns false if hasBlackFill is true", () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(true);
    const record = { "DN Matches Lease?": "Yes" };
    expect(ColumnW.isApplicable(record)).toBe(false);
  });

  it("isApplicable returns true if hasBlackFill is false", () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(false);
    const record = { "DN Matches Lease?": "Yes" };
    expect(ColumnW.isApplicable(record)).toBe(true);
  });

  it("displayData returns correct message", () => {
    const context = { result: {} };
    const data = ColumnW.displayData({}, "W", context);
    expect(data).toMatchObject({
      fieldName: "DN Matches Lease?",
      message: "Please verify DN Matches Lease?.",
      requiresUserConfirmation: true,
    });
  });
});
