import BaseAuditType from "../src/js/audit-types/base-audit";

describe("BaseAuditType", () => {
  let audit;

  beforeEach(() => {
    audit = new BaseAuditType("sheetId", "SheetName");
  });

  test("setUp throws error", async () => {
    await expect(audit.setUp()).rejects.toThrow(
      "setUp() method must be implemented by subclass",
    );
  });

  test("findNext throws error", async () => {
    await expect(audit.findNext()).rejects.toThrow(
      "findNext() method must be implemented by subclass",
    );
  });

  test("filterRecords throws error", () => {
    expect(() => audit.filterRecords()).toThrow(
      "filterRecords() method must be implemented by subclass",
    );
  });

  test("isFieldApplicable returns true when no condition", () => {
    expect(audit.isFieldApplicable({}, {})).toBe(true);
  });

  test("isFieldApplicable respects condition", () => {
    const cond = jest.fn().mockReturnValue(false);
    expect(audit.isFieldApplicable({ condition: cond }, {})).toBe(false);
    expect(cond).toHaveBeenCalled();
  });

  test("hasBlackFill returns correct boolean", () => {
    expect(audit.hasBlackFill({ _blackFill_A: true }, "A")).toBe(true);
    expect(audit.hasBlackFill({}, "A")).toBe(false);
  });

  test("markFieldProcessed records status", () => {
    audit.currentRecordIndex = 1;
    audit.markFieldProcessed("B", "skipped");
    expect(audit.columnStatus["1_B"]).toBe("skipped");
  });
});
