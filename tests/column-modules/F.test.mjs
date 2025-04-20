import ColumnF from "../../src/js/column-modules/F.js";
import ColumnHelpers from "../../src/js/column-modules/column-helpers.js";

// Reset helpers before each test
beforeEach(() => {
  jest.clearAllMocks();
  ColumnHelpers.hasBlackFill = jest.fn();
  ColumnHelpers.findTextInPdf = jest.fn();
});

describe("ColumnF (Agent)", () => {
  const mockRecord = { Agent: "Taylor" };
  const context = { record: mockRecord };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be applicable if no black fill", () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(false);
    expect(ColumnF.isApplicable(mockRecord)).toBe(true);
  });

  it("should NOT be applicable if black fill", () => {
    ColumnHelpers.hasBlackFill.mockReturnValue(true);
    expect(ColumnF.isApplicable(mockRecord)).toBe(false);
  });

  it("should return success and match when agent is found in PDF", async () => {
    ColumnHelpers.findTextInPdf.mockResolvedValue(true);
    const result = await ColumnF.evaluate(context);
    expect(result.success).toBe(true);
    expect(result.value).toBe(mockRecord.Agent);
  });
});
