import { jest } from "@jest/globals";
import ColumnD from "../../../src/js/column-modules/D.mjs";
import ColumnHelpers from "../../../src/js/column-modules/column-helpers.mjs";

describe("ColumnD (First Name)", () => {
  const context = { record: { "First Name": "Alice" } };
  const row = {};
  const col = {};

  beforeEach(() => {
    jest.spyOn(ColumnHelpers, "hasBlackFill").mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return success=true and match=true when text is found", async () => {
    jest.spyOn(ColumnHelpers, "findTextInPdf").mockResolvedValue(true);
    const result = await ColumnD.run(row, col, context);
    expect(result).toEqual({
      success: true,
      pdfValue: "Alice",
      expectedValue: "Alice",
      normalizedPdfValue: "Alice",
      normalizedExpectedValue: "Alice",
      match: true,
    });
  });

  it("should return success=false and match=false when text is not found", async () => {
    jest.spyOn(ColumnHelpers, "findTextInPdf").mockResolvedValue(false);
    const result = await ColumnD.run(row, col, context);
    expect(result).toEqual({
      success: false,
      pdfValue: null,
      expectedValue: "Alice",
      normalizedPdfValue: null,
      normalizedExpectedValue: "Alice",
      match: false,
    });
  });
});
