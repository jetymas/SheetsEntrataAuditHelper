import { jest } from "@jest/globals";

let ColumnHelpers, ColumnAO;

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
  ({ default: ColumnAO } = await import("../src/js/column-modules/AO.mjs"));
});

describe("ColumnAO", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("run always returns requiresUserConfirmation true", async () => {
    const context = {
      record: {
        "Proof of Employment/Rental History/International Docs Uploaded": "Yes",
      },
      result: {},
    };
    const result = await ColumnAO.run({}, "AO", context);
    expect(result).toMatchObject({
      success: true,
      requiresUserConfirmation: true,
    });
  });

  it("isApplicable returns false if hasBlackFill is true", () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(true);
    const record = {
      "Proof of Employment/Rental History/International Docs Uploaded": "Yes",
    };
    expect(ColumnAO.isApplicable(record)).toBe(false);
  });

  it("isApplicable returns true if hasBlackFill is false", () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(false);
    const record = {
      "Proof of Employment/Rental History/International Docs Uploaded": "Yes",
    };
    expect(ColumnAO.isApplicable(record)).toBe(true);
  });

  it("displayData returns correct message", () => {
    const context = { result: {} };
    const data = ColumnAO.displayData({}, "AO", context);
    expect(data).toMatchObject({
      fieldName:
        "Proof of Employment/Rental History/International Docs Uploaded",
      message: expect.stringContaining("proof of employment"),
      requiresUserConfirmation: true,
    });
  });
});
